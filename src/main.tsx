import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "styled-components";
import { GlobalStyle } from "./styles/GlobalStyle";
import { lightTheme } from "./styles/theme";
import App from "./App.tsx";
import { runClassifierSelfCheck } from "./features/intent/classifyIntent";

if (import.meta.env.DEV) {
  runClassifierSelfCheck();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={lightTheme}>
      <GlobalStyle />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
