# Prompt Builder — Claude Code 가이드

모호한 사용자 요청을 전문성 있는 구조화 프롬프트로 변환하는 프론트엔드 프로젝트.

---

## 도메인 흐름

```
[사용자 입력 (모호한 요청)]
        ↓
[Call 1 — 동적 질문 생성]      ← Gemini: 입력을 분석해 3~5개 질문 생성
        ↓
[사용자 답변 수집]             ← 스텝 폼 (선택지 우선, 기타 직접 입력 지원)
        ↓
[Call 2 — 구조화된 프롬프트 생성]  ← Gemini: 답변 + 원문으로 최종 프롬프트 생성
        ↓
[최종 프롬프트 출력 + 복사 / 새 프롬프트]
```

**핵심 UX 원칙**: 자유 입력보다 멀티플 초이스 우선. 모든 선택 질문에 "기타 직접 입력"을 제공해 유연성 확보.

---

## 기술 스택

| 항목 | 버전 | 용도 |
|------|------|------|
| React | 19.2.5 | UI 렌더링 |
| TypeScript | 6.0.2 | 타입 안전성 |
| Vite | 8.0.10 | 빌드 도구 |
| Zustand | 5.0.12 | 전역 상태 관리 |
| styled-components | 6.4.1 | CSS-in-JS |
| react-markdown | 10.1.0 | 결과 마크다운 렌더 |
| @vercel/node | 5.7.15 | 서버리스 함수 (api/) |

**미도입 라이브러리**: TanStack Query 등은 요청 없이 도입하지 않는다.

---

## 폴더 구조

```
src/
  main.tsx                              # 진입점 — ThemeProvider, GlobalStyle 마운트
  App.tsx                               # Workflow(상태 분기) + IntentInput 컴포넌트

  api/
    geminiClient.ts                     # /api/generate 프록시 호출 (generateViaProxy)

  store/
    promptStore.ts                      # Zustand 전역 상태 + 액션 (devtools 포함)

  types/
    question.ts                         # DynamicQuestion, DynamicChoice, AnswerValue, AnswerMap

  features/
    questions/
      StepForm.tsx                      # 스텝별 질문 진행 + 완료 시 프롬프트 생성 트리거
      useQuestionGeneration.ts          # Call 1 — analyzing 감지 → 동적 질문 생성
      usePromptGeneration.ts            # Call 2 — 마지막 스텝 완료 감지 → 프롬프트 생성
    builder/
      buildPrompt.ts                    # 답변 + 질문 → Call 2용 systemInstruction 텍스트 조립
    output/
      PromptResult.tsx                  # 마크다운 렌더 + 복사 + 다시 생성 + 새 프롬프트

  components/
    Choice.tsx                          # 단일/다중 선택 (radio/checkbox + 기타 직접 입력)
    TextInput.tsx                       # 자유 텍스트 textarea

  styles/
    theme.ts                            # 라이트 테마 토큰 (color, radius, space, font, shadow)
    GlobalStyle.ts                      # 전역 스타일 (box-sizing, body, 포커스 링)
    styled.d.ts                         # DefaultTheme 타입 확장

api/
  generate.ts                           # Vercel 서버리스 함수 — Gemini REST 호출 프록시
```

---

## 전체 데이터 흐름 (상태 머신)

```
status: "idle"
  → 사용자가 IntentInput에 텍스트 입력 후 "시작하기"
  → store: setOriginalInput(input), setStatus("analyzing")

status: "analyzing"
  → useQuestionGeneration 훅이 감지
  → Call 1: generateViaProxy({ prompt: originalInput, systemInstruction: CALL1_SYSTEM_INSTRUCTION })
  → 응답 JSON 파싱 → DynamicQuestion[] 검증
  → store: setDynamicQuestions(questions), setStatus("answering")

status: "answering"
  → StepForm이 dynamicQuestions 순회
  → 각 스텝: 선택/입력 → store.setAnswer(questionId, value)
  → goNext() / goPrev()로 currentStep 이동
  → 마지막 스텝에서 "완료" 클릭 → currentStep >= total

  (usePromptGeneration useEffect 감지)
  → buildSystemPrompt({ dynamicQuestions, answers }) → string
  → Call 2: generateViaProxy({ prompt: originalInput, systemInstruction })
  → setStatus("generating")

status: "generating"
  → 스피너 UI 표시

status: "done"
  → store.setResult(text)
  → PromptResult 렌더 (복사 / 다시 생성 / 새 프롬프트)

status: "error"
  → store.setError(msg)
  → 에러 메시지 + 다시 시도 버튼
```

**genSeqRef**: React 18 Strict Mode 이중 effect 호출 방지용 시퀀스 ref. Call 1, Call 2 각각에 적용. 마지막 요청만 상태에 반영.

---

## Zustand 스토어 (`src/store/promptStore.ts`)

### 상태 (PromptState)

| 필드 | 타입 | 역할 |
|------|------|------|
| `originalInput` | `string` | 사용자가 입력한 원문 |
| `dynamicQuestions` | `DynamicQuestion[]` | Call 1이 생성한 질문 목록 |
| `currentStep` | `number` | 현재 질문 인덱스 (0부터) |
| `answers` | `Record<string, AnswerValue>` | questionId → 답변값 |
| `status` | `"idle" \| "analyzing" \| "answering" \| "generating" \| "done" \| "error"` | 앱 단계 |
| `result` | `string \| null` | Call 2 생성 결과 (마크다운) |
| `error` | `string \| null` | 에러 메시지 |

### 주요 액션

- `setOriginalInput(v)` — 원문 저장
- `setDynamicQuestions(questions)` — Call 1 결과 저장 + currentStep 0 리셋
- `setAnswer(questionId, value)` — 특정 질문 답변 저장
- `goNext() / goPrev()` — 스텝 이동
- `setStatus(s)` — 상태 직접 변경 (재시도 등에 사용)
- `reset()` — 전체 초기화 (idle 상태로 복귀)

---

## API 구조

### 클라이언트 (`src/api/geminiClient.ts`)

```ts
generateViaProxy(params: { prompt: string; systemInstruction?: string }): Promise<string>
```

- `POST /api/generate` 호출
- 응답 `.text` 필드 추출
- 빈 문자열 입력 시 즉시 에러 (호출 전 검증)
- Call 1(질문 생성), Call 2(프롬프트 생성) 모두 이 함수를 사용

### 서버 (`api/generate.ts` — Vercel 서버리스)

- 환경변수 `GEMINI_API_KEY` 사용
- `gemini-3-flash-preview` 모델 호출
- Gemini REST API 직접 호출 (SDK 미사용)
- 타임아웃 15초, OPTIONS 처리 포함

---

## Call 1 프롬프트 (`useQuestionGeneration.ts` — CALL1_SYSTEM_INSTRUCTION)

Gemini가 동적으로 질문을 생성할 때 따르는 규칙:

1. 사용자가 이미 명시한 기술·요구사항은 다시 묻지 않는다
2. 구현 방향에 실제 영향을 미치는 미결정 사항만 3~5개 질문
3. 모든 single/multi 질문에 `allowCustom: true` 포함 (기타 직접 입력 UI 자동 추가)
4. 한 질문에 여러 개념을 묶지 않고 질문을 분리
5. 영어 약어/전문 용어 사용 금지 — 한국어로 풀어서 설명
6. 마지막 질문은 반드시 `type: "text"`, required: false (자유 추가 입력용)
7. 순수 JSON만 반환 (마크다운 코드 블록 없이)

---

## Call 2 프롬프트 (`buildPrompt.ts` — ROLE_INTRO)

생성되는 최종 프롬프트의 고정 섹션 구조:

```
## 목표
## 기술 환경
## 요구사항
## 제약 및 가정
## 완료 기준
## 스코프 외 (하지 말 것)
```

- `buildSystemPrompt({ dynamicQuestions, answers })` → systemInstruction 문자열 반환
- 선택지 id는 한글 라벨로 변환, 기타 직접 입력은 원문 그대로 포함

---

## 타입 (`src/types/question.ts`)

```ts
// 답변 값
type AnswerValue = string | string[];
type AnswerMap = Record<string, AnswerValue>;

// Call 1이 생성하는 동적 선택지
interface DynamicChoice { id: string; label: string; }

// Call 1이 생성하는 동적 질문
interface DynamicQuestion {
  id: string;
  text: string;
  type: "single" | "multi" | "text";
  choices?: DynamicChoice[];
  required?: boolean;
  allowCustom?: boolean;
}
```

---

## 테마 토큰 (`src/styles/theme.ts`)

| 그룹 | 주요 토큰 |
|------|----------|
| color | `bg`, `surface`, `surfaceMuted`, `border`, `borderStrong`, `text`, `textMuted`, `textSubtle`, `primary`, `primaryHover`, `primarySoft`, `codeBg`, `codeText`, `codeBorder`, `codeMuted`, `danger`, `success` |
| radius | `sm(6px)`, `md(10px)`, `lg(14px)`, `pill(999px)` |
| space | `xs(4)`, `sm(8)`, `md(12)`, `lg(16)`, `xl(24)`, `xxl(32)` |
| font | `sans` (system-ui), `mono` (JetBrains Mono) |
| shadow | `sm` |
| layout | `maxWidth: 720px` |

---

## 핵심 개발 원칙

1. **LLM 호출은 Call 1 + Call 2 두 번만** — 분류나 중간 처리에 추가 호출하지 않는다.
2. **멀티플 초이스 우선** — 자유 텍스트보다 선택지를 먼저 제시. 모든 선택 질문에 allowCustom 포함.
3. **미설치 라이브러리 미리 도입 금지** — TanStack Query 등은 요청 시에만.
4. **외과적 변경** — 요청 범위 밖의 코드를 건드리지 않는다.
5. **Commit/Push는 사용자 명시 승인 후에만** — 자동 push 없음.

---

## 명령어

```bash
npm run dev      # Vite 개발 서버 (localhost:5173) — /api/generate 없음, UI만 확인용
vercel dev       # 전체 로컬 테스트 (Vite + 서버리스 함수) — .env.local에 GEMINI_API_KEY 필요
npm run build    # tsc + 프로덕션 빌드
npm run lint     # ESLint
npm run preview  # 빌드 결과 미리보기
```

---

## 배포 URL

- **프로덕션**: https://prompt-builder-liard.vercel.app/
- 클라이언트의 `fetch("/api/generate")`는 프로덕션에서 동일 호스트 → 별도 baseURL 설정 불필요
- 전체 플로우(`/api/generate` 포함) 확인이 필요할 때 위 URL 기준으로 검증

---

## 규칙 파일

@.claude/rules/karpathy-guidelines.md
@.claude/rules/react-patterns.md
@.claude/rules/styled-components.md
@.claude/rules/typescript-standards.md
@.claude/rules/phase-workflow.md
