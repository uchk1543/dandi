import "server-only";
import { createHash } from "node:crypto";
import { readObject, removeObjectPrefix, statObject, writeObject } from "./object-store";

// 내용 주소 저장소(F-51, 스킬 파일 F-38 공용). 파일 본문을 blobs/<sha256>(object-store.ts)에 한 번만 저장한다.
// - 같은 내용은 한 번만 저장된다. 배포는 불변이고, 배포 기록(SiteDeploy.files)이 해시를 가리킨다.
// - 저장 전에 sha256을 다시 계산해 요청한 해시와 다르면 거부한다.
// - 저장소는 전역이지만 "이미 있다"는 사실을 요청한 사람에게 알려 주면 안 된다(다른 교사의 비공개 파일 존재 확인·열람).
//   그래서 전역 존재 여부를 목록으로 돌려주는 함수는 두지 않고, 배포마다 실제로 받은 내용을 영수증(receipt)으로 남긴다.
//   사용자별 소유 판단은 sites.ts가 한다(그 교사의 확정된 배포·스킬에 들어 있는 해시만 올린 것으로 본다).

const SHA256_RE = /^[0-9a-f]{64}$/;

export function isSha256(value: unknown): value is string {
  return typeof value === "string" && SHA256_RE.test(value);
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** 해시 형식을 검사한 뒤 저장 키를 돌려준다. 형식이 틀리면 null(저장소 밖을 가리키지 못하게). */
function blobKey(hash: string): string | null {
  return isSha256(hash) ? `blobs/${hash}` : null;
}

export async function hasBlob(hash: string): Promise<boolean> {
  const key = blobKey(hash);
  return key ? (await statObject(key)) !== null : false;
}

/* ---------- 업로드 영수증 ---------- */

// 배포(scope)마다 요청자가 실제로 본문을 보내 해시가 확인된 내용을 표시한다: upload-receipts/<scope>/<sha256>.
// finalize는 이 영수증(또는 그 교사가 이전에 올린 적이 있다는 기록)이 있어야 파일을 인정한다.
// 파일 하나를 올릴 때마다 저장소 전체를 다시 쓰지 않으려고 DB가 아니라 작은 파일로 남긴다.
const SCOPE_RE = /^[A-Za-z0-9_-]{1,64}$/;

function receiptKey(scope: string, hash: string): string | null {
  if (!SCOPE_RE.test(scope) || !isSha256(hash)) return null;
  return `upload-receipts/${scope}/${hash}`;
}

/** scope(배포 id)에 hash 내용을 받았다고 기록한다. putBlob으로 해시를 확인한 뒤에만 부른다. */
export async function recordUploadReceipt(scope: string, hash: string): Promise<void> {
  const key = receiptKey(scope, hash);
  if (!key) return;
  await writeObject(key, new Uint8Array([49]));
}

export async function hasUploadReceipt(scope: string, hash: string): Promise<boolean> {
  const key = receiptKey(scope, hash);
  return key ? (await statObject(key)) !== null : false;
}

/** scope의 영수증을 모두 지운다(확정·삭제 뒤). 없으면 아무것도 하지 않는다. */
export async function clearUploadReceipts(scope: string): Promise<void> {
  if (!SCOPE_RE.test(scope)) return;
  await removeObjectPrefix(`upload-receipts/${scope}`);
}

export type PutBlobResult =
  | { ok: true; hash: string; created: boolean }
  | { ok: false; reason: "hash_mismatch" | "size_mismatch"; actualHash: string; actualSize: number };

/**
 * 본문을 저장한다. expected를 주면 해시(와 크기)가 같을 때만 저장한다.
 * 이미 같은 해시의 파일이 있으면 다시 쓰지 않는다(created: false).
 */
export async function putBlob(
  bytes: Uint8Array,
  expected?: { sha256?: string; size?: number },
): Promise<PutBlobResult> {
  const hash = sha256Hex(bytes);
  if (expected?.size !== undefined && expected.size !== bytes.byteLength) {
    return { ok: false, reason: "size_mismatch", actualHash: hash, actualSize: bytes.byteLength };
  }
  if (expected?.sha256 !== undefined && expected.sha256 !== hash) {
    return { ok: false, reason: "hash_mismatch", actualHash: hash, actualSize: bytes.byteLength };
  }
  const key = blobKey(hash) as string; // sha256Hex는 항상 올바른 형식
  if (await hasBlob(hash)) return { ok: true, hash, created: false };
  const created = await writeObject(key, bytes);
  return { ok: true, hash, created };
}

/** 본문을 읽는다. 없거나 해시 형식이 틀리면 null. verify를 켜면 해시를 다시 계산해 손상 여부를 확인한다. */
export async function readBlob(hash: string, { verify = false }: { verify?: boolean } = {}): Promise<Uint8Array | null> {
  const key = blobKey(hash);
  if (!key) return null;
  const bytes = await readObject(key);
  if (!bytes) return null;
  if (verify && sha256Hex(bytes) !== hash) return null;
  return bytes;
}
