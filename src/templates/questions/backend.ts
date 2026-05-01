import type { Question } from "../../types/question";

// backend 카테고리 전용 질문.
// LLM이 런타임/프레임워크/DB/인증/요구사항 컨텍스트를 추론할 수 있도록
// 핵심 정보를 6문항으로 추출한다. 모두 멀티플 초이스 우선 + 필요 시 직접 입력.
export const BACKEND_QUESTIONS: Question[] = [
  {
    id: "be_taskType",
    type: "single",
    prompt: "어떤 종류의 작업인가요?",
    helper: "작업 성격에 맞춰 결과 프롬프트의 구조가 달라집니다.",
    choices: [
      { id: "new_endpoint", label: "새 API 엔드포인트 추가" },
      { id: "modify_endpoint", label: "기존 엔드포인트 수정 / 개선" },
      { id: "db_schema", label: "DB 스키마 / 마이그레이션 변경" },
      { id: "auth", label: "인증 / 인가 로직" },
      { id: "integration", label: "외부 서비스 연동 (결제 / 메일 / 큐 등)" },
      { id: "perf", label: "성능 최적화 (쿼리 / 캐싱 / N+1 등)" },
    ],
    allowCustom: true,
  },
  {
    id: "be_runtime",
    type: "single",
    prompt: "어떤 런타임 / 언어를 쓰고 있나요?",
    choices: [
      { id: "node", label: "Node.js (JavaScript / TypeScript)" },
      { id: "python", label: "Python" },
      { id: "go", label: "Go" },
      { id: "java", label: "Java / Kotlin (JVM)" },
      { id: "ruby", label: "Ruby" },
    ],
    allowCustom: true,
  },
  {
    id: "be_framework",
    type: "single",
    prompt: "어떤 프레임워크를 쓰고 있나요?",
    helper: "런타임에 맞는 항목을 고르거나, 직접 입력해도 됩니다.",
    choices: [
      { id: "express", label: "Express / Fastify" },
      { id: "nest", label: "NestJS" },
      { id: "next_api", label: "Next.js Route Handler / API Route" },
      { id: "fastapi", label: "FastAPI / Flask / Django" },
      { id: "spring", label: "Spring Boot" },
      { id: "none", label: "프레임워크 없이 / 해당 없음" },
    ],
    allowCustom: true,
  },
  {
    id: "be_database",
    type: "single",
    prompt: "주된 데이터 저장소는 무엇인가요?",
    choices: [
      { id: "postgres", label: "PostgreSQL" },
      { id: "mysql", label: "MySQL / MariaDB" },
      { id: "mongo", label: "MongoDB" },
      { id: "redis", label: "Redis (캐시 / 세션)" },
      { id: "sqlite", label: "SQLite" },
      { id: "none", label: "DB 사용 안 함 / 해당 없음" },
    ],
    allowCustom: true,
  },
  {
    id: "be_auth",
    type: "single",
    prompt: "인증 / 인가는 어떻게 처리하나요?",
    helper: "이번 작업이 인증과 무관하다면 '해당 없음'을 선택하세요.",
    choices: [
      { id: "jwt", label: "JWT (액세스 / 리프레시 토큰)" },
      { id: "session", label: "세션 + 쿠키" },
      { id: "oauth", label: "OAuth / 소셜 로그인" },
      { id: "api_key", label: "API 키" },
      { id: "none", label: "해당 없음" },
    ],
    allowCustom: true,
  },
  {
    id: "be_concerns",
    type: "multi",
    prompt: "추가로 챙겨야 할 요구사항이 있다면 모두 골라주세요.",
    helper: "선택 사항입니다. 해당 없으면 비워두세요.",
    required: false,
    choices: [
      { id: "tests", label: "테스트 코드 (단위 / 통합)" },
      { id: "logging", label: "로깅 / 모니터링" },
      { id: "validation", label: "입력 검증 / 에러 응답 표준화" },
      { id: "rate_limit", label: "Rate limit / 보안 헤더" },
      { id: "caching", label: "캐싱 (응답 / 쿼리)" },
      { id: "transaction", label: "트랜잭션 / 동시성 처리" },
    ],
  },
];
