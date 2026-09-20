"use client";

import { useInView } from "@/lib/hooks";

interface RevealProps {
  children: React.ReactNode;
  /** Stagger delay in milliseconds. */
  delay?: number;
  /** Direction the content travels from. */
  from?: "up" | "down" | "left" | "right" | "none";
  /** Render as a different element when semantics matter. */
  as?: "div" | "section" | "li" | "article";
  className?: string;
}

const OFFSETS: Record<NonNullable<RevealProps["from"]>, string> = {
  up: "translate3d(0, 18px, 0)",
  down: "translate3d(0, -18px, 0)",
  left: "translate3d(22px, 0, 0)",
  right: "translate3d(-22px, 0, 0)",
  none: "none",
};

/**
 * Fades and slides its children into view on first intersection.
 *
 * SSR-safe: content renders visible in the initial HTML and the effect only
 * applies once the observer is wired up on the client, so nothing is ever lost
 * to a broken or disabled observer.
 */
export default function Reveal({
  children,
  delay = 0,
  from = "up",
  as: Tag = "div",
  className = "",
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : OFFSETS[from],
        transition: `opacity 620ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 620ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        willChange: inView ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}
