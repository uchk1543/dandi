"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./site-header.module.css";

// 헤더 메뉴(design.md 7.1). 992px 이상은 묶음별 드롭다운, 그 아래는 햄버거 패널.
// 묶음마다 hover·현재 위치 밑줄 색(--accent)을 다르게 준다. 항목이 하나뿐인 묶음은 드롭다운 없이 링크로 둔다.

export type NavItem = { href: string; label: string; desc?: string };
export type NavGroup = { label: string; accent: string; items: NavItem[] };

function isCurrent(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [prevPath, setPrevPath] = useState(pathname);
  // 마우스를 올려 연 드롭다운은 이어지는 클릭 한 번에 닫히지 않게 한다.
  const openedByHover = useRef(false);

  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(null);
  }

  // 헤더는 이동해도 다시 그려지지 않아 클릭한 메뉴가 포커스를 계속 쥔다.
  // 그대로 두면 키를 한 번 누를 때 엉뚱한 메뉴에 포커스 테두리가 켜지므로 이동하면 놓아 준다.
  useEffect(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && ref.current?.contains(active)) active.blur();
  }, [pathname]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <nav className={styles.gnb} aria-label="주 메뉴" ref={ref}>
      {groups.map((g, i) => {
        const style = { "--accent": g.accent } as CSSProperties;
        const current = g.items.some((n) => isCurrent(pathname, n.href));
        if (g.items.length === 1) {
          const n = g.items[0];
          return (
            <Link
              key={n.href}
              href={n.href}
              className={styles.gnbLink}
              style={style}
              aria-current={current ? "page" : undefined}
            >
              {g.label}
            </Link>
          );
        }
        const isOpen = open === i;
        const panelId = `gnb-panel-${i}`;
        return (
          <div
            key={g.label}
            className={styles.gnbGroup}
            style={style}
            onPointerEnter={(e) => {
              if (e.pointerType !== "mouse") return;
              openedByHover.current = open !== i;
              setOpen(i);
            }}
            onPointerLeave={(e) => e.pointerType === "mouse" && setOpen((v) => (v === i ? null : v))}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen((v) => (v === i ? null : v));
            }}
          >
            <button
              type="button"
              className={styles.gnbLink}
              aria-expanded={isOpen}
              aria-controls={panelId}
              data-current={current || undefined}
              onClick={() => {
                if (openedByHover.current) {
                  openedByHover.current = false;
                  return;
                }
                setOpen(isOpen ? null : i);
              }}
            >
              {g.label}
              <svg className={styles.gnbChevron} viewBox="0 0 12 12" aria-hidden="true">
                <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <ul className={styles.gnbPanel} id={panelId} hidden={!isOpen}>
              {g.items.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} aria-current={isCurrent(pathname, n.href) ? "page" : undefined}>
                    <strong>{n.label}</strong>
                    {n.desc && <span>{n.desc}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function MobileNav({ groups, isAdmin }: { groups: NavGroup[]; isAdmin: boolean }) {
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
          {groups.map((g) => (
            <section key={g.label} className={styles.mnavGroup} style={{ "--accent": g.accent } as CSSProperties}>
              {g.items.length > 1 && <h2>{g.label}</h2>}
              <ul>
                {/* /connect는 패널 아래 큰 버튼으로 따로 둔다 */}
                {g.items.filter((n) => n.href !== "/connect").map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} aria-current={isCurrent(pathname, n.href) ? "page" : undefined}>
                      {n.label}
                    </Link>
                  </li>
                ))}
                {isAdmin && g === groups[groups.length - 1] && (
                  <li>
                    <Link href="/admin" aria-current={isCurrent(pathname, "/admin") ? "page" : undefined}>
                      관리자
                    </Link>
                  </li>
                )}
              </ul>
            </section>
          ))}
          <Link href="/connect" className={`button primary ${styles.mnavCta}`}>
            AI로 내 사이트 올리기
          </Link>
        </div>
      )}
    </div>
  );
}
