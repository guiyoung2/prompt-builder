import { useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { SingleChoice, MultiChoice } from "../../components/Choice";
import { TextInput } from "../../components/TextInput";
import { PromptResult } from "../output/PromptResult";
import { usePromptStore } from "../../store/promptStore";
import { QUESTIONS_BY_CATEGORY } from "../../templates/questions";
import { usePromptGeneration } from "./usePromptGeneration";
import type { AnswerValue, Question } from "../../types/question";

// 카테고리별 + 공통 질문을 한 화면씩 보여주는 스텝 폼.
// store가 single source of truth — category/currentStep/answers를 그대로 읽고,
// 답변/이동은 setAnswer/goNext/goPrev에 위임. props 없음 (PLAN 결정).
//
// 완료 처리: 마지막 질문에서 "완료"를 누르면 currentStep === total 이 된다.
// answering → useEffect에서 Gemini 프록시 호출(generating) → done / error.
// Strict Mode 이중 effect 대비: genSeqRef 로 마지막 요청만 상태 반영.
export function StepForm() {
  const category = usePromptStore((s) => s.category);
  const currentStep = usePromptStore((s) => s.currentStep);
  const answers = usePromptStore((s) => s.answers);
  const status = usePromptStore((s) => s.status);
  const result = usePromptStore((s) => s.result);
  const error = usePromptStore((s) => s.error);
  const goNext = usePromptStore((s) => s.goNext);
  const goPrev = usePromptStore((s) => s.goPrev);
  const setStatus = usePromptStore((s) => s.setStatus);

  usePromptGeneration();

  const questions = useMemo(
    () => (category ? QUESTIONS_BY_CATEGORY[category] : []),
    [category],
  );

  const total = questions.length;

  if (!category || questions.length === 0) return null;

  if (currentStep >= total) {
    if (status === "generating") {
      return (
        <Card>
          <LoadingRow>
            <Spinner aria-hidden />
            <LoadingText>
              구조화 프롬프트를 생성하는 중입니다…
            </LoadingText>
          </LoadingRow>
        </Card>
      );
    }
    if (status === "error") {
      return (
        <Card>
          <ErrorText role="alert">
            {error ?? "오류가 발생했습니다."}
          </ErrorText>
          <RetryFooter>
            <PrimaryButton
              type="button"
              onClick={() => setStatus("answering")}
            >
              다시 시도
            </PrimaryButton>
          </RetryFooter>
        </Card>
      );
    }
    if (status === "done" && result !== null && result !== "") {
      return (
        <Card>
          <PromptResult
            markdown={result}
            onRegenerate={() => setStatus("answering")}
          />
        </Card>
      );
    }
    // answering: effect가 generating 으로 바꾸기 직전 짧은 프레임
    return (
      <Card>
        <CompleteText>생성을 준비하는 중…</CompleteText>
      </Card>
    );
  }

  const question = questions[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === total - 1;
  const required = question.required ?? true;
  const canProceed = !required || hasAnswer(question, answers[question.id]);
  const progress = ((currentStep + 1) / total) * 100;

  return (
    <Card>
      <ProgressRow>
        <ProgressLabel>
          {currentStep + 1} / {total}
        </ProgressLabel>
        <ProgressBar>
          <ProgressFill style={{ width: `${progress}%` }} />
        </ProgressBar>
      </ProgressRow>

      <HeaderBlock>
        <Prompt>{question.prompt}</Prompt>
        {question.helper ? <Helper>{question.helper}</Helper> : null}
      </HeaderBlock>

      <QuestionInput question={question} />

      <Footer>
        <SecondaryButton type="button" disabled={isFirst} onClick={goPrev}>
          이전
        </SecondaryButton>
        <PrimaryButton type="button" disabled={!canProceed} onClick={goNext}>
          {isLast ? "완료" : "다음"}
        </PrimaryButton>
      </Footer>
    </Card>
  );
}

// 질문 타입별로 입력 컴포넌트를 분기. store에서 직접 답변/세터를 읽어
// StepForm 본체를 얇게 유지한다.
function QuestionInput({ question }: { question: Question }) {
  const answer = usePromptStore((s) => s.answers[question.id]);
  const setAnswer = usePromptStore((s) => s.setAnswer);

  if (question.type === "single") {
    return (
      <SingleChoice
        question={question}
        value={typeof answer === "string" ? answer : ""}
        onChange={(v) => setAnswer(question.id, v)}
      />
    );
  }
  if (question.type === "multi") {
    return (
      <MultiChoice
        question={question}
        value={Array.isArray(answer) ? answer : []}
        onChange={(v) => setAnswer(question.id, v)}
      />
    );
  }
  return (
    <TextInput
      question={question}
      value={typeof answer === "string" ? answer : ""}
      onChange={(v) => setAnswer(question.id, v)}
    />
  );
}

// 답변이 채워졌는지 검사 (required 질문의 "다음" 활성화 판정용)
function hasAnswer(
  question: Question,
  answer: AnswerValue | undefined,
): boolean {
  if (question.type === "multi") {
    return Array.isArray(answer) && answer.length > 0;
  }
  return typeof answer === "string" && answer.trim() !== "";
}

const Card = styled.section`
  background: ${({ theme }) => theme.color.surface};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space.xl};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.lg};
`;

const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
`;

const ProgressLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.textMuted};
  white-space: nowrap;
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 6px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.color.surfaceMuted};
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.color.primary};
  transition: width 0.2s ease;
`;

const HeaderBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

const Prompt = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.text};
  letter-spacing: -0.01em;
`;

const Helper = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 13px;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  margin-top: ${({ theme }) => theme.space.sm};
`;

const PrimaryButton = styled.button`
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.xl};
  background: ${({ theme }) => theme.color.primary};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.color.primaryHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.xl};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.text};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.color.borderStrong};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const LoadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
`;

const Spinner = styled.span`
  display: inline-block;
  width: 22px;
  height: 22px;
  border: 2px solid ${({ theme }) => theme.color.border};
  border-top-color: ${({ theme }) => theme.color.primary};
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
  flex-shrink: 0;
`;

const LoadingText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 14px;
`;

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.danger};
  font-size: 14px;
  line-height: 1.5;
`;

const RetryFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.space.sm};
`;

const CompleteText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.text};
  font-size: 14px;
`;
