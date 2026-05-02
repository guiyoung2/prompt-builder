import { useId, useMemo, useState } from "react";
import styled from "styled-components";
import type {
  MultiChoiceQuestion,
  SingleChoiceQuestion,
} from "../types/question";

// 단일/다중 선택 + "기타(직접 입력)"을 한 컴포넌트에서 처리.
// 답변 표현 방식 (PLAN 결정: 옵션 B):
//   - 미리 정의된 choice 선택 시  → choice.id 그대로 저장
//   - "기타" 직접 입력 시          → 입력한 자유 텍스트가 그대로 저장
//   - multi의 "기타"는 1슬롯으로 한정 (배열 안에 choice id가 아닌 항목은 최대 1개)

interface SingleProps {
  question: SingleChoiceQuestion;
  value: string;
  onChange: (value: string) => void;
}

interface MultiProps {
  question: MultiChoiceQuestion;
  value: string[];
  onChange: (value: string[]) => void;
}

export function SingleChoice({ question, value, onChange }: SingleProps) {
  const choiceIds = useMemo(
    () => new Set(question.choices.map((c) => c.id)),
    [question.choices],
  );
  // 외부 value가 choice id가 아니면 = 자유 텍스트가 들어있는 상태
  const isExternallyCustom = value !== "" && !choiceIds.has(value);
  // "기타" 라디오를 켰지만 아직 안 적은 상태(value === "")까지 커버하기 위한 내부 플래그
  const [customForced, setCustomForced] = useState(false);
  const showCustom = isExternallyCustom || customForced;
  const customText = isExternallyCustom ? value : "";

  const groupName = useId();

  return (
    <ChoiceList role="radiogroup">
      {question.choices.map((c) => {
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
          </ChoiceItem>
        );
      })}
      {question.allowCustom ? (
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

export function MultiChoice({ question, value, onChange }: MultiProps) {
  const choiceIds = useMemo(
    () => new Set(question.choices.map((c) => c.id)),
    [question.choices],
  );
  // 배열 안에서 choice id가 아닌 첫 항목 = 자유 텍스트 슬롯
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
      {question.choices.map((c) => {
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
          </ChoiceItem>
        );
      })}
      {question.allowCustom ? (
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
  gap: ${({ theme }) => theme.space.sm};
`;

const ChoiceItem = styled.label<{ $selected: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.md} ${({ theme }) => theme.space.lg};
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected ? theme.color.primary : theme.color.border};
  background: ${({ theme, $selected }) =>
    $selected ? theme.color.primarySoft : theme.color.surface};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    border-color: ${({ theme, $selected }) =>
      $selected ? theme.color.primary : theme.color.borderStrong};
  }

  input {
    margin-top: 2px;
    accent-color: ${({ theme }) => theme.color.primary};
    cursor: pointer;
  }
`;

const ChoiceText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ChoiceLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.text};
`;

const ChoiceDesc = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.color.textMuted};
`;

const CustomRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;

const CustomInput = styled.input`
  margin-left: ${({ theme }) => theme.space.xl};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.color.surface};
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s ease;

  &:focus {
    border-color: ${({ theme }) => theme.color.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.color.textSubtle};
  }
`;
