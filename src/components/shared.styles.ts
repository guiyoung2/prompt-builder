import styled, { keyframes } from "styled-components";

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

// 스피너 + 텍스트를 가로로 배치하는 로딩 행
export const LoadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
`;

// 회전 스피너 아이콘
export const Spinner = styled.span`
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid ${({ theme }) => theme.color.border};
  border-top-color: ${({ theme }) => theme.color.primary};
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
  flex-shrink: 0;
`;

export const LoadingText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 14px;
`;

export const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.danger};
  font-size: 14px;
  line-height: 1.5;
`;

// 재시도 버튼 오른쪽 정렬 래퍼
export const RetryFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.space.sm};
`;
