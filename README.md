# Prompt Builder

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.0-646cff?logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000?logo=vercel&logoColor=white)

모호한 개발 요청을 **Claude Code** 전달용 구조화 프롬프트로 변환하는 웹 앱

**프로덕션**: https://prompt-builder-liard.vercel.app/

---

## 만든 이유

Claude Code에 붙여넣는 프롬프트의 품질이 결과에 직접 영향을 준다. 그런데 즉흥적으로 작성한 프롬프트는 기술 환경이 빠지거나, 완료 기준이 없거나, 스코프가 불명확한 경우가 많다.

Prompt Builder는 Gemini를 두 번 호출해 이 문제를 해결한다.

1. **Call 1** — 사용자 요청을 분석해 빠진 정보를 동적으로 질문
2. **Call 2** — 원문 + 답변을 바탕으로 6섹션 구조화 프롬프트 생성

---

## 핵심 기능

- **동적 질문 생성**: 이미 언급한 기술·요구사항은 재질문 없이 건너뜀
- **멀티플 초이스 우선 UX**: 선택지 클릭 위주, 모든 선택 질문에 "기타 직접 입력" 제공
- **6섹션 구조화 출력**: Claude Code가 바로 사용할 수 있는 고정 형식
- **재생성 지원**: 같은 답변으로 프롬프트를 다시 생성 가능
- **클립보드 복사**: 결과 마크다운 원문 전체 복사

---

## 출력 형식

모든 생성 결과는 아래 6개 섹션을 고정 헤더로 유지한다.

```markdown
## 목표
## 기술 환경
## 요구사항
## 제약 및 가정
## 완료 기준
## 스코프 외 (하지 말 것)
```

---

## 아키텍처

### 전체 흐름

```
사용자 입력 (모호한 개발 요청)
        ↓
[Call 1] Gemini — 동적 질문 3~5개 JSON 생성
        ↓
스텝 폼 — 선택지 / 자유 입력으로 답변 수집
        ↓
[Call 2] Gemini — 원문 + 답변 → 6섹션 프롬프트 생성
        ↓
복사 / 다시 생성 / 새 프롬프트
```

### 보안 구조

클라이언트는 Gemini API를 직접 호출하지 않는다. Vercel 서버리스 함수가 프록시 역할을 해 API 키를 서버에만 보관한다.

```
브라우저 → POST /api/generate → Vercel Function → Gemini REST API
```

### 상태 머신

```
idle → analyzing → answering → generating → done
                                          ↘ error
```

| 상태 | 설명 |
|------|------|
| `idle` | 초기 입력 화면 |
| `analyzing` | Call 1 진행 중 (질문 생성) |
| `answering` | 스텝 폼 질문 응답 중 |
| `generating` | Call 2 진행 중 (프롬프트 생성) |
| `done` | 결과 출력 완료 |
| `error` | API 오류 또는 파싱 실패 |

---

## 기술 스택

| 기술 | 버전 | 선택 이유 |
|------|------|----------|
| React | 19.2.5 | 최신 버전 실험 목적 |
| TypeScript | 6.0.2 | LLM 응답 파싱 시 런타임 검증 + 타입 안전성 |
| Vite | 8.0.10 | 빌드 속도 |
| Zustand | 5.0.12 | Context API 대비 간결한 상태 머신 표현 |
| styled-components | 6.4.1 | 테마 토큰 기반 일관된 라이트 테마 |
| react-markdown | 10.1.0 | 결과 마크다운 렌더링 |
| Gemini API | gemini-2.0-flash | 한국어 자연어 이해 + JSON 구조 출력 품질 |
| Vercel | — | API 키 격리 + 서버리스 함수 무료 배포 |

---

## 개발 과정

### V1 — 정적 템플릿 방식

초기 버전은 카테고리(frontend / backend / bugfix / refactor)별 고정 8문항을 사용했다.

**드러난 한계:**

- 사용자가 이미 입력에서 "Supabase 사용할게"라고 했는데, DB 관련 질문이 다시 나옴
- 키워드 기반 분류기 오탐 — "로그인 폼 만들어줘"가 backend로 분류됨
- 카테고리와 무관한 질문이 결과 프롬프트에 포함돼 품질 저하

### V2 — 동적 2-call 아키텍처

정적 템플릿과 분류기를 전면 제거하고 Gemini에게 질문 생성을 위임했다.

**핵심 변경:**

- Call 1 시스템 프롬프트 규칙: "이미 언급된 기술·요구사항은 절대 재질문 금지"
- 질문 수 3~5개로 감소, 맥락에 맞는 질문만 생성
- 마지막 질문은 항상 자유 입력 (`type: "text"`, `required: false`)
- `DynamicQuestion` 타입으로 선택지 구조도 Gemini가 동적 생성

### 주요 개선 이력

| 항목 | 내용 |
|------|------|
| 출력 형식 고정 | Gemini가 세션마다 다른 구조로 출력하던 문제 — 6섹션 헤더를 시스템 프롬프트에 명시해 통일 |
| priority 톤 반영 | "긴급" 선택 시 설명 최소화·코드 위주 출력, "여유" 선택 시 트레이드오프 포함 |
| 훅 분리 | `StepForm.tsx` 376줄 → API 호출 로직을 `usePromptGeneration.ts`로 분리 |
| 타임아웃 명시 | `AbortController` + 15초 타임아웃, 504 에러 메시지 명확화 |
| 재생성 버튼 | 같은 답변으로 Call 2만 재실행하는 "다시 생성" 버튼 추가 |

---

## 로컬 실행

### 사전 준비

- Node.js 18+
- Vercel CLI: `npm i -g vercel`
- [Google AI Studio](https://aistudio.google.com/)에서 Gemini API 키 발급

### 설치 및 실행

```bash
git clone <repository-url>
cd prompt-builder
npm install
```

`.env.local` 파일 생성:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

```bash
# 전체 플로우 (Vite + 서버리스 함수)
vercel dev

# UI만 확인 (API 호출 없음)
npm run dev
```

### 명령어

```bash
npm run build    # TypeScript 컴파일 + 프로덕션 빌드
npm run lint     # ESLint 검사
npm run preview  # 빌드 결과 미리보기
```

---

## 프로젝트 구조

```
src/
  main.tsx                         # 진입점 — ThemeProvider, GlobalStyle
  App.tsx                          # 상태 분기 + IntentInput 컴포넌트

  api/
    geminiClient.ts                # /api/generate 프록시 호출

  store/
    promptStore.ts                 # Zustand 전역 상태 + 액션

  types/
    question.ts                    # DynamicQuestion, DynamicChoice, AnswerMap

  features/
    questions/
      StepForm.tsx                 # 스텝별 질문 폼
      useQuestionGeneration.ts     # Call 1 — 동적 질문 생성 훅
      usePromptGeneration.ts       # Call 2 — 프롬프트 생성 훅
    builder/
      buildPrompt.ts               # 질문 + 답변 → systemInstruction 조립
    output/
      PromptResult.tsx             # 결과 렌더 + 복사 + 재생성

  components/
    Choice.tsx                     # 단일/다중 선택 (기타 입력 포함)
    TextInput.tsx                  # 자유 텍스트 textarea

  styles/
    theme.ts                       # 라이트 테마 토큰
    GlobalStyle.ts                 # 전역 스타일

api/
  generate.ts                      # Vercel 서버리스 — Gemini REST 프록시
```
