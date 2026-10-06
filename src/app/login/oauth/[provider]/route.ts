import { NextResponse } from "next/server";
import { hubOriginFromRequest, safeNextPath } from "@/lib/origin";
import { createSupabaseAuthClient } from "@/lib/supabase-auth";
import { isAuthProvider } from "@/lib/supabase-config";

// 소셜 로그인 시작(F-02). /login/oauth/google, /login/oauth/kakao
// Supabase Auth의 인가 주소를 만들어 그쪽으로 보낸다. 돌아올 곳은 /login/callback이다.
// 돌아올 주소는 Supabase 프로젝트의 Redirect URLs에 등록되어 있어야 한다(설정 주체 미정, README "소셜 로그인").

export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }): Promise<Response> {
  const { provider } = await ctx.params;
  const origin = hubOriginFromRequest(req);
  const fail = (code: string) => NextResponse.redirect(new URL(`/login?error=${code}`, origin), 303);

  if (!isAuthProvider(provider)) return fail("unknown_provider");
  const supabase = await createSupabaseAuthClient();
  if (!supabase) return fail("not_configured");

  const next = safeNextPath(new URL(req.url).searchParams.get("next"));
  const callback = new URL("/login/callback", origin);
  callback.searchParams.set("provider", provider);
  if (next) callback.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: callback.toString(), skipBrowserRedirect: true },
  });
  if (error || !data.url) return fail("oauth_start_failed");
  return NextResponse.redirect(data.url, 303);
}
