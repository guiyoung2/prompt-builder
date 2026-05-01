import type { Question } from "../../types/question";

// refactor 카테고리 전용 질문.
// LLM이 리팩터링 목표 / 범위 / 동기 / 테스트 안전망 / 외부 호환성을 추론할 수 있도록
// 핵심 정보를 6문항으로 추출한다. 모두 멀티플 초이스 우선 + 필요 시 직접 입력.
export const REFACTOR_QUESTIONS: Question[] = [
  {
    id: "rf_taskType",
    type: "single",
    prompt: "어떤 종류의 리팩터링인가요?",
    helper: "목표에 따라 결과 프롬프트의 강조점이 달라집니다.",
    choices: [
      { id: "readability", label: "가독성 / 네이밍 개선" },
      { id: "dedup", label: "중복 제거 / 공통화" },
      { id: "split", label: "큰 함수 / 컴포넌트 분리" },
      { id: "types", label: "타입 강화 / any 제거" },
      { id: "deps", label: "의존성 / 결합도 정리" },
      { id: "perf", label: "성능 개선 (구조 변경 동반)" },
    ],
    allowCustom: true,
  },
  {
    id: "rf_scope",
    type: "single",
    prompt: "리팩터링 범위는 어느 정도인가요?",
    choices: [
      { id: "function", label: "단일 함수 / 메서드" },
      { id: "file", label: "한 파일 / 한 컴포넌트" },
      { id: "module", label: "한 모듈 / 한 폴더" },
      { id: "cross_module", label: "여러 모듈에 걸친 광범위한 변경" },
      { id: "architecture", label: "아키텍처 / 패턴 수준" },
    ],
    allowCustom: true,
  },
  {
    id: "rf_motivation",
    type: "single",
    prompt: "왜 지금 리팩터링이 필요한가요?",
    helper: "동기를 알면 LLM이 우선순위를 더 잘 잡아줍니다.",
    choices: [
      { id: "freq_change", label: "이 부분을 자주 수정해서 힘들다" },
      { id: "new_feature", label: "신규 기능 추가를 위해 정리가 필요하다" },
      { id: "hard_to_test", label: "테스트하기 어렵다" },
      { id: "frequent_bugs", label: "버그가 반복적으로 발생한다" },
      { id: "tech_debt", label: "기술 부채 정리 / 코드 품질" },
    ],
    allowCustom: true,
  },
  {
    id: "rf_testCoverage",
    type: "single",
    prompt: "기존 테스트는 얼마나 커버하고 있나요?",
    helper: "안전망 수준에 따라 LLM이 권장하는 진행 방식이 달라집니다.",
    choices: [
      { id: "good", label: "충분 — 회귀를 잘 잡아줄 것 같다" },
      { id: "partial", label: "일부만 — 핵심 경로는 있다" },
      { id: "almost_none", label: "거의 없음 — 수동 확인 위주" },
      { id: "none", label: "전혀 없음" },
      { id: "unknown", label: "잘 모르겠다" },
    ],
    allowCustom: true,
  },
  {
    id: "rf_compat",
    type: "single",
    prompt: "외부 호환성 제약이 있나요?",
    helper: "공개 API / 다른 모듈 / 외부 사용자가 의존하는지 여부.",
    choices: [
      { id: "keep_api", label: "공개 API / 시그니처는 그대로 유지해야 한다" },
      { id: "internal_only", label: "내부에서만 쓰여서 자유롭게 바꿔도 된다" },
      { id: "deprecate_ok", label: "기존을 deprecate 후 점진 교체 가능" },
      { id: "break_ok", label: "한 번에 바꿔도 영향 적다" },
      { id: "unknown", label: "잘 모르겠다" },
    ],
    allowCustom: true,
  },
  {
    id: "rf_concerns",
    type: "multi",
    prompt: "함께 챙겨야 할 것이 있다면 모두 골라주세요.",
    helper: "선택 사항입니다. 해당 없으면 비워두세요.",
    required: false,
    choices: [
      { id: "add_tests", label: "테스트 먼저 추가하고 진행" },
      { id: "strengthen_types", label: "타입 강화 / 제네릭 정리" },
      { id: "naming", label: "네이밍 / 도메인 용어 정리" },
      { id: "folder_layout", label: "폴더 / 파일 구조 재정리" },
      { id: "comments_docs", label: "주석 / 문서 보강" },
      { id: "simplify_deps", label: "의존성 단순화 / 순환 제거" },
      { id: "perf_safety", label: "성능 회귀 방지 측정" },
    ],
  },
];
