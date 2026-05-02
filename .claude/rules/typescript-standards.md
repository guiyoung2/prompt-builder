# TypeScript 표준

## 핵심 규칙

- `any` 금지. 정말 모르겠으면 `unknown` 후 좁히기.
- 변수 타입은 추론에 맡기고, **함수 시그니처(파라미터/반환)** 만 명시.
- 객체 형태는 `interface`, 유니언/유틸리티 조합은 `type`.
- 외부 입력(LLM 응답, JSON, localStorage)은 런타임 검증 후 사용.

## 예시

```ts
// ❌ BAD
const parseResponse = (data: any) => data.choices[0].text;

// ✅ GOOD
type GeminiResponse = { candidates: Array<{ content: { parts: { text: string }[] } }> };

const parseResponse = (data: unknown): string => {
  const res = data as GeminiResponse;
  const text = res.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini 응답이 비어있습니다");
  return text;
};
```

## 타입 정의 위치

- **공용 도메인 타입**: `src/types/`
- **컴포넌트 props**: 같은 파일에 `Props` 인터페이스로 선언
- **feature 내부 타입**: `features/<name>/<name>.types.ts`

## Discriminated Union 활용

상태 머신 형태(질문 단계, LLM 호출 결과 등)에는 반드시 사용:

```ts
type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };
```

`status`로 좁히면 `data` 접근 시 타입 안전.
