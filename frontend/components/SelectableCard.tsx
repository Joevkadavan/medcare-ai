"use client";

import { Check } from "lucide-react";

interface SelectableCardProps {
  label: string;
  hint?: string;
  selected: boolean;
  onToggle: () => void;
  compact?: boolean;
}

/**
 * A selectable answer card. Selected state is expressed with a cyan border and
 * a soft glow, with a check icon — the identity called for in the design spec.
 */
export default function SelectableCard({
  label,
  hint,
  selected,
  onToggle,
  compact = false,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={[
        "group relative flex w-full items-start gap-3 rounded-xl border text-left transition-all duration-200",
        compact ? "px-3.5 py-3" : "px-4 py-3.5",
        selected
          ? "border-accent/70 bg-accent/[0.07] shadow-glow-sm"
          : "border-white/10 bg-white/[0.02] hover:border-accent/40 hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <span
        className={[
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
          selected
            ? "border-accent bg-accent text-[#04222b]"
            : "border-white/25 text-transparent group-hover:border-accent/50",
        ].join(" ")}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={[
            "block text-sm font-medium sm:text-[0.95rem]",
            selected ? "text-white" : "text-slate-200",
          ].join(" ")}
        >
          {label}
        </span>
        {hint && (
          <span className="mt-1 block text-xs leading-relaxed text-slate-400">
            {hint}
          </span>
        )}
      </span>
    </button>
  );
}
