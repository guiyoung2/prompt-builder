import type { AnswerMap, DynamicChoice, DynamicQuestion } from "../../types/question";

/** Gemini `systemInstruction`에 넣을 문자열을 만들 때 사용하는 입력 */
export interface BuildSystemPromptInput {
  dynamicQuestions: DynamicQuestion[];
  answers: AnswerMap;
}

// 미리 정의된 choice id면 한글 라벨로, 그 외(기타 입력)는 값 그대로 표시
function displayChoiceValue(choices: DynamicChoice[], raw: string): string {
  const found = choices.find((c) => c.id === raw);
  return found !== undefined ? found.label : raw;
}

function formatAnswerLine(question: DynamicQuestion, answers: AnswerMap): string {
  const raw = answers[question.id];
  const choices = question.choices ?? [];

  if (question.type === "text") {
    if (raw === undefined || typeof raw !== "string") return "—";
    const t = raw.trim();
    return t === "" ? "—" : t;
  }

  if (question.type === "single") {
    if (raw === undefined || typeof raw !== "string") return "—";
    const t = raw.trim();
    if (t === "") return "—";
    return displayChoiceValue(choices, t);
  }

  // multi
  if (!Array.isArray(raw) || raw.length === 0) return "—";
  const resolved = raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => displayChoiceValue(choices, item));
  return resolved.length === 0 ? "—" : resolved.join(", ");
}

const ROLE_INTRO = `당신은 사용자의 모호한 개발 요청과 아래 맥락(스텝 폼 답변)을 바탕으로,
Claude Code(AI 코딩 CLI)에게 전달할 구조화된 프롬프트를 작성합니다.

[출력 규칙 — 반드시 준수]
1. 아래 섹션 순서와 헤더를 그대로 사용할 것 (헤더 이름 변경 금지):
   ## 목표
   ## 기술 환경
   ## 요구사항
   ## 제약 및 가정
   ## 완료 기준
   ## 스코프 외 (하지 말 것)
2. 각 섹션은 간결한 불릿(-)으로 작성. 서술형 문장 최소화.
3. "## 목표" 첫 줄은 동사로 시작하는 한 문장 (예: "React로 히어로 섹션 컴포넌트를 신규 구현한다.").
4. "## 완료 기준"은 검증 가능한 조건만 (예: "빌드 에러 없음", "모바일 375px에서 레이아웃 깨지지 않음").
5. "## 스코프 외"는 Claude Code가 하지 말아야 할 것을 명시 (예: "테스트 코드 작성 금지", "기존 컴포넌트 리팩터링 금지").
6. 출력 전체를 마크다운으로 작성. 제목(#) 사용 금지 — 섹션 헤더(##)부터 시작.`;

// 동적 질문-답변을 systemInstruction 형식 문자열로 조립
export function buildSystemPrompt(input: BuildSystemPromptInput): string {
  const { dynamicQuestions, answers } = input;

  const lines: string[] = [
    ROLE_INTRO,
    "",
    "## 스텝 폼 답변",
    "보기에서 고른 값은 한글 라벨로 풀었습니다. 직접 입력·기타 텍스트는 그대로 옮깁니다.",
    "",
  ];

  dynamicQuestions.forEach((q, i) => {
    lines.push(`${String(i + 1)}. ${q.text}`);
    lines.push(`답변: ${formatAnswerLine(q, answers)}`);
    lines.push("");
  });

  return `${lines.join("\n").trimEnd()}\n`;
}
