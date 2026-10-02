import type { AppCategory, SchoolLevel } from "@/lib/types";

// 허브 화면용 자체 제작 SVG 일러스트. 외부 이미지 없이 학교급·분류 색만으로 그린다.
// 모두 장식용이라 aria-hidden으로 보조기기에서 숨긴다.

type SvgProps = { className?: string };

/** 히어로 마스코트: 태블릿을 든 로봇과 떠 있는 미니앱 카드 */
export function HeroArt({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 520 420" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="270" cy="392" rx="150" ry="16" fill="#6D4AE8" opacity=".12" />
      {/* 떠 있는 앱 카드 */}
      <g transform="rotate(-8 92 120)">
        <rect x="30" y="70" width="124" height="96" rx="18" fill="#fff" />
        <rect x="30" y="70" width="124" height="30" rx="18" fill="#FF6700" />
        <rect x="30" y="86" width="124" height="14" fill="#FF6700" />
        <rect x="46" y="114" width="70" height="9" rx="4.5" fill="#E6E8EB" />
        <rect x="46" y="132" width="50" height="9" rx="4.5" fill="#E6E8EB" />
        <circle cx="134" cy="146" r="10" fill="#FF6700" opacity=".2" />
      </g>
      <g transform="rotate(7 446 96)">
        <rect x="390" y="44" width="112" height="90" rx="18" fill="#fff" />
        <rect x="406" y="60" width="34" height="34" rx="10" fill="#29A3A3" opacity=".9" />
        <rect x="448" y="64" width="40" height="8" rx="4" fill="#E6E8EB" />
        <rect x="448" y="80" width="28" height="8" rx="4" fill="#E6E8EB" />
        <rect x="406" y="106" width="82" height="12" rx="6" fill="#29A3A3" opacity=".18" />
      </g>
      <g transform="rotate(-4 454 262)">
        <rect x="404" y="214" width="100" height="96" rx="18" fill="#fff" />
        <path d="M420 290 l18 -26 l16 16 l14 -22 l20 32 z" fill="#9E54DE" opacity=".85" />
        <circle cx="430" cy="236" r="8" fill="#9E54DE" opacity=".35" />
      </g>
      {/* 반짝이 */}
      <path d="M186 40 l5 13 13 5 -13 5 -5 13 -5 -13 -13 -5 13 -5z" fill="#fff" />
      <path d="M372 186 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z" fill="#fff" />
      <circle cx="70" cy="250" r="6" fill="#fff" />
      {/* 안테나 */}
      <rect x="265" y="62" width="6" height="34" rx="3" fill="#B9A9F7" />
      <circle cx="268" cy="58" r="13" fill="#6D4AE8" />
      <circle cx="264" cy="54" r="4" fill="#fff" opacity=".6" />
      {/* 귀 */}
      <rect x="172" y="146" width="26" height="54" rx="13" fill="#B9A9F7" />
      <rect x="338" y="146" width="26" height="54" rx="13" fill="#B9A9F7" />
      {/* 머리 */}
      <rect x="186" y="92" width="164" height="140" rx="56" fill="#fff" />
      <rect x="206" y="122" width="124" height="80" rx="36" fill="#22264A" />
      <ellipse cx="244" cy="160" rx="11" ry="14" fill="#7FE7FF" />
      <ellipse cx="292" cy="160" rx="11" ry="14" fill="#7FE7FF" />
      <circle cx="248" cy="154" r="4" fill="#fff" />
      <circle cx="296" cy="154" r="4" fill="#fff" />
      <path d="M256 184 q12 10 24 0" stroke="#7FE7FF" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="214" cy="190" rx="9" ry="6" fill="#FF8FB1" opacity=".55" />
      <ellipse cx="322" cy="190" rx="9" ry="6" fill="#FF8FB1" opacity=".55" />
      {/* 몸통 */}
      <path d="M214 250 q0 -20 20 -20 h68 q20 0 20 20 v74 q0 46 -54 46 q-54 0 -54 -46z" fill="#fff" />
      <circle cx="268" cy="262" r="9" fill="#6D4AE8" opacity=".25" />
      {/* 팔 */}
      <path d="M216 262 q-34 12 -34 48" stroke="#fff" strokeWidth="22" strokeLinecap="round" />
      <path d="M320 262 q34 12 34 48" stroke="#fff" strokeWidth="22" strokeLinecap="round" />
      {/* 태블릿 */}
      <g transform="rotate(-6 268 312)">
        <rect x="190" y="268" width="156" height="104" rx="16" fill="#22264A" />
        <rect x="200" y="278" width="136" height="84" rx="10" fill="#F7F7F7" />
        <rect x="210" y="288" width="36" height="30" rx="8" fill="#FF6700" />
        <rect x="250" y="288" width="36" height="30" rx="8" fill="#29A3A3" />
        <rect x="290" y="288" width="36" height="30" rx="8" fill="#9E54DE" />
        <rect x="210" y="324" width="116" height="10" rx="5" fill="#E6E8EB" />
        <rect x="210" y="340" width="72" height="10" rx="5" fill="#6D4AE8" opacity=".5" />
      </g>
      <circle cx="184" cy="314" r="15" fill="#fff" />
      <circle cx="352" cy="314" r="15" fill="#fff" />
    </svg>
  );
}

/** 학교급 카드 일러스트 */
export function LevelArt({ level, className }: SvgProps & { level: SchoolLevel }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" aria-hidden="true" focusable="false">
      {level === "elem" && (
        <>
          <circle cx="164" cy="28" r="6" fill="#FF6700" opacity=".25" />
          <path d="M28 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#FFB27A" />
          <rect x="34" y="104" width="44" height="44" rx="8" fill="#FF6700" />
          <rect x="78" y="112" width="36" height="36" rx="8" fill="#2E7BEA" />
          <rect x="52" y="70" width="38" height="38" rx="8" fill="#FFC23D" />
          <path d="M100 98 q34 -46 86 -26 l-8 64 q-46 -14 -78 10z" fill="#fff" stroke="#FFB27A" strokeWidth="4" strokeLinejoin="round" />
          <path d="M140 84 l-6 60" stroke="#FFB27A" strokeWidth="3" />
          <path d="M116 104 q12 -6 18 -4 M150 92 q12 -4 22 0 M148 108 q12 -4 22 0" stroke="#FFD2B0" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {level === "middle" && (
        <>
          <circle cx="40" cy="30" r="5" fill="#29A3A3" opacity=".3" />
          <rect x="30" y="34" width="130" height="94" rx="14" fill="#fff" stroke="#9ED8D8" strokeWidth="4" />
          <path d="M48 104 l26 -26 l22 14 l34 -38" stroke="#29A3A3" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="74" cy="78" r="6" fill="#29A3A3" />
          <circle cx="96" cy="92" r="6" fill="#29A3A3" />
          <circle cx="130" cy="54" r="6" fill="#29A3A3" />
          <circle cx="160" cy="124" r="28" fill="#FFB547" />
          <path d="M160 124 v-28 a28 28 0 0 1 26 18z" fill="#29A3A3" />
          <circle cx="160" cy="124" r="11" fill="#fff" />
        </>
      )}
      {level === "high" && (
        <>
          <circle cx="36" cy="40" r="7" fill="#9E54DE" opacity=".25" />
          <rect x="22" y="104" width="12" height="40" rx="4" fill="#C7A3EE" />
          <rect x="40" y="88" width="12" height="56" rx="4" fill="#B184E8" />
          <rect x="58" y="96" width="12" height="48" rx="4" fill="#C7A3EE" />
          <rect x="86" y="116" width="96" height="16" rx="5" fill="#7B3FC4" />
          <rect x="92" y="100" width="86" height="16" rx="5" fill="#B184E8" />
          <rect x="86" y="132" width="98" height="14" rx="5" fill="#5B2A9E" />
          <path d="M134 34 l52 22 -52 22 -52 -22z" fill="#6D35B8" />
          <path d="M108 66 v18 q26 16 52 0 v-18 l-26 11z" fill="#8A4FD6" />
          <path d="M178 60 v28" stroke="#FFC23D" strokeWidth="4" strokeLinecap="round" />
          <circle cx="178" cy="92" r="6" fill="#FFC23D" />
        </>
      )}
      {level === "special" && (
        <>
          <circle cx="40" cy="36" r="6" fill="#2488F2" opacity=".3" />
          <path d="M100 140 q-64 -40 -64 -78 q0 -28 28 -28 q22 0 36 22 q14 -22 36 -22 q28 0 28 28 q0 38 -64 78z" fill="#7DB8F7" />
          <path d="M100 140 q-40 -28 -48 -60" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".6" />
          <circle cx="150" cy="118" r="22" fill="#fff" stroke="#2488F2" strokeWidth="4" />
          <path d="M140 118 l7 7 13 -14" stroke="#2488F2" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M160 34 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#9CC9FA" />
        </>
      )}
    </svg>
  );
}

/** 도크·CTA 아이콘: AI로 사이트 올리기 */
export function UploadArt({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 64 58" fill="none" aria-hidden="true" focusable="false">
      <rect x="4" y="10" width="56" height="42" rx="10" fill="#FFE6D4" />
      <rect x="4" y="10" width="56" height="12" rx="6" fill="#FF6700" opacity=".85" />
      <circle cx="12" cy="16" r="2" fill="#fff" />
      <circle cx="19" cy="16" r="2" fill="#fff" />
      <path d="M32 46 V28 m-8 8 l8 -8 8 8" stroke="#FF6700" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M52 2 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#6D4AE8" />
    </svg>
  );
}

/** 도크·CTA 아이콘: 전자책 서가 */
export function BookArt({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 64 58" fill="none" aria-hidden="true" focusable="false">
      <path d="M32 14 q-12 -8 -28 -4 v40 q16 -4 28 4z" fill="#E4E0FB" />
      <path d="M32 14 q12 -8 28 -4 v40 q-16 -4 -28 4z" fill="#C9BEF7" />
      <path d="M32 14 v40" stroke="#6D4AE8" strokeWidth="3" />
      <path d="M10 20 q9 -2 16 2 M10 28 q9 -2 16 2 M38 22 q7 -4 16 -2 M38 30 q7 -4 16 -2" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="44" y="2" width="8" height="18" rx="2" fill="#18191B" />
      <path d="M44 20 l4 -4 4 4" fill="#18191B" />
    </svg>
  );
}

const CATEGORY_GLYPH: Record<AppCategory, string> = {
  class: "M0 -18 l16 8 v16 l-16 8 l-16 -8 v-16z", // 수업: 블록
  work: "M-16 -12 h32 v26 h-32z M-8 -18 h16 v6 h-16z", // 업무: 서류 가방
  guidance: "M0 16 q-20 -12 -20 -24 q0 -10 10 -10 q7 0 10 8 q3 -8 10 -8 q10 0 10 10 q0 12 -20 24z", // 학생지도: 하트
  etc: "M0 -18 l5 12 13 1 -10 9 3 13 -11 -7 -11 7 3 -13 -10 -9 13 -1z", // 기타: 별
};

/** 미니앱 썸네일 자리(8:5). 스크린샷이 없으므로 학교급 색 위에 분류 기호를 크게 그린다. */
export function AppThumbArt({ category, className }: SvgProps & { category: AppCategory }) {
  return (
    <svg className={className} viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <circle cx="270" cy="40" r="70" fill="var(--lv, #6D4AE8)" opacity=".14" />
      <circle cx="300" cy="150" r="40" fill="var(--lv, #6D4AE8)" opacity=".1" />
      <rect x="200" y="34" width="84" height="84" rx="24" fill="#fff" />
      <g transform="translate(242 76) scale(1.25)">
        <path d={CATEGORY_GLYPH[category]} fill="var(--lv, #6D4AE8)" />
      </g>
      <circle cx="40" cy="36" r="5" fill="#fff" />
      <circle cx="176" cy="28" r="3" fill="#fff" />
    </svg>
  );
}
