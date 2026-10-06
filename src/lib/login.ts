import "server-only";
import { newId, nowIso } from "./db";
import { hasPII } from "./pii";
import { userIdForSession, writeAudit } from "./session";
import { hashSecret } from "./tokens";
import type { DB, SocialProvider, User } from "./types";

// 데모 로그인(login/actions.ts)과 소셜 로그인(login/callback)이 함께 쓰는 로그인 세션 처리.

export const NAME_MAX = 30;

export function revokeSession(db: DB, sid: string | null): void {
  if (!sid) return;
  const hash = hashSecret(sid);
  for (const s of db.sessions) if (s.sidHash === hash && !s.revokedAt) s.revokedAt = nowIso();
}

/** 익명일 때 누른 좋아요를 로그인 계정으로 옮긴다. 이미 계정으로 누른 글은 중복을 지운다. */
export function moveAnonLikes(db: DB, anonId: string, accountId: string): void {
  if (anonId === accountId) return;
  const liked = new Set(db.likes.filter((l) => l.userId === accountId).map((l) => l.postId));
  db.likes = db.likes.filter((l) => {
    if (l.userId !== anonId) return true;
    if (liked.has(l.postId)) return false;
    liked.add(l.postId);
    l.userId = accountId;
    return true;
  });
}

/**
 * 이전 쿠키(oldSid)의 로그인 세션을 폐기하고, 새 쿠키(newSid)를 계정에 연결한다.
 * 익명일 때 누른 좋아요는 계정으로 옮긴다. mutate 안에서 호출한다.
 */
export function startLoginSession(db: DB, account: User, oldSid: string | null, newSid: string): void {
  revokeSession(db, oldSid);
  db.sessions.push({ sidHash: hashSecret(newSid), userId: account.id, createdAt: nowIso(), revokedAt: null });
  if (oldSid) moveAnonLikes(db, userIdForSession(oldSid), account.id);
}

/**
 * 제공자가 알려 준 이름을 작성자 이름으로 쓸 수 있으면 돌려준다. 길거나 개인정보(이메일 등)로 보이면 null이고,
 * 이때는 프로필 화면에서 교사가 직접 이름을 적는다.
 */
export function usableDisplayName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim();
  if (!name || name.length > NAME_MAX || hasPII(name)) return null;
  return name;
}

/**
 * 소셜 로그인 계정을 찾거나 만든다(F-02). 같은 제공자·같은 Supabase 사용자 id면 같은 계정이다.
 * 역할은 교사로 둔다. 관리자 지정 방법은 정해지지 않았으므로 소셜 로그인으로는 관리자가 되지 않는다.
 * 학교급(F-03)은 제공자가 주지 않으므로 처음에는 비어 있고, 프로필 화면에서 고른다.
 */
export function findOrCreateSocialUser(
  db: DB,
  provider: SocialProvider,
  subject: string,
  displayName: string | null,
): User {
  const existing = db.users.find((u) => u.authProvider === provider && u.authSubject === subject);
  if (existing) return existing;
  const account: User = {
    id: newId("u"),
    role: "teacher",
    name: displayName,
    schoolLevel: null,
    createdAt: nowIso(),
    authProvider: provider,
    authSubject: subject,
  };
  db.users.push(account);
  writeAudit(db, account, "auth.social_signup", account.id, provider);
  return account;
}

/** 소셜 로그인 계정이 허브를 쓰기 전에 프로필(이름·학교급)을 채워야 하는가 */
export function needsProfile(user: User): boolean {
  return user.role === "teacher" && Boolean(user.authProvider) && (!user.name || !user.schoolLevel);
}
