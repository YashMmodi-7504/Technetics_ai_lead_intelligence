import React from "react";

interface ScoreBadgeProps {
  value: number; // 0-100
  label?: string;
  className?: string;
}

function tone(v: number) {
  if (v >= 85) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (v >= 70) return "bg-blue-50 text-blue-700 border-blue-200";
  if (v >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

/** Threshold-colored score chip used across tables, cards, and lists. */
export default function ScoreBadge({ value, label, className = "" }: ScoreBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-bold ${tone(value)} ${className}`}
    >
      {value}
      {label && <span className="text-[9px] font-semibold uppercase opacity-70">{label}</span>}
    </span>
  );
}
