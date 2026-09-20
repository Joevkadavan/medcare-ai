"use client";

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  label: string;
  hint?: string;
  compact?: boolean;
}

export default function LoadingState({ label, hint, compact = false }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "animate-fade-in rounded-xl border border-white/10 bg-white/[0.03]",
        compact ? "p-3.5" : "p-5 sm:p-6",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-200">{label}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
      </div>

      {!compact && (
        <div className="mt-4 space-y-2" aria-hidden>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-2.5 animate-pulse rounded-full bg-white/[0.06]"
              style={{ width: `${88 - index * 18}%`, animationDelay: `${index * 140}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
