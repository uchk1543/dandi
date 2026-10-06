import { redirect } from "next/navigation";
import { levelLabel } from "@/lib/constants";
import { needsProfile } from "@/lib/login";
import { getCurrentUser } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { logout } from "./actions";
import { safeNextPath } from "@/lib/origin";
import { LoginForm } from "./login-form";

// 소셜 로그인(F-02) 실패 사유. /login/oauth/*, /login/callback이 ?error=로 넘긴다.
const LOGIN_ERRORS: Record<string, string> = {
  not_configured: "소셜 로그인이 아직 설정되지 않았습니다. 데모 로그인을 사용하십시오.",
  unknown_provider: "지원하지 않는 로그인 방식입니다.",
  oauth_start_failed: "로그인을 시작하지 못했습니다. 잠시 뒤 다시 시도하십시오.",
  oauth_denied: "로그인이 취소되었거나 제공자 설정에 문제가 있습니다.",
  oauth_invalid: "로그인 응답에 확인 코드가 없습니다. 이 화면의 버튼으로 처음부터 다시 로그인하십시오. 반복되면 Supabase 프로젝트의 Redirect URLs에 <허브 주소>/login/callback이 허용되어 있는지 확인하십시오.",
  oauth_exchange_failed: "로그인 확인에 실패했습니다. 같은 브라우저에서 이 화면의 버튼으로 처음부터 다시 시도하십시오.",
};

function nextQuery(next: string | undefined): string {
  return next ? `?next=${encodeURIComponent(next)}` : "";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = safeNextPath(typeof sp.next === "string" ? sp.next : null) ?? undefined;
  const user = await getCurrentUser();
  if (needsProfile(user)) redirect(`/login/profile${nextQuery(next)}`);
  if (user.role !== "anon") {
    return (
      <>
        <h1>계정</h1>
        <p>
          {user.name} · {user.role === "admin" ? "교육청 관리자" : "교사"}
          {user.schoolLevel ? ` · ${levelLabel(user.schoolLevel)}` : ""}
          {user.authProvider ? ` · ${user.authProvider === "google" ? "구글" : "카카오"} 로그인` : ""}
        </p>
        {user.authProvider && (
          <p>
            <a href="/login/profile">이름·학교급 바꾸기</a>
          </p>
        )}
        {next && (
          <p>
            <a href={next} className="button primary">
              이 계정으로 계속하기
            </a>
          </p>
        )}
        <form action={logout}>
          <button type="submit">로그아웃(익명으로 돌아가기)</button>
        </form>
      </>
    );
  }
  const social = isSupabaseConfigured();
  const error = typeof sp.error === "string" ? LOGIN_ERRORS[sp.error] : undefined;
  return (
    <>
      <h1>{social ? "교사 로그인" : "교사 로그인 (데모)"}</h1>
      <p className="muted">
        학생·방문자는 로그인 없이 미니앱 실행, 글 읽기, 자료 다운로드를 사용할 수 있습니다. 앱 등록·글쓰기·파일
        업로드·AI 키 발급은 교사 로그인이 필요합니다. 프로토타입에서는 구글·카카오 로그인 대신 이름과 학교급만
        입력합니다.
      </p>
      <p className="muted">
        같은 이름·역할로 다시 로그인하면 같은 계정으로 들어가, 전에 등록한 앱·글·자료와 CLI 토큰·API 키를 그대로
        관리할 수 있습니다. 데모 로그인에는 비밀번호가 없으므로 시연용으로만 사용하십시오.
      </p>
      {next && <p className="notice">로그인하면 요청하신 화면(연결 승인)으로 돌아갑니다.</p>}
      {error && <p className="notice">{error}</p>}
      {social && (
        <>
          <h2>소셜 로그인</h2>
          <p className="social-login">
            <a href={`/login/oauth/google${nextQuery(next)}`} className="button lg">
              구글로 로그인
            </a>
            <a href={`/login/oauth/kakao${nextQuery(next)}`} className="button lg">
              카카오로 로그인
            </a>
          </p>
          <h2>데모 로그인</h2>
        </>
      )}
      <LoginForm next={next} />
    </>
  );
}
