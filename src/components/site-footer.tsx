import Link from "next/link";
import { NAV_GROUPS } from "./site-header";
import styles from "./site-footer.module.css";

// 사이트 푸터(design.md 7.9). 프로토타입임을 밝히고 전체 화면 바로가기를 둔다.
export function SiteFooter() {
  return (
    <footer className={styles.siteFooter}>
      <div className={styles.footerInner}>
        <div>
          <div className={styles.footerLogo}>
            Dan<span className={styles.logoAccent}>di</span>
          </div>
          <ul className={styles.footerInfo}>
            <li>교사가 AI 코딩 도구로 만든 수업·업무 미니앱을 올리고 함께 쓰는 허브</li>
            <li>v0.2 프로토타입 · 로컬 저장소 · 데모 로그인 · 모의 AI 응답</li>
            <li>
              AI 에이전트는 <code>/llms.txt</code>를 읽으십시오
            </li>
          </ul>
          <p className={styles.footerCopy}>이 화면은 기능 확인용 시안입니다. 공식 서비스가 아닙니다.</p>
        </div>
        <nav className={styles.footerLinks} aria-label="바로가기">
          {NAV_GROUPS.map((g) => (
            <div key={g.label}>
              <h2>{g.items.length > 1 ? g.label : "도움말"}</h2>
              {g.items.map((n) => (
                <Link key={n.href} href={n.href}>
                  {n.label}
                </Link>
              ))}
              {g.items.length === 1 && (
                <>
                  <Link href="/admin">관리자</Link>
                  <a href="/llms.txt">llms.txt</a>
                </>
              )}
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}
