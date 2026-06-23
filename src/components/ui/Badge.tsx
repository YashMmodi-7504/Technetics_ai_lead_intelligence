import React from "react";

type Tone = "primary" | "accent" | "success" | "warning" | "danger" | "neutral";

const TONES: Record<Tone, string> = {
  primary: "bg-blue-50 text-blue-700 border-blue-200",
  accent: "bg-cyan-50 text-cyan-700 border-cyan-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};

interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

/** Compact status pill used across KPI cards, tables, and headers. */
export default function Badge({
  children,
  tone = "neutral",
  dot = false,
  pulse = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${TONES[tone]} ${className}`}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 animate-ping" />
          )}
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
