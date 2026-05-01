import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Category } from "../types/category";

// 워크플로우 진행 상태
export type Status =
  | "idle" // 초기 입력 대기
  | "classifying" // 의도 분류 중 (현재는 동기지만 비동기 전환 여지)
  | "answering" // 스텝 폼 진행 중
  | "generating" // Gemini 호출 중
  | "done"
  | "error";

// 답변 값 — 단일 선택/직접입력은 string, 다중 선택은 string[]
export type AnswerValue = string | string[];

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
      setCategory: (c) => set({ category: c }, false, "setCategory"),
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
