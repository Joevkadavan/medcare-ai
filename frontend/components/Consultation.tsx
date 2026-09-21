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

  const busy = useRef(false);
  const summaryBusy = useRef(false);
  const [failedText, setFailedText] = useState<string | null>(null);
  const [errorAction, setErrorAction] = useState<"send" | "summary" | "reset" | null>(null);
  const [continued, setContinued] = useState(false);
  const conversation: ConversationTurn[] = messages.map(({ role, content }) => ({ role, content }));

  /** Open the consultation with the first assistant turn. */
  const beginChat = useCallback(
    async (currentAssessment: Assessment) => {
      if (busy.current) return;
      busy.current = true;
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
        busy.current = false;
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

  const finish = async (history: ConversationTurn[] = conversation) => {
    if (summaryBusy.current) return;
    summaryBusy.current = true;
    setChecking(true);
    setError(null);
    setErrorAction(null);
    try {
      const response = await consultationRequest(assessment, history, sessionId.current);
      setResult(response);
      setPhase("result");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to prepare the summary. Please retry.");
      setErrorAction("summary");
    } finally { setChecking(false); summaryBusy.current = false; }
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy.current || checking || emergencyInChat) return;
    if (trimmed.length > 2000 || messages.length >= 38) {
      setError("This consultation has reached its limit. View your summary or start a new consultation.");
      return;
    }
    busy.current = true;
    const outgoing = message("user", trimmed);
    setMessages([...messages, outgoing]);
    setPending(true);
    setError(null);
    setErrorAction(null);
    setFailedText(null);
    try {
      const response = await chatRequest(trimmed, conversation, assessment, sessionId.current, continued ? "question" : "consultation");
      const nextMessages = [...messages, outgoing, { ...message("assistant", response.message), sources: response.sources }];
      setMessages(nextMessages);
      setAiMode(response.ai_mode);
      setOptions(response.options);
      setEmergencyInChat(response.emergency);
      if (response.complete && !response.emergency && !continued) {
        await finish(nextMessages.map(({ role, content }) => ({ role, content })));
      }
    } catch (caught) {
      setMessages(messages); // Retry sends the failed turn exactly once.
      setFailedText(trimmed);
      setErrorAction("send");
      setError(caught instanceof ApiError ? caught.message : "Unable to send your response. Please retry.");
    } finally {
      setPending(false);
      busy.current = false;
    }
  };

  const restart = async () => {
    if (busy.current || checking) return;
    busy.current = true;
    setChecking(true);
    setError(null);
    try {
      await resetRequest(sessionId.current);
      sessionId.current = newSessionId();
      setAnswers(EMPTY_ANSWERS);
      setMessages([]);
      setOptions([]);
      setResult(null);
      setEmergencyInChat(false);
      setAiMode(undefined);
      setFailedText(null);
      setErrorAction(null);
      setContinued(false);
      setPhase("quiz");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to clear the session. Please retry.");
      setErrorAction("reset");
    } finally { busy.current = false; setChecking(false); }
  };

  const retry = () => {
    if (errorAction === "reset") void restart();
    else if (errorAction === "summary") void finish();
    else if (failedText) void send(failedText);
  };

  return (
    <section id="consultation" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="label-muted">Start a consultation</p>
          <h2 className="section-title mt-2">Your health assessment</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
            Answer a few questions and MedCare AI will ask anything else it needs to know.
            MedCare AI provides informational guidance and does not replace professional medical advice.
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
                  inputDisabled={emergencyInChat || checking || messages.length >= 38 || !!failedText}
                  options={options}
                  aiMode={aiMode}
                  onSend={(text) => void send(text)}
                  banner={
                    error ? (
                      <ErrorState
                        message={error}
                        compact
                        onRetry={retry}
                        retrying={pending || checking}
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
                    hint="Preparing your informational guidance."
                    compact
                  />
                )}

                {error && !pending && errorAction === "summary" && (
                  <ErrorState message={error} compact onRetry={retry} retrying={pending || checking} />
                )}
              </aside>
            </div>
          )}

          {phase === "result" && error && <ErrorState message={error} onRetry={retry} retrying={checking} />}
          {phase === "result" && result && (
            <ResultDashboard
              result={result}
              pending={checking}
              onContinueChat={() => { setContinued(true); setPhase("chat"); }}
              onRestart={() => void restart()}
            />
          )}
        </div>
      </div>
    </section>
  );
}
