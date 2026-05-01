import type { Question } from "../../types/question";

// bugfix 카테고리 전용 질문.
// LLM이 문제 유형 / 영향 범위 / 재현성 / 발생 환경 / 보유 단서를 추론할 수 있도록
// 핵심 정보를 6문항으로 추출한다. 모두 멀티플 초이스 우선 + 필요 시 직접 입력.
export const BUGFIX_QUESTIONS: Question[] = [
  {
    id: "bf_taskType",
    type: "single",
    prompt: "어떤 종류의 문제인가요?",
    helper: "문제의 성격에 맞춰 결과 프롬프트의 디버깅 전략이 달라집니다.",
    choices: [
      { id: "runtime_error", label: "런타임 에러 / 예외 발생" },
      { id: "ui_glitch", label: "UI가 의도와 다르게 보이거나 동작" },
      { id: "wrong_data", label: "결과 데이터가 잘못됨 / 계산 오류" },
      { id: "perf", label: "느려짐 / 렉 / 응답 지연" },
      { id: "build_fail", label: "빌드 / 배포 / 환경 오류" },
    ],
    allowCustom: true,
  },
  {
    id: "bf_severity",
    type: "single",
    prompt: "영향 범위가 어느 정도인가요?",
    helper: "긴급도가 높을수록 핫픽스 위주로 프롬프트가 구성됩니다.",
    choices: [
      { id: "blocker", label: "전체 사용자 차단 / 서비스 다운" },
      { id: "major", label: "주요 기능이 망가짐" },
      { id: "minor", label: "일부 사용자 / 일부 케이스만 영향" },
      { id: "cosmetic", label: "동작은 되지만 보기 좋지 않음" },
      { id: "unknown", label: "아직 파악 안 됨" },
    ],
    allowCustom: true,
  },
  {
    id: "bf_reproducibility",
    type: "single",
    prompt: "재현은 얼마나 잘 되나요?",
    choices: [
      { id: "always", label: "항상 재현됨 (재현 절차 있음)" },
      { id: "sometimes", label: "가끔 발생 (간헐적)" },
      { id: "specific_env", label: "특정 환경 / 계정에서만" },
      { id: "once", label: "한 번 봤고 다시 안 남" },
      { id: "unknown", label: "아직 시도해보지 않음" },
    ],
    allowCustom: true,
  },
  {
    id: "bf_environment",
    type: "single",
    prompt: "어디서 발생했나요?",
    choices: [
      { id: "production", label: "운영(production) 환경" },
      { id: "staging", label: "스테이징 / QA 환경" },
      { id: "dev", label: "개발 서버 / 동료 환경" },
      { id: "local", label: "내 로컬에서만" },
      { id: "ci", label: "CI / 빌드 파이프라인" },
    ],
    allowCustom: true,
  },
  {
    id: "bf_clue",
    type: "single",
    prompt: "현재 가지고 있는 단서는 무엇인가요?",
    helper: "보유한 단서에 따라 LLM의 추론 출발점이 달라집니다.",
    choices: [
      { id: "stacktrace", label: "에러 메시지 / 스택 트레이스가 있다" },
      { id: "repro_steps", label: "재현 절차는 알지만 원인은 모른다" },
      { id: "suspect_code", label: "의심 가는 코드 / 커밋이 있다" },
      { id: "logs", label: "서버 / 브라우저 로그가 있다" },
      { id: "none", label: "거의 없음 / 어디서부터 봐야 할지 모르겠다" },
    ],
    allowCustom: true,
  },
  {
    id: "bf_concerns",
    type: "multi",
    prompt: "수정 시 함께 챙겨야 할 것이 있다면 모두 골라주세요.",
    helper: "선택 사항입니다. 해당 없으면 비워두세요.",
    required: false,
    choices: [
      { id: "regression_test", label: "재발 방지용 회귀 테스트 추가" },
      { id: "logging", label: "로깅 / 관측 강화" },
      { id: "hotfix_first", label: "핫픽스 먼저, 근본 수정은 나중에" },
      { id: "root_cause", label: "근본 원인까지 파고들기" },
      { id: "rollback_plan", label: "롤백 / 복구 절차도 함께" },
      { id: "side_effects", label: "다른 곳 영향 범위 점검" },
    ],
  },
];
