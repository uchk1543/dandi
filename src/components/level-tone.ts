import type { LevelOrAll } from "@/lib/types";

// 학교급 색 연결(design.md 9장): 초 주황, 중 청록, 고 보라, 특수 파랑.
// 반환한 클래스가 --lv / --lv-tint 변수를 정해 배지·버튼·카드가 같은 색을 쓴다.
export function levelTone(level: LevelOrAll | null | undefined): string {
  return level && level !== "all" ? `lv-${level}` : "";
}
