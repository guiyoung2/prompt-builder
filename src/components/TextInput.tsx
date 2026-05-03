import styled from "styled-components";

// 자유 텍스트 입력을 받는 컨트롤드 컴포넌트.
// - placeholder 를 그대로 입력란에 노출
// - 외부 store/state 가 단일 source of truth (value/onChange 로 완전 컨트롤드)
// - 멀티라인 가능성이 큰 질문(예: 제약사항)을 위해 textarea 사용

interface Props {
  question: { prompt: string; placeholder?: string };
  value: string;
  onChange: (value: string) => void;
}

export function TextInput({ question, value, onChange }: Props) {
  return (
    <TextArea
      value={value}
      placeholder={question.placeholder}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      aria-label={question.prompt}
    />
  );
}

const TextArea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.text};
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.color.borderStrong};
  }

  &:focus {
    border-color: ${({ theme }) => theme.color.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.color.primarySoft};
  }

  &::placeholder {
    color: ${({ theme }) => theme.color.textSubtle};
  }
`;
