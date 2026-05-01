import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Category } from "../types/category";
import type { AnswerValue } from "../types/question";

// 워크플로우 진행 상태
export type Status =
  | "idle" // 초기 입력 대기
  | "classifying" // 의도 분류 중 (현재는 동기지만 비동기 전환 여지)
  | "answering" // 스텝 폼 진행 중
  | "generating" // Gemini 호출 중
  | "done"
  | "error";

interface PromptState {
  originalInput: string;
  category: Category | null;
  currentStep: number;
  answers: Record<string, AnswerValue>;
  status: Status;
  result: string | null;
  error: string | null;
}

interface PromptActions {
  setOriginalInput: (v: string) => void;
  setCategory: (c: Category) => void;
  setAnswer: (questionId: string, value: AnswerValue) => void;
  goNext: () => void;
  goPrev: () => void;
  setStatus: (s: Status) => void;
  setResult: (text: string) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

const initialState: PromptState = {
  originalInput: "",
  category: null,
  currentStep: 0,
  answers: {},
  status: "idle",
  result: null,
  error: null,
};

export const usePromptStore = create<PromptState & PromptActions>()(
  devtools(
    (set) => ({
      ...initialState,
      setOriginalInput: (v) =>
        set({ originalInput: v }, false, "setOriginalInput"),
      setCategory: (c) =>
        // 카테고리가 바뀌면 질문 셋이 달라지므로 진행 단계는 처음으로 되돌린다.
        // 답변(answers)은 유지 — ID prefix가 카테고리별로 달라 충돌이 없고,
        // 공통 질문(co_*)은 재사용되므로 사용자 입력을 보존한다.
        set({ category: c, currentStep: 0 }, false, "setCategory"),
      setAnswer: (questionId, value) =>
        set(
          (s) => ({ answers: { ...s.answers, [questionId]: value } }),
          false,
          "setAnswer",
        ),
      goNext: () =>
        set((s) => ({ currentStep: s.currentStep + 1 }), false, "goNext"),
      goPrev: () =>
        set(
          (s) => ({ currentStep: Math.max(0, s.currentStep - 1) }),
          false,
          "goPrev",
        ),
      setStatus: (status) => set({ status }, false, "setStatus"),
      setResult: (result) => set({ result }, false, "setResult"),
      setError: (error) => set({ error }, false, "setError"),
      reset: () => set(initialState, false, "reset"),
    }),
    { name: "PromptStore" },
  ),
);
