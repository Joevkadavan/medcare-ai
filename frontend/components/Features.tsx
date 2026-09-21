"use client";

import {
  Activity,
  Brain,
  Database,
  HeartPulse,
  Lock,
  ShieldAlert,
  Siren,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import Reveal from "./Reveal";
import KnowledgeQA from "./KnowledgeQA";

const FEATURES = [
  {
    icon: Stethoscope,
    title: "Adaptive symptom assessment",
    body: "A structured consultation that narrows with your answers, rather than a single open text box.",
  },
  {
    icon: Brain,
    title: "Follow-up that adapts",
    body: "The assistant asks relevant follow-ups based on what you have already reported, and stops when it has enough.",
  },
  {
    icon: Siren,
    title: "Emergency warning detection",
    body: "Red-flag symptoms are detected and surfaced immediately, before any general guidance is offered.",
  },
  {
    icon: Database,
    title: "Source-linked questions",
    body: "Questions retrieve reviewed NHS passages and show which sources support the answer. Uncovered questions receive no invented answer.",
  },
  {
    icon: Lock,
    title: "Server-side AI",
    body: "Model calls happen server-side only. No API key is ever exposed to the browser.",
  },
  {
    icon: Activity,
    title: "Honest about its limits",
    body: "The platform reports whether it is running on live or fallback logic, and whether retrieval is active.",
  },
];

const STEPS = [
  {
    icon: HeartPulse,
    title: "Describe what you are experiencing",
    body: "Choose the symptoms that apply, how long they have lasted, and how severe they feel.",
  },
  {
    icon: Sparkles,
    title: "Answer a few follow-up questions",
    body: "A short adaptive conversation fills in the detail that matters for useful guidance.",
  },
  {
    icon: ShieldAlert,
    title: "Review your consultation summary",
    body: "A risk indicator, a plain-language summary, next steps, and clear guidance on when to seek care.",
  },
];

export default function Features() {
  return (
    <>
      {/* Features */}
      <section id="features" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
        <div className="container-page">
          <Reveal className="max-w-2xl">
            <p className="label-muted">What MedCare AI does</p>
            <h2 className="section-title mt-2">
              Guidance that adapts to you, not a form that asks once
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
              MedCare AI is an AI-assisted guidance platform. It helps you organise
              what you are experiencing and understand what to do next. It does not
              diagnose, and it does not replace a healthcare professional.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }, index) => (
              <Reveal key={title} delay={index * 70}>
                <div className="card-surface lift group h-full p-5 transition-colors duration-200 hover:border-accent/35">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent transition-transform duration-200 group-hover:scale-105">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* RAG technology */}
      <section id="rag" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
        <div className="container-page">
          <Reveal className="glass overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
              <div>
                <p className="label-muted">How the guidance is grounded</p>
                <h2 className="section-title mt-2">
                  Retrieval-augmented generation, honestly labelled
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
                  Ask a general health question and MedCare AI retrieves relevant
                  passages from a small, reviewed NHS knowledge collection. Each answer
                  cites the passages it uses. It works without an API key.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
                  Retrieval is disabled when switched off, ready when enabled,
                  and active for answers that actually retrieve supporting passages.
                  This is a limited educational system, not a diagnostic service.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  {
                    step: "Retrieve",
                    body: "Your question is matched against a versioned set of reviewed passages.",
                  },
                  {
                    step: "Ground",
                    body: "BM25 ranks relevant passages; unrelated topics are declined.",
                  },
                  {
                    step: "Generate",
                    body: "The answer is composed from the retrieved passages with numbered source links.",
                  },
                ].map(({ step, body }, index) => (
                  <Reveal key={step} from="left" delay={index * 110}>
                    <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors duration-200 hover:border-accent/30">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-xs font-semibold text-accent">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{step}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">
                          {body}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
          <KnowledgeQA />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
        <div className="container-page">
          <Reveal className="max-w-2xl">
            <p className="label-muted">The experience</p>
            <h2 className="section-title mt-2">Three steps, about two minutes</h2>
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, index) => (
              <Reveal key={title} delay={index * 90}>
                <div className="card-surface lift relative h-full p-5">
                  <span className="label-muted">Step {index + 1}</span>
                  <span className="mt-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
