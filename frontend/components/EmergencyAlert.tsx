"use client";

import { AlertTriangle } from "lucide-react";

interface EmergencyAlertProps {
  /** Optional detail lines explaining what was detected. */
  reasons?: string[];
  compact?: boolean;
}

export default function EmergencyAlert({ reasons = [], compact = false }: EmergencyAlertProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="animate-fade-up overflow-hidden rounded-2xl border-2 border-red-500/60 bg-red-500/[0.08] shadow-[0_0_40px_-12px_rgba(239,68,68,0.5)]"
    >
      <div className="flex items-start gap-3 border-b border-red-500/30 bg-red-500/10 p-4 sm:p-5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-300">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-red-200 sm:text-base">
            Urgent medical attention
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-red-100/90">
            Some symptoms you entered may require immediate medical attention.
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <ul className="space-y-2.5 text-sm leading-relaxed text-red-50/90">
          <li className="flex gap-2.5">
            <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
            <span>
              Contact your local emergency services now, or go to the nearest emergency
              department.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
            <span>
              Do not wait to see whether the symptoms settle on their own before seeking
              care.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
            <span>
              If you are with someone, tell them what you are experiencing and stay with
              them.
            </span>
          </li>
        </ul>

        {!compact && reasons.length > 0 && (
          <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[0.05] p-3.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-200/80">
              What was detected
            </p>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-red-100/75">
              {reasons.slice(0, 6).map((reason) => (
                <li key={reason} className="break-words">
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-4 text-xs leading-relaxed text-red-100/60">
          This is a possible warning sign, not a diagnosis. A healthcare professional can
          assess what is actually happening.
        </p>
      </div>
    </div>
  );
}
