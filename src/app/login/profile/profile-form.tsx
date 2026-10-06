"use client";

import { useActionState } from "react";
import { PiiInput } from "@/components/pii-guard";
import { submitWithoutReset } from "@/components/submit-without-reset";
import { SCHOOL_LEVELS } from "@/lib/constants";
import type { SchoolLevel } from "@/lib/types";
import { saveProfile, type ProfileState } from "./actions";

export function ProfileForm({
  next,
  name,
  schoolLevel,
}: {
  next?: string;
  name: string;
  schoolLevel: SchoolLevel | null;
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, {});
  return (
    <form action={action} onSubmit={(e) => submitWithoutReset(e, action)} className="stack">
      {next && <input type="hidden" name="next" value={next} />}
      <PiiInput name="name" label="작성자 이름" required maxLength={30} defaultValue={name} placeholder="예: 김교사" />
      <label className="field">
        <span>학교급</span>
        <select name="schoolLevel" defaultValue={schoolLevel ?? ""} required>
          <option value="" disabled>
            선택하십시오
          </option>
          {SCHOOL_LEVELS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      {state.error && <p className="error">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "저장 중…" : "저장하고 시작하기"}
      </button>
    </form>
  );
}
