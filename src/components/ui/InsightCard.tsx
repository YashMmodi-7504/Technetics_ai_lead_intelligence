import React from "react";
import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "success" | "warning" | "danger" | "accent";

const TONES: Record<Tone, { box: string; icon: string }> = {
  primary: { box: "bg-blue-50 border-blue-100", icon: "text-blue-600" },
  success: { box: "bg-emerald-50 border-emerald-100", icon: "text-emerald-600" },
  warning: { box: "bg-amber-50 border-amber-100", icon: "text-amber-600" },
  danger: { box: "bg-rose-50 border-rose-100", icon: "text-rose-600" },
  accent: { box: "bg-cyan-50 border-cyan-100", icon: "text-cyan-600" },
};

interface InsightCardProps {
  icon: LucideIcon;
  text: React.ReactNode;
  tone?: Tone;
  value?: string;
  onClick?: () => void;
}

/** A single executive-brief insight row. */
export default function InsightCard({ icon: Icon, text, tone = "primary", value, onClick }: InsightCardProps) {
  const t = TONES[tone];
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${t.box} ${
        onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-elevation-1" : ""
      }`}
    >
      <span className={`shrink-0 ${t.icon}`}>
        <Icon className="w-4 h-4" />
      </span>
      <p className="text-xs text-[#0F172A] leading-snug flex-1 min-w-0">{text}</p>
      {value && <span className={`text-xs font-extrabold ${t.icon}`}>{value}</span>}
    </div>
  );
}
