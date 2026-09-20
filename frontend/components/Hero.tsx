"use client";

import { Activity, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { scrollToConsultation } from "./Navbar";

export default function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pt-28 sm:pt-32 lg:pt-36">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-8rem] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-accent/[0.12] blur-[110px] sm:h-[34rem] sm:w-[34rem]" />
        <div className="absolute bottom-[-10rem] right-[-6rem] h-[20rem] w-[20rem] rounded-full bg-accent-deep/[0.14] blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <div className="container-page pb-14 sm:pb-20 lg:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/[0.08] px-3.5 py-1.5 text-xs font-medium text-accent-soft">
            <Sparkles className="h-3.5 w-3.5" />
            AI-assisted health guidance
          </span>

          <h1 className="mt-6 text-[1.85rem] font-semibold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Understand your symptoms.
            <span className="block bg-gradient-to-r from-accent-soft via-accent to-accent-deep bg-clip-text text-transparent">
              Know what to do next.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base lg:text-lg">
            MedCare AI walks you through an adaptive symptom assessment, asks the
            follow-up questions that matter, and gives you clear guidance on what to do
            next — including an immediate warning if something you describe needs urgent
            attention.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={scrollToConsultation} className="btn-primary w-full sm:w-auto">
              Start Consultation
              <ArrowRight className="h-4 w-4" />
            </button>
            <a href="#how" className="btn-ghost w-full sm:w-auto">
              See how it works
            </a>
          </div>

          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-accent" />
              Adaptive assessment
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-accent" />
              Emergency warning detection
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Source-backed guidance
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
