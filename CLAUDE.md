# Prompt Builder — Claude Code 가이드

모호한 사용자 요청을 전문성 있는 구조화 프롬프트로 변환하는 프론트엔드 프로젝트.

---

## 도메인 흐름

```
[사용자 입력 (모호한 요청)]
        ↓
[의도 분석 + 카테고리 분류]    ← 템플릿 기반 (LLM 호출 X)
        ↓
[맞춤형 질문 생성]             ← 카테고리별 질문 템플릿
        ↓
[사용자 답변 수집]             ← 인터랙티브 프롬프팅 (a/b/c... 선택지 우선)
        ↓
[구조화된 프롬프트 생성]       ← LLM API (Gemini Flash)
        ↓
[최종 프롬프트 출력 + 복사]
```

**핵심 UX 원칙**: 자유 입력보다 멀티플 초이스 우선. 사용자가 키보드를 덜 치고 빠르게 답할 수 있도록 항상 선택지부터 제시한다.

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

**미도입 라이브러리**: TanStack Query 등은 요청 없이 도입하지 않는다. Zustand는 이미 사용 중.

---

## 폴더 구조

```
src/
  main.tsx                          # 진입점 — ThemeProvider, GlobalStyle 마운트
  App.tsx                           # 메인 컴포넌트 — IntentInput + Workflow 분기

  api/
    geminiClient.ts                 # /api/generate 프록시 호출 (generateViaProxy)

  store/
    promptStore.ts                  # Zustand 전역 상태 + 액션 (devtools 포함)

  types/
    category.ts                     # Category = "frontend" | "backend" | "bugfix" | "refactor"
    question.ts                     # Question 유니언, AnswerValue, Choice 타입

  features/
    intent/
      classifyIntent.ts             # 키워드 점수제 분류 함수 + self-check
      CategoryHeader.tsx            # 카테고리 표시 + 변경 칩 + "처음으로" 버튼
    questions/
      StepForm.tsx                  # 스텝별 질문 진행 + 완료 시 API 트리거
    builder/
      buildPrompt.ts                # 답변 → systemInstruction 텍스트 변환
    output/
      PromptResult.tsx              # 마크다운 렌더 + 클립보드 복사

  components/
    Choice.tsx                      # 단일/다중 선택 (radio/checkbox + 기타 입력)
    TextInput.tsx                   # 자유 텍스트 textarea

  templates/
    categories.ts                   # 4개 카테고리 메타데이터 (label, description, scope)
    intent-rules.ts                 # 분류 키워드 룰 + PRIORITY_ORDER
    questions/
      index.ts                      # QUESTIONS_BY_CATEGORY (카테고리 → 질문 배열 매핑)
      common.ts                     # 공통 질문 2개 (priority, constraints)
      frontend.ts                   # 프론트엔드 질문 6개
      backend.ts                    # 백엔드 질문 6개
      bugfix.ts                     # 버그수정 질문 6개
      refactor.ts                   # 리팩터링 질문 6개

  styles/
    theme.ts                        # 라이트 테마 토큰 (color, radius, space, font, shadow)
    GlobalStyle.ts                  # 전역 스타일 (box-sizing, body, 포커스 링)
    styled.d.ts                     # DefaultTheme 타입 확장

api/
  generate.ts                       # Vercel 서버리스 함수 — Gemini Flash REST 호출
```

---

## 전체 데이터 흐름 (상태 머신)

```
status: "idle"
  → 사용자가 IntentInput에 텍스트 입력 후 "시작하기"
  → classifyIntent(input) 동기 실행 → Category 결정
  → store: setOriginalInput, setCategory, status="answering"

status: "answering"
  → QUESTIONS_BY_CATEGORY[category] + COMMON_QUESTIONS 순회
  → 각 스텝: 선택/입력 → store.setAnswer(questionId, value)
  → store.goNext() / goPrev() 로 currentStep 이동
  → 마지막 스텝에서 "완료" 클릭 → currentStep >= total

  (StepForm useEffect 감지)
  → buildSystemPrompt(originalInput, category, answers, questions) → string
  → generateViaProxy({ prompt: originalInput, systemInstruction }) → Gemini Flash
  → status="generating" (API 호출 중)

status: "generating"
  → 스피너 UI 표시

status: "done"
  → store.setResult(text)
  → PromptResult 렌더 (react-markdown + 복사 버튼)

status: "error"
  → store.setError(msg)
  → 에러 메시지 + "다시 시도" 버튼
```

**genSeqRef**: React 18 Strict Mode 이중 호출 방지용 시퀀스 ref. 마지막 요청만 상태에 반영.

---

## Zustand 스토어 (`src/store/promptStore.ts`)

### 상태 (PromptState)

| 필드 | 타입 | 역할 |
|------|------|------|
| `originalInput` | `string` | 사용자가 입력한 원문 |
| `category` | `Category \| null` | 분류된 카테고리 |
| `currentStep` | `number` | 현재 질문 인덱스 (0부터) |
| `answers` | `Record<string, AnswerValue>` | questionId → 답변값 |
| `status` | `"idle" \| "answering" \| "generating" \| "done" \| "error"` | 앱 단계 |
| `result` | `string \| null` | Gemini 생성 결과 (마크다운) |
| `error` | `string \| null` | 에러 메시지 |

### 주요 액션

- `setCategory(c)` — 카테고리 설정 + currentStep 0으로 리셋 (answers는 유지)
- `setAnswer(questionId, value)` — 특정 질문 답변 저장
- `goNext() / goPrev()` — 스텝 이동
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

### 서버 (`api/generate.ts` — Vercel 서버리스)

- 환경변수 `GEMINI_API_KEY` 사용
- `gemini-2.0-flash` 모델 호출
- Gemini REST API 직접 호출 (SDK 미사용)
- OPTIONS CORS 처리 포함

---

## 템플릿 시스템

### 카테고리 분류 (`src/features/intent/classifyIntent.ts`)

1. 입력 소문자화
2. `INTENT_RULES` 키워드 substring 매칭 → 카테고리별 스코어 누적
3. 최고 스코어 카테고리 선택, 동점 시 `PRIORITY_ORDER: [bugfix, refactor, backend, frontend]`
4. 매칭 없으면 `frontend` 폴백 (confidence: "low")

개발 빌드에서 콘솔에 self-check 10개 케이스 출력.

### 질문 구조 (`src/types/question.ts`)

```ts
type Question =
  | { type: "single"; choices: Choice[]; allowCustom?: boolean; ... }
  | { type: "multi";  choices: Choice[]; allowCustom?: boolean; ... }
  | { type: "text";   placeholder?: string; ... }
```

각 카테고리 질문 6개 + 공통 질문 2개 = 총 8 스텝.

---

## 테마 토큰 (`src/styles/theme.ts`)

| 그룹 | 주요 토큰 |
|------|----------|
| color | `bg`, `surface`, `surfaceMuted`, `border`, `text`, `textMuted`, `primary`, `codeBg`, `codeText`, `danger`, `success` |
| radius | `sm(6px)`, `md(10px)`, `lg(14px)`, `pill(999px)` |
| space | `xs(4)`, `sm(8)`, `md(12)`, `lg(16)`, `xl(24)`, `xxl(32)` |
| font | `sans` (system-ui), `mono` (JetBrains Mono) |
| layout | `maxWidth: 720px` |

---

## 핵심 개발 원칙

1. **LLM 호출 최소화** — 마지막 프롬프트 생성 단계에만 Gemini 사용. 분류/질문은 정적 템플릿.
2. **멀티플 초이스 우선** — 자유 텍스트보다 선택지를 항상 먼저 제시.
3. **미설치 라이브러리 미리 도입 금지** — TanStack Query 등은 요청 시에만.
4. **외과적 변경** — 요청 범위 밖의 코드를 건드리지 않는다.
5. **Commit/Push는 사용자 명시 승인 후에만** — 자동 push 없음.

---

## 명령어

```bash
npm run dev      # 개발 서버 (localhost:5173)
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
