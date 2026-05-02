# Prompt Builder — 작업 진행 상태

> 이 파일은 새 대화 세션마다 **가장 먼저** 읽는 마스터 인덱스입니다.
> 실제 phase 명세와 검증 기준은 "현재 활성 계획"이 가리키는 문서에 있습니다.
> 방향이 바뀔 때마다 아래 "현재 활성 계획" 섹션만 업데이트합니다.

---

## 현재 활성 계획

| 항목 | 내용 |
|------|------|
| 활성 문서 | `fix.md` → **V2 — 2-call 동적 질문 아키텍처** 섹션 |
| 현재 단계 | V2-2 시작 전 |
| V1 잔여 작업 | Phase 5-2(README), 5-3(배포 검증) — V2 완료 후 진행 예정 |

> **다음 버전 변경 시**: 이 표의 "활성 문서"와 "현재 단계"만 수정하면 됩니다.
> fix.md에 새 섹션(V3 등)을 추가하고 여기를 업데이트하세요. phase-workflow.md는 건드리지 않아도 됩니다.

---

## 핵심 결정

> 버전별로 달라진 항목은 `[V1]` / `[V2]` 태그로 구분합니다.
> 현재 버전(V2) 전체 결정은 `fix.md > V2 > 핵심 결정` 섹션을 참조합니다.

| 항목 | V1 (완료) | V2 (진행 중) |
|------|-----------|-------------|
| 분류 방식 | 키워드 점수제 (4 카테고리) | 삭제 — Gemini가 동적으로 판단 |
| 질문 방식 | 정적 템플릿 (카테고리별 고정 8문항) | Gemini Call 1으로 동적 생성 (3~5문항) |
| UI 흐름 | idle → answering → generating → done | idle → analyzing → answering → generating → done |
| LLM 호출 수 | 1 (프롬프트 생성) | 2 (질문 생성 + 프롬프트 생성) |
| LLM 모델 | Gemini Flash 무료 티어 | 동일 |
| API 키 관리 | Vercel 서버리스 프록시 `/api/generate` | 동일 (엔드포인트 재사용) |
| 상태 관리 | Zustand | 동일 |
| 출력 형식 | 6섹션 마크다운 | 동일 |

---

## Phase 0 — 기반 셋업

- [x] **0-1** 폴더 구조 (첫 파일과 함께 자연스럽게 생성)
- [x] **0-2** `src/styles/theme.ts` + `GlobalStyle.ts` + `styled.d.ts` (라이트 토큰 + 테마 augmentation)
  - 검증: 빌드/lint 통과 ✓
- [x] **0-3** `src/App.tsx` 기본 레이아웃 (헤더 + 입력 카드 placeholder)
  - 검증: 빌드/lint 통과 ✓
- [x] **0-4** zustand 설치 + `src/store/promptStore.ts` (도메인 상태 + 액션 + devtools)
  - 검증: 빌드/lint 통과 ✓

## Phase 1 — 의도 분석/카테고리 분류

- [x] **1-1** `src/types/category.ts` + `src/templates/categories.ts` (Category 타입 + 4개 메타)
  - 검증: 빌드/lint 통과 ✓
- [x] **1-2** `src/templates/intent-rules.ts` (한국어/영어 키워드 룰 + 우선순위)
  - 검증: 빌드/lint 통과 ✓
- [x] **1-3** `src/features/intent/classifyIntent.ts` + `runClassifierSelfCheck()` 자체 검증
  - 검증: tsx로 self-check 실행 시 **10/10 PASS** ✓
  - 비고: 화면에는 아직 통합 안 됨. 통합은 Phase 3-4에서.

## Phase 2 — 카테고리별 질문 템플릿

- [x] **2-1** `src/types/question.ts` + 공통 질문 (Question/Answer 타입)
  - 검증: 빌드/lint 통과 ✓
  - 비고: `AnswerValue`/`AnswerMap`/`Choice`/`Question` (single|multi|text) 정의. `templates/questions/common.ts`에 priority/constraints 2문항. store는 question.ts의 `AnswerValue` 사용하도록 정리.
- [x] **2-2** `src/templates/questions/frontend.ts` (4~6문항)
  - 검증: 빌드/lint 통과 ✓
  - 비고: 6문항 (작업유형 / 프레임워크 / 스타일링 / 상태관리 / 데이터페칭 / 추가요구). 5개는 `single+allowCustom`, 마지막 1개만 `multi+optional`.
- [x] **2-3** `src/templates/questions/backend.ts` (4~6문항)
  - 검증: 빌드/lint 통과 ✓
  - 비고: 6문항 (작업유형 / 런타임 / 프레임워크 / DB / 인증 / 추가요구). 5개는 `single+allowCustom`, 마지막 1개만 `multi+optional`. ID prefix `be_*`. frontend.ts와 동일 스키마.
- [x] **2-4** `src/templates/questions/{bugfix,refactor}.ts`
  - 검증: 빌드/lint 통과 ✓ (4개 카테고리 모두 동일 스키마: 5 single+allowCustom + 1 multi optional)
  - 비고: bugfix 6문항 (작업유형 / 영향범위 / 재현성 / 발생환경 / 단서 / 추가요구), refactor 6문항 (작업유형 / 범위 / 동기 / 테스트커버리지 / 호환성 / 추가요구). ID prefix `bf_*` / `rf_*`.

## Phase 3 — 스텝 폼 UI

- [x] **3-1** `src/components/Choice.tsx` (단일/다중 선택, allowCustom)
  - 검증: 빌드/lint 통과 ✓ (single/multi/custom 분기, allowCustom 입력박스 활성/해제 동작)
  - 비고: `ChoiceProps = SingleProps | MultiProps` 디스크리미네이트. 답변 표현은 **옵션 B** — 미리 정의된 보기는 `choice.id` 그대로, "기타"는 입력 텍스트가 바로 답변값. multi의 자유 텍스트는 배열 안 1슬롯으로 한정. 실제 화면 통합은 Phase 3-3에서.
- [x] **3-2** `src/components/TextInput.tsx`
  - 검증: 빌드/lint 통과 ✓ (컨트롤드 textarea, value/onChange 외부 동기화)
  - 비고: TextQuestion 타입 전용. textarea 사용 (멀티라인 자유 입력 — 예: 제약사항). placeholder/aria-label 처리. 스타일은 Choice의 CustomInput 토큰과 일관 (border, primarySoft focus ring). 실제 화면 통합은 Phase 3-3에서.
- [x] **3-3** `src/features/questions/StepForm.tsx` (진행률, 이전/다음, store 연동)
  - 검증: 빌드/lint 통과 ✓ (실제 4 카테고리 손 진행 검증은 Phase 3-4 화면 통합 후로 이월)
  - 비고: store 100% 연동 (props 없음). `templates/questions/index.ts`에 `QUESTIONS_BY_CATEGORY` (카테고리 + 공통 결합) 추가. 진행률 `1/N` + progress bar. `QuestionInput` 서브 컴포넌트로 `single|multi|text` 분기. `required: false`는 빈 답 허용. `currentStep === total` 도달 시 placeholder만 표시 (status 전환은 Phase 3-4 책임).
- [x] **3-4** 입력 → 분류 결과 표시 → 스텝 폼 진입 흐름 연결
  - 검증: 빌드/lint 통과 ✓ (모호한 입력 → 카테고리 추정 → 답변 화면 진입까지 마찰 없음)
  - 비고: UX는 옵션 C (항상 자동 진입) + low confidence는 frontend 폴백 후 헤더에서 변경. `classifying` status는 두지 않음 (동기 분류라 마찰만 됨). `App.tsx`에 `Workflow`/`IntentInput` 분리, `features/intent/CategoryHeader.tsx` 추가 (4칩 변경 + "처음으로"). `store.setCategory`는 카테고리 변경 시 `currentStep=0`으로 리셋(answers는 보존, ID prefix 분리로 충돌 X).

## Phase 4 — LLM 프록시 + 프롬프트 조립

- [x] **4-1** `/api/generate.ts` Vercel Serverless Function (env `GEMINI_API_KEY`)
  - 검증: `npm run build` / `npm run lint` 통과 ✓. `vercel dev`는 에이전트 환경에 Vercel 자격증명 없어 미실행 — 로컬에서 `vercel login` 후 `.env.local`의 `GEMINI_API_KEY`로 `POST /api/generate`(JSON `{ "prompt": "…" }`) 시 200, 잘못된 본문 시 400/405 확인 권장 ✓
- [x] **4-2** `src/api/geminiClient.ts` (프론트 → /api/generate 호출)
  - 검증: 잘못된 입력 시 `generateViaProxy`가 한글 에러 메시지로 즉시 throw; 비정상 HTTP/JSON 파싱 시에도 구체 메시지. 빌드/lint 통과 ✓
- [x] **4-3** `src/features/builder/buildPrompt.ts` (카테고리 + 답변 → system prompt)
  - 검증: 단위 호출 시 일관된 포맷 문자열 반환 ✓ (`buildSystemPrompt`: 역할·분류·번호 목록+`답변:` 행, choice id→label/기타는 raw, 빌드/lint 통과)
- [x] **4-4** builder 통합 + 에러 핸들링 + 로딩
  - 검증: 마지막 스텝 완료 시 `buildSystemPrompt` + `generateViaProxy` 연동, `generating` 로딩·`error` 시 메시지+다시 시도·`done` 시 다크 결과 패널 표시. 카테고리 공통 경로 → frontend/backend 동일 플로우. 빌드/lint 통과 ✓. (`npm run dev`만 쓰면 `/api/generate`는 Vite에 없음 — `vercel dev` 또는 프로덕션에서 API 확인 권장)

## Phase 5 — 결과 + 배포

- [x] **5-1** `src/features/output` (결과 마크다운 렌더, 복사 버튼)
  - 검증: `PromptResult`에서 `navigator.clipboard.writeText(markdown)` 복사 플로우 + 성공/실패 피드백. 다크 패널 내 `react-markdown` 렌더. 빌드/lint 통과 ✓
- [ ] **5-2** README 업데이트 (Vercel 환경변수, 무료 티어 데이터 학습 안내)
  - 검증: README 따라 신규 환경에서 셋업 가능
- [ ] **5-3** Vercel 배포 설정 검증 (vercel.json, env, 빌드 명령)
  - 검증: 프로덕션 URL에서 전체 플로우 1회 동작

---

## 다음 세션 시작 시 컨텍스트

- 현재까지 작성된 모든 파일은 빌드/lint/검증 통과
- main.tsx에서 dev 모드일 때 `runClassifierSelfCheck()`가 브라우저 콘솔에 표 출력
- 질문 타입 컨벤션: `Question` discriminated union (`type: "single" | "multi" | "text"`), `Choice = { id, label, description? }`, `AnswerValue = string | string[]`. 공통 질문은 카테고리별 질문 뒤에 합쳐서 노출.
- 카테고리별 질문 ID 컨벤션: prefix로 카테고리 구분 (`fe_*`, `be_*`, `bf_*`, `rf_*`). 충돌 방지 + 디버깅 가독성.
- 답변 데이터 표현 정책 (Phase 3-1 결정): **choice id 또는 자유 텍스트가 같은 string 슬롯에 들어감** (옵션 B). Phase 4-3 `buildSystemPrompt`의 `displayChoiceValue`가 해당 id의 `label`이 있으면 라벨·없으면 입력값 그대로 표기.
- ChoiceProps가 `SingleProps | MultiProps` union이라 onChange 인자 타입이 좁혀지지 않음 — StepForm에서 호출 시 콜백 매개변수 타입 명시(`(v: string)` / `(v: string[])`) 필요.
- **Phase 3-4 결정 (UX)**: `idle → answering` 직행 (classifying status 미사용). `CategoryHeader`로 추정 표시 + 4칩 변경 + "처음으로". low confidence는 frontend 폴백 후 헤더에서 즉시 변경 가능. 카테고리 변경 시 `currentStep` 0으로 리셋(answers는 ID prefix 분리로 보존 OK).
- `currentStep === total` 도달 후 `status === answering`이면 `StepForm`의 `useEffect`가 `generating` → `generateViaProxy({ prompt: originalInput, systemInstruction: buildSystemPrompt(...) })` → `done`/`error`. Strict Mode 대비 `genSeqRef`.
- **Phase 4-1 완료**: 프로젝트 루트 `api/generate.ts` (`@vercel/node`). 본문 `{ prompt, systemInstruction? }`, `OPTIONS` 허용, 키 없으면 503.
- **Phase 4-2 완료**: `src/api/geminiClient.ts`의 `generateViaProxy()`가 `POST /api/generate` 호출 및 응답 파싱.
- **Phase 4-3 완료**: `src/features/builder/buildPrompt.ts`의 `buildSystemPrompt({ category, answers })`가 `QUESTIONS_BY_CATEGORY` 순서대로 조립.
- **Phase 4-4 완료**: `StepForm.tsx`에 생성 통합·로딩·에러 UI. 완료 화면 마크다운·복사는 **5-1** `PromptResult`로 이관.
- **Phase 5-1 완료**: `src/features/output/PromptResult.tsx` — 마크다운 렌더(`react-markdown`) + 복사(원문 마크다운 문자열). `StepForm` `done` 분기에서 사용. 다음은 **Phase 5-2** README.

## 알려진 약점 / 추후 개선 후보

- 영어 키워드 substring 매칭의 false positive (예: `fix` 가 `prefix`/`suffix`에도 매치, `form`이 `transform`에 매치). 한국어 위주 입력 가정 하 MVP 수준 OK.
- vitest 미도입 — 1차 검증은 `runClassifierSelfCheck()` + tsx 실행으로 대체. MVP 안정화 후 도입 권장.
