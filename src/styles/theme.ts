// 라이트 메인 + 결과 영역만 다크 패널 하이브리드 토큰
// 추후 다크 모드 도입 시 동일 키 구조로 darkTheme 한 벌 추가하고
// ThemeProvider에서 스왑하는 식으로 확장 가능.

export const lightTheme = {
  color: {
    bg: "#fafbfc",
    surface: "#ffffff",
    surfaceMuted: "#f3f5f8",
    border: "#e3e8ee",
    borderStrong: "#cdd5df",
    text: "#0f172a",
    textMuted: "#475569",
    textSubtle: "#94a3b8",

    primary: "#3b82f6",
    primaryHover: "#2563eb",
    primarySoft: "#dbeafe",
    primaryText: "#1e3a8a",

    danger: "#ef4444",
    success: "#10b981",

    codeBg: "#0f172a",
    codeBorder: "#1e293b",
    codeText: "#e2e8f0",
    codeMuted: "#94a3b8",
  },
  radius: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    pill: "999px",
  },
  space: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    xxl: "32px",
  },
  font: {
    sans: `system-ui, -apple-system, "Segoe UI", Roboto, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`,
    mono: `"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace`,
  },
  shadow: {
    sm: "0 1px 2px rgba(15, 23, 42, 0.04)",
    md: "0 2px 8px rgba(15, 23, 42, 0.06)",
    lg: "0 8px 24px rgba(15, 23, 42, 0.08)",
  },
  layout: {
    maxWidth: "720px",
  },
} as const;

export type AppTheme = typeof lightTheme;
