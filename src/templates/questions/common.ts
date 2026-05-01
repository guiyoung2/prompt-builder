import type { Question } from "../../types/question";

// 모든 카테고리에 공통으로 사용할 질문.
// 카테고리별 질문이 도메인 디테일을 묻는다면, 여기서는 톤/제약 같은
// 메타 정보를 묻는다. 이 배열은 카테고리별 질문 뒤에 합쳐서 노출될 예정.
export const COMMON_QUESTIONS: Question[] = [
  {
    id: "priority",
    type: "single",
    prompt: "이 작업의 우선순위는 어떻게 되나요?",
    helper: "최종 프롬프트의 톤(긴급도, 꼼꼼함)에 영향을 줍니다.",
    choices: [
      { id: "high", label: "긴급 — 지금 막혀있다" },
      { id: "normal", label: "보통 — 곧 필요하다" },
      { id: "low", label: "낮음 — 시간 날 때 하고 싶다" },
    ],
  },
  {
    id: "constraints",
    type: "text",
    prompt: "꼭 지켜야 할 제약 사항이 있다면 알려주세요. (선택)",
    helper:
      "예: 새 라이브러리 추가 금지, 기존 API 시그니처 유지, 특정 패턴만 사용 등",
    placeholder: "없으면 비워두세요",
    required: false,
  },
];
