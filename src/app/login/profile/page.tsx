import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/origin";
import { getCurrentUser } from "@/lib/session";
import { ProfileForm } from "./profile-form";

// 소셜 로그인(F-02) 뒤 처음 한 번: 작성자 이름과 학교급(F-03)을 정한다.

export const metadata: Metadata = { title: "프로필 설정 · Dandi" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = safeNextPath(typeof sp.next === "string" ? sp.next : null) ?? undefined;
  const user = await getCurrentUser();
  if (user.role !== "teacher" || !user.authProvider) redirect("/login");
  return (
    <>
      <h1>프로필 설정</h1>
      <p className="muted">
        앱·글·자료를 올릴 때 작성자 이름과 학교급이 함께 표시됩니다. 이름에는 전화번호·이메일 같은 개인정보를 넣지
        마십시오. 나중에 다시 바꿀 수 있습니다.
      </p>
      <ProfileForm next={next} name={user.name ?? ""} schoolLevel={user.schoolLevel} />
    </>
  );
}
