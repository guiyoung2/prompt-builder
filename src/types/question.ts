// 스텝 폼에서 사용자에게 보여줄 질문과 답변의 타입.
// - 질문은 type별 discriminated union (single/multi/text)
// - 답변(AnswerValue)은 store와 카테고리/공통 질문이 공통으로 import

// 답변 값
// - single, text → string (선택된 choice id 또는 직접 입력값)
// - multi → string[] (선택된 choice id 배열)
export type AnswerValue = string | string[];

// 답변 매핑: questionId → 답변 값
export type AnswerMap = Record<string, AnswerValue>;

// 단일/다중 선택지에서 한 옵션을 표현
export interface Choice {
  id: string; // 답변으로 저장될 식별자
  label: string; // 사용자에게 보여줄 텍스트
  description?: string; // 옵션의 의미 부연 (선택)
}

// 모든 질문이 공유하는 메타. 직접 export하지 않음 (외부에서는 Question union만 사용).
interface BaseQuestion {
  id: string;
  prompt: string;
  helper?: string;
  required?: boolean; // 기본 true. false면 건너뛰기 허용
}

export interface SingleChoiceQuestion extends BaseQuestion {
  type: "single";
  choices: Choice[];
  allowCustom?: boolean; // "기타" 직접 입력 허용
}

export interface MultiChoiceQuestion extends BaseQuestion {
  type: "multi";
  choices: Choice[];
  allowCustom?: boolean;
}

export interface TextQuestion extends BaseQuestion {
  type: "text";
  placeholder?: string;
}

export type Question =
  | SingleChoiceQuestion
  | MultiChoiceQuestion
  | TextQuestion;

// V2 동적 질문 타입 (Gemini Call 1이 생성)
export interface DynamicChoice {
  id: string;
  label: string;
}

export interface DynamicQuestion {
  id: string;
  text: string;
  type: "single" | "multi" | "text";
  choices?: DynamicChoice[];
  required?: boolean;
  allowCustom?: boolean; // 기타 직접 입력 허용
}
