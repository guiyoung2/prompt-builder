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

const ROLE_INTRO = [
  "당신은 사용자가 입력한 모호한 개발 요청을, 아래에 정리된 맥락(카테고리·스텝 폼 답변)을 반영한 전문가용 구조화 프롬프트로 재작성합니다.",
  "출력은 마크다운으로 작성하고, 요구사항·가정·제약·다음 액션을 명확히 구분하세요.",
].join("\n");

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

  return `${lines.join("\n").trimEnd()}\n`;
}
