# design.md — SCHOOL AI (sai.software.kr)

> https://sai.software.kr/ 메인 페이지(리뉴얼)의 **실제 CSS 규칙**(미디어 쿼리, clamp, vw, %, aspect-ratio, grid)을 추출하고,
> 440 · 800 · 1440px 화면 폭에서 실제 크기를 재서 검증한 반응형 설계 명세입니다. (2026-10-02 기준)
> px 값은 "그 구간에서의 고정값"이고, 비율·유동값이 있는 곳은 그 공식을 그대로 적었습니다.

---

## 0. 반응형 설계 원리 (먼저 읽을 것)

1. **모바일 우선(mobile-first).** 기본 스타일이 모바일이고, `min-width: 640px`, `min-width: 1024px`에서 단계적으로 확장한다.
2. **데스크톱 기준 아트보드는 1920px.** 데스크톱 전용 요소의 vw 값은 모두 `px ÷ 1920`으로 계산되어 있다.
   예) 히어로 높이 540/1920 = 28.125vw, 도크 너비 114/1920 = 5.94vw.
   → 1920에서 디자인 원본 크기, 그보다 작으면 비례 축소, `clamp()`로 최소/최대를 막는다.
3. **콘텐츠 폭은 "최대 1380px + 좌우 여백"으로 고정.** 화면이 커져도 1380을 넘지 않고 가운데 정렬.
4. **카드 그리드는 fr 기반 1 → 2 → 3열.** 카드 자체 크기는 정하지 않고, 열 수와 간격만 정한다.
5. **카드 내부 비율은 aspect-ratio와 %로.** 썸네일 8:5, 학교급 카드 2:1, 텍스트 영역은 카드 폭의 56~62%.
6. **글자는 브레이크포인트에서 단계 점프.** 유동 타이포(clamp)는 데스크톱 전용 요소에만 쓴다.
7. **자간은 em 단위.** 전역 `letter-spacing: -0.03em`(-3%), 헤딩은 -0.035 ~ -0.055em. 글자 크기가 바뀌면 자간도 비례해서 바뀐다.

---

## 1. 브레이크포인트

| 이름 | 범위 | 주요 변화 |
|---|---|---|
| **Mobile** | 0 – 639px | 1열, 좌우 여백 20px, 히어로 높이 320px 고정, 모바일 전용 히어로 이미지와 로봇 |
| **Tablet** | 640 – 1023px | 2열, 좌우 여백 32px, 글자 크기 1단계 상승, 히어로 유동 높이 |
| **Desktop** | 1024px 이상 | 3열, 히어로 H1 60px, 오른쪽 플로팅 도크 등장, CTA 타일 숨김 |
| (헤더 전용) | ≤ 991px / ≥ 992px | 992px부터 가로 메뉴, 그 아래는 햄버거 |

보조 구간(세부 조정): `400–1023`(CTA 타일 글자), `640–767`(CTA 타일 내부 배치), `640–1199`(학교급 카드 이미지를 오른쪽 기준 정렬), `1024–1199`(도크 버튼 높이 보정).

```css
/* 사용 패턴 */
@media (min-width: 640px)  { /* tablet 이상 */ }
@media (min-width: 1024px) { /* desktop */ }
@media (max-width: 1023px) { /* 모바일+태블릿 전용 요소 */ }
@media (max-width: 991px)  { /* 헤더 모바일 */ }
```

---

## 2. 레이아웃 컨테이너

```css
.shell {                       /* 본문 컨테이너 */
  width: 100%;
  max-width: 1380px;
  margin-inline: auto;
  padding-inline: 20px;        /* mobile */
}
@media (min-width: 640px) { .shell { padding-inline: 32px; } }

.header-inner {                /* 헤더는 width 계산식 사용 */
  width: min(100% - 48px, 1380px);   /* ≥992 : 좌우 24px */
  height: 80px;
}
@media (max-width: 991px) { .header-inner { width: min(100% - 32px, 1380px); height: 64px; } }
```

| 화면 폭 | 콘텐츠 폭 (실측) | 계산 |
|---|---|---|
| 440 | 400 | 440 − 20×2 |
| 800 | 736 | 800 − 32×2 |
| 1440 | 1316 | min(1440, 1380) − 32×2 |
| 1920 | 1316 | 1380 상한 − 32×2 |

### 세로 리듬

| 항목 | Mobile | ≥ 640 |
|---|---|---|
| 본문 위아래 여백 (`main` padding-block) | 56px | 80px |
| 섹션 간 간격 (section / notice margin-top) | 64px | 80px |
| 섹션 제목 → 부제 | 12px | 12px |
| 부제 → 그리드 | 32px | 32px |

---

## 3. 그리드

```css
.grade-grid, .content-grid { display: grid; grid-template-columns: 1fr; margin-top: 32px; }
.grade-grid   { gap: 20px; }
.content-grid { gap: 24px; }
@media (min-width: 640px)  { .grade-grid, .content-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 1024px) { .grade-grid, .content-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
```

카드 폭 공식: `(콘텐츠 폭 − gap × (열 수 − 1)) ÷ 열 수`
실측: 학교급 카드 400 → 358 → 425px, 콘텐츠 카드 400 → 356 → 423px.

---

## 4. 컬러

```css
:root {
  /* 텍스트 */
  --text-primary:   #171A1C;  /* 제목·기본 */
  --text-secondary: #454A54;  /* 리드, 카드 설명, 메뉴 기본 */
  --text-tertiary:  #737D8A;  /* 섹션 부제, 더보기 */
  --text-muted:     #9099A2;  /* 날짜, 카드 하단 */
  --text-strong:    #18191B;  /* CTA 제목 */

  /* 브랜드 / 학교급 */
  --brand:          #6D4AE8;  /* 로고 AI, 강조 버튼 */
  --grade-elementary: #FF6700;
  --grade-middle:     #29A3A3;
  --grade-high:       #9E54DE;
  --menu-project:     #7C68E8; /* 메뉴 hover 전용 */
  --menu-notice:      #2488F2; /* 메뉴/공지 hover 전용 */
  /* 틴트 = 학교급 색 8.6% 불투명도 → rgba(r,g,b,.086) */

  /* 배경 · 선 */
  --bg-page:   #F7F7F7;
  --bg-card:   #FFFFFF;
  --bg-subtle: #F1F2F3;       /* 썸네일 자리, 중립 태그, 아이콘 버튼 hover */
  --bg-hero:   #CCEDFF;
  --bg-footer: #18191B;
  --bg-footer-control: #242424;
  --border:    #E6E8EB;
  --divider-soft: #EAECEF;    /* 도크 내부 구분선 */
}
```

CSS에는 `--ds-gray/primary/secondary/danger/warning/success/info`(10~100단계) 팔레트도 정의되어 있지만 리뉴얼 메인에서는 쓰지 않는다. 상태 색이 필요할 때만 참고.

---

## 5. 타이포그래피

```css
body { font-family: "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
       letter-spacing: -0.03em; }
```

### 5.1 반응형 글자 크기 (구간별 단계)

| 역할 | Mobile (<640) | Tablet (640–1023) | Desktop (≥1024) | 굵기 | 행간 | 자간 |
|---|---|---|---|---|---|---|
| 히어로 H1 | 36 | 48 | 60 | 900 | 1.25 | -0.045em |
| 히어로 리드 | 14 / lh 28 | 16 / lh 32 | 16 / lh 32 | 500 | — | -0.03em |
| 섹션 H2 | 28 | 36 | 36 | 900 | 1.5 | -0.035em |
| 섹션 부제 | 14 | 16 | 16 | 600 | — | -0.03em |
| 학교급 카드 H3 | 18 | 20 | 20 | 900 | 28px | -0.03em |
| 학교급 카드 설명 | 12 / lh 18 | 14 / lh 21 | 14 / lh 21 | 500 | — | — |
| 콘텐츠 카드 제목 | 18 | 18 | 18 | 800 | 28px | — |
| 콘텐츠 카드 설명 | 14 | 14 | 14 | 600 | 24px | 2줄 말줄임 |
| 공지 패널 H2 | 20 | 20 | 20 | 900 | 28px | -0.025em |
| 로고 | 23 (≤991) | 23 (≤991) | 27 (≥992) | 900 | — | -0.055em |
| 헤더 메뉴 | — | — | 15 (≥992) | 800 | — | — |
| 배지 | 11 | 11 | 11 | 800 | 11~16px | — |

### 5.2 유동 글자 (데스크톱 도크·특집 카드 전용)

```css
font-size: clamp(10px, 0.833vw, 16px);  /* 도크 버튼 제목: 1920에서 16px */
font-size: clamp(10px, 0.729vw, 14px);  /* 도크 버튼 라벨: 1920에서 14px */
font-size: clamp(22px, 2.2vw, 30px);    /* 특집 카드 제목 */
```

- 한글 줄바꿈은 `word-break: keep-all` (카드 설명, 특집 카드 제목).
- 카드 제목처럼 짧은 헤딩은 `white-space: nowrap`.

---

## 6. 모서리 · 그림자 · 모션

| 토큰 | 값 | 사용처 |
|---|---|---|
| radius-control | 6px | 푸터 관련사이트 버튼 |
| radius-menu | 8px | 푸터 드롭다운 목록 |
| radius-icon | 9px | 햄버거 버튼 |
| radius-dock | clamp(12px, 1.04vw, 20px) | 데스크톱 도크 |
| radius-special | 22px | 특집 카드 |
| radius-card | 26px | 학교급 카드, 콘텐츠 카드, 공지 패널 |
| radius-cta | 32px | CTA 타일 |
| radius-pill | 999px | 배지, 태그, 알약 버튼, 메뉴 밑줄 |

```css
--border-default: 1px solid #E6E8EB;
--shadow-cta:   0 8px 24px rgba(23,26,28,.06);                     /* CTA 타일 (평상시) */
--shadow-hover: 0 16px 40px rgba(23,26,28,.10);                    /* 카드 hover */
--shadow-dock:  0 8px 16px rgba(0,0,0,.12), 0 0 2px rgba(0,0,0,.08);
--shadow-popover: 0 10px 24px rgba(0,0,0,.33);                     /* 푸터 드롭다운 */

/* 카드 hover 공통 */
.card { transition: transform .2s, box-shadow .2s; }
.card:hover { transform: translateY(-4px); box-shadow: var(--shadow-hover); }
.card:hover img { transform: scale(1.04); transition: transform .4s; }
/* 헤더 메뉴: color .18s, 밑줄 opacity .18s */
```

---

## 7. 컴포넌트 (반응형 규칙 포함)

### 7.1 헤더
- `position: sticky; top: 0; z-index: 90;` 배경 `rgba(255,255,255,.97)` + `backdrop-filter: blur(12px)`, 아래 테두리 1px #E6E8EB.
- 높이 **80px (≥992) / 64px (≤991)**. 로고 왼쪽, 메뉴 또는 햄버거 오른쪽 (`justify-content: space-between`).
- **≥992:** 가로 메뉴 5개(초등 교육 · 중학 교육 · 고교 교육 · 프로젝트 교육 · 알림 공간). 각 항목은 헤더 높이 100%, 좌우 padding 26px, 15/800 #454A54.
  hover 시 글자색과 **하단 3px 알약 밑줄**(left/right 26px)이 메뉴별 색으로 바뀜: 초등 #FF6700, 중학 #29A3A3, 고교 #9E54DE, 프로젝트 #7C68E8, 알림 #2488F2.
- **≤991:** 메뉴 숨김, 햄버거 42×42 (radius 9, 아이콘 24px, hover 배경 #F1F2F3).

### 7.2 히어로
| | Mobile (<640) | ≥640 |
|---|---|---|
| 높이 | 320px 고정 | `clamp(344px, 28.125vw, 540px)` → 1920에서 540, 1440에서 405, 1223 이하는 344 |
| 배경 이미지 | 모바일 전용 배경 (`center top`) + 로봇 이미지 별도 | 통 이미지 (`55% center / cover`) |
| 그라데이션 덮개 | `90deg, #CCEDFF 0%, .88 38%, .24 68%, 투명 84%` | `90deg, #CCEDFF 2%, .92 28%, 투명 61%` |
| 로봇 | `width: clamp(180px, 48.6vw, 248.4px)`, right −15px, bottom 50px | 배경에 포함 |
| 텍스트 영역 | 세로 가운데 정렬, padding-block 40px | ≥1024에서 padding-inline 50px 추가 |
| 리드 max-width | 320px | 672px |

- 줄바꿈은 구간별 `<br>`을 켜고 끄는 방식(mobile-break / desktop-break / wide-tablet-break).

### 7.3 플로팅 체험 도크 (≥1024 전용)
- 히어로 오른쪽에 세로 고정: `top: 50%; transform: translateY(-50%); right: clamp(20px, 2.08vw, 40px);`
- `width: clamp(72px, 5.94vw, 114px); aspect-ratio: 114 / 324;` 흰 배경, 그림자 dock, radius clamp(12, 1.04vw, 20).
- 내부 2칸(`grid-template-rows: 1fr 1px 1fr`): 제목 → 이미지(너비 56%, 64:58) → 알약 라벨(너비 79%, 90:32, 위 칸 #FF6700 / 아래 칸 #18191B). 구분선은 너비 65%, #EAECEF.
- **<1024에서는 숨기고 7.4 CTA 타일로 대체.**

### 7.4 CTA 타일 (<1024 전용, 도크의 모바일 버전)
- 컨테이너: 히어로 아래 `margin-top: 40px`, **640–1023에서 2열 / <640에서 1열**, gap 12px.
- 타일: `min-height: 110px; display: grid; grid-template-columns: repeat(3, 1fr);` padding 12px 6px, radius 32, 테두리 1px, 그림자 cta.
  - 640–767에서는 열을 `84px 1fr 76px`로 바꿈.
- 구성: 이미지 84×84 → 제목 18/900 (<400px은 16) → 알약 버튼(너비 88, padding 12, 14/900 흰 글자, 첫 타일 #FF6700 · 두 번째 #18191B; <400px은 12px).

### 7.5 배지
```css
.badge { border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 800; line-height: 11px; }
```
| 변형 | 배경 | 글자 | 사용처 |
|---|---|---|---|
| solid | 학교급 색 | #FFF | 학교급 카드 (`ELEMENTARY` / `MIDDLE` / `HIGH`) |
| tint | 학교급 색 8.6% | 학교급 색 | 콘텐츠 카드 (`초등` / `중등` / `고교`) |
| neutral | #F1F2F3 | #454A54 (lh 16) | 공지 분류 (`콘텐츠`) |

### 7.6 학교급 카드
- 카드 전체를 배경 일러스트 이미지가 덮고(`object-fit: cover`), 그 위에 텍스트 영역을 올린다.
- 크기: **mobile `min-height: 180px` / ≥640 `aspect-ratio: 2 / 1`** (폭에 따라 높이가 따라옴).
- 텍스트 영역 너비 = 카드 폭의 **56% (mobile) → 62% (640–1023) → 56% (≥1024)**. padding 20px, ≥1024에서 좌우 28px. 세로 가운데 정렬.
- 이미지 정렬: 640–1199에서는 `object-position: right center` (그림이 잘릴 때 오른쪽 기준). 모바일 고교 카드도 동일.
- 구성: solid 배지 → H3 (위 간격 12) → 설명 (위 간격 8) → 과정 수.

### 7.7 콘텐츠 카드
- 세로 flex, 흰 배경, 테두리 1px, radius 26, `overflow: hidden`.
- 썸네일: 너비 100%, **`aspect-ratio: 8 / 5`**, cover.
- 본문: padding 20px, `flex: 1` → tint 배지 + 과목명 → 제목 (위 12) → 설명 (위 8, 2줄 말줄임) → 하단 행.
- 하단 행: `margin-top: auto`로 카드 바닥에 붙임 (같은 줄의 카드 높이가 달라도 하단 정렬), padding-top 20.
  왼쪽 `N개 차시` (14/700 #9099A2), 오른쪽 **`학습하기` 알약 버튼** — 배경은 학교급 색, 흰 글자 12/800, padding 8px 16px.

### 7.8 공지사항 패널
- 흰 배경 없이 테두리 1px + radius 26. padding **24px (mobile) → 28px (≥640)**.
- 헤더: H2 왼쪽, `더보기 →` 오른쪽 (14/800 #737D8A, hover #171A1C). 목록 위 간격 20.
- 행 배치가 구간별로 바뀜:
  - **mobile:** 2줄 grid — 1행: [분류 배지 | 날짜(오른쪽 끝)], 2행: 제목(가로 전체, 한 줄 말줄임). gap 8px 12px.
  - **≥640:** 한 줄 flex — [분류 배지][제목 flex:1][날짜], gap 16.
- 행 padding 16px 0, 행 사이 테두리 1px. hover 시 제목 #2488F2.

### 7.9 푸터
```css
.footer-inner { display: grid; grid-template-columns: minmax(0,1fr) 260px; gap: 40px;
                max-width: 1380px; margin: 0 auto; padding: 48px 32px; }
@media (max-width: 1023px) { .footer-inner { grid-template-columns: 1fr; padding: 40px 32px; } }
@media (max-width: 639px)  { .footer-inner { padding-inline: 20px; } }
```
- 왼쪽: 로고 22/900 → 주소·정보 (위 28, 14/500 lh24, 흰색 70%, 줄 간격 8) → 저작권 (위 28, 13/500 lh20, 흰색 55%).
- 오른쪽(260px, ≥1024에서 오른쪽 정렬 / 그 아래는 왼쪽 정렬, 줄바꿈 허용): 링크 묶음 (gap 20, 14/600 흰색 70%, hover 100%) → 관련사이트 선택 버튼 (너비 200, 높이 56, radius 6, #242424, 위 간격 32 / ≤1023에서 24).
- 드롭다운은 버튼 **위로** 열림 (bottom 64px), 항목 높이 52, hover 흰색 5%. 꺾쇠 아이콘은 열리면 180° 회전.

### 7.10 특집 카드 (CSS에 정의, 현재 숨김)
- 2열 `1.35fr : 0.85fr` (≤1023에서 1열), min-height 280 (mobile 230), radius 22.
- 텍스트 영역 max-width 62% (mobile 68%), padding 34 (mobile 24). 이미지는 오른쪽 아래 절대 배치, max-width 43%.
- 우주 테마: 배경 #C9DCFF / 글자 #042F8F / 버튼 #6D4AE8. 전연령 테마: 배경 #92E6E9 / 글자 #006971 / 버튼 #006971.

---

## 8. 페이지 구성 순서

| 순서 | Mobile | Tablet | Desktop |
|---|---|---|---|
| 1 | 헤더 64 (햄버거) | 헤더 64 (햄버거) · ≥992는 80 + 메뉴 | 헤더 80 + 메뉴 |
| 2 | 히어로 320 + 로봇 | 히어로 유동 높이 | 히어로 유동 높이 + 오른쪽 도크 |
| 3 | 학교급 선택 1열 | 2열 | 3열 |
| 4 | CTA 타일 1열 | CTA 타일 2열 | (없음 — 도크로 대체) |
| 5 | 지금 많이 찾는 콘텐츠 1열 | 2열 | 3열 |
| 6 | 공지 (2줄 행) | 공지 (한 줄 행) | 공지 (한 줄 행) |
| 7 | 푸터 1열 | 푸터 1열 | 푸터 2열 (1fr : 260px) |

---

## 9. UI 생성 규칙

**이렇게 하세요**
- 모바일 기본 → `min-width: 640px` → `min-width: 1024px` 순서로 작성.
- 컨테이너는 `max-width: 1380px` + 좌우 여백 20/32px. 화면 폭에 맞춰 늘리지 말 것.
- 카드 크기는 정하지 말고 그리드 열 수(1/2/3)와 gap(20/24)만 정할 것. 카드 높이는 aspect-ratio로.
- 데스크톱에서 화면에 비례해야 하는 요소는 `clamp(최소, px÷1920×100vw, 1920 기준 px)` 공식 사용.
- 자간은 em으로 (전역 -0.03em).
- 한글 설명문에는 `word-break: keep-all`.
- 같은 줄의 카드 하단은 `margin-top: auto`로 맞출 것.
- 학교급 색 연결은 메뉴 hover · 배지 · 버튼 · 카드 이미지까지 일관되게: 초등 주황, 중등 청록, 고교 보라.

**이렇게 하지 마세요**
- 고정 px 너비의 카드나 섹션 만들지 않기.
- 일반 카드에 평상시 그림자 넣지 않기 (그림자는 hover와 CTA 타일만).
- 완전한 검정(#000) 글자 쓰지 않기.
- 모바일에서 데스크톱 도크를, 데스크톱에서 CTA 타일을 함께 보여주지 않기 (1024 기준으로 둘 중 하나만).
