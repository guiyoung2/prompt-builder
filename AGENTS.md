# Prompt Builder

모호한 사용자 요청을 전문성 있는 구조화 프롬프트로 변환해주는 프론트엔드 프로젝트.

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

핵심 UX 원칙: **자유 입력보다 멀티플 초이스 우선**. 사용자가 키보드를 덜 치고 빠르게 답할 수 있도록 항상 선택지부터 제시한다.

## 기술 스택

- **React 19** + **TypeScript 6** + **Vite 8**
- **styled-components 6** (현재 설치됨)
- **Zustand**, **TanStack Query** (미설치 — 필요 시점에 도입)
- **LLM**: Gemini Flash API (마지막 단계 변환에만 사용, 의도 분석/질문 생성에는 사용 X)

## 폴더 구조 (제안)

```
src/
  components/      # 재사용 UI 컴포넌트
  features/        # 도메인 기능 단위 (intent, questions, builder, output)
  hooks/           # 커스텀 훅
  api/             # 외부 API (Gemini 등) 클라이언트
  templates/       # 의도 분석/질문 템플릿 (정적 데이터)
  types/           # 공용 타입
  styles/          # theme, GlobalStyle
```

기능 단위(features) 안에서는 `components/`, `hooks/`, `*.types.ts`로 콜로케이션.

## 개발 원칙

- 작성/리뷰 기준은 `.cursor/rules/karpathy-guidelines.mdc`를 따른다.
- 미설치 라이브러리(Zustand, TanStack Query)는 **요청 없이 미리 설치/도입하지 않는다**.
- LLM 호출은 마지막 단계에만. 비용·지연 발생 지점이므로 호출 횟수 최소화.

## 명령어

```bash
npm run dev      # 개발 서버
npm run build    # 타입체크 + 프로덕션 빌드
npm run lint     # ESLint
```
