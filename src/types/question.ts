// 답변 값
// - single, text → string (선택된 choice id 또는 직접 입력값)
// - multi → string[] (선택된 choice id 배열)
export type AnswerValue = string | string[];

// 답변 매핑: questionId → 답변 값
export type AnswerMap = Record<string, AnswerValue>;

// Gemini Call 1이 생성하는 동적 선택지
export interface DynamicChoice {
  id: string;
  label: string;
}

// Gemini Call 1이 생성하는 동적 질문
export interface DynamicQuestion {
  id: string;
  text: string;
  type: "single" | "multi" | "text";
  choices?: DynamicChoice[];
  required?: boolean;
  allowCustom?: boolean;
}
