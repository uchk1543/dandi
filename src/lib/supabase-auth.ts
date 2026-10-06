import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublicConfig } from "./supabase-config";

// 소셜 로그인(F-02)용 Supabase Auth 클라이언트. 라우트 핸들러에서만 쓴다.
// PKCE 확인값(code verifier)과 Supabase 세션은 Supabase가 정한 이름의 쿠키(sb-...)에 저장된다.
// 허브는 Supabase 세션을 계속 쓰지 않는다. 콜백에서 사용자를 확인한 뒤 허브 자체 세션(dd_sid)으로 바꾸고 sb- 쿠키는 지운다.

/** 설정이 없으면 null. */
export async function createSupabaseAuthClient() {
  const config = supabasePublicConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) store.set(name, value, options);
      },
    },
    auth: { flowType: "pkce" },
  });
}
