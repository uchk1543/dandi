import Link from "next/link";
import { appCategoryLabel, levelLabel } from "@/lib/constants";
import type { MiniApp } from "@/lib/types";
import { AppThumbArt } from "./illustrations";
import { levelTone } from "./level-tone";
import styles from "./app-card.module.css";

// 미니앱 카드(F-05 바로 실행, F-06 개인정보 표시). 허브(/)와 미니앱 목록(/apps)이 함께 사용한다.

/** ISO 시각을 한국 시간 기준 YYYY-MM-DD로 바꾼다. 서버 컴포넌트에서만 사용한다. */
export function formatKstDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

/** 셀프점검 답변 요약 배지(F-06): 학생 개인정보 처리, 외부 전송, 학교 내부 승인 상태. */
export function AppPrivacyBadges({ app }: { app: MiniApp }) {
  const approvedAt = formatKstDate(app.approvedAt);
  return (
    <>
      {app.handlesPersonalData ? (
        <span className="badge warn">학생 개인정보 처리</span>
      ) : (
        <span className="badge ok">학생 개인정보 없음</span>
      )}
      {app.privacyCheck?.externalTransfer && <span className="badge warn">외부 전송 있음</span>}
      {app.approvalStatus === "pending" && <span className="badge warn">승인 대기</span>}
      {app.approvalStatus === "approved" && (
        <span className="badge ok">내부 승인 완료{approvedAt ? ` ${approvedAt}` : ""}</span>
      )}
    </>
  );
}

export function AppMetaBadges({ app }: { app: MiniApp }) {
  return (
    <>
      <span className="badge">{appCategoryLabel(app.category)}</span>
      {app.schoolLevels.map((l) => (
        <span key={l} className={`badge tint ${levelTone(l)}`}>
          {levelLabel(l)}
        </span>
      ))}
    </>
  );
}

/** 미니앱 카드 그리드: 1 → 2(≥640) → 3(≥1024)열 */
export function AppCardGrid({ apps }: { apps: MiniApp[] }) {
  return (
    <ul className={styles.cardGrid}>
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </ul>
  );
}

/** 콘텐츠 카드(design.md 7.7): 썸네일 8:5 → 학교급 배지·분류 → 제목 → 설명 2줄 → 개인정보 배지 → 하단 행. */
export function AppCard({ app }: { app: MiniApp }) {
  const tone = levelTone(app.schoolLevels[0]);
  const href = `/apps/${app.id}`;
  return (
    <li className={`${styles.appCard} ${tone}`}>
      <Link href={href} className={styles.appThumb} tabIndex={-1} aria-hidden="true">
        <AppThumbArt category={app.category} className={styles.appThumbArt} />
        <span className={styles.appThumbTitle}>{app.title}</span>
      </Link>
      <div className={styles.appBody}>
        <div className={styles.appTags}>
          {app.schoolLevels.map((l) => (
            <span key={l} className={`badge tint ${levelTone(l)}`}>
              {levelLabel(l)}
            </span>
          ))}
          <span className={styles.appCat}>{appCategoryLabel(app.category)}</span>
        </div>
        <h3 className={styles.appTitle}>
          <Link href={href}>{app.title}</Link>
        </h3>
        {app.description && <p className={styles.appDesc}>{app.description}</p>}
        <div className={styles.appPrivacy}>
          <AppPrivacyBadges app={app} />
        </div>
        <div className={styles.appFoot}>
          <span className={styles.appMeta}>
            실행 {app.runs.toLocaleString("ko-KR")}회 · {app.authorName}
          </span>
          <Link href={href} className={styles.pillBtn} aria-label={`${app.title} 바로 실행`}>
            바로 실행
          </Link>
        </div>
      </div>
    </li>
  );
}
