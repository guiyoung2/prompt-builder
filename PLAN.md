# Prompt Builder — 작업 진행 상태

> 이 파일은 새 대화 세션마다 참조하는 작업 트래커입니다.
> **한 todo가 끝날 때마다 이 파일에 체크하고, 다음 todo는 새 세션에서 진행합니다.**

## 진행 요약

- 현재 진행 중: **Phase 4-4 직전** (Phase 4-3 완료)
- 완료: 18 / 22
- 다음 단위: `Phase 4-4 — builder 통합 + 에러 핸들링 + 로딩`

## 핵심 결정 (변경 시 PLAN.md 동기화)

- **카테고리 4종**: `frontend` / `backend` / `bugfix` / `refactor` (모두 넓은 의미)
- **UI 흐름**: 스텝 폼 (1/N 진행, 멀티플 초이스 우선, 필요 시 직접 입력)
- **LLM**: Gemini 3 Flash (`gemini-3-flash-preview`) 무료 티어
- **API 키 관리**: Vercel Serverless Function 프록시 (`/api/generate`), 키는 Vercel 환경변수 `GEMINI_API_KEY`
- **상태 관리**: Zustand 하이브리드 (도메인 상태는 단일 스토어, 컨트롤드 인풋은 로컬 `useState`)
- **저장소**: 사용 안 함 (일회성 워크플로우)
- **테마**: 라이트 메인 + 결과 영역만 다크 패널 (`src/styles/theme.ts`의 `lightTheme`)

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
- [ ] **4-4** builder 통합 + 에러 핸들링 + 로딩
  - 검증: frontend/backend 두 시나리오 end-to-end 성공

## Phase 5 — 결과 + 배포

- [ ] **5-1** `src/features/output` (결과 마크다운 렌더, 복사 버튼)
  - 검증: 복사 버튼 클릭 시 클립보드 동기화
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
- `currentStep === total` 도달 시 status 전환은 미정 — Phase 4-4(builder 통합)에서 "generating"으로 트리거. 그 전까지는 StepForm 내부 placeholder가 임시 화면.
- **Phase 4-1 완료**: 프로젝트 루트 `api/generate.ts` (`@vercel/node`). 본문 `{ prompt, systemInstruction? }`, `OPTIONS` 허용, 키 없으면 503.
- **Phase 4-2 완료**: `src/api/geminiClient.ts`의 `generateViaProxy()`가 `POST /api/generate` 호출 및 응답 파싱.
- **Phase 4-3 완료**: `src/features/builder/buildPrompt.ts`의 `buildSystemPrompt({ category, answers })`가 `QUESTIONS_BY_CATEGORY` 순서대로 조립. 다음은 **Phase 4-4** builder 통합.

## 알려진 약점 / 추후 개선 후보

- 영어 키워드 substring 매칭의 false positive (예: `fix` 가 `prefix`/`suffix`에도 매치, `form`이 `transform`에 매치). 한국어 위주 입력 가정 하 MVP 수준 OK.
- vitest 미도입 — 1차 검증은 `runClassifierSelfCheck()` + tsx 실행으로 대체. MVP 안정화 후 도입 권장.
