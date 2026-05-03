export const lightTheme = {
  color: {
    bg: "#fafbfc",
    surface: "#ffffff",
    surfaceMuted: "#f3f5f8",
    surfaceHover: "#f1f5f9",
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

    // 결과 마크다운 패널 (라이트)
    resultBg: "#f8fafc",
    resultBorder: "#e3e8ee",

    // 기존 다크 코드 토큰 (타입 호환 유지)
    codeBg: "#0f172a",
    codeBorder: "#1e293b",
    codeText: "#e2e8f0",
    codeMuted: "#94a3b8",
  },
  radius: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    xl: "20px",
    xxl: "28px",
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
    sm: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
    md: "0 4px 12px rgba(15, 23, 42, 0.08), 0 1px 4px rgba(15, 23, 42, 0.05)",
    lg: "0 12px 32px rgba(15, 23, 42, 0.10), 0 4px 12px rgba(15, 23, 42, 0.06)",
  },
  layout: {
    maxWidth: "720px",
  },
} as const;

export type AppTheme = typeof lightTheme;
