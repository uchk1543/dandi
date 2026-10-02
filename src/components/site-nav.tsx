"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./site-header.module.css";

// 헤더 메뉴(design.md 7.1). 992px 이상은 가로 메뉴, 그 아래는 햄버거 패널.
// 메뉴마다 hover·현재 위치 밑줄 색(--accent)을 다르게 준다.

export type NavItem = { href: string; label: string; accent: string };

function isCurrent(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className={styles.gnb} aria-label="주 메뉴">
      {items.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          style={{ "--accent": n.accent } as CSSProperties}
          aria-current={isCurrent(pathname, n.href) ? "page" : undefined}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);
  const ref = useRef<HTMLDivElement>(null);

  // 다른 화면으로 이동하면 패널을 닫는다(렌더 중 상태 조정).
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <div className={styles.mnav} ref={ref}>
      <button
        type="button"
        className={styles.mnavToggle}
        aria-expanded={open}
        aria-controls="mnav-panel"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      </button>
      {open && (
        <div className={styles.mnavPanel} id="mnav-panel">
          <ul>
            {items.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  style={{ "--accent": n.accent } as CSSProperties}
                  aria-current={isCurrent(pathname, n.href) ? "page" : undefined}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/connect" className={`button primary ${styles.mnavCta}`}>
            AI로 내 사이트 올리기
          </Link>
        </div>
      )}
    </div>
  );
}
