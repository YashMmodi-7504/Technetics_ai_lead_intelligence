import React, { useId } from "react";

interface ScoreRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  /** color thresholds; defaults map low->danger, mid->warning, high->success */
  colorFor?: (value: number) => { from: string; to: string };
  className?: string;
}

const defaultColorFor = (v: number) => {
  if (v >= 80) return { from: "#10B981", to: "#06B6D4" };
  if (v >= 60) return { from: "#2563EB", to: "#06B6D4" };
  if (v >= 40) return { from: "#F59E0B", to: "#FBBF24" };
  return { from: "#EF4444", to: "#F59E0B" };
};

/**
 * Animated circular progress ring used for opportunity / AI demand scores.
 */
export default function ScoreRing({
  value,
  size = 72,
  strokeWidth = 7,
  label,
  sublabel,
  colorFor = defaultColorFor,
  className = "",
}: ScoreRingProps) {
  const gradientId = useId();
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const colors = colorFor(clamped);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? "Score"}: ${clamped}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`ring-${gradientId}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#EEF2F7"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-extrabold text-[#0F172A] leading-none">
          {label ?? `${clamped}`}
        </span>
        {sublabel && (
          <span className="text-[8px] font-semibold uppercase tracking-wider text-[#64748B] mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
