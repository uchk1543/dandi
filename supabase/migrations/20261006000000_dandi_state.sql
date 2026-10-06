-- Dandi 저장소(임시 구조): DB 전체를 JSON 문서 한 행으로, 파일 본문은 비공개 Storage 버킷에 둔다.
-- 서버만 비밀 키(sb_secret_)로 접근한다. RLS를 켜고 정책을 두지 않아 공개 키(브라우저)로는 읽고 쓸 수 없다.
-- Supabase 대시보드 > SQL Editor에서 한 번 실행한다. 다시 실행해도 안전하다.
-- v1.0 정식 스키마(테이블별 분리, RLS 정책)로 옮기면 이 테이블은 없앤다.

create table if not exists public.dandi_state (
  id text primary key,
  data jsonb not null,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.dandi_state enable row level security;
revoke all on table public.dandi_state from anon, authenticated;
-- 새 프로젝트는 public 테이블 권한을 자동으로 주지 않는다. 서버(비밀 키 = service_role)에만 준다.
grant select, insert, update, delete on table public.dandi_state to service_role;

-- 파일 본문(자료실 업로드, 사이트·스킬 blob, 업로드 영수증). 공개하지 않고 서버가 읽어서 내려준다.
-- 크기 상한은 앱 상한(UPLOAD_MAX_BYTES 50MB)과 같게 둔다.
insert into storage.buckets (id, name, public, file_size_limit)
values ('dandi', 'dandi', false, 52428800)
on conflict (id) do nothing;
