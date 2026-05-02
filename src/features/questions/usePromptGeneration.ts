import { useEffect, useRef } from "react";
import { generateViaProxy } from "../../api/geminiClient";
import { buildSystemPrompt } from "../builder/buildPrompt";
import { usePromptStore } from "../../store/promptStore";

// 마지막 스텝 완료 감지 → Gemini 호출 → done / error 상태 전환.
// 부수 효과만 있는 훅 — 반환값 없음.
// genSeqRef: React 18 Strict Mode 이중 effect 호출 방지용.
export function usePromptGeneration() {
  const dynamicQuestions = usePromptStore((s) => s.dynamicQuestions);
  const currentStep = usePromptStore((s) => s.currentStep);
  const status = usePromptStore((s) => s.status);
  const setStatus = usePromptStore((s) => s.setStatus);
  const setResult = usePromptStore((s) => s.setResult);
  const setError = usePromptStore((s) => s.setError);

  const genSeqRef = useRef(0);

  const total = dynamicQuestions.length;

  useEffect(() => {
    if (total === 0) return;
    if (currentStep < total) return;
    if (status !== "answering") return;

    const seq = ++genSeqRef.current;
    setStatus("generating");
    setError(null);

    const snap = usePromptStore.getState();
    const { originalInput, category: cat, answers: ans } = snap;

    void (async () => {
      if (!cat) {
        if (seq === genSeqRef.current) {
          setError("카테고리 정보가 없습니다.");
          setStatus("error");
        }
        return;
      }
      try {
        const systemInstruction = buildSystemPrompt({
          category: cat,
          answers: ans,
        });
        const text = await generateViaProxy({
          prompt: originalInput,
          systemInstruction,
        });
        if (seq !== genSeqRef.current) return;
        setResult(text);
        setStatus("done");
      } catch (e) {
        if (seq !== genSeqRef.current) return;
        const msg =
          e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
        setError(msg);
        setStatus("error");
      }
    })();
  }, [currentStep, status, total, setStatus, setResult, setError]);
}
