"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSchoolLevel } from "@/lib/constants";
import { mutate } from "@/lib/db";
import { NAME_MAX } from "@/lib/login";
import { safeNextPath } from "@/lib/origin";
import { hasPII } from "@/lib/pii";
import { getCurrentUser, writeAudit } from "@/lib/session";

export type ProfileState = { error?: string };

// 소셜 로그인 계정의 첫 프로필(F-03): 작성자 이름과 학교급. 데모 로그인과 같은 규칙으로 검사한다.
export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (user.role !== "teacher" || !user.authProvider) return { error: "소셜 로그인한 교사만 사용할 수 있습니다." };
  const name = String(formData.get("name") ?? "").trim();
  const level = String(formData.get("schoolLevel") ?? "");
  if (!name) return { error: "이름을 입력하십시오." };
  if (name.length > NAME_MAX) return { error: `이름은 ${NAME_MAX}자 이하로 입력하십시오.` };
  if (hasPII(name)) return { error: "이름에 전화번호·이메일 등 개인정보로 보이는 내용이 있습니다. 이름만 입력하십시오." };
  if (!isSchoolLevel(level)) return { error: "학교급을 선택하십시오." };

  await mutate((db) => {
    const account = db.users.find((u) => u.id === user.id);
    if (!account) return;
    account.name = name;
    account.schoolLevel = level;
    writeAudit(db, account, "auth.profile_update", account.id, level);
  });
  revalidatePath("/", "layout");
  redirect(safeNextPath(String(formData.get("next") ?? "")) ?? "/studio");
}
