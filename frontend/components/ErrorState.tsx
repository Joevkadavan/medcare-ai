"use client";

import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  compact?: boolean;
}

export default function ErrorState({
  message,
  onRetry,
  retrying = false,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={[
        "animate-fade-in rounded-xl border border-amber-400/35 bg-amber-400/[0.07]",
        compact ? "p-3.5" : "p-4 sm:p-5",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
          <AlertCircle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-amber-50/95">{message}</p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-400/40 px-3.5 py-2 text-xs font-semibold text-amber-100 transition hover:border-amber-300 hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {retrying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {retrying ? "Retrying…" : "Try again"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
