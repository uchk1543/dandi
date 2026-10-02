import Link from "next/link";
import type { Role } from "@/lib/types";
import { DesktopNav, MobileNav, type NavItem } from "./site-nav";
import styles from "./site-header.module.css";

// 사이트 헤더(design.md 7.1). 로고 · 가로 메뉴(≥992) · AI 연결 버튼 · 로그인 상태 · 모바일 메뉴.
// .session 클래스는 E2E가 로그인 상태를 읽는 표식이라 모듈 클래스와 함께 남겨 둔다.

// 가로 메뉴(≥992)는 자주 쓰는 화면만, 모바일 패널과 푸터에는 전체 화면을 둔다.
export const PRIMARY_NAV: NavItem[] = [
  { href: "/apps", label: "미니앱", accent: "var(--lv-elem)" },
  { href: "/templates", label: "템플릿", accent: "var(--lv-middle)" },
  { href: "/skills", label: "스킬", accent: "var(--lv-high)" },
  { href: "/books", label: "서가", accent: "var(--menu-project)" },
  { href: "/community", label: "커뮤니티", accent: "var(--menu-notice)" },
  { href: "/files", label: "자료실", accent: "var(--lv-middle)" },
  { href: "/docs", label: "문서", accent: "var(--lv-elem)" },
];
export const MORE_NAV: NavItem[] = [
  { href: "/ai", label: "AI 모델", accent: "var(--lv-high)" },
  { href: "/guide", label: "가이드", accent: "var(--menu-project)" },
  { href: "/studio", label: "스튜디오", accent: "var(--brand)" },
  { href: "/admin", label: "관리자", accent: "var(--text-primary)" },
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
        <DesktopNav items={PRIMARY_NAV} />
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
          <MobileNav items={[...PRIMARY_NAV, ...MORE_NAV]} />
        </div>
      </div>
    </header>
  );
}
