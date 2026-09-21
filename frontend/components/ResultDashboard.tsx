"use client";

import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  ClipboardList,
  ExternalLink,
  Gauge,
  RotateCcw,
  Stethoscope,
} from "lucide-react";
import type { ConsultationResult } from "@/lib/api";
import { RISK_STYLES } from "@/lib/constants";
import EmergencyAlert from "./EmergencyAlert";

interface ResultDashboardProps {
  result: ConsultationResult;
  pending?: boolean;
  onContinueChat: () => void;
  onRestart: () => void;
}

function Field({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        <Icon className="h-3.5 w-3.5 text-accent" />
        {label}
      </p>
      <p className="mt-2 break-words text-sm leading-relaxed text-slate-200">{value || "—"}</p>
    </div>
  );
}

export default function ResultDashboard({
  result,
  pending = false,
  onContinueChat,
  onRestart,
}: ResultDashboardProps) {
  const risk = RISK_STYLES[result.risk_level] ?? RISK_STYLES.LOW;
  const reported = result.reported || {};

  const allSymptoms = [
    ...(reported.symptoms || []),
    ...(reported.additional_symptoms || []),
  ].filter((item) => item && item.toLowerCase() !== "none of these");

  return (
    <div className="space-y-5">
      {/* Emergency outranks everything else on the page. */}
      {result.emergency && <EmergencyAlert />}

      {/* Header / risk */}
      <div className="card-surface overflow-hidden">
        <div className="border-b border-white/10 bg-white/[0.02] p-4 sm:p-6">
          <p className="label-muted">Your consultation summary</p>
          <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
            Here is what you told us
          </h2>
        </div>

        <div className="p-4 sm:p-6">
          <div
            className={[
              "flex items-center gap-4 rounded-xl border p-4",
              risk.border,
              risk.bg,
            ].join(" ")}
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#07111f]">
              <span className={["h-3 w-3 animate-pulse-dot rounded-full", risk.dot].join(" ")} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Risk level
              </p>
              <p className={["mt-0.5 text-lg font-semibold", risk.text].join(" ")}>
                {result.risk_level} · {risk.label}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Field
              icon={Stethoscope}
              label="Reported symptoms"
              value={allSymptoms.join(", ")}
            />
            <Field icon={CalendarClock} label="Duration" value={reported.duration || ""} />
            <Field icon={Gauge} label="Severity" value={reported.severity || ""} />
          </div>

          {reported.notes && (
            <div className="mt-3">
              <Field icon={ClipboardList} label="What else you mentioned" value={reported.notes} />
            </div>
          )}
        </div>
      </div>

      {result.follow_up_answers.length > 0 && <div className="card-surface p-4 sm:p-6">
        <Field icon={ClipboardList} label="Follow-up answers" value={result.follow_up_answers.join(" · ")} />
      </div>}
      {/* AI guidance */}
      <div className="card-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-white">Guidance</h3>
          <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">
            {result.ai_mode === "live" ? "Live AI" : "Fallback mode"} · {result.rag_status}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{result.summary}</p>
        <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs leading-relaxed text-slate-400">
          {result.disclaimer}
        </p>
      </div>

      {/* Next steps + warning signs */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card-surface p-4 sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <ArrowRight className="h-4 w-4 text-accent" />
            Recommended next steps
          </h3>
          <ul className="mt-4 space-y-3">
            {result.next_steps.map((step) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                <span className="mt-[0.5rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-surface p-4 sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Warning signs to watch for
          </h3>
          <ul className="mt-4 space-y-3">
            {result.warning_signs.map((sign) => (
              <li key={sign} className="flex gap-3 text-sm leading-relaxed text-slate-400">
                <span className="mt-[0.5rem] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/70" />
                <span>{sign}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* When to seek care */}
      <div className="card-surface p-4 sm:p-6">
        <h3 className="text-base font-semibold text-white">When to seek medical attention</h3>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {result.seek_care_when.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-400">
              <span className="mt-[0.5rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Sources */}
      {result.sources.length > 0 && (
        <div className="card-surface p-4 sm:p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <BookOpen className="h-4 w-4 text-accent" />
            Sources used
          </h3>
          <p className="mt-1.5 text-xs text-slate-500">
            Retrieved from the MedCare AI knowledge base to ground this guidance.
          </p>
          <div className="mt-4 space-y-3">
            {result.sources.map((source, index) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-accent/40 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-white">[{index + 1}] {source.title}</p>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                </div>
                <p className="mt-1 text-xs text-slate-500">{source.organisation}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {source.snippet}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button type="button" onClick={onContinueChat} disabled={pending} className="btn-primary w-full sm:flex-1">
          Continue chat
          <ArrowRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={onRestart} disabled={pending} className="btn-ghost w-full sm:w-auto">
          <RotateCcw className="h-4 w-4" />
          {pending ? "Clearing consultation…" : "Start new consultation"}
        </button>
      </div>
    </div>
  );
}
