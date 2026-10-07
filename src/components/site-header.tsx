import Link from "next/link";
import type { Role } from "@/lib/types";
import { DesktopNav, MobileNav, type NavGroup } from "./site-nav";
import styles from "./site-header.module.css";

// 사이트 헤더(design.md 7.1). 로고 · 가로 메뉴(≥992) · AI 연결 버튼 · 로그인 상태 · 모바일 메뉴.
// .session 클래스는 E2E가 로그인 상태를 읽는 표식이라 모듈 클래스와 함께 남겨 둔다.

// 메뉴는 쓰임새별로 묶는다. 수업하기는 수업 시간에 바로 쓰는 화면만, 개발하기는 교사 개발 공동체와 만들기 도구,
// 문서는 사용 설명서다(계정은 오른쪽 로그인 영역). 가로 메뉴(≥992)는 묶음마다 드롭다운, 모바일 패널과 푸터는 묶음 제목 아래 나열한다.
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "수업하기",
    accent: "var(--lv-elem)",
    items: [
      { href: "/apps", label: "미니앱", desc: "교사들이 만든 수업용 앱을 바로 실행" },
      { href: "/books", label: "서가", desc: "웹북과 PDF 교재를 브라우저에서 읽기" },
      { href: "/files", label: "자료실", desc: "교육용 프로그램과 수업 자료 내려받기" },
    ],
  },
  {
    label: "개발하기",
    accent: "var(--brand)",
    items: [
      { href: "/community", label: "커뮤니티", desc: "아이디어 발표 · 의견 나누기 · 팀 모집" },
      { href: "/templates", label: "템플릿", desc: "예시 사이트와 AI 작업 지시서로 시작" },
      { href: "/skills", label: "스킬", desc: "AI 코딩 도구에 설치하는 작업 설명서" },
      { href: "/ai", label: "AI 모델", desc: "프로젝트 API 키와 사용 가능한 모델" },
      { href: "/studio", label: "스튜디오", desc: "내가 올린 앱 · 사이트 · 글 관리" },
      { href: "/connect", label: "AI로 내 사이트 올리기", desc: "AI 도구에 주소 하나로 바로 배포" },
    ],
  },
  { label: "문서", accent: "var(--lv-middle)", items: [{ href: "/docs", label: "문서" }] },
];

function LogoMark() {
  return (
    <svg className={styles.logoMark} viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <rect width="28" height="28" rx="9" fill="#6D4AE8" />
      <rect x="6" y="6" width="7" height="7" rx="2" fill="#fff" />
      <rect x="15" y="6" width="7" height="7" rx="2" fill="#FFB27A" />
      <rect x="6" y="15" width="7" height="7" rx="2" fill="#7FE7FF" />
      <rect x="15" y="15" width="7" height="7" rx="2" fill="#fff" />
    </svg>
  );
}

export function SiteHeader({ who, role }: { who: string; role: Role }) {
  return (
    <header className={styles.siteHeader}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.logo} aria-label="Dandi 허브 홈">
          <LogoMark />
          <span>
            Dan<span className={styles.logoAccent}>di</span>
          </span>
          <span className={styles.logoTag}>v0.2</span>
        </Link>
        <DesktopNav groups={NAV_GROUPS} />
        <div className={styles.headerActions}>
          <Link href="/connect" className={`button primary ${styles.headerCta}`}>
            AI로 내 사이트 올리기
          </Link>
          <div className={`session ${styles.session}`}>
            <span className={styles.sessionWho}>{who}</span>
            {role !== "anon" && (
              <Link className={styles.sessionExtra} href={role === "admin" ? "/admin" : "/studio"}>
                {role === "admin" ? "관리자" : "스튜디오"}
              </Link>
            )}
            <Link href="/login">{role === "anon" ? "교사 로그인" : "계정"}</Link>
          </div>
          <MobileNav groups={NAV_GROUPS} isAdmin={role === "admin"} />
        </div>
      </div>
    </header>
  );
}
