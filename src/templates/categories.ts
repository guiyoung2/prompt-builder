import type { Category } from "../types/category";

export interface CategoryMeta {
  id: Category;
  label: string;
  description: string;
  // 사용자에게 분류 결과를 보여줄 때 쓰는 짧은 한 줄 요약
  scope: string;
}

// 카테고리 메타데이터. 4개 카테고리는 의도적으로 "넓은 의미"로 정의됨.
// - frontend: UI뿐 아니라 인터랙션, 상태, 데이터 페칭 등 클라이언트 측 작업 전반
// - backend: API뿐 아니라 서버 로직, DB 모델, 인증 등 서버 측 작업 전반
// - bugfix: 재현 조건, 기대 동작, 우선순위 등 디버깅 워크플로우
// - refactor: 범위, 제약, 테스트 전략 등 코드 개선 작업
export const CATEGORY_META: Record<Category, CategoryMeta> = {
  frontend: {
    id: "frontend",
    label: "프론트엔드",
    description: "UI/인터랙션/상태/데이터 페칭 등 클라이언트 작업",
    scope: "컴포넌트 · 페이지 · 인터랙션 · 스타일",
  },
  backend: {
    id: "backend",
    label: "백엔드",
    description: "API/서버 로직/DB 모델/인증/검증 등 서버 작업",
    scope: "API · 서비스 · 데이터 모델 · 인증",
  },
  bugfix: {
    id: "bugfix",
    label: "버그 수정",
    description: "재현 조건과 기대 동작을 명확히 한 디버깅 작업",
    scope: "재현 · 원인 분석 · 수정 범위",
  },
  refactor: {
    id: "refactor",
    label: "리팩터링",
    description: "동작은 유지하면서 구조/가독성/유지보수성을 개선",
    scope: "범위 · 제약 · 테스트 전략",
  },
};

export const CATEGORY_ORDER: Category[] = [
  "frontend",
  "backend",
  "bugfix",
  "refactor",
];
