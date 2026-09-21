"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import {
  ADDITIONAL_OPTIONS,
  DURATION_OPTIONS,
  SEVERITY_OPTIONS,
  SYMPTOM_OPTIONS,
} from "@/lib/constants";
import SelectableCard from "./SelectableCard";
import EmergencyAlert from "./EmergencyAlert";

export interface QuizAnswers {
  symptoms: string[];
  otherSymptom: string;
  duration: string;
  severity: string;
  additional: string[];
  otherAdditional: string;
  notes: string;
}

export const EMPTY_ANSWERS: QuizAnswers = {
  symptoms: [],
  otherSymptom: "",
  duration: "",
  severity: "",
  additional: [],
  otherAdditional: "",
  notes: "",
};

const STEP_COUNT = 5;

interface ConsultationQuizProps {
  answers: QuizAnswers;
  onChange: (next: QuizAnswers) => void;
  onComplete: (answers: QuizAnswers) => void;
}

export default function ConsultationQuiz({
  answers,
  onChange,
  onComplete,
}: ConsultationQuizProps) {
  const [step, setStep] = useState(0);

  const set = <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) =>
    onChange({ ...answers, [key]: value });

  const toggle = (key: "symptoms" | "additional", value: string) => {
    // "None of these" is exclusive — selecting it clears the rest.
    if (value === "None of these") {
      set(key, answers[key].includes(value) ? [] : [value]);
      return;
    }
    const current = answers[key].filter((item) => item !== "None of these");
    set(
      key,
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const toggleSymptom = (value: string) => toggle("symptoms", value);
  const toggleAdditional = (value: string) => toggle("additional", value);

  /* -------------------------- step validity --------------------------- */

  const stepValid = (() => {
    switch (step) {
      case 0:
        return answers.symptoms.length > 0 && (!answers.symptoms.includes("Other") || !!answers.otherSymptom.trim());
      case 1:
        return answers.duration !== "";
      case 2:
        return answers.severity !== "";
      case 3:
        return !answers.additional.includes("Other") || !!answers.otherAdditional.trim();
      case 4:
        return answers.notes.length <= 2000;
      default:
        return false;
    }
  })();

  const next = () => {
    if (!stepValid) return;
    if (step === STEP_COUNT - 1) {
      onComplete(answers);
      return;
    }
    setStep((value) => value + 1);
  };

  const back = () => setStep((value) => Math.max(0, value - 1));

  const otherSelected = answers.symptoms.includes("Other");
  // Immediate caution for explicit red-flag selections, without waiting for a network call.
  // The backend independently screens all submitted assessments and free-text turns.
  if (answers.symptoms.some((item) => ["Chest pain", "Breathing difficulty"].includes(item))) {
    return <div className="space-y-4"><EmergencyAlert />
      <p className="text-sm text-slate-300">The assessment has stopped so it does not delay urgent care.</p>
      <button type="button" className="btn-ghost" onClick={() => { onChange(EMPTY_ANSWERS); setStep(0); }}>Start new consultation</button>
    </div>;
  }

  return (
    <div className="card-surface overflow-hidden">
      {/* Progress */}
      <div className="border-b border-white/10 bg-white/[0.02] px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className="label-muted">
            Step {step + 1} of {STEP_COUNT}
          </p>
          <p className="text-xs text-slate-500">
            {Math.round(((step + 1) / STEP_COUNT) * 100)}% complete
          </p>
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          {Array.from({ length: STEP_COUNT }).map((_, index) => (
            <span
              key={index}
              className={[
                "h-1 flex-1 rounded-full transition-colors duration-300",
                index <= step ? "bg-accent" : "bg-white/10",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6">
        <div key={step} className="animate-fade-up">
          {step === 0 && (
            <>
              <h3 className="text-lg font-semibold text-white sm:text-xl">
                What are you experiencing?
              </h3>
              <p className="mt-1.5 text-sm text-slate-400">
                Select everything that applies. You can choose more than one.
              </p>

              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {SYMPTOM_OPTIONS.map((option) => (
                  <SelectableCard
                    key={option}
                    label={option}
                    selected={answers.symptoms.includes(option)}
                    onToggle={() => toggleSymptom(option)}
                  />
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-sm font-medium text-slate-200">
                  Can&apos;t find your symptom?
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Choose Other and describe it in your own words.
                </p>
                <div className="mt-3">
                  <SelectableCard
                    label="Other"
                    selected={otherSelected}
                    onToggle={() => toggleSymptom("Other")}
                    compact
                  />
                </div>
                {otherSelected && (
                  <input
                    type="text"
                    maxLength={120}
                    value={answers.otherSymptom}
                    onChange={(event) => set("otherSymptom", event.target.value)}
                    placeholder="Describe your symptom..."
                    aria-label="Describe your other symptom"
                    className="mt-3 w-full animate-fade-in rounded-xl border border-white/12 bg-[#07111f] px-3.5 py-3 text-base text-slate-100 placeholder:text-slate-500 transition focus:border-accent/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent sm:text-sm"
                  />
                )}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h3 className="text-lg font-semibold text-white sm:text-xl">
                How long have you had these symptoms?
              </h3>
              <p className="mt-1.5 text-sm text-slate-400">
                An approximate answer is fine.
              </p>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {DURATION_OPTIONS.map((option) => (
                  <SelectableCard
                    key={option}
                    label={option}
                    selected={answers.duration === option}
                    onToggle={() => set("duration", option)}
                  />
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-lg font-semibold text-white sm:text-xl">
                How severe are your symptoms?
              </h3>
              <p className="mt-1.5 text-sm text-slate-400">
                Think about how much they are affecting your day.
              </p>
              <div className="mt-5 grid gap-2.5">
                {SEVERITY_OPTIONS.map((option) => (
                  <SelectableCard
                    key={option.label}
                    label={option.label}
                    hint={option.hint}
                    selected={answers.severity === option.label}
                    onToggle={() => set("severity", option.label)}
                  />
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="text-lg font-semibold text-white sm:text-xl">
                Are you experiencing any other symptoms?
              </h3>
              <p className="mt-1.5 text-sm text-slate-400">
                Select everything that applies, or skip if none do.
              </p>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {ADDITIONAL_OPTIONS.map((option) => (
                  <SelectableCard
                    key={option}
                    label={option}
                    selected={answers.additional.includes(option)}
                    onToggle={() => toggleAdditional(option)}
                  />
                ))}
              </div>

              <div className="mt-3">
                <SelectableCard
                  label="Other"
                  selected={answers.additional.includes("Other")}
                  onToggle={() => toggleAdditional("Other")}
                  compact
                />
              </div>
              {answers.additional.includes("Other") && (
                <input
                  type="text"
                    maxLength={120}
                  value={answers.otherAdditional}
                  onChange={(event) => set("otherAdditional", event.target.value)}
                  placeholder="Describe the other symptom..."
                  aria-label="Describe the other symptom"
                  className="mt-3 w-full animate-fade-in rounded-xl border border-white/12 bg-[#07111f] px-3.5 py-3 text-base text-slate-100 placeholder:text-slate-500 transition focus:border-accent/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent sm:text-sm"
                />
              )}
            </>
          )}

          {step === 4 && (
            <>
              <h3 className="text-lg font-semibold text-white sm:text-xl">
                Tell us anything else
              </h3>
              <p className="mt-1.5 text-sm text-slate-400">
                Anything you think is relevant — recent travel, existing conditions,
                medication, or how you have been feeling generally.
              </p>
              <textarea
                value={answers.notes}
                onChange={(event) => set("notes", event.target.value)}
                rows={5}
                maxLength={2000}
                aria-describedby="notes-count"
                placeholder="Describe anything else you're experiencing..."
                aria-label="Additional details"
                className="chat-scroll mt-5 w-full resize-y rounded-xl border border-white/12 bg-[#07111f] px-3.5 py-3 text-base leading-relaxed text-slate-100 placeholder:text-slate-500 transition focus:border-accent/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent sm:text-sm"
              />
              <p id="notes-count" className="mt-2 text-xs text-slate-400">{answers.notes.length}/2000 characters. Optional; avoid identifying details.</p>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 bg-white/[0.02] px-4 py-4 sm:px-6">
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="btn-ghost w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            type="button"
            onClick={next}
            disabled={!stepValid}
            className="btn-primary w-full sm:w-auto"
          >
            {step === STEP_COUNT - 1 ? (
              <>
                <Check className="h-4 w-4" />
                Begin consultation
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {!stepValid && (
          <p className="mt-2.5 text-xs text-slate-500">
            {step === 0 && "Select at least one symptom and describe Other if selected."}
            {step === 1 && "Choose how long your symptoms have lasted."}
            {step === 2 && "Choose how severe your symptoms feel."}
            {step === 3 && "Describe the other symptom to continue."}
          </p>
        )}
      </div>
    </div>
  );
}
