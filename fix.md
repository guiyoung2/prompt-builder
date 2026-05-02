# Fix Plan — Prompt Builder 개선 작업

> 목적: Claude Code에게 전달할 프롬프트를 생성하는 앱. 결과물이 Claude Code 기준으로 유용해야 한다.
> 작업 순서: P0 → P1 → P2. 한 번에 한 항목씩 요청.

---

## 진행 요약

| 단계 | 항목                                        | 상태 |
| ---- | ------------------------------------------- | ---- |
| P0-1 | system prompt 출력 형식 명시                | [x]  |
| P0-2 | priority를 system prompt에 실제 반영        | [x]  |
| P1-1 | `"classifying"` 죽은 상태 제거              | [x]  |
| P1-2 | 분류기 오탐 키워드 수정                     | [x]  |
| P1-3 | Enter 키 제출 지원 (Cmd+Enter / Ctrl+Enter) | [x]  |
| P1-4 | StepForm에서 API 호출 로직을 훅으로 분리    | [x]  |
| P1-5 | Choice `as` 캐스팅 제거                     | [x]  |
| P2-1 | 결과 화면에 "다시 생성" 버튼 추가           | [x]  |
| P2-2 | Gemini API 호출 timeout 추가                | [x]  |

---

## P0 — 핵심 동작 품질 (프롬프트 생성 결과에 직접 영향)

### P0-1. system prompt 출력 형식 명시

**파일**: `src/features/builder/buildPrompt.ts`

**현재 문제**:
`ROLE_INTRO` 지시문이 "요구사항·가정·제약·다음 액션을 명확히 구분하세요"라고만 되어 있어 Gemini가 세션마다 다른 구조로 출력한다. 프롬프트 빌더인데 출력 형식이 들쭉날쭉하면 Claude Code에게 붙여넣었을 때 일관성이 없다.

**수정 내용**:
`ROLE_INTRO` 문자열을 아래 내용으로 교체한다. 목표는 Gemini가 항상 동일한 섹션 구조로, Claude Code가 바로 쓸 수 있는 형식의 프롬프트를 출력하게 만드는 것이다.

```
당신은 사용자의 모호한 개발 요청과 아래 맥락(카테고리·스텝 폼 답변)을 바탕으로,
Claude Code(AI 코딩 CLI)에게 전달할 구조화된 프롬프트를 작성합니다.

[출력 규칙 — 반드시 준수]
1. 아래 섹션 순서와 헤더를 그대로 사용할 것 (헤더 이름 변경 금지):
   ## 목표
   ## 기술 환경
   ## 요구사항
   ## 제약 및 가정
   ## 완료 기준
   ## 스코프 외 (하지 말 것)
2. 각 섹션은 간결한 불릿(-)으로 작성. 서술형 문장 최소화.
3. "## 목표" 첫 줄은 동사로 시작하는 한 문장 (예: "React로 히어로 섹션 컴포넌트를 신규 구현한다.").
4. "## 완료 기준"은 검증 가능한 조건만 (예: "빌드 에러 없음", "모바일 375px에서 레이아웃 깨지지 않음").
5. "## 스코프 외"는 Claude Code가 하지 말아야 할 것을 명시 (예: "테스트 코드 작성 금지", "기존 컴포넌트 리팩터링 금지").
6. 출력 전체를 마크다운으로 작성. 제목(#) 사용 금지 — 섹션 헤더(##)부터 시작.
```

**검증**: `npm run build` 통과. 실제로 앱을 실행해 프론트엔드 질문 흐름을 완료했을 때 생성된 결과가 위 6개 섹션(##) 구조를 포함하는지 확인.

---

### P0-2. priority를 system prompt에 실제 반영

**파일**: `src/features/builder/buildPrompt.ts`

**현재 문제**:
`common.ts`의 `priority` 질문이 "최종 프롬프트의 톤(긴급도, 꼼꼼함)에 영향을 줍니다"라고 설명하지만, `buildSystemPrompt`는 단순히 답변을 나열만 한다. 사용자가 "긴급"을 선택해도 생성 결과가 달라지지 않는다.

**수정 내용**:
`buildSystemPrompt` 함수 내에서 `answers["priority"]` 값을 읽어, 섹션 나열 이후 마지막에 톤 지시문을 조건부로 추가한다.

```
priority === "high"  → "⚠️ 긴급 작업: 설명 최소화, 코드와 완료 기준 위주로 작성."
priority === "normal" → (추가 지시 없음)
priority === "low"  → "여유 작업: 접근 방법의 트레이드오프와 대안을 간략히 포함."
```

위 문자열은 생성된 system instruction 텍스트 마지막에 빈 줄 하나 후 추가한다.

**검증**: `npm run build` 통과. "긴급"과 "낮음"을 각각 선택했을 때 생성 결과의 톤이 다른지 확인.

---

## P1 — 코드 품질 개선

### P1-1. `"classifying"` 죽은 상태 제거

**파일**: `src/store/promptStore.ts`

**현재 문제**:
`Status` 타입에 `"classifying"`이 있지만 코드베이스 어디서도 `setStatus("classifying")`을 호출하지 않는다. 존재하지 않는 상태가 타입에 있으면 미래 작업자가 혼란을 겪는다.

**수정 내용**:
`Status` 타입의 `"classifying"` 유니언 멤버를 제거한다. 다른 코드 변경은 없다.

**검증**: `npm run build` 통과 (TypeScript가 사용처 없음을 이미 검증하므로 컴파일 에러 없을 것).

---

### P1-2. 분류기 오탐 키워드 수정

**파일**: `src/templates/intent-rules.ts`

**현재 문제**:

- `bugfix` 키워드에 `"수정해"`, `"고쳐"` 포함 → "네비게이션 수정해줘", "스타일 고쳐줘" 등이 bugfix로 잘못 분류됨
- `backend` 키워드에 `"인증"`, `"로그인"`, `"회원가입"` 포함 → UI 맥락의 "로그인 폼 만들어줘"가 backend로 잘못 분류됨
- `" db "` (앞뒤 공백 포함) → "DB 작업"처럼 붙여쓰면 매칭 실패

**수정 내용**:

1. `bugfix` 키워드에서 `"수정해"`, `"고쳐"` 제거 (이미 `"버그"`, `"에러"`, `"오류"`, `"broken"`, `"fix"` 등 명확한 키워드가 충분함)
2. `backend` 키워드에서 `"인증"`, `"로그인"`, `"회원가입"` 제거. 대신 더 명확한 `"인증 api"`, `"로그인 api"`, `"auth api"` 등 복합 토큰을 추가 — 단 이미 키워드가 너무 늘어나지 않도록 판단해서 최소한으로.
3. `" db "` → `"db"` 로 교체 (공백 없이). 단, 오탐 위험이 있으면 `" db"`, `"db "` 두 개로 분리.

**검증**:
`npm run dev`로 브라우저 콘솔에서 self-check 결과 확인. 기존 10개 케이스가 모두 PASS인지 확인.
추가로 다음 케이스들이 올바른 카테고리로 분류되는지 콘솔에서 직접 `classifyIntent("...")` 결과 확인:

- `"네비게이션 수정해줘"` → frontend
- `"스타일 고쳐줘"` → frontend
- `"로그인 폼 만들어줘"` → frontend
- `"로그인 API 엔드포인트 만들어줘"` → backend

---

### P1-3. Enter 키 제출 지원

**파일**: `src/App.tsx` (`IntentInput` 함수)

**현재 문제**:
초기 textarea에서 `Cmd+Enter`(Mac) / `Ctrl+Enter`(Windows)를 눌러도 제출이 안 된다. 키보드 사용자에게 불필요한 마찰이다.

**수정 내용**:
`Textarea` 컴포넌트에 `onKeyDown` 핸들러를 추가한다.
조건: `(e.metaKey || e.ctrlKey) && e.key === "Enter"` 이고 `canSubmit`이 true일 때 `handleStart()` 호출.
`e.preventDefault()`로 기본 동작(줄바꿈 삽입) 방지.

새 함수나 훅을 만들지 말고 `IntentInput` 내부에 인라인으로 처리한다.

**검증**: `npm run dev` 후 textarea에 텍스트 입력 → `Ctrl+Enter` / `Cmd+Enter` 제출 확인. 텍스트 없을 때는 동작하지 않는지 확인.

---

### P1-4. StepForm에서 API 호출 로직을 훅으로 분리

**파일**: `src/features/questions/StepForm.tsx` (수정), `src/features/questions/usePromptGeneration.ts` (신규)

**현재 문제**:
`StepForm.tsx`가 376줄로 본인 규칙("50~80줄 이상 분리 고려") 위반. 특히 `useEffect` 기반 Gemini 호출 로직(약 40줄)이 렌더링 로직과 섞여 있어 읽기 어렵다.

**수정 내용**:
`src/features/questions/usePromptGeneration.ts` 파일을 새로 만들어 아래 로직만 담는다:

- `genSeqRef`
- `useEffect` (currentStep >= total, status === "answering" 감지 → generating → done/error)
- store에서 필요한 값 구독 (`category`, `currentStep`, `answers`, `originalInput`, `status`)
- 반환값 없음 (부수 효과만 있는 훅)

`StepForm.tsx`에서는 해당 `useEffect` 블록과 관련 import를 제거하고 `usePromptGeneration()`을 호출하는 한 줄로 교체한다.
styled components, 렌더링 로직, `QuestionInput`, `hasAnswer`는 그대로 유지.

**검증**: `npm run build` 통과. 동작 변경 없음 — 질문 완료 후 Gemini 호출 → 결과 표시 흐름이 동일하게 작동.

---

### P1-5. Choice `as` 캐스팅 제거

**파일**: `src/components/Choice.tsx`, `src/features/questions/StepForm.tsx`

**현재 문제**:
`Choice.tsx:34`, `Choice.tsx:40`에 `as string`, `as (v: string) => void` 캐스팅이 있다. `Choice` 컴포넌트가 `SingleProps | MultiProps` union을 받고 내부에서 `question.type`으로 좁히지만, TypeScript가 `props.value`와 `props.onChange`를 좁히지 못해 캐스팅이 필요해진 구조다.

**수정 내용**:
`Choice` 컴포넌트의 public API를 제거하고, `StepForm.tsx`의 `QuestionInput`에서 `question.type === "single"`일 때 `SingleChoice`를, `"multi"`일 때 `MultiChoice`를 직접 import해서 호출한다.

구체적으로:

1. `Choice.tsx`에서 `export function Choice(...)` 래퍼 함수와 `ChoiceProps` 타입을 제거한다.
2. `SingleChoice`, `MultiChoice` 함수를 `export`로 변경한다.
3. `StepForm.tsx`의 `QuestionInput`에서 `Choice` import를 제거하고 `SingleChoice`, `MultiChoice`를 직접 import해서 `question.type`으로 분기한다.

**검증**: `npm run build` 통과. 선택지 UI 동작(단일/다중 선택, 기타 입력) 변화 없음.

---

## P2 — 편의 기능

### P2-1. 결과 화면에 "다시 생성" 버튼 추가

**파일**: `src/features/output/PromptResult.tsx`, `src/features/questions/StepForm.tsx`

**현재 문제**:
생성 결과가 마음에 들지 않아도 같은 답변으로 재시도할 방법이 없다. 처음으로 돌아가면 모든 답변을 다시 입력해야 한다.

**수정 내용**:
`PromptResult` 컴포넌트에 `onRegenerate?: () => void` prop을 추가한다.
버튼을 "복사" 버튼 옆에 배치하고 라벨은 "다시 생성".
`StepForm.tsx`에서 `PromptResult`를 렌더할 때 `onRegenerate={() => setStatus("answering")}` 을 전달한다.
(status를 "answering"으로 바꾸면 기존 retry 로직과 동일하게 usePromptGeneration 훅이 재실행된다.)

새 상태/훅 추가 없이 기존 retry 흐름을 재사용할 것.

**검증**: `npm run build` 통과. 결과 화면에서 "다시 생성" 클릭 → 로딩 스피너 → 새 결과 표시.

- 검증: 빌드/lint 통과 ✓

---

### P2-2. Gemini API 호출 timeout 추가

**파일**: `api/generate.ts`

**현재 문제**:
서버에서 Gemini를 `fetch`로 호출할 때 timeout이 없다. Gemini 응답이 느리거나 hanging 상태가 되면 Vercel 함수가 기본 제한(10초)까지 대기하다가 504를 반환한다. 명시적 timeout이 있으면 에러 메시지가 명확해진다.

**수정 내용**:
`fetch` 호출에 `AbortController` + `setTimeout`으로 8000ms timeout을 추가한다.
timeout 발생 시 `res.status(504).json({ error: "Gemini 응답 시간 초과 (8초)" })` 반환.

```ts
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 8000);
try {
  geminiRes = await fetch(url, { ..., signal: controller.signal });
} finally {
  clearTimeout(timeoutId);
}
```

**검증**: `npm run build` 통과. (실제 timeout 테스트는 네트워크 차단 환경에서만 가능하므로 코드 리뷰로 대체.)

- 검증: 빌드/lint 통과 ✓

---

## 작업 완료 후 최종 확인

- [ ] `npm run build` 전체 통과 (0 TypeScript 에러, 0 Vite 에러)
- [ ] `npm run lint` 전체 통과
- [ ] 실제 앱 실행 후 프론트엔드 전체 플로우 (입력 → 분류 → 8문답 → 생성 → 복사) 동작 확인
- [ ] 생성된 프롬프트가 `## 목표` ~ `## 스코프 외` 6개 섹션을 포함하는지 확인

---

## V2 — 2-call 동적 질문 아키텍처 (2026-05-02~)

> **배경 및 문제의식**
> 정적 템플릿(카테고리별 고정 8문항) 방식의 한계가 확인됨.
> - 사용자가 이미 입력에서 언급한 기술을 다시 물어봄 (예: Supabase 명시 → DB 질문 또 나옴)
> - 요청과 무관한 항목이 결과에 포함됨 (예: 정적 히어로 섹션에 TanStack Query 요구사항 삽입)
> - 모든 카테고리가 동일 8문항 구조 → 맥락 없는 질문이 최종 프롬프트 품질을 낮춤
>
> **방향**
> Gemini를 두 번 호출하는 방식으로 전환. Call 1에서 사용자 입력을 읽고 맥락에 맞는
> 질문을 동적으로 생성, Call 2에서 원래 입력 + 답변 기반으로 구조화 프롬프트 생성.
> 정적 템플릿·분류기·카테고리 전체를 삭제하고 완전 교체.

### 핵심 결정

- **2-call 방식**: Call 1(질문 생성 JSON) → Call 2(프롬프트 생성 markdown). 기존 `/api/generate` 엔드포인트 재사용 (systemInstruction만 교체).
- **동적 질문 형태**: Gemini가 질문 본문 + 선택지(choices)까지 JSON으로 생성. 선택지가 있는 경우 현재와 동일한 클릭 UX 유지. 자유 텍스트는 `type: "text"`.
- **정적 템플릿 완전 교체**: 하이브리드(분기) 없음. `src/templates/` 전체, 분류기, CategoryHeader 삭제.
- **status 추가**: `"analyzing"` (Call 1 진행 중 스피너).
- **6섹션 출력 형식 유지**: Call 2의 시스템 프롬프트(현재 `ROLE_INTRO` + 출력 규칙)는 그대로.

### 삭제 대상 파일

| 파일 / 디렉토리 | 이유 |
|----------------|------|
| `src/templates/` 전체 | 정적 질문 템플릿 불필요 |
| `src/features/intent/classifyIntent.ts` | 카테고리 분류 불필요 |
| `src/features/intent/CategoryHeader.tsx` | 카테고리 UI 불필요 |
| `src/types/category.ts` | Category 타입 불필요 |

### 유지 대상 (변경 없음)

- `api/generate.ts` — 엔드포인트 구조 그대로. systemInstruction만 call별로 다르게 전달.
- `src/features/output/PromptResult.tsx` — 결과 화면 동일.
- `src/features/builder/buildPrompt.ts` — 6섹션 규칙 유지, 입력 시그니처만 수정.
- `src/styles/` 전체 — 테마 변경 없음.

---

### 단계별 계획

| 단계  | 항목                                              | 상태 |
|-------|---------------------------------------------------|------|
| V2-1  | 타입 정의 — `DynamicQuestion` + store 업데이트     | [x]  |
| V2-2  | Call 1 로직 — 질문 생성 시스템 프롬프트 + JSON 파싱 | [x]  |
| V2-3  | 입력 → `analyzing` 로딩 → 동적 질문 표시 흐름     | [x]  |
  - 검증: 빌드/lint 통과 ✓. analyzing 스피너 분기, handleStart → setStatus("analyzing") 전환. 질문 화면은 V2-4 완성 후 확인 가능.
| V2-4  | 동적 질문 렌더러 (선택지 / 자유 텍스트)            | [x]  |
| V2-5  | Call 2 — `buildPrompt.ts` 수정 (동적 Q&A 기반)    | [x]  |
| V2-6  | 정적 템플릿·분류기·CategoryHeader 삭제 + 정리     | [ ]  |
| V2-7  | 빌드/lint/E2E 검증                                | [ ]  |

---

### V2-1. 타입 정의 + store 업데이트

**신규 타입** (`src/types/question.ts` 하단에 추가 또는 별도 `src/types/dynamicQuestion.ts`):

```ts
interface DynamicChoice {
  id: string;
  label: string;
}

interface DynamicQuestion {
  id: string;       // Gemini가 "q1", "q2"... 형태로 생성
  text: string;     // 질문 본문
  type: "single" | "multi" | "text";
  choices?: DynamicChoice[];  // type === "text"면 없음
  required?: boolean;
}
```

**store 변경** (`src/store/promptStore.ts`):
- `category: Category | null` → 삭제
- `dynamicQuestions: DynamicQuestion[]` → 추가 (기본값 `[]`)
- `status` 유니언에 `"analyzing"` 추가
- `setCategory` 액션 → 삭제
- `setDynamicQuestions(questions: DynamicQuestion[])` 액션 → 추가
- `goNext` / `goPrev` / `currentStep` → 유지 (스텝 진행 로직 동일)

**검증**: `npm run build` 통과. 타입 에러 없음.

---

### V2-2. Call 1 — 질문 생성 로직

**파일**: `src/features/questions/useQuestionGeneration.ts` (신규)

Call 1 전용 시스템 프롬프트:

```
당신은 시니어 풀스택 개발자입니다.
사용자의 개발 요청을 읽고, 구현에 필요하지만 아직 결정되지 않은 사항을 3~5개 질문으로 추출하세요.

[규칙]
1. 사용자가 이미 명시한 기술·요구사항은 절대 다시 묻지 말 것.
2. 구현 방향에 실제 영향을 미치는 미결정 사항만 질문할 것.
3. 가능하면 choices를 제공할 것 (자유 입력보다 선택이 편하도록). 정해진 선택지가 없을 때만 type "text".
4. 아래 JSON 형식만 반환. 마크다운 코드 블록(```) 없이 순수 JSON.

{
  "questions": [
    { "id": "q1", "text": "...", "type": "single", "choices": [{ "id": "c1", "label": "..." }] },
    { "id": "q2", "text": "...", "type": "text", "choices": null }
  ]
}
```

`generateViaProxy`를 이 시스템 프롬프트로 호출 → 응답 text를 `JSON.parse()`.

**JSON 파싱 실패 폴백**: 파싱 실패 시 `status → "error"`, 메시지 "질문 생성에 실패했습니다. 다시 시도해주세요."

**검증**: 실제 입력("로그인 페이지 구현해줘 supabase, 구글 로그인") 시 콘솔에 파싱된 질문 배열 확인.

---

### V2-3. 입력 → analyzing → 질문 표시 흐름

**파일**: `src/App.tsx` 수정

현재 `handleStart()`:
```
classifyIntent(input) → setCategory → setStatus("answering")
```

변경 후:
```
setOriginalInput(input) → setStatus("analyzing")
→ (useQuestionGeneration 훅이 감지) → Call 1 → setDynamicQuestions → setStatus("answering")
```

"analyzing" 상태 UI: 현재 "generating" 스피너와 동일 컴포넌트 재사용, 텍스트만 "질문을 구성하는 중...".

**검증**: 입력 제출 후 스피너 → 질문 화면 전환 확인.

---

### V2-4. 동적 질문 렌더러

**파일**: `src/features/questions/StepForm.tsx` 수정

`QUESTIONS_BY_CATEGORY[category]` 대신 `store.dynamicQuestions`를 사용.
`QuestionInput` 내부의 `single | multi | text` 분기 로직은 그대로 — `DynamicQuestion`이 기존 `Question`과 동일 필드(`type`, `choices`) 사용하므로 변경 최소화.

`CategoryHeader` 제거. 진행률 표시(`1 / N`)는 `dynamicQuestions.length` 기준.

**검증**: 동적으로 생성된 3~5개 질문이 스텝 형태로 렌더되고, 선택/입력 후 store에 저장되는지 확인.

- 검증: 빌드/lint 통과 ✓. DynamicQuestion.text → 헤더 렌더, 어댑터로 Choice/TextInput 재사용. usePromptGeneration도 dynamicQuestions.length 기반으로 변경.

---

### V2-5. buildPrompt.ts 시그니처 수정

**파일**: `src/features/builder/buildPrompt.ts`

현재 시그니처:
```ts
buildSystemPrompt({ originalInput, category, answers, questions })
```

변경 후:
```ts
buildSystemPrompt({ originalInput, dynamicQuestions, answers })
```

`category` 관련 출력 제거. 질문-답변 나열 로직은 동일 (`dynamicQuestions` 배열 순회).
6섹션 출력 규칙(`ROLE_INTRO`)은 변경 없음.

**검증**: `npm run build` 통과. 생성 결과가 6섹션 구조를 유지하는지 확인.

- 검증: 빌드/lint 통과 ✓. `category` 섹션 제거, `dynamicQuestions` 순회로 교체. `usePromptGeneration` 내 category 의존도 제거.

---

### V2-6. 삭제 + 정리

삭제:
- `src/templates/` 디렉토리 전체
- `src/features/intent/classifyIntent.ts`
- `src/features/intent/CategoryHeader.tsx`
- `src/types/category.ts`
- `src/features/intent/` 디렉토리가 비면 삭제

정리:
- `main.tsx`에서 `runClassifierSelfCheck()` 호출 제거
- store import에서 `Category` 관련 제거
- `App.tsx`에서 `CategoryHeader`, `classifyIntent` import 제거

**검증**: `npm run build` + `npm run lint` 0 에러.

---

### V2-7. 최종 검증

- [ ] `npm run build` 0 에러
- [ ] `npm run lint` 0 에러
- [ ] 전체 플로우: 입력 → analyzing → 동적 질문 3~5개 → 답변 → generating → 6섹션 결과 → 복사
- [ ] "다시 생성" 버튼 정상 동작 (Call 2 재실행)
- [ ] 이미 언급한 기술이 질문에 다시 나오지 않는지 확인 (예: "supabase 사용할거야" → DB 질문 없어야 함)
