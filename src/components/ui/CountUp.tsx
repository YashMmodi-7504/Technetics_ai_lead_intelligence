import React, { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  duration?: number;
  /** Format the animated number for display (e.g. currency). */
  format?: (n: number) => string;
  className?: string;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Animated number that counts up from 0 to `value` on mount / value change. */
export default function CountUp({ value, duration = 1100, format, className }: CountUpProps) {
  const [display, setDisplay] = useState(prefersReducedMotion() ? value : 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    let start: number | null = null;
    const from = 0;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setDisplay(from + (value - from) * ease(progress));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const text = format ? format(display) : Math.round(display).toLocaleString();
  return <span className={className}>{text}</span>;
}
