import { useState } from "react";
import styled from "styled-components";
import { classifyIntent } from "./features/intent/classifyIntent";
import { CategoryHeader } from "./features/intent/CategoryHeader";
import { StepForm } from "./features/questions/StepForm";
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
// - idle: 입력 카드 → "시작하기"로 분류 후 answering 진입
// - answering 이후: CategoryHeader + StepForm
// classifying 단계는 두지 않는다 (분류가 동기라 별도 확인 화면이 마찰만 됨).
function Workflow() {
  const status = usePromptStore((s) => s.status);

  if (status === "idle") {
    return <IntentInput />;
  }

  return (
    <>
      <CategoryHeader />
      <StepForm />
    </>
  );
}

// 사용자 입력 → classifyIntent → store 액션 호출로 답변 화면 진입.
// 입력 자체는 전송 직전까지만 의미가 있으므로 로컬 useState로 관리하고,
// 시작 시점에만 store에 originalInput을 기록한다.
function IntentInput() {
  const [input, setInput] = useState("");
  const setOriginalInput = usePromptStore((s) => s.setOriginalInput);
  const setCategory = usePromptStore((s) => s.setCategory);
  const setStatus = usePromptStore((s) => s.setStatus);

  const trimmed = input.trim();
  const canSubmit = trimmed.length > 0;

  const handleStart = () => {
    if (!canSubmit) return;
    const result = classifyIntent(trimmed);
    setOriginalInput(trimmed);
    setCategory(result.category);
    setStatus("answering");
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
