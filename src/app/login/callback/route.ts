import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { mutate } from "@/lib/db";
import { findOrCreateSocialUser, needsProfile, startLoginSession, usableDisplayName } from "@/lib/login";
import { hubOriginFromRequest, safeNextPath } from "@/lib/origin";
import { getSessionId, rotateSession, writeAudit } from "@/lib/session";
import { createSupabaseAuthClient } from "@/lib/supabase-auth";
import { isAuthProvider } from "@/lib/supabase-config";
import type { User } from "@/lib/types";

// 소셜 로그인 콜백(F-02). Supabase가 ?code=로 돌려보낸다.
// 1) code를 Supabase 세션으로 바꿔 사용자를 확인한다(PKCE, 시작할 때 저장한 sb- 쿠키 필요).
// 2) 같은 제공자·사용자 id의 허브 계정을 찾거나 만들고(역할: 교사), 허브 세션(dd_sid)을 새로 발급한다.
// 3) Supabase 세션은 더 쓰지 않으므로 이 브라우저의 sb- 쿠키를 지운다.
// 이름·학교급이 비어 있으면 프로필 화면으로 보낸다.

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const origin = hubOriginFromRequest(req);
  const fail = (code: string) => NextResponse.redirect(new URL(`/login?error=${code}`, origin), 303);

  // 사용자가 제공자 화면에서 취소했거나 제공자 설정 오류
  if (url.searchParams.get("error")) return fail("oauth_denied");
  const code = url.searchParams.get("code");
  if (!code) return fail("oauth_invalid");

  const supabase = await createSupabaseAuthClient();
  if (!supabase) return fail("not_configured");
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return fail("oauth_exchange_failed");
  // 제공자는 주소의 ?provider=가 아니라 Supabase가 확인한 값으로 정한다.
  // 돌아올 주소가 Supabase Redirect URLs에 없으면 Supabase가 Site URL로 돌려보내 ?provider=가 빠지기 때문이다.
  const provider = data.user.app_metadata?.provider;
  if (!isAuthProvider(provider)) {
    await supabase.auth.signOut({ scope: "local" });
    return fail("unknown_provider");
  }

  const meta = data.user.user_metadata ?? {};
  const displayName = usableDisplayName(
    meta.full_name ?? meta.name ?? meta.nickname ?? meta.user_name ?? meta.preferred_username,
  );
  await supabase.auth.signOut({ scope: "local" });

  const oldSid = await getSessionId();
  const newSid = await rotateSession();
  const account = await mutate((db): User => {
    const user = findOrCreateSocialUser(db, provider, data.user.id, displayName);
    startLoginSession(db, user, oldSid, newSid);
    writeAudit(db, user, "auth.social_login", user.id, provider);
    return { ...user };
  });
  revalidatePath("/", "layout");

  const next = safeNextPath(url.searchParams.get("next"));
  if (needsProfile(account)) {
    const profile = new URL("/login/profile", origin);
    if (next) profile.searchParams.set("next", next);
    return NextResponse.redirect(profile, 303);
  }
  return NextResponse.redirect(new URL(next ?? "/studio", origin), 303);
}
