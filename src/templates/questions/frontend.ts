import type { Question } from "../../types/question";

// frontend 카테고리 전용 질문.
// LLM이 컴포넌트/스타일/상태/데이터 페칭 컨텍스트를 추론할 수 있도록
// 핵심 정보를 6문항으로 추출한다. 모두 멀티플 초이스 우선 + 필요 시 직접 입력.
export const FRONTEND_QUESTIONS: Question[] = [
  {
    id: "fe_taskType",
    type: "single",
    prompt: "어떤 종류의 작업인가요?",
    helper: "작업 성격에 맞춰 결과 프롬프트의 구조가 달라집니다.",
    choices: [
      { id: "new_component", label: "새 컴포넌트 또는 페이지 만들기" },
      { id: "modify_ui", label: "기존 UI 수정 / 개선" },
      { id: "state_logic", label: "상태 / 인터랙션 로직 변경" },
      { id: "styling", label: "스타일 / 디자인만 변경" },
      { id: "perf", label: "성능 최적화 (렌더링 / 번들 / 이미지 등)" },
    ],
    allowCustom: true,
  },
  {
    id: "fe_framework",
    type: "single",
    prompt: "어떤 프레임워크 / 라이브러리를 쓰고 있나요?",
    choices: [
      { id: "react", label: "React" },
      { id: "next", label: "Next.js" },
      { id: "vue", label: "Vue / Nuxt" },
      { id: "svelte", label: "Svelte / SvelteKit" },
      { id: "vanilla", label: "프레임워크 없이 (Vanilla JS/TS)" },
    ],
    allowCustom: true,
  },
  {
    id: "fe_styling",
    type: "single",
    prompt: "스타일링은 어떤 방식으로 하고 있나요?",
    choices: [
      { id: "tailwind", label: "Tailwind CSS" },
      { id: "css_modules", label: "CSS Modules" },
      { id: "styled_components", label: "styled-components" },
      { id: "emotion", label: "Emotion" },
      { id: "vanilla_css", label: "그냥 CSS / SCSS" },
    ],
    allowCustom: true,
  },
  {
    id: "fe_state",
    type: "single",
    prompt: "주된 상태 관리 방식은 무엇인가요?",
    choices: [
      { id: "local", label: "useState / useReducer만" },
      { id: "context", label: "Context API" },
      { id: "zustand", label: "Zustand" },
      { id: "redux", label: "Redux / Redux Toolkit" },
      { id: "none", label: "상태 관리 안 씀 / 해당 없음" },
    ],
    allowCustom: true,
  },
  {
    id: "fe_data",
    type: "single",
    prompt: "서버 데이터는 어떻게 다루나요?",
    helper: "API 호출이 없는 작업이라면 '해당 없음'을 선택하세요.",
    choices: [
      { id: "tanstack_query", label: "TanStack Query (React Query)" },
      { id: "swr", label: "SWR" },
      { id: "fetch_axios", label: "fetch / axios 직접 호출" },
      { id: "server_component", label: "서버 컴포넌트 / SSR" },
      { id: "none", label: "해당 없음" },
    ],
    allowCustom: true,
  },
  {
    id: "fe_concerns",
    type: "multi",
    prompt: "추가로 챙겨야 할 요구사항이 있다면 모두 골라주세요.",
    helper: "선택 사항입니다. 해당 없으면 비워두세요.",
    required: false,
    choices: [
      { id: "responsive", label: "반응형 (모바일 / 태블릿)" },
      { id: "dark_mode", label: "다크 모드" },
      { id: "a11y", label: "접근성 (키보드 / 스크린리더)" },
      { id: "i18n", label: "다국어 (i18n)" },
      { id: "animation", label: "애니메이션 / 마이크로 인터랙션" },
    ],
  },
];
