"use client";
import { useRef, useState } from "react";
import { ApiError, askQuestion, reset } from "@/lib/api";
import Chatbot, { type ChatMessage } from "./Chatbot";
import EmergencyAlert from "./EmergencyAlert";
import ErrorState from "./ErrorState";

export default function KnowledgeQA() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [emergency, setEmergency] = useState(false);
  const [status, setStatus] = useState("");
  const [resetFailed, setResetFailed] = useState(false);
  const session = useRef("knowledge-qa");
  const busy = useRef(false);
  const send = async (text: string) => {
    if (busy.current || emergency || !text.trim() || messages.length >= 38) return;
    busy.current = true;
    setPending(true);
    setError(null);
    setFailed(null);
    setResetFailed(false);
    try {
      const response = await askQuestion(text.trim(), messages.map(({ role, content }) => ({ role, content })), session.current);
      setMessages([...messages,
        { id: crypto.randomUUID(), role: "user", content: text.trim(), at: new Date() },
        { id: crypto.randomUUID(), role: "assistant", content: response.message, at: new Date(), sources: response.sources }]);
      setEmergency(response.emergency);
      setStatus(response.answer_mode === "retrieval" ? "Retrieved answer · Sources shown below" : response.answer_mode === "abstain" ? "No supported answer available" : "Urgent guidance");
    } catch (caught) {
      setFailed(text);
      setError(caught instanceof ApiError ? caught.message : "Unable to answer. Please retry.");
    } finally { setPending(false); busy.current = false; }
  };
  const clear = async () => {
    if (busy.current) return;
    busy.current = true; setPending(true); setError(null);
    try {
      await reset(session.current);
      session.current = crypto.randomUUID();
      setMessages([]); setEmergency(false); setStatus(""); setFailed(null); setResetFailed(false);
    } catch (caught) {
      setResetFailed(true);
      setError(caught instanceof ApiError ? caught.message : "Unable to reset. Please retry.");
    } finally { setPending(false); busy.current = false; }
  };
  return <div className="mt-8 space-y-4">
    <div>
      <h3 className="text-xl font-semibold text-white">Ask a health question</h3>
      <p className="mt-2 text-sm text-slate-400">Answers use reviewed NHS passages with linked sources. Coverage is limited to the topics below. MedCare AI provides informational guidance and does not replace professional medical advice.</p>
    </div>
    {emergency && <EmergencyAlert />}
    {status && <p role="status" className="text-sm text-cyan-200">{status}</p>}
    <Chatbot messages={messages} pending={pending} inputDisabled={emergency || !!failed || messages.length >= 38}
      options={messages.length ? [] : ["What is a fever?", "How long can a cough last?", "When should I seek care for tiredness?"]}
      onSend={(text) => void send(text)}
      banner={error ? <ErrorState message={error} retrying={pending} onRetry={() => resetFailed ? void clear() : void send(failed || "")} /> : null} />
    {messages.length >= 38 && <p className="text-sm text-slate-300">Conversation limit reached. Clear this chat to start again.</p>}
    {(messages.length > 0 || error) && <button type="button" onClick={() => void clear()} disabled={pending} className="btn-ghost">Clear question history</button>}
  </div>;
}
