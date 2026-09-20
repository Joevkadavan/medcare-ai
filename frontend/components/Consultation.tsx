"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Loader2, Stethoscope } from "lucide-react";
import {
  ApiError,
  chat as chatRequest,
  consultation as consultationRequest,
  reset as resetRequest,
  type Assessment,
  type ConsultationResult,
  type ConversationTurn,
} from "@/lib/api";
import Chatbot, { type ChatMessage } from "./Chatbot";
import ConsultationQuiz, { EMPTY_ANSWERS, type QuizAnswers } from "./ConsultationQuiz";
import EmergencyAlert from "./EmergencyAlert";
import ErrorState from "./ErrorState";
import LoadingState from "./LoadingState";
import ResultDashboard from "./ResultDashboard";

type Phase = "quiz" | "chat" | "analyzing" | "result";

/** A fresh session id per consultation. */
function newSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function message(role: "user" | "assistant", content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    at: new Date(),
  };
}

export default function Consultation() {
  const [phase, setPhase] = useState<Phase>("quiz");
  const [answers, setAnswers] = useState<QuizAnswers>(EMPTY_ANSWERS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConsultationResult | null>(null);
  const [aiMode, setAiMode] = useState<"mock" | "live" | undefined>(undefined);
  const [emergencyInChat, setEmergencyInChat] = useState(false);
  const [checking, setChecking] = useState(false);

  const sessionId = useRef<string>(newSessionId());

  /** Turn the quiz answers into the API's assessment shape. */
  const assessment = useMemo<Assessment>(() => {
    const symptoms = answers.symptoms
      .filter((item) => item !== "Other")
      .concat(answers.symptoms.includes("Other") && answers.otherSymptom
        ? [answers.otherSymptom.trim()]
        : []);

    const additional = answers.additional
      .filter((item) => item !== "Other")
      .concat(answers.additional.includes("Other") && answers.otherAdditional
        ? [answers.otherAdditional.trim()]
        : []);

    return {
      symptoms,
      duration: answers.duration,
      severity: answers.severity,
      additional_symptoms: additional,
      notes: answers.notes,
    };
  }, [answers]);

  /** Chat history in the shape the backend expects. */
  const conversation = useMemo<ConversationTurn[]>(() => {
    const turns: ConversationTurn[] = [
      { role: "assistant", content: "What are you experiencing?" },
      { role: "user", content: assessment.symptoms.join(", ") || "Not specified" },
    ];
    if (assessment.duration) {
      turns.push({ role: "user", content: `Duration: ${assessment.duration}` });
    }
    if (assessment.severity) {
      turns.push({ role: "user", content: `Severity: ${assessment.severity}` });
    }
    for (const entry of messages.filter((item) => item.role === "user")) {
      turns.push({ role: "user", content: entry.content });
    }
    for (const entry of messages.filter((item) => item.role === "assistant")) {
      turns.push({ role: "assistant", content: entry.content });
    }
    return turns;
  }, [assessment, messages]);

  /** Open the consultation with the first assistant turn. */
  const beginChat = useCallback(
    async (currentAssessment: Assessment) => {
      setPhase("chat");
      setPending(true);
      setError(null);
      try {
        const response = await chatRequest("", [], currentAssessment, sessionId.current);
        setAiMode(response.ai_mode);
        setMessages([message("assistant", response.message)]);
        setOptions(response.options);
        if (response.emergency) setEmergencyInChat(true);
      } catch (caught) {
        setError(
          caught instanceof ApiError
            ? caught.message
            : "MedCare AI could not start the consultation. Please try again.",
        );
        setPhase("quiz");
      } finally {
        setPending(false);
      }
    },
    [],
  );

  const handleQuizComplete = (completed: QuizAnswers) => {
    setAnswers(completed);

    const symptoms = completed.symptoms
      .filter((item) => item !== "Other")
      .concat(completed.symptoms.includes("Other") && completed.otherSymptom
        ? [completed.otherSymptom.trim()]
        : []);
    const additional = completed.additional
      .filter((item) => item !== "Other")
      .concat(completed.additional.includes("Other") && completed.otherAdditional
        ? [completed.otherAdditional.trim()]
        : []);

    void beginChat({
      symptoms,
      duration: completed.duration,
      severity: completed.severity,
      additional_symptoms: additional,
      notes: completed.notes,
    });
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const outgoing = message("user", trimmed);
    setMessages((current) => [...current, outgoing]);
    setPending(true);
    setError(null);

    try {
      const response = await chatRequest(
        trimmed,
        conversation,
        assessment,
        sessionId.current,
      );
      setAiMode(response.ai_mode);
      setMessages((current) => [...current, message("assistant", response.message)]);
      setOptions(response.options);
      if (response.emergency) setEmergencyInChat(true);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "MedCare AI could not respond just now. Please try again.",
      );
      setOptions([]);
    } finally {
      setPending(false);
    }
  };

  /** Fetch the full result dashboard and switch to it. */
  const finish = async () => {
    setChecking(true);
    setError(null);
    try {
      const response = await consultationRequest(
        assessment,
        conversation,
        sessionId.current,
      );
      setResult(response);
      setAiMode(response.ai_mode);
      setPhase("result");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "MedCare AI could not put your summary together. Please try again.",
      );
    } finally {
      setChecking(false);
    }
  };

  const restart = async () => {
    const previous = sessionId.current;
    sessionId.current = newSessionId();
    setAnswers(EMPTY_ANSWERS);
    setMessages([]);
    setOptions([]);
    setResult(null);
    setError(null);
    setEmergencyInChat(false);
    setPhase("quiz");
    try {
      await resetRequest(previous);
    } catch {
      // A failed reset is not worth interrupting the user for — the new session
      // id already isolates them from the old one.
    }
  };

  return (
    <section id="consultation" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="label-muted">Start a consultation</p>
          <h2 className="section-title mt-2">Your health assessment</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
            Answer a few questions and MedCare AI will ask anything else it needs to know.
            This is general health guidance, not a diagnosis.
          </p>
        </div>

        <div className="mt-8">
          {phase === "quiz" && (
            <>
              {error && (
                <div className="mb-4">
                  <ErrorState
                    message={error}
                    onRetry={() => void beginChat(assessment)}
                  />
                </div>
              )}
              <ConsultationQuiz
                answers={answers}
                onChange={setAnswers}
                onComplete={handleQuizComplete}
              />
            </>
          )}

          {phase === "chat" && (
            <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
              {/* Chat */}
              <div>
                {emergencyInChat && (
                  <div className="mb-4">
                    <EmergencyAlert compact />
                  </div>
                )}
                <Chatbot
                  messages={messages}
                  pending={pending}
                  options={options}
                  aiMode={aiMode}
                  onSend={(text) => void send(text)}
                  banner={
                    error ? (
                      <ErrorState
                        message={error}
                        compact
                        onRetry={() => void send(messages.at(-1)?.content || "")}
                      />
                    ) : null
                  }
                />
              </div>

              {/* Side rail */}
              <aside className="space-y-4">
                <div className="card-surface p-4 sm:p-5">
                  <p className="label-muted">Your answers so far</p>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">Symptoms</dt>
                      <dd className="mt-0.5 break-words text-slate-200">
                        {assessment.symptoms.join(", ") || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Duration</dt>
                      <dd className="mt-0.5 text-slate-200">{assessment.duration || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Severity</dt>
                      <dd className="mt-0.5 text-slate-200">{assessment.severity || "—"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="card-surface p-4 sm:p-5">
                  <p className="text-sm font-semibold text-white">
                    Ready to see your summary?
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                    You can finish at any point — you will still be able to keep chatting
                    afterwards.
                  </p>
                  <button
                    type="button"
                    onClick={() => void finish()}
                    disabled={checking || pending}
                    className="btn-primary mt-4 w-full"
                  >
                    {checking ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analysing…
                      </>
                    ) : (
                      <>
                        <Stethoscope className="h-4 w-4" />
                        View my summary
                      </>
                    )}
                  </button>
                </div>

                {checking && (
                  <LoadingState
                    label="Analysing your symptoms…"
                    hint="Grading your assessment and retrieving relevant guidance."
                    compact
                  />
                )}

                {error && !pending && (
                  <ErrorState message={error} compact onRetry={() => void finish()} />
                )}
              </aside>
            </div>
          )}

          {phase === "result" && result && (
            <ResultDashboard
              result={result}
              onContinueChat={() => setPhase("chat")}
              onRestart={() => void restart()}
            />
          )}
        </div>
      </div>
    </section>
  );
}
