"use client";

import { useEffect, useRef, useState, useTransition } from "react";

// 원클릭 복사 버튼(F-10). navigator.clipboard가 막힌 환경(http, 오래된 브라우저)에서는 textarea 방식으로 대신 복사한다.
// onCopyAction에 서버 액션을 넘기면 복사에 성공한 뒤 호출한다(예: 복사 수 집계).

function fallbackCopy(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "0";
  ta.style.left = "0";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 권한 거부 등: 아래 방식으로 다시 시도한다.
    }
  }
  return fallbackCopy(text);
}

type Status = "idle" | "copied" | "failed";

export function CopyButton({
  text,
  label = "복사",
  copiedMessage = "복사했습니다.",
  onCopyAction,
}: {
  text: string;
  label?: string;
  copiedMessage?: string;
  onCopyAction?: () => Promise<unknown>;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [, startTransition] = useTransition();

  async function handleClick() {
    const ok = await copyText(text);
    setStatus(ok ? "copied" : "failed");
    if (ok && onCopyAction) {
      startTransition(async () => {
        try {
          await onCopyAction();
        } catch {
          // 집계 실패는 복사 자체에 영향을 주지 않는다.
        }
      });
    }
  }

  return (
    <span>
      <button type="button" className="button primary" onClick={handleClick}>
        {label}
      </button>{" "}
      <span role="status" aria-live="polite" className={status === "failed" ? "error" : "muted"}>
        {status === "copied" && copiedMessage}
        {status === "failed" && "자동 복사가 막혀 있습니다. 본문을 직접 선택해 복사하십시오."}
      </span>
    </span>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * 복사 아이콘이 오른쪽 위에 붙은 코드 블록. 명령·문장·설정 예시처럼 그대로 붙여 넣는 글에 쓴다.
 * 버튼 이름(label)은 화면 낭독기와 툴팁으로 읽히고, 복사 결과는 블록 아래에 짧게 표시한다.
 */
export function CodeBlock({
  text,
  label = "복사",
  copiedMessage = "복사했습니다.",
  onCopyAction,
  kind,
}: {
  text: string;
  label?: string;
  copiedMessage?: string;
  onCopyAction?: () => Promise<unknown>;
  /** 붙여 넣을 곳 표시: AI 도구 입력창에 줄 문장인지, 터미널에서 실행할 명령인지 */
  kind?: "prompt" | "command";
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [, startTransition] = useTransition();

  async function handleClick() {
    const ok = await copyText(text);
    setStatus(ok ? "copied" : "failed");
    if (ok) setTimeout(() => setStatus((s) => (s === "copied" ? "idle" : s)), 2500);
    if (ok && onCopyAction) {
      startTransition(async () => {
        try {
          await onCopyAction();
        } catch {
          // 집계 실패는 복사 자체에 영향을 주지 않는다.
        }
      });
    }
  }

  return (
    <div className={kind ? `code-block code-${kind}` : "code-block"}>
      {kind && <span className="code-caption">{kind === "prompt" ? "AI 입력창에 붙여 넣기" : "터미널 명령"}</span>}
      <pre>{text}</pre>
      <button
        type="button"
        className="code-copy"
        aria-label={label}
        title={label}
        data-copied={status === "copied" || undefined}
        onClick={handleClick}
      >
        {status === "copied" ? <CheckIcon /> : <CopyIcon />}
      </button>
      <span role="status" aria-live="polite" className={status === "failed" ? "code-status error" : "code-status"}>
        {status === "copied" && copiedMessage}
        {status === "failed" && "자동 복사가 막혀 있습니다. 본문을 직접 선택해 복사하십시오."}
      </span>
    </div>
  );
}

/**
 * 마크다운을 렌더링한 HTML(문서 화면) 안의 코드 블록에 복사 버튼을 붙인다.
 * 본문은 dangerouslySetInnerHTML이라 React가 자식을 관리하지 않으므로, 마운트 뒤 DOM에서 직접 감싼다.
 */
export function CopyablePres({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    for (const pre of Array.from(root.querySelectorAll("pre"))) {
      if (pre.parentElement?.classList.contains("code-block")) continue;
      const wrap = document.createElement("div");
      wrap.className = "code-block";
      pre.replaceWith(wrap);
      wrap.appendChild(pre);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy";
      btn.setAttribute("aria-label", "복사");
      btn.title = "복사";
      const icon = (copied: boolean) =>
        copied
          ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" stroke="currentColor" stroke-width="1.8"/></svg>';
      btn.innerHTML = icon(false);
      btn.addEventListener("click", async () => {
        const ok = await copyText(pre.textContent ?? "");
        btn.innerHTML = icon(ok);
        if (ok) btn.dataset.copied = "true";
        setTimeout(() => {
          btn.innerHTML = icon(false);
          delete btn.dataset.copied;
        }, 2500);
      });
      wrap.appendChild(btn);
    }
  }, [html]);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
