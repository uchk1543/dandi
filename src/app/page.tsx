import Link from "next/link";
import { AppCardGrid, formatKstDate } from "@/components/app-card";
import { BookArt, HeroArt, LevelArt, UploadArt } from "@/components/illustrations";
import { levelTone } from "@/components/level-tone";
import styles from "./hub.module.css";
import { isPublicApp } from "@/lib/apps";
import { isTeachersOnlyBookFile } from "@/lib/files";
import { getCurrentUser, isTeacher } from "@/lib/session";
import { LevelFilter } from "@/components/level-filter";
import { isSchoolLevel, levelLabel, postCategoryLabel } from "@/lib/constants";
import { readDb } from "@/lib/db";
import type { LevelOrAll, SchoolLevel } from "@/lib/types";

// 메인 허브 대시보드(PRD 9장, 화면 구성은 design.md 8장).
// 히어로 → 바로가기(도크/CTA 타일) → 학교급 카드 → 인기 미니앱 → 커뮤니티·자료실 패널.
// 전역 학교급 필터(?level=)가 인기 미니앱·커뮤니티·자료실에 모두 적용된다. 로그인 없이 사용할 수 있다.

const POPULAR_APPS = 6;
const LATEST_POSTS = 5;
const LATEST_FILES = 5;

const LEVEL_CARDS: { id: SchoolLevel; en: string; title: string; desc: string }[] = [
  { id: "elem", en: "ELEMENTARY", title: "초등 미니앱", desc: "놀이처럼 배우는 수업 도구와 학급 운영 앱" },
  { id: "middle", en: "MIDDLE", title: "중등 미니앱", desc: "교과 개념 연습, 수행평가, 학급 업무 앱" },
  { id: "high", en: "HIGH", title: "고등 미니앱", desc: "심화 학습, 진로·진학, 학교 업무 간소화 앱" },
  { id: "special", en: "SPECIAL", title: "특수 미니앱", desc: "학생 한 명 한 명에게 맞춘 맞춤 학습 앱" },
];

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function matchesLevel(target: LevelOrAll, level: SchoolLevel | undefined): boolean {
  return !level || target === "all" || target === level;
}

function withLevel(path: string, level: SchoolLevel | undefined): string {
  return level ? `${path}?level=${level}` : path;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default async function HubPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const rawLevel = first(sp.level);
  const level = isSchoolLevel(rawLevel) ? rawLevel : undefined;

  const db = await readDb();

  const apps = db.apps
    .filter(isPublicApp)
    .filter((a) => !level || a.schoolLevels.includes(level))
    .sort((a, b) => b.runs - a.runs || b.createdAt.localeCompare(a.createdAt))
    .slice(0, POPULAR_APPS);

  const posts = db.posts
    .filter((p) => matchesLevel(p.schoolLevel, level))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, LATEST_POSTS);

  const commentCount = new Map<string, number>();
  for (const c of db.comments) commentCount.set(c.postId, (commentCount.get(c.postId) ?? 0) + 1);
  const likeCount = new Map<string, number>();
  for (const l of db.likes) likeCount.set(l.postId, (likeCount.get(l.postId) ?? 0) + 1);

  const viewerIsTeacher = isTeacher(await getCurrentUser());
  const files = db.files
    .filter((f) => viewerIsTeacher || !isTeachersOnlyBookFile(db, f.id))
    .filter((f) => matchesLevel(f.schoolLevel, level))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, LATEST_FILES);

  const levelCounts = new Map<SchoolLevel, number>();
  for (const a of db.apps.filter(isPublicApp))
    for (const l of a.schoolLevels) levelCounts.set(l, (levelCounts.get(l) ?? 0) + 1);

  return (
    <>
      <section className={`${styles.hero} ${styles.bleed}`} aria-labelledby="hub-title">
        <div className={`shell ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <p className={styles.heroEyebrow}>교사가 만들고, 교사가 나누는 미니앱 허브</p>
            <h1 id="hub-title">
              AI로 만든 수업 앱,
              <br />
              <span className={styles.accent}>Dandi</span>에서 바로 나눠요
            </h1>
            <p className={styles.heroLead}>
              로그인 없이 미니앱을 바로 실행하고 자료를 내려받을 수 있습니다.
              <br className={styles.brDesktop} /> 앱 등록과 글쓰기는 <Link href="/login">교사 로그인</Link> 후 사용할 수
              있습니다.
            </p>
            <div className={styles.heroActions}>
              <Link href={withLevel("/apps", level)} className="button dark lg">
                미니앱 둘러보기
              </Link>
              <Link href="/connect" className="button lg">
                AI로 내 사이트 올리기
              </Link>
            </div>
          </div>
          <HeroArt className={styles.heroArt} />
        </div>
        <nav className={styles.dock} aria-label="바로가기">
          <Link href="/connect" className={styles.dockItem}>
            <span className={styles.dockTitle}>
              AI로
              <br />
              올리기
            </span>
            <UploadArt className={styles.dockImg} />
            <span className={styles.dockLabel}>시작</span>
          </Link>
          <span className={styles.dockDivider} aria-hidden="true" />
          <Link href="/books" className={`${styles.dockItem} ${styles.dark}`}>
            <span className={styles.dockTitle}>
              전자책
              <br />
              서가
            </span>
            <BookArt className={styles.dockImg} />
            <span className={styles.dockLabel}>읽기</span>
          </Link>
        </nav>
      </section>

      <nav className={styles.ctaTiles} aria-label="바로가기">
        <Link href="/connect" className={styles.ctaTile}>
          <UploadArt />
          <span className={styles.ctaTitle}>
            AI로 내 사이트 올리기
            <small>링크 한 줄로 배포까지</small>
          </span>
          <span className={styles.ctaPill}>시작</span>
        </Link>
        <Link href="/books" className={`${styles.ctaTile} ${styles.dark}`}>
          <BookArt />
          <span className={styles.ctaTitle}>
            전자책 서가
            <small>로그인 없이 바로 읽기</small>
          </span>
          <span className={styles.ctaPill}>읽기</span>
        </Link>
      </nav>

      <section className={styles.section} aria-labelledby="hub-levels">
        <div className={styles.sectionHead}>
          <h2 id="hub-levels">학교급별 미니앱</h2>
        </div>
        <p className={styles.sectionSub}>학교급을 고르면 그 학교급 선생님들이 만든 미니앱만 모아 봅니다.</p>
        <ul className={styles.gradeGrid}>
          {LEVEL_CARDS.map((c) => (
            <li key={c.id}>
              <Link href={`/apps?level=${c.id}`} className={`${styles.gradeCard} ${levelTone(c.id)}`}>
                <LevelArt level={c.id} className={styles.gradeArt} />
                <div className={styles.gradeText}>
                  <span className="badge solid">{c.en}</span>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                  <div className={styles.gradeCount}>{(levelCounts.get(c.id) ?? 0).toLocaleString("ko-KR")}개 앱</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="hub-apps">
        <div className={styles.sectionHead}>
          <h2 id="hub-apps">인기 미니앱</h2>
          <Link href={withLevel("/apps", level)} className={styles.moreLink}>
            미니앱 전체 보기 →
          </Link>
        </div>
        <p className={styles.sectionSub}>
          실행 수가 많은 순서입니다. 직접 만든 앱은 <Link href="/studio/apps/new">미니앱 등록(교사)</Link>에서 올릴 수
          있습니다.
        </p>
        <LevelFilter basePath="/" current={level} />
        {apps.length === 0 ? (
          <p className="muted">해당 학교급의 미니앱이 아직 없습니다.</p>
        ) : (
          <AppCardGrid apps={apps} />
        )}
      </section>

      <div className={styles.boardGrid}>
        <section className={styles.board} aria-labelledby="hub-posts">
          <div className={styles.boardHead}>
            <h2 id="hub-posts">커뮤니티 최근 글</h2>
            <Link href={withLevel("/community", level)} className={styles.moreLink}>
              더보기 →
            </Link>
          </div>
          {posts.length === 0 ? (
            <p className={`muted ${styles.boardEmpty}`}>해당 학교급의 글이 아직 없습니다.</p>
          ) : (
            <ul className={styles.boardList}>
              {posts.map((p) => (
                <li key={p.id} className={styles.boardRow}>
                  <span className="badge">{postCategoryLabel(p.category)}</span>
                  <Link href={`/community/${p.id}`} className={styles.boardTitle}>
                    {p.title}
                  </Link>
                  <span className={styles.boardDate}>{formatKstDate(p.createdAt)}</span>
                  <span className={styles.boardMeta}>
                    <span className={`badge tint ${levelTone(p.schoolLevel)}`}>{levelLabel(p.schoolLevel)}</span>
                    {p.authorName} · 댓글 {commentCount.get(p.id) ?? 0} · 좋아요 {likeCount.get(p.id) ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.board} aria-labelledby="hub-files">
          <div className={styles.boardHead}>
            <h2 id="hub-files">자료실 최근 파일</h2>
            <Link href={withLevel("/files", level)} className={styles.moreLink}>
              더보기 →
            </Link>
          </div>
          {files.length === 0 ? (
            <p className={`muted ${styles.boardEmpty}`}>해당 학교급의 자료가 아직 없습니다.</p>
          ) : (
            <ul className={styles.boardList}>
              {files.map((f) => (
                <li key={f.id} className={styles.boardRow}>
                  <span className="badge">.{f.ext}</span>
                  <strong className={styles.boardTitle}>{f.title}</strong>
                  <span className={styles.boardDate}>{formatKstDate(f.createdAt)}</span>
                  <span className={styles.boardMeta}>
                    <span className={`badge tint ${levelTone(f.schoolLevel)}`}>{levelLabel(f.schoolLevel)}</span>
                    {f.originalName} · {formatBytes(f.size)} · 다운로드 {f.downloads.toLocaleString("ko-KR")}회 ·{" "}
                    {f.authorName}
                  </span>
                  <a href={`/api/files/${f.id}/download`} className={`button ${styles.boardDownload}`}>
                    다운로드
                  </a>
                  {(f.ext === "exe" || f.ext === "apk") && (
                    <span className={`muted ${styles.boardNote}`}>
                      실행 파일입니다. 올린 교사와 출처를 확인한 뒤 실행하십시오.
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
