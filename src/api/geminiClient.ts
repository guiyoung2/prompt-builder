/** 프론트 → Vercel `/api/generate` 프록시 호출 (키는 서버 전용) */

export interface GenerateRequest {
  prompt: string;
  systemInstruction?: string;
}

interface ApiErrorBody {
  error?: string;
}

interface ApiSuccessBody {
  text?: string;
}

/** 호출 전 입력 검증 — 서버 400과 동일한 메시지 기준으로 맞춤 */
function assertValidRequest(params: GenerateRequest): void {
  if (typeof params.prompt !== "string" || params.prompt.trim() === "") {
    throw new Error("`prompt`는 비어 있지 않은 문자열이어야 합니다.");
  }
  const { systemInstruction } = params;
  if (
    systemInstruction !== undefined &&
    systemInstruction !== null &&
    typeof systemInstruction !== "string"
  ) {
    throw new Error("`systemInstruction`은 문자열이어야 합니다.");
  }
}

/**
 * Gemini 프록시를 통해 생성 텍스트를 받습니다.
 * @throws Error 검증 실패·HTTP 오류·파싱 실패 시 (메시지는 UI 표시용 한글 위주)
 */
export async function generateViaProxy(
  params: GenerateRequest,
): Promise<string> {
  assertValidRequest(params);

  const body: { prompt: string; systemInstruction?: string } = {
    prompt: params.prompt.trim(),
  };
  if (
    typeof params.systemInstruction === "string" &&
    params.systemInstruction.trim() !== ""
  ) {
    body.systemInstruction = params.systemInstruction;
  }

  let res: Response;
  try {
    res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "알 수 없는 네트워크 오류";
    throw new Error(`네트워크 오류: ${msg}`, { cause: e });
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error(
      res.ok
        ? "서버 응답을 JSON으로 읽을 수 없습니다."
        : `요청 실패 (HTTP ${String(res.status)})`,
    );
  }

  if (!res.ok) {
    const serverMsg =
      typeof json === "object" &&
      json !== null &&
      typeof (json as ApiErrorBody).error === "string"
        ? (json as ApiErrorBody).error
        : undefined;
    throw new Error(
      serverMsg ?? `요청 실패 (HTTP ${String(res.status)})`,
    );
  }

  const text =
    typeof json === "object" &&
    json !== null &&
    typeof (json as ApiSuccessBody).text === "string"
      ? (json as ApiSuccessBody).text
      : undefined;

  if (text === undefined || text.trim() === "") {
    throw new Error("서버가 유효한 텍스트 응답을 반환하지 않았습니다.");
  }

  return text;
}
