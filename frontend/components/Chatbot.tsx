"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import SourceList from "./SourceList";
import type { Source, AiMode } from "@/lib/api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: Date;
  sources?: Source[];
}

interface ChatbotProps {
  messages: ChatMessage[];
  pending: boolean;
  options: string[];
  inputDisabled?: boolean;
  banner?: React.ReactNode;
  aiMode?: AiMode;
  onSend: (text: string) => void;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.04] px-4 py-3">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-accent"
          style={{ animationDelay: `${index * 160}ms` }}
        />
      ))}
      <span className="sr-only">MedCare AI is typing</span>
    </div>
  );
}

export default function Chatbot({
  messages,
  pending,
  options,
  inputDisabled = false,
  banner,
  aiMode,
  onSend,
}: ChatbotProps) {
  const [value, setValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view as the conversation grows.
  useEffect(() => {
    const container = bottomRef.current?.parentElement;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, pending]);

  const submit = () => {
    const text = value.trim();
    if (!text || pending || inputDisabled) return;
    onSend(text);
    setValue("");
  };

  const sendOption = (option: string) => {
    if (pending || inputDisabled) return;
    onSend(option);
  };

  return (
    <div className="card-surface flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">MedCare AI</p>
            <p className="truncate text-xs text-slate-400">AI Health Assistant</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {aiMode && (
            <span className="hidden rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:inline-block">
              {aiMode === "live" ? "Live AI" : "Fallback mode"}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
            {pending ? "Responding" : "Consultation"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        className="chat-scroll flex-1 space-y-3.5 overflow-y-auto px-4 py-5 sm:px-5"
        role="log" aria-label="Conversation" aria-live="polite"
        style={{ maxHeight: "min(50dvh, 30rem)" }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={[
              "flex animate-fade-up",
              message.role === "user" ? "justify-end" : "justify-start",
            ].join(" ")}
          >
            <div className="max-w-[86%] sm:max-w-[78%]">
              <div
                className={[
                  "whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "rounded-br-md bg-accent text-[#04222b]"
                    : "rounded-bl-md border border-white/10 bg-white/[0.04] text-slate-100",
                ].join(" ")}
              >
                {message.content}
                <SourceList sources={message.sources || []} />
              </div>
              <p
                className={[
                  "mt-1.5 text-[10px] text-slate-500",
                  message.role === "user" ? "text-right" : "text-left",
                ].join(" ")}
              >
                {formatTime(message.at)}
              </p>
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex animate-fade-in justify-start">
            <TypingIndicator />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested answers */}
      {options.length > 0 && !pending && !inputDisabled && (
        <div className="animate-fade-in border-t border-white/10 px-4 py-3 sm:px-5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Suggested answers
          </p>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => sendOption(option)}
                className="rounded-full border border-accent/30 bg-accent/[0.07] px-3.5 py-2 text-xs font-medium text-accent-soft transition hover:border-accent/60 hover:bg-accent/[0.13] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
              >
                {option}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Or type your own response below if none of these fit.
          </p>
        </div>
      )}

      {banner && <div className="px-4 pb-1 sm:px-5">{banner}</div>}

      {/* Composer */}
      <div className="border-t border-white/10 bg-white/[0.02] p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends; Shift+Enter inserts a newline. Touch users get the
              // explicit button, so this never traps them.
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            rows={1}
            maxLength={2000}
            disabled={pending || inputDisabled}
            placeholder={inputDisabled ? "View your guidance below" : "Type your response..."}
            aria-label="Type your response"
            className="w-full max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-white/12 bg-[#07111f] px-3.5 py-3 text-base leading-snug text-slate-100 placeholder:text-slate-500 transition focus:border-accent/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60 sm:text-sm"
          />

          <button
            type="button"
            onClick={submit}
            disabled={pending || inputDisabled || value.trim().length === 0}
            aria-label="Send response"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-[#04222b] transition hover:bg-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111f] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
