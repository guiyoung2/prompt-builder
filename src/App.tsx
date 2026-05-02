import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { StepForm } from "./features/questions/StepForm";
import { useQuestionGeneration } from "./features/questions/useQuestionGeneration";
import { usePromptStore } from "./store/promptStore";

const Page = styled.div`
  min-height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  padding: ${({ theme }) => theme.space.xl} ${({ theme }) => theme.space.lg};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  background: ${({ theme }) => theme.color.surface};
`;

const HeaderInner = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const Subtitle = styled.p`
  margin: ${({ theme }) => theme.space.xs} 0 0;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 14px;
`;

const Main = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.space.xxl} ${({ theme }) => theme.space.lg};
`;

const MainInner = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
`;

const InputCard = styled.section`
  background: ${({ theme }) => theme.color.surface};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space.xl};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.textMuted};
  margin-bottom: ${({ theme }) => theme.space.sm};
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  resize: vertical;
  padding: ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
  outline: none;
  transition: border-color 0.15s ease;
  font: inherit;

  &:focus {
    border-color: ${({ theme }) => theme.color.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.color.textSubtle};
  }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
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

const SubmitButton = styled.button`
  margin-top: ${({ theme }) => theme.space.lg};
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.xl};
  background: ${({ theme }) => theme.color.primary};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-weight: 600;
  font-size: 15px;
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

function App() {
  return (
    <Page>
      <Header>
        <HeaderInner>
          <Title>Prompt Builder</Title>
          <Subtitle>모호한 요청을 구체적인 프롬프트로 바꿔드립니다</Subtitle>
        </HeaderInner>
      </Header>

      <Main>
        <MainInner>
          <Workflow />
        </MainInner>
      </Main>
    </Page>
  );
}

// 진행 상태(status)에 따라 화면을 분기.
// - idle: 입력 카드
// - analyzing: Call 1 질문 생성 중 스피너
// - error(질문 생성 실패): 에러 카드 — dynamicQuestions가 비면 analyzing 단계 에러
// - answering 이후: StepForm
function Workflow() {
  const status = usePromptStore((s) => s.status);
  const dynamicQuestions = usePromptStore((s) => s.dynamicQuestions);
  const error = usePromptStore((s) => s.error);
  const setStatus = usePromptStore((s) => s.setStatus);

  useQuestionGeneration();

  if (status === "idle") return <IntentInput />;

  if (status === "analyzing") {
    return (
      <InputCard>
        <LoadingRow>
          <Spinner aria-hidden />
          <LoadingText>질문을 구성하는 중...</LoadingText>
        </LoadingRow>
      </InputCard>
    );
  }

  if (status === "error" && dynamicQuestions.length === 0) {
    return (
      <InputCard>
        <ErrorText role="alert">{error ?? "오류가 발생했습니다."}</ErrorText>
        <RetryFooter>
          <SubmitButton type="button" onClick={() => setStatus("analyzing")}>
            다시 시도
          </SubmitButton>
        </RetryFooter>
      </InputCard>
    );
  }

  return <StepForm />;
}

// 사용자 입력 → store에 저장 후 "analyzing"으로 전환.
// Call 1(질문 생성)은 useQuestionGeneration 훅이 analyzing 감지 시 처리한다.
function IntentInput() {
  const [input, setInput] = useState("");
  const setOriginalInput = usePromptStore((s) => s.setOriginalInput);
  const setStatus = usePromptStore((s) => s.setStatus);

  const trimmed = input.trim();
  const canSubmit = trimmed.length > 0;

  const handleStart = () => {
    if (!canSubmit) return;
    setOriginalInput(trimmed);
    setStatus("analyzing");
  };

  return (
    <InputCard>
      <Label htmlFor="prompt-input">어떤 작업이 필요하신가요?</Label>
      <Textarea
        id="prompt-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
            e.preventDefault();
            handleStart();
          }
        }}
        placeholder="예) 히어로 섹션 구현해줘 / 로그인 API 만들어줘 / 무한 스크롤 버그 고쳐줘"
      />
      <SubmitButton type="button" disabled={!canSubmit} onClick={handleStart}>
        시작하기
      </SubmitButton>
    </InputCard>
  );
}

export default App;
