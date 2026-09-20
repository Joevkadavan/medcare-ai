"use client";

import { Heart, ShieldAlert, Stethoscope } from "lucide-react";
import Consultation from "./Consultation";
import Features from "./Features";
import Hero from "./Hero";
import Navbar, { scrollToConsultation } from "./Navbar";

function ConsultationCta() {
  return (
    <section className="py-14 sm:py-16">
      <div className="container-page">
        <div className="glass relative overflow-hidden p-6 text-center sm:p-10">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-[-6rem] h-[18rem] w-[18rem] -translate-x-1/2 rounded-full bg-accent/[0.14] blur-[90px]" />
          </div>

          <div className="relative">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
              <Stethoscope className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-white sm:text-2xl lg:text-3xl">
              Ready to check in with your symptoms?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
              The assessment takes about two minutes. You will get a plain-language
              summary, clear next steps, and an immediate warning if anything you describe
              needs urgent attention.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={scrollToConsultation} className="btn-primary w-full sm:w-auto">
                Start Consultation
              </button>
              <a href="#features" className="btn-ghost w-full sm:w-auto">
                Learn more
              </a>
            </div>

            <p className="mt-6 inline-flex items-center gap-2 text-xs text-slate-500">
              <ShieldAlert className="h-3.5 w-3.5 text-accent" />
              Not a diagnosis. For emergencies, contact your local emergency services.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-10 sm:py-12">
      <div className="container-page">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/35 bg-accent/10 text-accent">
                <Stethoscope className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-white">MedCare AI</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              AI-assisted health guidance. MedCare AI does not diagnose, treat, or
              prescribe, and it is not a substitute for professional medical care.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 text-sm sm:items-end">
            <a href="#features" className="text-slate-400 transition hover:text-white">
              Features
            </a>
            <a href="#rag" className="text-slate-400 transition hover:text-white">
              RAG Technology
            </a>
            <a href="#consultation" className="text-slate-400 transition hover:text-white">
              Consultation
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} MedCare AI. General information only.
          </p>
          <p className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <Heart className="h-3.5 w-3.5 text-accent/70" />
            Built for careful, transparent health guidance
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Consultation />
        <ConsultationCta />
      </main>
      <Footer />
    </div>
  );
}
