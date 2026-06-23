import React from "react";

type Tone = "online" | "active" | "warning" | "offline" | "info";

const DOT: Record<Tone, string> = {
  online: "bg-emerald-500",
  active: "bg-blue-500",
  warning: "bg-amber-500",
  offline: "bg-slate-300",
  info: "bg-cyan-500",
};

const TEXT: Record<Tone, string> = {
  online: "text-emerald-600",
  active: "text-blue-600",
  warning: "text-amber-600",
  offline: "text-slate-400",
  info: "text-cyan-600",
};

interface StatusPillProps {
  label: string;
  tone?: Tone;
  value?: string | number;
  pulse?: boolean;
  /** Hide the label text (icon-rail / collapsed mode). */
  compact?: boolean;
}

/** Live status line: pulsing dot + label + optional value. */
export default function StatusPill({
  label,
  tone = "online",
  value,
  pulse = true,
  compact = false,
}: StatusPillProps) {
  return (
    <div className="flex items-center gap-2 min-w-0" title={`${label}${value != null ? `: ${value}` : ""}`}>
      <span className="relative flex h-2 w-2 shrink-0">
        {pulse && tone !== "offline" && (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${DOT[tone]}`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${DOT[tone]}`} />
      </span>
      {!compact && (
        <>
          <span className="text-[11px] font-medium text-[#475569] truncate">{label}</span>
          {value != null && (
            <span className={`ml-auto text-[11px] font-bold ${TEXT[tone]}`}>{value}</span>
          )}
        </>
      )}
    </div>
  );
}
