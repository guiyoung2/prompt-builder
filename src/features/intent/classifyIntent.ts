import type { Category } from "../../types/category";
import {
  INTENT_RULES,
  PRIORITY_ORDER,
} from "../../templates/intent-rules";

export interface IntentResult {
  category: Category;
  // high: 키워드가 1개 이상 매칭됨
  // low: 매칭이 없거나 동점이라 사용자 확인이 필요한 경우
  confidence: "high" | "low";
  matchedKeywords: string[];
  scores: Record<Category, number>;
}

// 입력 문자열을 카테고리로 분류한다.
// 알고리즘:
// 1. 입력을 소문자화
// 2. 각 카테고리 룰의 키워드를 substring 매칭하며 점수 누적
// 3. 가장 높은 점수의 카테고리를 반환 (동점은 PRIORITY_ORDER로 결정)
// 4. 매칭이 0이면 frontend로 폴백 + confidence 'low'
export function classifyIntent(input: string): IntentResult {
  const text = input.toLowerCase().trim();

  const scores: Record<Category, number> = {
    frontend: 0,
    backend: 0,
    bugfix: 0,
    refactor: 0,
  };
  const matchedByCategory: Record<Category, string[]> = {
    frontend: [],
    backend: [],
    bugfix: [],
    refactor: [],
  };

  if (!text) {
    return {
      category: "frontend",
      confidence: "low",
      matchedKeywords: [],
      scores,
    };
  }

  for (const rule of INTENT_RULES) {
    for (const kw of rule.keywords) {
      if (text.includes(kw.toLowerCase())) {
        scores[rule.category] += 1;
        matchedByCategory[rule.category].push(kw);
      }
    }
  }

  // 우선순위 순으로 순회하면서 가장 높은 점수의 카테고리를 선택.
  // (동점일 때 PRIORITY_ORDER가 앞쪽일수록 우선)
  let best: Category = "frontend";
  let bestScore = 0;
  for (const cat of PRIORITY_ORDER) {
    if (scores[cat] > bestScore) {
      best = cat;
      bestScore = scores[cat];
    }
  }

  return {
    category: best,
    confidence: bestScore > 0 ? "high" : "low",
    matchedKeywords: matchedByCategory[best],
    scores,
  };
}

// === 개발용 자체 검증 ===
// 실제 분류 결과가 의도한 카테고리와 일치하는지 콘솔로 표 출력.
// 의존성 추가 없이(테스트 러너 없이) 1차 검증을 위한 임시 도구.
// MVP 안정화 이후 vitest 도입 시 같은 케이스를 그대로 옮긴다.
const VERIFICATION_CASES: { input: string; expected: Category }[] = [
  { input: "히어로 섹션 구현해줘", expected: "frontend" },
  { input: "로그인 API 만들어줘", expected: "backend" },
  { input: "무한 스크롤 버그 고쳐줘", expected: "bugfix" },
  { input: "이 컴포넌트를 리팩터링 해줘", expected: "refactor" },
  { input: "사이드바 메뉴 만들어줘", expected: "frontend" },
  { input: "JWT 인증 토큰 발급 엔드포인트", expected: "backend" },
  { input: "버튼 클릭하면 에러 나는데 고쳐줘", expected: "bugfix" },
  { input: "중복된 코드 정리하고 가독성 좋게", expected: "refactor" },
  { input: "다크모드 토글 버튼", expected: "frontend" },
  { input: "데이터베이스 모델 스키마 설계", expected: "backend" },
];

export function runClassifierSelfCheck(): void {
  const rows = VERIFICATION_CASES.map(({ input, expected }) => {
    const result = classifyIntent(input);
    return {
      input,
      expected,
      got: result.category,
      confidence: result.confidence,
      pass: result.category === expected ? "PASS" : "FAIL",
      matched: result.matchedKeywords.slice(0, 3).join(", "),
    };
  });
  const failed = rows.filter((r) => r.pass === "FAIL").length;
  console.groupCollapsed(
    `[classifyIntent self-check] ${rows.length - failed}/${rows.length} passed`,
  );
  console.table(rows);
  console.groupEnd();
}
