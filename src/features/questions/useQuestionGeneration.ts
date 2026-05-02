import { useEffect, useRef } from "react";
import { usePromptStore } from "../../store/promptStore";
import { generateViaProxy } from "../../api/geminiClient";
import type { DynamicQuestion, DynamicChoice } from "../../types/question";

// Gemini Call 1 — 동적 질문 생성용 시스템 프롬프트
const CALL1_SYSTEM_INSTRUCTION = `당신은 시니어 풀스택 개발자입니다.
사용자의 개발 요청을 읽고, 구현에 필요하지만 아직 결정되지 않은 사항을 3~5개 질문으로 추출하세요.

[규칙]
1. 사용자가 이미 명시한 기술·요구사항은 절대 다시 묻지 말 것.
2. 구현 방향에 실제 영향을 미치는 미결정 사항만 질문할 것.
3. 선택지가 있는 경우 choices를 제공하되, 아래 두 가지 규칙을 반드시 지킬 것:
   a. 조합이 너무 많은 질문(예: 프레임워크 + 스타일링 라이브러리)은 하나의 질문으로 묶지 말고 두 질문으로 나눌 것.
   b. 모든 single/multi 질문에는 반드시 "allowCustom": true 를 포함할 것 (UI에서 '기타 직접 입력' 텍스트 필드가 자동으로 추가됨).
4. 질문 본문에 영어 약어나 전문 용어(예: CTA, SEO, SSR, hydration 등)는 사용하지 말 것. 한국어로 풀어서 설명할 것.
   예) "CTA 버튼" → "주요 버튼(예: '시작하기', '구매하기')", "SSR" → "서버 사이드 렌더링"
5. 마지막 질문은 반드시 type "text"로, text는 "추가 요구사항이나 특이사항이 있으면 자유롭게 작성해주세요. (없으면 건너뛰어도 됩니다)", required: false 로 고정할 것.
6. 아래 JSON 형식만 반환. 마크다운 코드 블록(\`\`\`) 없이 순수 JSON.

{
  "questions": [
    { "id": "q1", "text": "...", "type": "single", "allowCustom": true, "choices": [{ "id": "c1", "label": "..." }] },
    { "id": "q2", "text": "...", "type": "text", "choices": null, "required": false }
  ]
}`;

// Gemini 응답 JSON에서 DynamicQuestion[] 파싱 및 검증
function parseQuestionsFromText(text: string): DynamicQuestion[] {
  // 응답에 마크다운 코드 블록이 포함된 경우 추출
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? null;
  const jsonText = jsonMatch ? jsonMatch[1] : text;

  const parsed: unknown = JSON.parse(jsonText.trim());

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>)["questions"])
  ) {
    throw new Error("questions 배열이 없는 형식입니다.");
  }

  const rawQuestions = (parsed as Record<string, unknown>)[
    "questions"
  ] as unknown[];

  return rawQuestions.map((q, i): DynamicQuestion => {
    if (typeof q !== "object" || q === null) {
      throw new Error(`질문 항목 ${i}이 올바르지 않습니다.`);
    }
    const item = q as Record<string, unknown>;

    const id =
      typeof item["id"] === "string" ? item["id"] : `q${String(i + 1)}`;
    const text =
      typeof item["text"] === "string" ? item["text"] : "";
    const type =
      item["type"] === "single" || item["type"] === "multi"
        ? item["type"]
        : "text";

    let choices: DynamicChoice[] | undefined;
    if (
      (type === "single" || type === "multi") &&
      Array.isArray(item["choices"])
    ) {
      choices = (item["choices"] as unknown[])
        .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
        .map((c, ci) => ({
          id: typeof c["id"] === "string" ? c["id"] : `c${String(ci + 1)}`,
          label: typeof c["label"] === "string" ? c["label"] : "",
        }));
    }

    const required =
      typeof item["required"] === "boolean" ? item["required"] : true;
    const allowCustom =
      typeof item["allowCustom"] === "boolean" ? item["allowCustom"] : undefined;

    return { id, text, type, choices, required, allowCustom };
  });
}

// status === "analyzing"을 감지해 Call 1 실행 후 동적 질문을 store에 저장
export function useQuestionGeneration(): void {
  const status = usePromptStore((s) => s.status);
  const originalInput = usePromptStore((s) => s.originalInput);
  const setDynamicQuestions = usePromptStore((s) => s.setDynamicQuestions);
  const setStatus = usePromptStore((s) => s.setStatus);
  const setError = usePromptStore((s) => s.setError);

  // React 18 StrictMode 이중 실행 방지용 시퀀스 ref
  const genSeqRef = useRef(0);

  useEffect(() => {
    if (status !== "analyzing") return;

    const seq = ++genSeqRef.current;

    async function runCall1() {
      try {
        const text = await generateViaProxy({
          prompt: originalInput,
          systemInstruction: CALL1_SYSTEM_INSTRUCTION,
        });

        if (seq !== genSeqRef.current) return;

        const questions = parseQuestionsFromText(text);
        setDynamicQuestions(questions);
        setStatus("answering");
      } catch (e) {
        if (seq !== genSeqRef.current) return;
        const msg =
          e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
        setError(`질문 생성에 실패했습니다. 다시 시도해주세요. (${msg})`);
        setStatus("error");
      }
    }

    void runCall1();
  }, [status, originalInput, setDynamicQuestions, setStatus, setError]);
}
