import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabasePublicConfig, supabaseSecretKey } from "./supabase-config";

// 서버 전용 Supabase 연결(저장소 DB·파일). 비밀 키(sb_secret_)로 접속하므로 RLS를 우회한다.
// 브라우저는 이 연결을 쓰지 않는다. 테이블·버킷은 RLS를 켜고 정책을 두지 않아 공개 키로는 읽을 수 없다
// (supabase/migrations/20261006000000_dandi_state.sql).
//
// 저장 위치(DANDI_STORAGE):
// - "supabase": DB는 dandi_state 테이블, 파일은 Storage 버킷
// - "local": data/ 폴더(로컬 개발 기본값)
// - 비워 두면 Vercel(VERCEL=1)에 Supabase 키가 모두 있을 때만 supabase, 아니면 local

export type StorageMode = "supabase" | "local";

export function storageMode(): StorageMode {
  const raw = (process.env.DANDI_STORAGE ?? "").trim().toLowerCase();
  if (raw === "local") return "local";
  if (raw === "supabase") {
    if (!supabasePublicConfig() || !supabaseSecretKey()) {
      throw new Error(
        "DANDI_STORAGE=supabase에는 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY가 모두 필요합니다.",
      );
    }
    return "supabase";
  }
  if (raw) throw new Error(`DANDI_STORAGE는 supabase 또는 local이어야 합니다(지금 값: ${raw}).`);
  return process.env.VERCEL && supabasePublicConfig() && supabaseSecretKey() ? "supabase" : "local";
}

export function isRemoteStorage(): boolean {
  return storageMode() === "supabase";
}

/** 파일 본문을 두는 비공개 버킷 이름. */
export function storageBucket(): string {
  return (process.env.DANDI_STORAGE_BUCKET ?? "").trim() || "dandi";
}

const g = globalThis as unknown as { __dandiSupabaseAdmin?: SupabaseClient };

/**
 * 저장소 요청은 매번 실제로 보낸다. Next는 렌더 중 같은 GET fetch를 한 번만 실행해 결과를 나눠 쓰고(memoization)
 * 캐시에 남길 수도 있어, 그대로 두면 저장한 직후 다시 읽어도 예전 값이 나온다.
 * memoization은 signal을 넘기면 빠진다(node_modules/next/dist/docs/01-app/03-api-reference/04-functions/fetch.md).
 */
export const freshFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store", signal: init?.signal ?? new AbortController().signal });

/** 서버 전용 클라이언트. 설정이 없으면 오류. */
export function supabaseAdmin(): SupabaseClient {
  if (g.__dandiSupabaseAdmin) return g.__dandiSupabaseAdmin;
  const config = supabasePublicConfig();
  const secret = supabaseSecretKey();
  if (!config || !secret) throw new Error("Supabase 서버 설정(URL, SUPABASE_SECRET_KEY)이 없습니다.");
  g.__dandiSupabaseAdmin = createClient(config.url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: freshFetch },
  });
  return g.__dandiSupabaseAdmin;
}

/** Storage REST를 직접 부를 때(Range 요청) 쓰는 주소와 인증 헤더. */
export function storageRest(): { objectUrl: string; headers: Record<string, string> } {
  const config = supabasePublicConfig();
  const secret = supabaseSecretKey();
  if (!config || !secret) throw new Error("Supabase 서버 설정(URL, SUPABASE_SECRET_KEY)이 없습니다.");
  return {
    objectUrl: `${config.url}/storage/v1/object`,
    headers: { apikey: secret, Authorization: `Bearer ${secret}` },
  };
}
