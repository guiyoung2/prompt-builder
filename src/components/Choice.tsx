import { useId, useMemo, useState } from "react";
import styled from "styled-components";

// 단일/다중 선택 + "기타(직접 입력)"을 한 컴포넌트에서 처리.
// 답변 표현 방식:
//   - 미리 정의된 choice 선택 시  → choice.id 그대로 저장
//   - "기타" 직접 입력 시          → 입력한 자유 텍스트가 그대로 저장
//   - multi의 "기타"는 1슬롯으로 한정 (배열 안에 choice id가 아닌 항목은 최대 1개)

interface ChoiceOption {
  id: string;
  label: string;
  description?: string;
}

interface SingleProps {
  choices: ChoiceOption[];
  allowCustom?: boolean;
  value: string;
  onChange: (value: string) => void;
}

interface MultiProps {
  choices: ChoiceOption[];
  allowCustom?: boolean;
  value: string[];
  onChange: (value: string[]) => void;
}

export function SingleChoice({ choices, allowCustom, value, onChange }: SingleProps) {
  const choiceIds = useMemo(
    () => new Set(choices.map((c) => c.id)),
    [choices],
  );
  const isExternallyCustom = value !== "" && !choiceIds.has(value);
  const [customForced, setCustomForced] = useState(false);
  const showCustom = isExternallyCustom || customForced;
  const customText = isExternallyCustom ? value : "";

  const groupName = useId();

  return (
    <ChoiceList role="radiogroup">
      {choices.map((c) => {
        const selected = value === c.id;
        return (
          <ChoiceItem key={c.id} $selected={selected}>
            <input
              type="radio"
              name={groupName}
              checked={selected}
              onChange={() => {
                setCustomForced(false);
                onChange(c.id);
              }}
            />
            <ChoiceText>
              <ChoiceLabel>{c.label}</ChoiceLabel>
              {c.description ? <ChoiceDesc>{c.description}</ChoiceDesc> : null}
            </ChoiceText>
            {selected && <CheckMark aria-hidden="true">✓</CheckMark>}
          </ChoiceItem>
        );
      })}
      {allowCustom ? (
        <CustomRow>
          <ChoiceItem $selected={showCustom}>
            <input
              type="radio"
              name={groupName}
              checked={showCustom}
              onChange={() => {
                setCustomForced(true);
                onChange(customText);
              }}
            />
            <ChoiceText>
              <ChoiceLabel>기타 (직접 입력)</ChoiceLabel>
            </ChoiceText>
            {showCustom && <CheckMark aria-hidden="true">✓</CheckMark>}
          </ChoiceItem>
          {showCustom ? (
            <CustomInput
              type="text"
              value={customText}
              placeholder="직접 입력하세요"
              onChange={(e) => onChange(e.target.value)}
            />
          ) : null}
        </CustomRow>
      ) : null}
    </ChoiceList>
  );
}

export function MultiChoice({ choices, allowCustom, value, onChange }: MultiProps) {
  const choiceIds = useMemo(
    () => new Set(choices.map((c) => c.id)),
    [choices],
  );
  const customText = useMemo(
    () => value.find((v) => !choiceIds.has(v)) ?? "",
    [value, choiceIds],
  );
  const [customForced, setCustomForced] = useState(false);
  const showCustom = customText !== "" || customForced;

  const toggleChoice = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const toggleCustom = () => {
    if (showCustom) {
      setCustomForced(false);
      onChange(value.filter((v) => choiceIds.has(v)));
    } else {
      setCustomForced(true);
    }
  };

  const updateCustomText = (text: string) => {
    const onlyChoices = value.filter((v) => choiceIds.has(v));
    onChange(text ? [...onlyChoices, text] : onlyChoices);
  };

  return (
    <ChoiceList>
      {choices.map((c) => {
        const selected = value.includes(c.id);
        return (
          <ChoiceItem key={c.id} $selected={selected}>
            <input
              type="checkbox"
              checked={selected}
              onChange={() => toggleChoice(c.id)}
            />
            <ChoiceText>
              <ChoiceLabel>{c.label}</ChoiceLabel>
              {c.description ? <ChoiceDesc>{c.description}</ChoiceDesc> : null}
            </ChoiceText>
            {selected && <CheckMark aria-hidden="true">✓</CheckMark>}
          </ChoiceItem>
        );
      })}
      {allowCustom ? (
        <CustomRow>
          <ChoiceItem $selected={showCustom}>
            <input
              type="checkbox"
              checked={showCustom}
              onChange={toggleCustom}
            />
            <ChoiceText>
              <ChoiceLabel>기타 (직접 입력)</ChoiceLabel>
            </ChoiceText>
            {showCustom && <CheckMark aria-hidden="true">✓</CheckMark>}
          </ChoiceItem>
          {showCustom ? (
            <CustomInput
              type="text"
              value={customText}
              placeholder="직접 입력하세요"
              onChange={(e) => updateCustomText(e.target.value)}
            />
          ) : null}
        </CustomRow>
      ) : null}
    </ChoiceList>
  );
}

const ChoiceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};

  @media (max-width: 600px) {
    gap: ${({ theme }) => theme.space.sm};
  }
`;

const ChoiceItem = styled.label<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  padding: 14px 18px;
  border: ${({ $selected }) => ($selected ? "2px" : "1.5px")} solid
    ${({ theme, $selected }) =>
      $selected ? theme.color.primary : theme.color.border};
  background: ${({ theme, $selected }) =>
    $selected ? theme.color.primarySoft : theme.color.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;
  box-shadow: ${({ $selected }) =>
    $selected ? "0 0 0 1px rgba(59, 130, 246, 0.3)" : "none"};

  &:hover {
    border-color: ${({ theme, $selected }) =>
      $selected ? theme.color.primary : theme.color.borderStrong};
    background: ${({ theme, $selected }) =>
      $selected ? theme.color.primarySoft : theme.color.surfaceHover};
  }

  /* input 시각적으로 숨기되 접근성 유지 */
  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  @media (max-width: 600px) {
    padding: 12px 14px;
  }
`;

const ChoiceText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

const ChoiceLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.text};
`;

const ChoiceDesc = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.color.textMuted};
`;

// 선택 체크 표시 (카드 우측)
const CheckMark = styled.span`
  margin-left: auto;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.primary};
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CustomRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;

const CustomInput = styled.input`
  margin-top: 0;
  padding: 10px 14px;
  border: 1.5px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
  font-size: 14px;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus {
    border-color: ${({ theme }) => theme.color.primary};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }

  &::placeholder {
    color: ${({ theme }) => theme.color.textSubtle};
  }
`;
