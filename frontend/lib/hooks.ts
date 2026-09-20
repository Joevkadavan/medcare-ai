"use client";

import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  /** Fraction of the element that must be visible before firing. */
  threshold?: number;
  /** Extra margin around the viewport, e.g. "-10% 0px". */
  rootMargin?: string;
  /** Fire only once, then stop observing. */
  once?: boolean;
}

/**
 * Reports whether an element has entered the viewport.
 *
 * Returns `true` immediately when IntersectionObserver is unavailable or the
 * user prefers reduced motion — content must never be hidden behind an effect
 * that cannot run.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {},
) {
  const { threshold = 0.15, rootMargin = "0px 0px -10% 0px", once = true } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}

/**
 * Counts from 0 to `target` once the element is visible.
 * Purely presentational — never used to display a value the interface does not
 * already have elsewhere.
 */
export function useCountUp(target: number, active: boolean, durationMs = 1100) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      // easeOutCubic — fast start, gentle settle.
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, durationMs]);

  return value;
}

/**
 * Types a string out one character at a time once `active` is true.
 */
export function useTypewriter(text: string, active: boolean, speedMs = 42) {
  const [output, setOutput] = useState("");

  useEffect(() => {
    if (!active) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setOutput(text);
      return;
    }

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setOutput(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, speedMs);

    return () => window.clearInterval(timer);
  }, [text, active, speedMs]);

  return output;
}
