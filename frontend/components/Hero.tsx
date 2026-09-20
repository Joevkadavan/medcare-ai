"use client";

import { Activity, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { useInView, useTypewriter } from "@/lib/hooks";
import Reveal from "./Reveal";
import { scrollToConsultation } from "./Navbar";

const ROTATING = [
  "Know what to do next.",
  "Understand what is urgent.",
  "Get guidance you can trust.",
];

export default function Hero() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.1 });
  const typed = useTypewriter(ROTATING[0], inView, 38);

  return (
    <section id="top" className="relative isolate overflow-hidden pt-28 sm:pt-32 lg:pt-36">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-8rem] h-[26rem] w-[26rem] -translate-x-1/2 animate-pulse-slow rounded-full bg-accent/[0.12] blur-[110px] sm:h-[34rem] sm:w-[34rem]" />
        <div className="absolute bottom-[-10rem] right-[-6rem] h-[20rem] w-[20rem] animate-pulse-slow rounded-full bg-accent-deep/[0.14] blur-[110px] [animation-delay:1.4s]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 70% 55% at 50% 40%, #000 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 55% at 50% 40%, #000 40%, transparent 100%)",
          }}
        />
      </div>

      <div ref={ref} className="container-page pb-14 sm:pb-20 lg:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal from="down">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/[0.08] px-3.5 py-1.5 text-xs font-medium text-accent-soft">
              <Sparkles className="h-3.5 w-3.5" />
              AI-assisted health guidance
            </span>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="mt-6 text-[1.85rem] font-semibold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Understand your symptoms.
              {/*
                The typed line reserves its height so the layout never shifts
                while the characters arrive.
              */}
              <span className="block min-h-[1.15em] bg-gradient-to-r from-accent-soft via-accent to-accent-deep bg-clip-text text-transparent">
                {typed}
                <span
                  aria-hidden
                  className="ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.08em] animate-caret bg-accent align-middle"
                />
              </span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base lg:text-lg">
              MedCare AI walks you through an adaptive symptom assessment, asks the
              follow-up questions that matter, and gives you clear guidance on what to do
              next — including an immediate warning if something you describe needs urgent
              attention.
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={scrollToConsultation}
                className="btn-primary shine w-full sm:w-auto"
              >
                Start Consultation
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
              <a href="#how" className="btn-ghost w-full sm:w-auto">
                See how it works
              </a>
            </div>
          </Reveal>

          <Reveal delay={340}>
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
          </Reveal>
        </div>
      </div>
    </section>
  );
}
