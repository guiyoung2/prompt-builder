import { CATEGORY_META } from "../../templates/categories";
import { QUESTIONS_BY_CATEGORY } from "../../templates/questions";
import type { Category } from "../../types/category";
import type { AnswerMap, Choice, Question } from "../../types/question";

/** Gemini `systemInstruction`에 넣을 문자열을 만들 때 사용하는 입력 */
export interface BuildSystemPromptInput {
  category: Category;
  answers: AnswerMap;
}

// 미리 정의된 choice id면 한글 라벨로, 그 외(기타 입력)는 값 그대로 표시
function displayChoiceValue(choices: Choice[], raw: string): string {
  const found = choices.find((c) => c.id === raw);
  return found !== undefined ? found.label : raw;
}

function formatAnswerLine(question: Question, answers: AnswerMap): string {
  const raw = answers[question.id];

  if (question.type === "text") {
    if (raw === undefined || typeof raw !== "string") return "—";
    const t = raw.trim();
    return t === "" ? "—" : t;
  }

  if (question.type === "single") {
    if (raw === undefined || typeof raw !== "string") return "—";
    const t = raw.trim();
    if (t === "") return "—";
    return displayChoiceValue(question.choices, t);
  }

  // multi
  if (!Array.isArray(raw) || raw.length === 0) return "—";
  const resolved = raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => displayChoiceValue(question.choices, item));
  return resolved.length === 0 ? "—" : resolved.join(", ");
}

const ROLE_INTRO = `당신은 사용자의 모호한 개발 요청과 아래 맥락(카테고리·스텝 폼 답변)을 바탕으로,
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

/**
 * 카테고리와 스텝 폼 답변을 `/api/generate`의 `systemInstruction` 형식 문자열로 조립합니다.
 * 질문 순서는 `QUESTIONS_BY_CATEGORY`와 동일합니다.
 */
export function buildSystemPrompt(input: BuildSystemPromptInput): string {
  const { category, answers } = input;
  const meta = CATEGORY_META[category];
  const questions = QUESTIONS_BY_CATEGORY[category];

  const lines: string[] = [
    ROLE_INTRO,
    "",
    "## 분류",
    `- 카테고리: ${meta.label} (${category})`,
    `- 범위: ${meta.scope}`,
    "",
    "## 스텝 폼 답변",
    "보기에서 고른 값은 한글 라벨로 풀었습니다. 직접 입력·기타 텍스트는 그대로 옮깁니다.",
    "",
  ];

  questions.forEach((q, i) => {
    lines.push(`${String(i + 1)}. ${q.prompt}`);
    lines.push(`답변: ${formatAnswerLine(q, answers)}`);
    lines.push("");
  });

  const priority = answers["priority"];
  if (priority === "high") {
    lines.push("⚠️ 긴급 작업: 설명 최소화, 코드와 완료 기준 위주로 작성.");
  } else if (priority === "low") {
    lines.push("여유 작업: 접근 방법의 트레이드오프와 대안을 간략히 포함.");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
