"use client";

import { useEffect, useState } from "react";
import { Menu, Stethoscope, X } from "lucide-react";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#rag", label: "RAG Technology" },
  { href: "#consultation", label: "Consultation" },
];

/**
 * Scroll to the consultation section. Defined once so the navbar CTA, hero CTA,
 * and mobile menu all share one behaviour.
 */
export function scrollToConsultation() {
  const target = document.getElementById("consultation");
  if (!target) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled || open
          ? "border-b border-white/10 bg-[#07111f]/85 backdrop-blur-md"
          : "border-b border-transparent",
      ].join(" ")}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        <a
          href="#top"
          className="flex min-w-0 items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111f]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/35 bg-accent/10 text-accent">
            <Stethoscope className="h-4 w-4" />
          </span>
          <span className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">
            MedCare AI
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={scrollToConsultation}
            className="btn-primary hidden sm:inline-flex"
          >
            Start Consultation
          </button>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-slate-200 transition hover:border-accent/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      <div
        id="mobile-menu"
        className={[
          "overflow-hidden border-t border-white/10 bg-[#07111f]/95 backdrop-blur-md transition-[max-height] duration-300 md:hidden",
          open ? "max-h-[22rem]" : "max-h-0 border-transparent",
        ].join(" ")}
      >
        <div className="container-page flex flex-col gap-1 py-4">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              // Wait for the sheet to collapse before scrolling.
              setTimeout(scrollToConsultation, 120);
            }}
            className="btn-primary mt-2 w-full"
          >
            Start Consultation
          </button>
        </div>
      </div>
    </header>
  );
}
