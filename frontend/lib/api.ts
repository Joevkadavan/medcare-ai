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

function validResponse(path: string, value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  const str = (v: unknown): v is string => typeof v === "string" && v.length <= 100000;
  const strings = (v: unknown) => Array.isArray(v) && v.length <= 100 && v.every(str);
  if (path === "/reset") return p.ok === true && str(p.message);
  const mode = p.ai_mode === "mock" || p.ai_mode === "live";
  const rag = ["RAG_DISABLED", "RAG_READY", "RAG_ACTIVE"].includes(String(p.rag_status));
  if (path === "/health") return p.status === "ok" && str(p.service) && mode && rag;
  if (!mode || !["LOW", "MODERATE", "HIGH", "EMERGENCY"].includes(String(p.risk_level)) ||
      typeof p.emergency !== "boolean" || (p.emergency !== (p.risk_level === "EMERGENCY")) ||
      !str(p.session_id) || !str(p.session_token) || !Array.isArray(p.sources)) return false;
  if (!p.sources.every((source: unknown) => {
    if (!source || typeof source !== "object") return false;
    const v = source as Record<string, unknown>;
    return str(v.id) && str(v.section) && str(v.verified_on) && typeof v.score === "number" && Number.isFinite(v.score) && str(v.title) && str(v.organisation) && str(v.snippet) && str(v.url) && /^https:\/\//.test(v.url);
  })) return false;
  if (path === "/chat") return rag && ["follow_up", "retrieval", "abstain", "emergency"].includes(String(p.answer_mode)) && str(p.message) && p.message.trim().length > 0 && strings(p.options) &&
    typeof p.complete === "boolean" && typeof p.allow_free_text === "boolean";
  const r = p.reported as Record<string, unknown> | undefined;
  return !!r && typeof r === "object" && strings(r.symptoms) && strings(r.additional_symptoms) &&
    str(r.duration) && str(r.severity) && str(r.notes) && str(p.summary) && str(p.disclaimer) &&
    strings(p.next_steps) && strings(p.warning_signs) && strings(p.seek_care_when) && strings(p.follow_up_answers) && rag;
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
      throw new ApiError(messageForStatus(response.status), response.status);
    }
    if (!validResponse(path, payload)) {
      throw new ApiError("The service returned an invalid response. Please try again.", response.status);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    // eslint-disable-next-line no-console
    console.error("[MedCare AI] transport failure", { path });

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
  id: string;
  section: string;
  verified_on: string;
  score: number;
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
  role: "user" | "assistant";
  content: string;
}

export interface ConsultationResult {
  session_id: string;
  session_token: string;
  follow_up_answers: string[];
  risk_level: RiskLevel;
  emergency: boolean;
  summary: string;
  reported: Partial<Assessment>;
  next_steps: string[];
  warning_signs: string[];
  seek_care_when: string[];
  sources: Source[];
  ai_mode: AiMode;
  rag_status: "RAG_DISABLED" | "RAG_READY" | "RAG_ACTIVE";
  disclaimer: string;
}

export interface ChatResult {
  rag_status: "RAG_DISABLED" | "RAG_READY" | "RAG_ACTIVE";
  answer_mode: "follow_up" | "retrieval" | "abstain" | "emergency";
  session_id: string;
  session_token: string;
  message: string;
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
  rag_status: "RAG_DISABLED" | "RAG_READY" | "RAG_ACTIVE";
}

/* ------------------------------ endpoints ----------------------------- */

export function health() {
  return request<HealthResult>("/health", { method: "GET", timeoutMs: 15000 });
}

// Credentials live only in memory and are never placed in URLs or persistent storage.
const sessions = new Map<string, { session_id: string; session_token: string }>();
async function sessionRequest<T extends ChatResult | ConsultationResult>(path: string, key: string, body: object) {
  const result = await request<T>(path, {
    method: "POST", body: JSON.stringify({ ...body, ...sessions.get(key) }),
  });
  sessions.set(key, { session_id: result.session_id, session_token: result.session_token });
  return result;
}
export function consultation(assessment: Assessment, conversation: ConversationTurn[], sessionId: string) {
  return sessionRequest<ConsultationResult>("/consultation", sessionId, { assessment, conversation });
}
export function chat(message: string, conversation: ConversationTurn[], assessment: Assessment, sessionId: string, intent: "consultation" | "question" = "consultation") {
  return sessionRequest<ChatResult>("/chat", sessionId, { message, conversation, assessment, intent });
}
export async function reset(sessionId: string) {
  const credentials = sessions.get(sessionId);
  if (!credentials) return;
  await request<{ ok: boolean; message: string }>("/reset", {
    method: "POST", body: JSON.stringify(credentials),
  });
  sessions.delete(sessionId);
}

export function askQuestion(message: string, conversation: ConversationTurn[], sessionId: string) {
  return sessionRequest<ChatResult>("/chat", sessionId, { message, conversation, intent: "question" });
}
