import "server-only";
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { buildSeed } from "./seed";
import { isRemoteStorage, supabaseAdmin } from "./supabase-admin";
import type { DB } from "./types";

// 저장소. DB 전체를 JSON 문서 하나로 다룬다(readDb/mutate).
// - local: data/db.json
// - supabase(DANDI_STORAGE, supabase-admin.ts): dandi_state 테이블의 한 행(data jsonb + version).
//   서버 인스턴스가 여러 개라 version이 읽을 때와 같을 때만 저장하고, 다르면 다시 읽어 fn을 다시 실행한다.
// v1.0 정식 스키마(테이블별 분리, RLS)로 옮길 때는 readDb/mutate를 쓰는 lib/*.ts 도메인 함수를 바꾼다.

// Vercel 서버는 /tmp만 쓸 수 있으므로(VERCEL=1은 Vercel이 자동 설정) local일 때 기본 위치를 /tmp로 바꾼다.
// /tmp는 인스턴스마다 따로이고 재시작하면 지워지므로, Vercel에서는 supabase 저장소를 써야 한다.
export const DATA_DIR = process.env.DANDI_DATA_DIR
  ? path.resolve(process.env.DANDI_DATA_DIR)
  : process.env.VERCEL
    ? "/tmp/dandi"
    : path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
/** 사이트·스킬 파일 본문(내용 주소 저장: data/blobs/<sha256>) */
export const BLOB_DIR = path.join(DATA_DIR, "blobs");
const DB_FILE = path.join(DATA_DIR, "db.json");

const EMPTY: DB = {
  users: [],
  apps: [],
  posts: [],
  comments: [],
  likes: [],
  files: [],
  templates: [],
  models: [],
  projects: [],
  projectKeys: [],
  usage: [],
  cliTokens: [],
  sessions: [],
  sites: [],
  siteDeploys: [],
  deviceAuths: [],
  oauthClients: [],
  oauthCodes: [],
  oauthTokens: [],
  skills: [],
  books: [],
  audit: [],
};

// dev 서버의 HMR로 모듈이 다시 로드되어도 쓰기 순서가 유지되도록 전역에 둔다.
const g = globalThis as unknown as { __dandiLock?: Promise<unknown> };

function serialize(db: DB): string {
  return JSON.stringify(db, null, 2);
}

/**
 * 저장소를 읽는다. raw는 읽은 내용을 다시 직렬화한 것으로, mutate가 바뀐 것이 없으면 쓰기를 건너뛰는 데 쓴다.
 * 읽기 전용(readDb)은 raw가 필요 없으므로 직렬화 비용을 들이지 않는다.
 */
async function load(withRaw = false): Promise<{ db: DB; raw: string }> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const db = normalize(JSON.parse(raw) as Partial<DB>);
    return { db, raw: withRaw ? serialize(db) : "" };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    const seeded = buildSeed();
    await save(seeded);
    return { db: seeded, raw: serialize(seeded) };
  }
}

function normalize(parsed: Partial<DB>): DB {
  const db = { ...EMPTY, ...parsed };
  // v0.1 때 만든 저장소에는 서가가 없다. 처음 한 번만 시드 책을 넣는다(이후 관리자가 지운 책은 되살리지 않는다).
  if (!("books" in parsed)) db.books = structuredClone(buildSeed().books);
  return db;
}

/* ---------- supabase(dandi_state 한 행) ---------- */

const STATE_TABLE = "dandi_state";
const STATE_ID = "main";
const REMOTE_RETRIES = 8;

function remoteError(error: { message: string }, what: string): Error {
  const hint = /relation|does not exist|schema cache/i.test(error.message)
    ? " supabase/migrations의 SQL을 Supabase SQL Editor에서 먼저 실행하십시오."
    : "";
  return new Error(`Supabase 저장소 ${what} 실패: ${error.message}.${hint}`);
}

async function remoteLoad(): Promise<{ db: DB; version: number }> {
  const table = () => supabaseAdmin().from(STATE_TABLE);
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await table().select("data, version").eq("id", STATE_ID).maybeSingle();
    if (error) throw remoteError(error, "읽기");
    if (data) return { db: normalize(data.data as Partial<DB>), version: Number(data.version) };
    // 처음이면 시드를 넣는다. 다른 인스턴스가 먼저 넣었으면 무시되고 다시 읽는다.
    const seeded = await table().upsert(
      { id: STATE_ID, data: buildSeed(), version: 0 },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (seeded.error) throw remoteError(seeded.error, "초기화");
  }
  throw new Error("Supabase 저장소를 초기화하지 못했습니다.");
}

/** version이 그대로일 때만 저장한다. 다른 인스턴스가 먼저 바꿨으면 false. */
async function remoteSave(db: DB, version: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from(STATE_TABLE)
    .update({ data: db, version: version + 1, updated_at: nowIso() })
    .eq("id", STATE_ID)
    .eq("version", version)
    .select("version");
  if (error) throw remoteError(error, "저장");
  return (data ?? []).length > 0;
}

async function remoteMutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const { db, version } = await remoteLoad();
    const raw = serialize(db);
    const result = await fn(db);
    if (serialize(db) === raw) return result;
    if (await remoteSave(db, version)) return result;
    if (attempt >= REMOTE_RETRIES) throw new Error("저장 요청이 몰려 저장하지 못했습니다. 잠시 뒤 다시 시도하십시오.");
    await new Promise((r) => setTimeout(r, 20 + Math.random() * 60 * (attempt + 1)));
  }
}

// Windows에서는 다른 프로그램(편집기, 백신, PowerShell 등)이 db.json을 열고 있으면 rename이 잠시 실패한다.
const RETRYABLE = new Set(["EPERM", "EACCES", "EBUSY"]);

async function renameWithRetry(from: string, to: string): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      await fs.rename(from, to);
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code ?? "";
      if (!RETRYABLE.has(code) || attempt >= 8) throw err;
      await new Promise((r) => setTimeout(r, 20 * (attempt + 1)));
    }
  }
}

async function save(db: DB): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, serialize(db), "utf8");
  try {
    await renameWithRetry(tmp, DB_FILE);
  } catch (err) {
    await fs.rm(tmp, { force: true });
    throw err;
  }
}

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = g.__dandiLock ?? Promise.resolve();
  const next = prev.then(fn, fn);
  g.__dandiLock = next.catch(() => undefined);
  return next;
}

/** 읽기 전용 스냅샷. 반환값을 수정해도 저장되지 않는다. */
export function readDb(): Promise<DB> {
  if (isRemoteStorage()) return remoteLoad().then((r) => r.db);
  return withLock(async () => (await load()).db);
}

/**
 * 저장소가 바뀌었는지 비교하는 값(캐시 무효화용). 바뀌면 값이 달라진다. 확인할 수 없으면 null.
 * local은 db.json의 수정 시각·크기, supabase는 version.
 */
export async function dbStamp(): Promise<string | null> {
  if (isRemoteStorage()) {
    const { data, error } = await supabaseAdmin().from(STATE_TABLE).select("version").eq("id", STATE_ID).maybeSingle();
    return error || !data ? null : `v${data.version}`;
  }
  try {
    const st = await fs.stat(DB_FILE);
    return `${st.mtimeMs}:${st.size}`;
  } catch {
    return null;
  }
}

/**
 * 직렬화된 읽기-수정-쓰기. fn 안에서 db를 직접 수정하면 끝난 뒤 저장된다.
 * 바뀐 내용이 없으면(검증 실패, 없는 id 등) 다시 쓰지 않는다.
 * supabase에서 다른 인스턴스와 충돌하면 fn을 새 내용으로 다시 실행하므로, fn은 db 밖의 일을 되도록 하지 않는다.
 */
export function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  // supabase에서도 같은 인스턴스 안의 쓰기는 줄 세운다(충돌 재시도를 줄인다).
  if (isRemoteStorage()) return withLock(() => remoteMutate(fn));
  return withLock(async () => {
    const { db, raw } = await load(true);
    const result = await fn(db);
    if (serialize(db) !== raw) await save(db);
    return result;
  });
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
