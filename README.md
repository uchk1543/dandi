# Dandi v0.2 프로토타입

교사·학생용 바이브코딩 & 미니앱 허브의 기능 확인용 프로토타입입니다. **처음 맡는 분은 [`HANDOVER.md`](./HANDOVER.md)부터 읽으십시오.** 요구사항은 [`docs/planning/PRD.md`](./docs/planning/PRD.md) v0.4를 따르며, 디자인은 최소화하고 기능 동작에 집중했습니다. v0.2에서 추가한 기능(PRD 15장)의 근거는 [벤치마크 문서](./docs/planning/벤치마크_AI연결_프로젝트키_스킬_전자책_20260928.md)에 있습니다.

## v0.2에서 추가한 것

| 기능 | 주소 | PRD |
|---|---|---|
| **AI에게 링크만 주면 사이트가 올라감** — AI가 읽는 실행 런북 | `/llms.txt`, `/llms-full.txt`, `/connect` | F-55, F-56 |
| 허브가 사이트를 직접 호스팅(비공개 미리보기 → 셀프점검 → 공개) | `/studio/sites`, `http://<이름>.localhost:3000` | F-51, F-52 |
| CLI 브라우저 승인 로그인(토큰 복사 없음), 에이전트용 `--json`·종료 코드 | `/device`, `npx -y <허브>/dandi-0.2.0.tgz` | F-53, F-54 |
| 원격 MCP + OAuth(힉스필드 방식), stdio MCP | `/mcp`, `/oauth/*`, `dandi mcp` | F-57, F-58 |
| 프로젝트별 API 키(Edge Impulse 방식: 여러 키·역할·1회 표시·만료·마지막 사용) | `/studio/projects` | F-31~F-35 |
| 스킬 레지스트리(skills.sh 방식, `npx skills add <허브>`) | `/skills`, `/.well-known/agent-skills/index.json` | F-37~F-41 |
| 전자책 서가(웹북 리더·PDF 리더·저작권 게이트) | `/books` | F-43~F-45 |

외부 계정 없이 로컬에서 바로 실행되도록 PRD 8장의 대체 목록(세션 쿠키, 데모 로그인, 로컬 JSON 저장소, 로컬 파일 저장소, 모의 AI 응답)을 적용했습니다.

## 실행

Node.js 22 이상이 필요합니다.

```bash
npm install
npm run dev          # http://localhost:3000 (CLI tarball·PDF 뷰어 파일을 먼저 만듭니다)
```

처음 실행하면 `data/db.json`이 시드 데이터(예시 미니앱 3개, 템플릿 4개, 게시글 2개, AI 모델 7개, 스킬 4개, 코드코리아 웹북 1권)로 만들어집니다. 처음 상태로 되돌리려면 `data/` 폴더를 삭제하십시오. 데이터 위치는 `DANDI_DATA_DIR` 환경 변수로 바꿀 수 있습니다.

```bash
npm test             # 개인정보 필터·CLI·런북·서가 단위 테스트
npm run typecheck
npm run lint
npm run build && npx next start
```

## AI에게 "내 사이트 올려줘" 시키기

1. 사이트 폴더(예: `index.html`이 있는 폴더)에서 AI 코딩 도구(Claude Code, Codex, Cursor 등)를 엽니다.
2. `/connect` 화면의 문장을 붙여 넣습니다. 로컬 허브는 WebFetch가 `localhost`를 막으므로 다음처럼 명령을 쓰는 문장을 줍니다.
   ```text
   npx -y http://localhost:3000/dandi-0.2.0.tgz guide 를 실행해 나온 안내를 그대로 따라 해서, 이 폴더의 사이트를 Dandi에 올려줘.
   ```
   공개 HTTPS 허브라면 `https://<허브>/llms.txt 를 읽고 …`로 충분합니다.
3. AI가 보여 주는 링크를 열어 화면의 코드가 같으면 **[승인]** 합니다(토큰을 복사하거나 대화창에 붙여 넣지 않습니다).
4. AI가 비공개 미리보기 주소를 보여 주고 셀프점검 5문항을 묻습니다. 답하면 허브에 등록되고 앱 주소가 나옵니다.

MCP로 연결하려면 `/connect`의 한 줄을 씁니다. 예) `claude mcp add --transport http dandi http://localhost:3000/mcp` → Claude Code에서 `/mcp` → 브라우저에서 허용.

## 시연 순서

1. 로그인하지 않은 상태로 허브(`/`)에서 미니앱을 실행하고, `/books`에서 코드코리아 웹북을 읽습니다.
2. `/login`에서 교사로 데모 로그인합니다(관리자 화면은 역할을 "교육청 관리자(데모)"로 선택). 같은 이름·역할이면 같은 계정입니다.
3. 위의 "AI에게 내 사이트 올려줘"를 실행합니다. 학교 내부 승인이 필요하다고 답하면 승인 대기로 등록되고, `/studio/sites`나 `/admin`에서 승인 완료를 표시해야 공개됩니다.
4. `/studio/projects`에서 프로젝트를 만들고 API 키를 발급(원문 1회 표시)한 뒤 `/ai`에서 게이트웨이를 호출합니다.
5. `/skills`에서 스킬 설치 명령을 복사해 AI 코딩 도구에 설치하고, `/skills/new`에서 스킬을 게시합니다.
6. `/community/new`에서 전화번호 등을 입력하면 경고가 나오고 등록이 막힙니다.
7. 관리자로 `/admin`에서 모델 상태, 스킬 검토, 감사 로그를 확인합니다.

## 운영 환경 변수

로컬 시연에는 필요 없습니다. 공개 서버에 올릴 때는 다음을 설정하십시오.

| 변수 | 의미 |
|---|---|
| `HUB_ORIGIN` | 허브 주소(예: `https://dandi.example.kr`). OAuth 발급자·설치 명령·런북의 주소가 됩니다. **반드시 설정**하십시오. |
| `SITES_DOMAIN` | 교사 사이트 전용 도메인(예: `dandi-sites.kr`, 와일드카드 DNS·TLS 필요). 사이트는 `https://<이름>.<도메인>`에서 서빙되어 허브 세션과 분리됩니다. |
| `TRUST_PROXY=1` | 믿을 수 있는 리버스 프록시 뒤에서만 켭니다. 켜면 `X-Forwarded-Host/Proto/For`를 사용합니다(가장 오른쪽 IP). |
| `DANDI_OAUTH_SECRET` | 서버를 여러 대로 돌려 `data/`를 공유하지 않을 때 32자 이상으로 설정합니다(갱신 토큰 재전송 허용용). |
| `DANDI_DATA_DIR` | 로컬 저장소 위치. 기본은 `data/`. |
| `DANDI_STORAGE` | `supabase`면 DB·파일을 Supabase에 둡니다(아래 "저장소"). 비워 두면 Vercel에서 Supabase 키 세 개가 모두 있을 때만 `supabase`, 그 밖에는 `local`. |
| `DANDI_STORAGE_BUCKET` | 파일 본문을 둘 Storage 버킷. 기본 `dandi`. |

## 저장소 (로컬 / Supabase)

Vercel처럼 서버 인스턴스가 여러 개이고 디스크가 남지 않는 곳에서는 `data/`를 쓸 수 없습니다(로그인 세션·글·업로드가 인스턴스마다 따로 놀고 사라짐). 그래서 `DANDI_STORAGE=supabase`일 때 다음으로 바꿉니다.

- DB: `dandi_state` 테이블의 한 행(`data jsonb` + `version`). 지금 `db.json`과 같은 문서 전체를 저장하고, 다른 인스턴스가 먼저 바꿨으면(version 불일치) 다시 읽어 다시 적용합니다. 테이블을 나누고 RLS 정책을 두는 정식 스키마(PRD v1.0)로 가기 전의 임시 구조입니다.
- 파일: 비공개 버킷(`dandi`)의 `uploads/`(자료실), `blobs/`(사이트·스킬 본문), `upload-receipts/`(배포 중 영수증). 브라우저가 직접 받지 않고 서버가 읽어 내려줍니다.
- 접근: 서버만 `SUPABASE_SECRET_KEY`로 접근합니다. 테이블은 RLS를 켜고 정책을 두지 않아 공개 키로는 읽을 수 없습니다.
- 준비: Supabase SQL Editor에서 `supabase/migrations/20261006000000_dandi_state.sql`을 한 번 실행합니다(테이블·버킷 생성). 첫 요청 때 시드 데이터가 들어갑니다.
- 코드: `src/lib/supabase-admin.ts`(모드·클라이언트), `src/lib/db.ts`, `src/lib/object-store.ts`
- 로컬 `data/`의 내용은 자동으로 옮기지 않습니다.

## 소셜 로그인 (Supabase, 계정·설정 미정)

PRD F-02는 "구글·카카오 로그인을 Supabase Auth로 처리한다"는 방향만 정해 두었습니다. **Supabase 계정(누가 만들고 소유·결제하는지)과 Supabase 쪽 설정은 아직 정해지지 않았습니다**(관련: PRD Q7).

소셜 로그인 코드는 들어가 있고, 키를 넣으면 켜집니다. 값을 비워 두면 지금처럼 데모 로그인만 보입니다. Supabase는 로그인 확인과, `DANDI_STORAGE=supabase`일 때 저장소(위 "저장소")에 씁니다.

- 흐름: `/login`의 [구글로 로그인]/[카카오로 로그인] → `/login/oauth/<google|kakao>`(Supabase 인가 주소로 이동, PKCE) → 제공자 로그인 → `/login/callback`(사용자 확인 후 허브 세션 `dd_sid` 발급, Supabase 세션 쿠키는 지움) → 처음이면 `/login/profile`에서 작성자 이름·학교급 입력
- 계정: 같은 제공자·같은 Supabase 사용자 id면 같은 계정입니다. 저장하는 것은 제공자 이름과 Supabase 사용자 id뿐이고 이메일은 저장하지 않습니다.
- 역할: 소셜 로그인 계정은 **교사**로만 만들어집니다. 관리자 지정 방법이 정해지지 않았기 때문입니다(아래 4번). 관리자는 지금처럼 데모 로그인을 씁니다.
- 데모 로그인으로 같은 이름을 입력해도 소셜 로그인 계정에는 들어갈 수 없습니다.
- 코드: `src/lib/supabase-config.ts`(키 읽기), `src/lib/supabase-auth.ts`, `src/lib/login.ts`, `src/app/login/oauth/[provider]`, `src/app/login/callback`, `src/app/login/profile`
- 계정이 정해지면 그 Supabase 프로젝트의 Redirect URLs에 `<허브 주소>/login/callback`이 허용되어 있어야 합니다.

키를 넣을 자리(계정이 정해진 뒤 사용):

| 변수 | 값 | 비고 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 프로젝트 주소 | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 공개 키 `sb_publishable_...` | 브라우저에 들어감, 보호는 RLS(F-15) |
| `SUPABASE_SECRET_KEY` | 비밀 키 `sb_secret_...` | **서버 전용**. `NEXT_PUBLIC_`을 붙이면 `src/lib/supabase-config.ts`가 오류를 냅니다 |

- 이름과 설명은 `.env.example`에 있습니다. `.env.local`로 복사해 채우고, 배포 환경에서는 같은 이름의 환경 변수로 넣습니다. `NEXT_PUBLIC_` 값은 빌드할 때 고정되므로 빌드 전에 넣어야 합니다.
- 구글·카카오 Client ID·Secret은 Supabase Auth가 로그인을 처리하는 구조라 앱 환경 변수가 아니라 Supabase 쪽에 넣게 됩니다. 비밀 키와 함께 커밋하지 마십시오(`.env*`는 무시 목록, `.env.example`만 올라감).

정해야 할 것(결정 주체 확인 후 진행):

1. Supabase 계정·프로젝트 소유 주체와 요금제(PRD Q7)
2. 구글 Cloud·Kakao Developers 앱을 누구 이름으로 등록할지, Redirect URI·Site URL로 쓸 허브 주소
3. 학생·방문자 익명 로그인(F-01)을 Supabase Anonymous sign-ins로 켤지
4. 가입한 사람 중 교사·관리자를 어떻게 지정할지(이메일 도메인, 초대, 관리자 승인 등). 명세에 없음
5. 데모 계정 데이터를 실제 계정으로 옮길지, CLI 기기 승인·MCP OAuth를 새 로그인과 어떻게 연결할지

CLI는 `public/dandi-<버전>-<해시>.tgz`로 배포됩니다. 내용이 바뀌면 파일 이름이 바뀌므로, 이미 `npx`로 실행한 PC도 새 CLI를 받습니다(같은 이름이면 `npx`가 캐시된 옛 CLI를 계속 실행합니다).

## E2E

실제 Chrome으로 전체 시나리오를 확인하려면 서버를 3100번 포트에서 별도 데이터 폴더로 띄운 뒤 실행합니다.

```bash
npm run build
DANDI_DATA_DIR=/tmp/dandi-e2e npx next start -p 3100
node e2e/demo.e2e.mjs          # 다른 주소는 BASE_URL=http://... 로 지정
```

데모 로그인은 비밀번호가 없는 시연용입니다. 로그아웃하면 서버의 로그인 세션이 폐기됩니다.

## 주요 경로

| 경로 | 기능 (PRD ID) |
|---|---|
| `/`, `/apps`, `/apps/[id]` | 허브, 미니앱 목록·무로그인 실행 (F-04~F-06) |
| `/studio`, `/studio/apps`, `/studio/sites`, `/studio/projects` | 교사 스튜디오: 앱·사이트·프로젝트 (F-04, F-16, F-31, F-51) |
| `/connect`, `/llms.txt`, `/llms-full.txt` | AI 에이전트 연결 (F-55, F-56) |
| `/device`, `/api/cli/*`, `cli/` | CLI 로그인·API·명령 (F-53, F-54, F-58) |
| `/mcp`, `/oauth/*`, `/.well-known/oauth-*` | 원격 MCP와 OAuth (F-57) |
| `/api/sites/*`, `http://<이름>.localhost:3000` | 정적 호스팅 (F-51) |
| `/ai`, `/api/ai/chat`, `/api/ai/models` | 모델 가이드·게이트웨이 (F-21~F-23, F-32) |
| `/skills`, `/.well-known/agent-skills/*`, `/admin/skills` | 스킬 레지스트리 (F-37~F-40) |
| `/books`, `/api/files/[id]/view` | 전자책 서가 (F-43~F-45) |
| `/community`, `/files`, `/templates`, `/guide` | 게시판·자료실·템플릿·가이드 (F-07~F-12) |
| `/admin` | 모델 정책, 승인 대기 앱, 감사 로그 (F-23, F-24, F-27) |

## 코드 구조

- `src/lib/` — 도메인 로직. Supabase로 옮길 때는 `db.ts`와 각 도메인 파일만 바꾸면 됩니다.
  - `pii.ts`, `text.ts`: 개인정보 검사기(클라이언트·서버 공용)와 입력 정리
  - `session.ts`, `agent-auth.ts`, `device-auth.ts`, `oauth.ts`: 세션·CLI·MCP 인증
  - `sites.ts`, `blobs.ts`: 정적 호스팅과 내용 주소 저장소
  - `projects.ts`, `ai.ts`: 프로젝트 키와 AI 게이트웨이
  - `skills.ts`, `books.ts`, `runbook.ts`, `mcp-tools.ts`: 스킬·서가·에이전트 런북·MCP 도구
- `cli/` — 의존성 없는 `dandi` CLI(stdio MCP 포함). `npm run pack:cli`가 `public/dandi-<버전>.tgz`를 만듭니다.
- `docs/v0.2-contracts.md` — v0.2 병렬 개발에 쓴 인터페이스 계약
- `e2e/` — 실제 Chrome E2E(`node e2e/demo.e2e.mjs`)
