import styled from "styled-components";
import { CATEGORY_META, CATEGORY_ORDER } from "../../templates/categories";
import { usePromptStore } from "../../store/promptStore";
import type { Category } from "../../types/category";

// 답변 화면 상단에 표시되는 카테고리 헤더.
// - 추정된 카테고리를 알리고, 4개 칩으로 즉시 변경 가능
// - "처음으로" 클릭 시 store 전체 초기화 (입력 화면으로 복귀)
// 분류가 잘못된 경우의 마찰을 1클릭으로 줄이는 게 목적.
export function CategoryHeader() {
  const category = usePromptStore((s) => s.category);
  const setCategory = usePromptStore((s) => s.setCategory);
  const reset = usePromptStore((s) => s.reset);

  if (!category) return null;

  const current = CATEGORY_META[category];

  return (
    <Wrap>
      <Top>
        <Estimate>
          이 작업은 <Strong>{current.label}</Strong>로 추정했어요
        </Estimate>
        <ResetButton type="button" onClick={reset}>
          처음으로
        </ResetButton>
      </Top>
      <Chips role="radiogroup" aria-label="카테고리 변경">
        {CATEGORY_ORDER.map((id) => (
          <Chip
            key={id}
            type="button"
            role="radio"
            aria-checked={id === category}
            $active={id === category}
            onClick={() => handleChange(id, category, setCategory)}
          >
            {CATEGORY_META[id].label}
          </Chip>
        ))}
      </Chips>
    </Wrap>
  );
}

// 동일 카테고리 재선택은 무의미하므로 가드 — 진행 단계가 불필요하게 0으로 리셋되는 걸 막는다.
function handleChange(
  next: Category,
  current: Category,
  setCategory: (c: Category) => void,
) {
  if (next === current) return;
  setCategory(next);
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
  background: ${({ theme }) => theme.color.surfaceMuted};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  margin-bottom: ${({ theme }) => theme.space.lg};
`;

const Top = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
`;

const Estimate = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.color.textMuted};
`;

const Strong = styled.strong`
  color: ${({ theme }) => theme.color.text};
  font-weight: 600;
`;

const ResetButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.color.textMuted};
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover {
    color: ${({ theme }) => theme.color.text};
  }
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space.xs};
`;

const Chip = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.color.primary : theme.color.border};
  background: ${({ theme, $active }) =>
    $active ? theme.color.primarySoft : theme.color.surface};
  color: ${({ theme, $active }) =>
    $active ? theme.color.primaryText : theme.color.text};

  &:hover {
    border-color: ${({ theme, $active }) =>
      $active ? theme.color.primary : theme.color.borderStrong};
  }
`;
