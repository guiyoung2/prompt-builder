import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import styled from "styled-components";

export interface PromptResultProps {
  /** Gemini 등이 반환한 마크다운 본문 (클립보드에도 동일 문자열 복사) */
  markdown: string;
  onRegenerate?: () => void;
  onReset?: () => void;
}

// 생성 완료 후 다크 패널에 마크다운을 렌더하고, 원문 통째로 복사한다.
export function PromptResult({ markdown, onRegenerate, onReset }: PromptResultProps) {
  const [copyState, setCopyState] = useState<"idle" | "ok" | "err">("idle");
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(
    () => () => {
      clearTimeout(resetTimerRef.current);
    },
    [],
  );

  const scheduleReset = (ms: number) => {
    clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setCopyState("idle"), ms);
  };

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("클립보드를 사용할 수 없습니다.");
      }
      await navigator.clipboard.writeText(markdown);
      setCopyState("ok");
      scheduleReset(2000);
    } catch {
      setCopyState("err");
      scheduleReset(3000);
    }
  };

  return (
    <>
      <ResultHeader>
        <ResultTitle>생성된 프롬프트</ResultTitle>
        <CopyActions>
          {copyState === "ok" ? (
            <CopyFeedback $tone="ok" role="status">
              복사됨
            </CopyFeedback>
          ) : null}
          {copyState === "err" ? (
            <CopyFeedback $tone="err" role="alert">
              복사 실패
            </CopyFeedback>
          ) : null}
          <CopyButton type="button" onClick={() => void handleCopy()}>
            복사
          </CopyButton>
          {onRegenerate ? (
            <RegenerateButton type="button" onClick={onRegenerate}>
              다시 생성
            </RegenerateButton>
          ) : null}
          {onReset ? (
            <ResetButton type="button" onClick={onReset}>
              새 프롬프트
            </ResetButton>
          ) : null}
        </CopyActions>
      </ResultHeader>
      <MarkdownBody>
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </MarkdownBody>
    </>
  );
}

const ResultHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  flex-wrap: wrap;
`;

const ResultTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.text};
`;

const CopyActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

const CopyFeedback = styled.span<{ $tone: "ok" | "err" }>`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme, $tone }) =>
    $tone === "ok" ? theme.color.success : theme.color.danger};
`;

const CopyButton = styled.button`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.text};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.color.borderStrong};
  }
`;

const ResetButton = styled.button`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.textMuted};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.color.borderStrong};
    color: ${({ theme }) => theme.color.text};
  }
`;

const RegenerateButton = styled.button`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
  background: ${({ theme }) => theme.color.primary};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.color.primaryHover};
  }
`;

const MarkdownBody = styled.div`
  margin: 0;
  padding: ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.color.codeBorder};
  background: ${({ theme }) => theme.color.codeBg};
  color: ${({ theme }) => theme.color.codeText};
  font-family: ${({ theme }) => theme.font.sans};
  font-size: 14px;
  line-height: 1.6;
  max-height: min(70vh, 520px);
  overflow: auto;
  word-break: break-word;

  h1,
  h2,
  h3,
  h4 {
    margin: 1.25em 0 0.5em;
    font-weight: 600;
    color: ${({ theme }) => theme.color.codeText};
    letter-spacing: -0.02em;
  }

  h1:first-child,
  h2:first-child,
  h3:first-child,
  h4:first-child {
    margin-top: 0;
  }

  h1 {
    font-size: 1.35rem;
  }
  h2 {
    font-size: 1.2rem;
  }
  h3 {
    font-size: 1.05rem;
  }
  h4 {
    font-size: 1rem;
  }

  p {
    margin: 0 0 1em;
  }

  p:last-child {
    margin-bottom: 0;
  }

  ul,
  ol {
    margin: 0 0 1em;
    padding-left: 1.35em;
  }

  li {
    margin: 0.25em 0;
  }

  a {
    color: ${({ theme }) => theme.color.primary};
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  strong {
    font-weight: 600;
    color: ${({ theme }) => theme.color.codeText};
  }

  code {
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 0.9em;
    padding: 0.15em 0.4em;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: rgba(255, 255, 255, 0.08);
  }

  pre {
    margin: 0 0 1em;
    padding: ${({ theme }) => theme.space.md};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid ${({ theme }) => theme.color.codeBorder};
    overflow: auto;
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 13px;
    line-height: 1.55;
  }

  pre code {
    padding: 0;
    background: transparent;
    font-size: inherit;
  }

  blockquote {
    margin: 0 0 1em;
    padding-left: 1em;
    border-left: 3px solid ${({ theme }) => theme.color.codeMuted};
    color: ${({ theme }) => theme.color.codeMuted};
  }

  hr {
    border: none;
    border-top: 1px solid ${({ theme }) => theme.color.codeBorder};
    margin: 1.5em 0;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 0 0 1em;
    font-size: 13px;
  }

  th,
  td {
    border: 1px solid ${({ theme }) => theme.color.codeBorder};
    padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
    text-align: left;
  }
`;
