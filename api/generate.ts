import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Gemini generateContent 요약 응답 (필요 필드만) */
interface GeminiCandidate {
  content?: { parts?: { text?: string }[] };
}
interface GeminiApiResponse {
  candidates?: GeminiCandidate[];
  error?: { code?: number; message?: string; status?: string };
}

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/** JSON.parse 실패 시 반환되는 단일 sentinel (매번 Symbol() 새로 만들면 비교 불가) */
const INVALID_JSON_BODY = Symbol("invalid_json_body");

function parseJsonBody(req: VercelRequest): unknown | typeof INVALID_JSON_BODY {
  const raw = req.body;
  if (raw === undefined || raw === null || raw === "") {
    return undefined;
  }
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return INVALID_JSON_BODY;
    }
  }
  if (typeof raw === "object") {
    return raw;
  }
  return undefined;
}

function isNonEmptyPrompt(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** POST /api/generate — Gemini Flash 프록시 (키는 GEMINI_API_KEY) */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader("Access-Control-Max-Age", "86400");
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    res
      .status(503)
      .json({ error: "GEMINI_API_KEY 가 서버 환경에 설정되어 있지 않습니다." });
    return;
  }

  const parsed = parseJsonBody(req);
  if (parsed === INVALID_JSON_BODY) {
    res.status(400).json({ error: "JSON 파싱에 실패했습니다." });
    return;
  }
  if (parsed === undefined || typeof parsed !== "object" || parsed === null) {
    res.status(400).json({ error: "요청 본문이 비어 있거나 객체가 아닙니다." });
    return;
  }

  const { prompt, systemInstruction } = parsed as {
    prompt?: unknown;
    systemInstruction?: unknown;
  };

  if (!isNonEmptyPrompt(prompt)) {
    res.status(400).json({ error: "`prompt`(비어 있지 않은 문자열)가 필요합니다." });
    return;
  }

  if (
    systemInstruction !== undefined &&
    systemInstruction !== null &&
    typeof systemInstruction !== "string"
  ) {
    res
      .status(400)
      .json({ error: "`systemInstruction`은 문자열이어야 합니다." });
    return;
  }

  const geminiPayload: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  };

  if (typeof systemInstruction === "string" && systemInstruction.trim() !== "") {
    geminiPayload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  let geminiRes: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    geminiRes = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      res.status(504).json({ error: "Gemini 응답 시간 초과 (15초)" });
      return;
    }
    const msg = e instanceof Error ? e.message : "알 수 없는 네트워크 오류";
    res.status(502).json({ error: `Gemini 호출 실패: ${msg}` });
    return;
  } finally {
    clearTimeout(timeoutId);
  }

  const geminiJson = (await geminiRes.json()) as GeminiApiResponse;

  if (!geminiRes.ok) {
    const message =
      geminiJson.error?.message ??
      `Gemini HTTP ${geminiRes.status}`;
    res.status(502).json({ error: message });
    return;
  }

  const text =
    geminiJson.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("") ?? "";

  if (!text.trim()) {
    res
      .status(502)
      .json({ error: "Gemini가 빈 텍스트를 반환했습니다.", raw: geminiJson });
    return;
  }

  res.status(200).json({ text });
}
