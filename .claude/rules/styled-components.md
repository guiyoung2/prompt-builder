# styled-components 규칙

## 위치와 네이밍

- 스타일은 컴포넌트 파일 **하단** 또는 같은 폴더의 `*.styles.ts`에 분리.
- styled 컴포넌트는 의미 기반 이름. `Wrapper`, `Container` 남발 금지.

```tsx
// ✅ GOOD — 의미 기반
const ChoiceList = styled.ul`...`;
const ChoiceItem = styled.li<{ $selected: boolean }>`...`;

// ❌ BAD
const Div1 = styled.div`...`;
const StyledDiv = styled.div`...`;
```

## Transient props (`$` 접두사) 필수

DOM에 전달되면 안 되는 prop은 반드시 `$`로 시작:

```tsx
// ❌ BAD — selected가 <li> DOM에 그대로 전달되어 경고
const Item = styled.li<{ selected: boolean }>``;

// ✅ GOOD
const Item = styled.li<{ $selected: boolean }>`
  background: ${({ $selected, theme }) => $selected ? theme.colors.primary : "transparent"};
`;
```

## theme 사용

- 색상/간격/폰트는 직접 박지 말고 항상 `theme`에서 가져오기.
- theme 정의는 `src/styles/theme.ts`, 타입은 `styled.d.ts`에 모듈 확장으로 선언.

```ts
// styled.d.ts
import "styled-components";
declare module "styled-components" {
  export interface DefaultTheme {
    colors: { primary: string; bg: string; text: string; };
    space: (n: number) => string;
  }
}
```

## 컴포넌트 내부 선언 금지

```tsx
// ❌ BAD — 매 렌더마다 새 컴포넌트 → 리마운트 + 성능 저하
function Card() {
  const Box = styled.div`padding: 16px;`;
  return <Box />;
}
```

반드시 컴포넌트 함수 **바깥**에서 선언.

## 글로벌 스타일

- `createGlobalStyle`은 앱 진입점(`App.tsx` 또는 `main.tsx`)에서 한 번만 마운트.
- 리셋 + 토큰 변수만. 컴포넌트별 스타일은 절대 글로벌에 두지 않기.
