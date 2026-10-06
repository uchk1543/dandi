import "server-only";
import type { SocialProvider } from "./types";

// v1.0 Supabase 연결 설정(PRD F-01 익명 인증, F-02 구글·카카오 로그인, F-15 RLS).
// 키를 넣는 곳은 .env.local(로컬) 또는 배포 환경 변수다. 이름과 설명은 저장소 루트의 .env.example에 있다.
// 구글·카카오 Client ID·Secret은 Supabase Auth 쪽 provider 설정에 넣는 구조라 여기에 없다.
// Supabase 계정·프로젝트와 그쪽 설정은 아직 정해지지 않았다(README "소셜 로그인").
//
// Supabase는 소셜 로그인(F-02) 확인과, DANDI_STORAGE가 supabase일 때 저장소(supabase-admin.ts)에 쓴다.
// 값이 비어 있으면 소셜 로그인 버튼이 보이지 않고 데모 로그인만 동작하며, 저장소는 로컬 JSON이다.

/** 구글·카카오 로그인(F-02). Supabase Auth의 provider 이름과 같다. */
export const AUTH_PROVIDERS: readonly SocialProvider[] = ["google", "kakao"];

export function isAuthProvider(value: unknown): value is SocialProvider {
  return AUTH_PROVIDERS.includes(value as SocialProvider);
}

export interface SupabasePublicConfig {
  /** 예: https://abcdefghijklmnop.supabase.co */
  url: string;
  /** sb_publishable_... 브라우저에 들어가도 되는 키 */
  publishableKey: string;
}

function read(name: string): string {
  return (process.env[name] ?? "").trim();
}

/**
 * 브라우저와 서버가 함께 쓰는 공개 설정. 둘 중 하나라도 비어 있으면 null(Supabase 미연결).
 * NEXT_PUBLIC_ 값은 next build 때 번들에 고정되므로 배포 환경에서는 빌드 전에 넣어야 한다.
 */
export function supabasePublicConfig(): SupabasePublicConfig | null {
  const url = read("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !publishableKey) return null;
  if (!/^https:\/\//.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(url)) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL은 https:// 주소여야 합니다.");
  }
  if (publishableKey.startsWith("sb_secret_")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY에 비밀 키(sb_secret_)가 들어 있습니다. 공개 키(sb_publishable_)로 바꾸십시오.");
  }
  return { url: url.replace(/\/+$/, ""), publishableKey };
}

/**
 * 서버 전용 비밀 키(sb_secret_). RLS를 우회하므로 서버 코드(라우트 핸들러, 서버 액션)에서만 쓴다.
 * 비어 있으면 null.
 */
export function supabaseSecretKey(): string | null {
  for (const leaked of ["NEXT_PUBLIC_SUPABASE_SECRET_KEY", "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"]) {
    if (read(leaked)) {
      throw new Error(`${leaked}는 브라우저 번들에 들어갑니다. 비밀 키는 NEXT_PUBLIC_ 없이 SUPABASE_SECRET_KEY에 넣으십시오.`);
    }
  }
  const key = read("SUPABASE_SECRET_KEY");
  if (!key) return null;
  if (key.startsWith("sb_publishable_")) {
    throw new Error("SUPABASE_SECRET_KEY에 공개 키(sb_publishable_)가 들어 있습니다. 비밀 키(sb_secret_)로 바꾸십시오.");
  }
  return key;
}

/** 공개 설정이 모두 채워졌는가. false면 데모 로그인·로컬 저장소를 쓴다. */
export function isSupabaseConfigured(): boolean {
  return supabasePublicConfig() !== null;
}
