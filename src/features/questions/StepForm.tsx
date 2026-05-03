import styled from "styled-components";
import { LoadingRow, Spinner, LoadingText, ErrorText, RetryFooter } from "../../components/shared.styles";
import { SingleChoice, MultiChoice } from "../../components/Choice";
import { TextInput } from "../../components/TextInput";
import { PromptResult } from "../output/PromptResult";
import { usePromptStore } from "../../store/promptStore";
import { usePromptGeneration } from "./usePromptGeneration";
import type { AnswerValue, DynamicQuestion } from "../../types/question";

// 카테고리별 + 공통 질문을 한 화면씩 보여주는 스텝 폼.
// store가 single source of truth — category/currentStep/answers를 그대로 읽고,
// 답변/이동은 setAnswer/goNext/goPrev에 위임. props 없음 (PLAN 결정).
//
// 완료 처리: 마지막 질문에서 "완료"를 누르면 currentStep === total 이 된다.
// answering → useEffect에서 Gemini 프록시 호출(generating) → done / error.
// Strict Mode 이중 effect 대비: genSeqRef 로 마지막 요청만 상태 반영.
export function StepForm() {
  const dynamicQuestions = usePromptStore((s) => s.dynamicQuestions);
  const currentStep = usePromptStore((s) => s.currentStep);
  const answers = usePromptStore((s) => s.answers);
  const status = usePromptStore((s) => s.status);
  const result = usePromptStore((s) => s.result);
  const error = usePromptStore((s) => s.error);
  const goNext = usePromptStore((s) => s.goNext);
  const goPrev = usePromptStore((s) => s.goPrev);
  const setStatus = usePromptStore((s) => s.setStatus);
  const reset = usePromptStore((s) => s.reset);

  usePromptGeneration();

  const total = dynamicQuestions.length;

  if (dynamicQuestions.length === 0) return null;

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
            onReset={reset}
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

  const question = dynamicQuestions[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === total - 1;
  const required = question.required ?? true;
  const canProceed = !required || hasAnswer(question, answers[question.id]);
  const progress = ((currentStep + 1) / total) * 100;

  return (
    <Card>
      <StepIndicator>
        <StepLabel>{currentStep + 1} / {total}</StepLabel>
        <ProgressBar>
          <ProgressFill style={{ width: `${progress}%` }} />
        </ProgressBar>
      </StepIndicator>

      <HeaderBlock>
        <Prompt>{question.text}</Prompt>
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

// 질문 타입별로 입력 컴포넌트를 분기
function QuestionInput({ question }: { question: DynamicQuestion }) {
  const answer = usePromptStore((s) => s.answers[question.id]);
  const setAnswer = usePromptStore((s) => s.setAnswer);
  const choices = question.choices ?? [];

  if (question.type === "single") {
    return (
      <SingleChoice
        choices={choices}
        allowCustom={question.allowCustom}
        value={typeof answer === "string" ? answer : ""}
        onChange={(v) => setAnswer(question.id, v)}
      />
    );
  }
  if (question.type === "multi") {
    return (
      <MultiChoice
        choices={choices}
        allowCustom={question.allowCustom}
        value={Array.isArray(answer) ? answer : []}
        onChange={(v) => setAnswer(question.id, v)}
      />
    );
  }
  return (
    <TextInput
      question={{ prompt: question.text }}
      value={typeof answer === "string" ? answer : ""}
      onChange={(v) => setAnswer(question.id, v)}
    />
  );
}

// 답변이 채워졌는지 검사 (required 질문의 "다음" 활성화 판정용)
function hasAnswer(
  question: DynamicQuestion,
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
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.space.xxl};
  box-shadow: ${({ theme }) => theme.shadow.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xl};

  @media (max-width: 600px) {
    padding: ${({ theme }) => theme.space.xl};
    gap: ${({ theme }) => theme.space.lg};
  }
`;

const StepIndicator = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;

const StepLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.primary};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.color.border};
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, ${({ theme }) => theme.color.primary}, ${({ theme }) => theme.color.primaryHover});
  border-radius: ${({ theme }) => theme.radius.pill};
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const HeaderBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

const Prompt = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.text};
  letter-spacing: -0.02em;
  line-height: 1.4;

  @media (max-width: 600px) {
    font-size: 17px;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  margin-top: ${({ theme }) => theme.space.sm};
  padding-top: ${({ theme }) => theme.space.lg};
  border-top: 1px solid ${({ theme }) => theme.color.border};

  @media (max-width: 600px) {
    flex-direction: column-reverse;
  }
`;

const PrimaryButton = styled.button`
  padding: 10px 24px;
  background: ${({ theme }) => theme.color.primary};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.radius.pill};
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

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const SecondaryButton = styled.button`
  padding: 10px 24px;
  background: transparent;
  color: ${({ theme }) => theme.color.text};
  border: 1.5px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.pill};
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.color.borderStrong};
    background: ${({ theme }) => theme.color.surfaceHover};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`;


const CompleteText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.text};
  font-size: 14px;
`;
