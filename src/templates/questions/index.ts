import type { Category } from "../../types/category";
import type { Question } from "../../types/question";
import { BACKEND_QUESTIONS } from "./backend";
import { BUGFIX_QUESTIONS } from "./bugfix";
import { COMMON_QUESTIONS } from "./common";
import { FRONTEND_QUESTIONS } from "./frontend";
import { REFACTOR_QUESTIONS } from "./refactor";

// 카테고리별 도메인 질문 + 공통 질문(우선순위/제약)을 한 배열로 이어 붙인다.
// 순서 컨벤션: 카테고리별 질문이 먼저, 공통 질문이 뒤. (도메인 컨텍스트 → 메타)
export const QUESTIONS_BY_CATEGORY: Record<Category, Question[]> = {
  frontend: [...FRONTEND_QUESTIONS, ...COMMON_QUESTIONS],
  backend: [...BACKEND_QUESTIONS, ...COMMON_QUESTIONS],
  bugfix: [...BUGFIX_QUESTIONS, ...COMMON_QUESTIONS],
  refactor: [...REFACTOR_QUESTIONS, ...COMMON_QUESTIONS],
};
