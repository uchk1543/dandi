import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import type { DB } from "../src/lib/types.ts";

// 소셜 로그인(F-02) 계정 규칙. Supabase 연결 없이 확인할 수 있는 부분(계정 찾기·만들기, 이름 검사, 세션)만 본다.
// src/lib/login.ts는 서버 전용(server-only)이고 "@/" 경로를 쓰므로 이 파일 안에서만 쓰는 로더로 해석한다.
const ROOT = new URL("../", import.meta.url).href;
const HOOKS = `
const ROOT = ${JSON.stringify(ROOT)};
const stub = (src) => ({ url: "data:text/javascript," + encodeURIComponent(src), shortCircuit: true });
export async function resolve(specifier, context, next) {
  if (specifier === "server-only") return stub("export default null");
  if (specifier === "next/headers") return stub("export async function headers(){return new Headers()} export async function cookies(){return {get(){return undefined},set(){}}}");
  if (specifier.startsWith("@/")) specifier = new URL("src/" + specifier.slice(2), ROOT).href;
  try {
    return await next(specifier, context);
  } catch (err) {
    if ((specifier.startsWith(".") || specifier.startsWith("file:")) && !/\\.[cm]?[jt]sx?$/.test(specifier)) {
      for (const ext of [".ts", ".tsx"]) {
        try { return await next(specifier + ext, context); } catch {}
      }
    }
    throw err;
  }
}`;
register(`data:text/javascript,${encodeURIComponent(HOOKS)}`);

const login = await import("../src/lib/login.ts");
const { hashSecret } = await import("../src/lib/tokens.ts");

function emptyDb(): DB {
  return {
    users: [], apps: [], posts: [], comments: [], likes: [], files: [], templates: [], models: [], projects: [],
    projectKeys: [], usage: [], cliTokens: [], sessions: [], sites: [], siteDeploys: [], deviceAuths: [],
    oauthClients: [], oauthCodes: [], oauthTokens: [], skills: [], books: [], audit: [],
  };
}

test("소셜 로그인: 같은 제공자·같은 사용자 id면 같은 계정, 역할은 교사, 학교급은 비어 있음", () => {
  const db = emptyDb();
  const a = login.findOrCreateSocialUser(db, "google", "sb-user-1", "김교사");
  assert.equal(a.role, "teacher");
  assert.equal(a.schoolLevel, null);
  assert.equal(a.authProvider, "google");
  assert.equal(login.findOrCreateSocialUser(db, "google", "sb-user-1", "다른 이름").id, a.id);
  assert.notEqual(login.findOrCreateSocialUser(db, "kakao", "sb-user-1", "김교사").id, a.id);
  assert.equal(db.users.length, 2);
});

test("소셜 로그인: 관리자는 만들지 않는다(관리자 지정 방법 미정)", () => {
  const db = emptyDb();
  db.users.push({ id: "u_admin", role: "admin", name: "관리자", schoolLevel: null, createdAt: "2026-01-01T00:00:00.000Z" });
  const u = login.findOrCreateSocialUser(db, "kakao", "sb-user-2", "관리자");
  assert.equal(u.role, "teacher");
  assert.notEqual(u.id, "u_admin");
});

test("소셜 로그인: 제공자 이름이 개인정보·너무 김·비어 있으면 쓰지 않는다", () => {
  assert.equal(login.usableDisplayName("  김교사 "), "김교사");
  assert.equal(login.usableDisplayName("teacher@example.com"), null);
  assert.equal(login.usableDisplayName("010-1234-5678"), null);
  assert.equal(login.usableDisplayName("가".repeat(31)), null);
  assert.equal(login.usableDisplayName(""), null);
  assert.equal(login.usableDisplayName(undefined), null);
});

test("소셜 로그인: 이름·학교급을 정하기 전에는 프로필이 필요하다", () => {
  const db = emptyDb();
  const u = login.findOrCreateSocialUser(db, "google", "sb-user-3", "김교사");
  assert.equal(login.needsProfile(u), true);
  u.schoolLevel = "high";
  assert.equal(login.needsProfile(u), false);
  u.name = null;
  assert.equal(login.needsProfile(u), true);
  // 데모 로그인 계정은 해당 없음
  assert.equal(login.needsProfile({ id: "u_d", role: "teacher", name: "데모", schoolLevel: null, createdAt: "x" }), false);
});

test("로그인 세션: 이전 쿠키 세션을 폐기하고 새 쿠키를 계정에 연결한다", () => {
  const db = emptyDb();
  const u = login.findOrCreateSocialUser(db, "google", "sb-user-4", "김교사");
  db.sessions.push({ sidHash: hashSecret("old-sid"), userId: u.id, createdAt: "x", revokedAt: null });
  login.startLoginSession(db, u, "old-sid", "new-sid");
  assert.ok(db.sessions.find((s) => s.sidHash === hashSecret("old-sid"))?.revokedAt);
  const fresh = db.sessions.find((s) => s.sidHash === hashSecret("new-sid"));
  assert.equal(fresh?.userId, u.id);
  assert.equal(fresh?.revokedAt, null);
});
