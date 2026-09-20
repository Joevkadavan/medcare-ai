/**
 * API client.
 *
 * Every call goes through `request`, which normalises transport failures, HTTP
 * status codes, and 422 validation payloads into a single `ApiError` carrying a
 * message that is safe and useful to show a user.
 */

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number | null;
  detail?: unknown;

  constructor(message: string, status: number | null = null, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/** Map a status code to a message a patient can act on. */
function messageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "Some of the information sent was not understood. Please review your answers and try again.";
    case 401:
      return "This session is no longer authorised. Please start a new consultation.";
    case 404:
      return "The MedCare AI analysis service could not be found. It may be starting up — please try again in a moment.";
    case 422:
      return "Some answers were in an unexpected format. Please go back and check your selections.";
    case 429:
      return "There have been too many requests just now. Please wait a moment and try again.";
    case 500:
      return "MedCare AI is temporarily unable to complete the analysis. Please try again shortly.";
    case 502:
    case 503:
    case 504:
      return "MedCare AI is temporarily unable to reach the analysis service. It may be restarting — please try again in a moment.";
    default:
      return "Something unexpected happened while contacting MedCare AI. Please try again.";
  }
}

function extractDetail(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    if (first && typeof first.msg === "string") return first.msg;
  }
  return null;
}

async function request<T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const { timeoutMs = 45000, ...rest } = init || {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(rest.headers || {}),
      },
    });

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      const detail = extractDetail(payload);
      // eslint-disable-next-line no-console
      console.error("[MedCare AI] API error", {
        path,
        status: response.status,
        payload,
      });
      throw new ApiError(detail || messageForStatus(response.status), response.status, payload);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    // eslint-disable-next-line no-console
    console.error("[MedCare AI] transport failure", { path, error });

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(
        "The request took too long. MedCare AI may be starting up — please try again.",
        null,
        error,
      );
    }

    // A CORS rejection surfaces as a generic TypeError with no status.
    if (error instanceof TypeError) {
      throw new ApiError(
        "MedCare AI could not reach the analysis service. Check your connection, or try again in a moment.",
        null,
        error,
      );
    }

    throw new ApiError("Something unexpected happened. Please try again.", null, error);
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------- types -------------------------------- */

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "EMERGENCY";
export type AiMode = "mock" | "live";

export interface Source {
  title: string;
  organisation: string;
  url: string;
  snippet: string;
}

export interface Assessment {
  symptoms: string[];
  duration: string;
  severity: string;
  additional_symptoms: string[];
  notes: string;
}

export interface ConversationTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ConsultationResult {
  risk_level: RiskLevel;
  emergency: boolean;
  summary: string;
  reported: Partial<Assessment>;
  next_steps: string[];
  warning_signs: string[];
  seek_care_when: string[];
  sources: Source[];
  ai_mode: AiMode;
  rag_status: "RAG READY" | "RAG ACTIVE";
  disclaimer: string;
}

export interface ChatResult {
  message: string;
  next_question: string | null;
  options: string[];
  allow_free_text: boolean;
  risk_level: RiskLevel;
  emergency: boolean;
  complete: boolean;
  sources: Source[];
  ai_mode: AiMode;
}

export interface HealthResult {
  status: string;
  service: string;
  ai_mode: AiMode;
  rag_status: "RAG READY" | "RAG ACTIVE";
}

/* ------------------------------ endpoints ----------------------------- */

export function health() {
  return request<HealthResult>("/health", { method: "GET", timeoutMs: 15000 });
}

export function consultation(
  assessment: Assessment,
  conversation: ConversationTurn[],
  sessionId: string,
) {
  return request<ConsultationResult>("/consultation", {
    method: "POST",
    body: JSON.stringify({ assessment, conversation, session_id: sessionId }),
  });
}

export function chat(
  message: string,
  conversation: ConversationTurn[],
  assessment: Assessment,
  sessionId: string,
) {
  return request<ChatResult>("/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      conversation,
      assessment,
      session_id: sessionId,
    }),
  });
}

export function reset(sessionId: string) {
  return request<{ ok: boolean; message: string }>("/reset", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId }),
  });
}
