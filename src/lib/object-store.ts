import "server-only";
import { randomBytes } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { DATA_DIR } from "./db";
import { freshFetch, isRemoteStorage, storageBucket, storageRest, supabaseAdmin } from "./supabase-admin";

// 파일 본문 저장소. 키는 "uploads/<저장 이름>", "blobs/<sha256>", "upload-receipts/<scope>/<sha256>" 형태다.
// - local: DATA_DIR/<키>(예전 data/ 폴더 배치와 같다)
// - supabase: 비공개 버킷(storageBucket())의 <키>
// 키 검사는 부르는 쪽(해시·저장 이름 규칙)이 먼저 하고, 여기서는 경로 조작만 한 번 더 막는다.

export interface ObjectStat {
  size: number;
  mtimeMs: number;
}

export interface ByteRange {
  start: number;
  /** 포함(inclusive) */
  end: number;
}

const SEGMENT_RE = /^[A-Za-z0-9_-][A-Za-z0-9._-]{0,127}$/;

function checkKey(key: string): string {
  if (!key.split("/").every((s) => SEGMENT_RE.test(s))) throw new Error(`잘못된 저장 키: ${key}`);
  return key;
}

function localPath(key: string): string {
  return path.join(DATA_DIR, ...checkKey(key).split("/"));
}

function encodeKey(key: string): string {
  return checkKey(key).split("/").map(encodeURIComponent).join("/");
}

function isNotFound(error: { message?: string; status?: number; statusCode?: string | number } | null): boolean {
  if (!error) return false;
  return error.status === 404 || String(error.statusCode) === "404" || /not.?found/i.test(error.message ?? "");
}

/* ---------- local ---------- */

// Windows에서는 백신·검색 색인이 새 파일을 잠시 열어 rename이 실패할 수 있다(db.ts와 같은 처리).
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

async function localStat(key: string): Promise<ObjectStat | null> {
  try {
    const st = await fs.stat(localPath(key));
    return st.isFile() ? { size: st.size, mtimeMs: st.mtimeMs } : null;
  } catch {
    return null;
  }
}

/** 임시 파일에 쓴 뒤 이름을 바꾼다. 쓰는 도중에 멈춰도 반쯤 쓴 파일이 키 이름으로 남지 않는다. */
async function localWrite(key: string, bytes: Uint8Array): Promise<boolean> {
  const full = localPath(key);
  if (await localStat(key)) return false;
  await fs.mkdir(path.dirname(full), { recursive: true });
  const tmp = path.join(path.dirname(full), `.${path.basename(full)}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`);
  await fs.writeFile(tmp, bytes);
  try {
    await renameWithRetry(tmp, full);
  } catch (err) {
    await fs.rm(tmp, { force: true });
    // 동시에 같은 키를 쓴 다른 요청이 먼저 저장했으면 이미 있는 것으로 본다.
    if (await localStat(key)) return false;
    throw err;
  }
  return true;
}

/* ---------- supabase ---------- */

async function remoteStat(key: string): Promise<ObjectStat | null> {
  const { data, error } = await supabaseAdmin().storage.from(storageBucket()).info(checkKey(key));
  if (error) {
    if (isNotFound(error as never)) return null;
    throw error;
  }
  const size = data.size ?? Number((data.metadata as { size?: number } | undefined)?.size ?? NaN);
  if (!Number.isFinite(size)) return null;
  const mtimeMs = Date.parse(data.lastModified ?? data.updatedAt ?? data.createdAt);
  return { size, mtimeMs: Number.isFinite(mtimeMs) ? mtimeMs : 0 };
}

async function remoteWrite(key: string, bytes: Uint8Array): Promise<boolean> {
  const { error } = await supabaseAdmin()
    .storage.from(storageBucket())
    .upload(checkKey(key), bytes, { upsert: false, contentType: "application/octet-stream" });
  if (!error) return true;
  const e = error as { message?: string; status?: number; statusCode?: string | number };
  if (e.status === 409 || String(e.statusCode) === "409" || /exist|duplicate/i.test(e.message ?? "")) return false;
  throw error;
}

/** Range를 지원하는 GET. 없으면 null. 서버가 Range를 무시하고 전체를 주면 잘라서 돌려준다. */
async function remoteGet(key: string, range?: ByteRange): Promise<Response | null> {
  const { objectUrl, headers } = storageRest();
  const res = await freshFetch(`${objectUrl}/${encodeURIComponent(storageBucket())}/${encodeKey(key)}`, {
    headers: range ? { ...headers, Range: `bytes=${range.start}-${range.end}` } : headers,
  });
  if (res.status === 404 || res.status === 400) {
    await res.body?.cancel();
    return null;
  }
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`Supabase Storage 읽기 실패(${res.status}): ${key}`);
  }
  if (range && res.status === 200) {
    const all = new Uint8Array(await res.arrayBuffer());
    return new Response(all.slice(range.start, range.end + 1));
  }
  return res;
}

/* ---------- 공개 함수 ---------- */

export async function statObject(key: string): Promise<ObjectStat | null> {
  return isRemoteStorage() ? remoteStat(key) : localStat(key);
}

/**
 * 키가 없을 때만 저장한다. 새로 저장했으면 true, 이미 있었으면 false.
 * (내용 주소 저장과 무작위 이름 저장만 쓰므로 덮어쓰기가 필요 없다.)
 */
export async function writeObject(key: string, bytes: Uint8Array): Promise<boolean> {
  return isRemoteStorage() ? remoteWrite(key, bytes) : localWrite(key, bytes);
}

export async function readObject(key: string, range?: ByteRange): Promise<Uint8Array | null> {
  if (isRemoteStorage()) {
    const res = await remoteGet(key, range);
    return res ? new Uint8Array(await res.arrayBuffer()) : null;
  }
  const full = localPath(key);
  if (!range) {
    try {
      const buf = await fs.readFile(full);
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    } catch {
      return null;
    }
  }
  let handle: fs.FileHandle | null = null;
  try {
    handle = await fs.open(full, "r");
    const buf = Buffer.alloc(range.end - range.start + 1);
    const { bytesRead } = await handle.read(buf, 0, buf.length, range.start);
    return new Uint8Array(buf.buffer, buf.byteOffset, bytesRead);
  } catch {
    return null;
  } finally {
    await handle?.close();
  }
}

/** 응답 본문용 스트림. 없으면 null. */
export async function streamObject(key: string, range?: ByteRange): Promise<ReadableStream<Uint8Array> | null> {
  if (isRemoteStorage()) {
    const res = await remoteGet(key, range);
    return res?.body ?? null;
  }
  if (!(await localStat(key))) return null;
  const stream = createReadStream(localPath(key), range ? { start: range.start, end: range.end } : undefined);
  return Readable.toWeb(stream) as ReadableStream<Uint8Array>;
}

/** 없으면 아무것도 하지 않는다. */
export async function removeObject(key: string): Promise<void> {
  if (isRemoteStorage()) {
    const { error } = await supabaseAdmin().storage.from(storageBucket()).remove([checkKey(key)]);
    if (error && !isNotFound(error as never)) throw error;
    return;
  }
  try {
    await fs.unlink(localPath(key));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

/** prefix 폴더 바로 아래의 파일을 모두 지운다. */
export async function removeObjectPrefix(prefix: string): Promise<void> {
  if (!isRemoteStorage()) {
    await fs.rm(localPath(prefix), { recursive: true, force: true });
    return;
  }
  const bucket = supabaseAdmin().storage.from(storageBucket());
  for (let round = 0; round < 50; round++) {
    const { data, error } = await bucket.list(checkKey(prefix), { limit: 1000 });
    if (error) throw error;
    const names = (data ?? []).map((o) => o.name).filter((n) => SEGMENT_RE.test(n));
    if (names.length === 0) return;
    const removed = await bucket.remove(names.map((n) => `${prefix}/${n}`));
    if (removed.error) throw removed.error;
  }
}
