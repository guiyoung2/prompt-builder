import { useState } from "react";
import styled from "styled-components";
import { LoadingRow, Spinner, LoadingText, ErrorText, RetryFooter } from "./components/shared.styles";
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
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.color.text};

  @media (max-width: 600px) {
    font-size: 18px;
  }
`;

const Subtitle = styled.p`
  margin: ${({ theme }) => theme.space.xs} 0 0;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 14px;

  @media (max-width: 600px) {
    display: none;
  }
`;

const Main = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.space.xxl} ${({ theme }) => theme.space.lg};

  @media (max-width: 600px) {
    padding: 20px 12px;
  }
`;

const MainInner = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
`;

// IntentInput 전용 큰 라운드 카드 컨테이너
const InputCard = styled.section`
  background: ${({ theme }) => theme.color.surface};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.xxl};
  padding: 0;
  box-shadow: ${({ theme }) => theme.shadow.md};
  transition: box-shadow 0.2s ease;

  &:focus-within {
    box-shadow: ${({ theme }) => theme.shadow.lg};
  }

  @media (max-width: 600px) {
    border-radius: ${({ theme }) => theme.radius.xl};
  }
`;

// 로딩/에러 상태용 일반 카드 (내부 패딩 있음)
const StateCard = styled.section`
  background: ${({ theme }) => theme.color.surface};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.xxl};
  padding: ${({ theme }) => theme.space.xl};
  box-shadow: ${({ theme }) => theme.shadow.md};

  @media (max-width: 600px) {
    border-radius: ${({ theme }) => theme.radius.xl};
    padding: ${({ theme }) => theme.space.lg};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 140px;
  resize: none;
  padding: 20px 24px 12px 24px;
  border: none;
  border-radius: 0;
  background: transparent;
  outline: none;
  font: inherit;
  font-size: 15px;
  line-height: 1.6;
  color: ${({ theme }) => theme.color.text};

  &::placeholder {
    color: ${({ theme }) => theme.color.textSubtle};
  }

  @media (max-width: 600px) {
    min-height: 120px;
    padding: 16px 16px 10px 16px;
  }
`;

// textarea 아래 하단 액션 바
const ActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 14px 24px;
  border-top: 1px solid ${({ theme }) => theme.color.border};

  @media (max-width: 600px) {
    padding: 8px 12px 12px 16px;
  }
`;

const InputLabel = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.color.textSubtle};
  margin: 0;
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
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
    opacity: 0.35;
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
      <StateCard>
        <LoadingRow>
          <Spinner aria-hidden />
          <LoadingText>질문을 구성하는 중...</LoadingText>
        </LoadingRow>
      </StateCard>
    );
  }

  if (status === "error" && dynamicQuestions.length === 0) {
    return (
      <StateCard>
        <ErrorText role="alert">{error ?? "오류가 발생했습니다."}</ErrorText>
        <RetryFooter>
          <SubmitButton type="button" onClick={() => setStatus("analyzing")}>
            다시 시도
          </SubmitButton>
        </RetryFooter>
      </StateCard>
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
      <Textarea
        id="prompt-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && canSubmit) {
            e.preventDefault();
            handleStart();
          }
        }}
        placeholder="어떤 작업이 필요하신가요? 예) 히어로 섹션 구현해줘 / 로그인 API 만들어줘"
        aria-label="어떤 작업이 필요하신가요?"
      />
      <ActionBar>
        <InputLabel>Enter로 시작 · Shift+Enter로 줄바꿈</InputLabel>
        <SubmitButton type="button" disabled={!canSubmit} onClick={handleStart}>
          시작하기
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </SubmitButton>
      </ActionBar>
    </InputCard>
  );
}

export default App;
