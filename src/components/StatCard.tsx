import React from "react";
import { TrendingUp, TrendingDown, Info, LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import Sparkline from "./ui/Sparkline";
import Tooltip from "./ui/Tooltip";

type AccentColor = "blue" | "green" | "amber" | "rose" | "cyan";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: LucideIcon;
  subtitle?: string;
  accentColor?: AccentColor;
  /** Optional sparkline series for the KPI trend visual. */
  sparkline?: number[];
  /** Optional status pill text shown top-right. */
  status?: string;
  /** Optional tooltip explaining the metric. */
  tooltip?: string;
  /** Stagger index for entrance animation. */
  index?: number;
}

const ACCENTS: Record<
  AccentColor,
  { bg: string; text: string; border: string; spark: string; badge: string }
> = {
  blue: {
    bg: "bg-blue-50",
    text: "text-[#2563EB]",
    border: "border-blue-100",
    spark: "#2563EB",
    badge: "bg-blue-50 text-blue-600 border-blue-100",
  },
  green: {
    bg: "bg-emerald-50",
    text: "text-[#10B981]",
    border: "border-emerald-100",
    spark: "#10B981",
    badge: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-[#F59E0B]",
    border: "border-[#FDE68A]",
    spark: "#F59E0B",
    badge: "bg-amber-50 text-amber-600 border-amber-100",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-[#EF4444]",
    border: "border-rose-100",
    spark: "#EF4444",
    badge: "bg-rose-50 text-rose-600 border-rose-100",
  },
  cyan: {
    bg: "bg-cyan-50",
    text: "text-[#06B6D4]",
    border: "border-cyan-100",
    spark: "#06B6D4",
    badge: "bg-cyan-50 text-cyan-600 border-cyan-100",
  },
};

export default function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  subtitle,
  accentColor = "blue",
  sparkline,
  status,
  tooltip,
  index = 0,
}: StatCardProps) {
  const accent = ACCENTS[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="card-premium p-5 relative overflow-hidden group"
    >
      {/* Decorative ambient gradient */}
      <div
        className={`absolute -right-6 -bottom-6 w-28 h-28 rounded-full opacity-40 blur-2xl transition-all duration-500 group-hover:scale-125 ${accent.bg}`}
      />

      <div className="flex items-start justify-between relative">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider truncate">
              {title}
            </p>
            {tooltip && (
              <Tooltip content={tooltip}>
                <Info className="w-3 h-3 text-[#94A3B8] hover:text-[#64748B] cursor-help" />
              </Tooltip>
            )}
          </div>
          <h3 className="text-2xl font-extrabold text-[#0F172A] mt-1 tracking-tight">
            {value}
          </h3>
        </div>
        <div
          className={`p-2.5 rounded-xl border shrink-0 ${accent.bg} ${accent.text} ${accent.border} shadow-sm`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Sparkline band */}
      {sparkline && sparkline.length > 1 && (
        <div className="mt-3 -mx-1">
          <Sparkline
            data={sparkline}
            width={260}
            height={34}
            stroke={accent.spark}
            fill={accent.spark}
            className="w-full h-9"
          />
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E2E8F0] relative">
        {trend ? (
          <div className="flex items-center gap-1">
            <span
              className={`flex items-center text-xs font-bold ${
                trend.isPositive ? "text-[#10B981]" : "text-[#EF4444]"
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
              )}
              {trend.value}
            </span>
            <span className="text-[10px] text-[#64748B]">vs last month</span>
          </div>
        ) : status ? (
          <span
            className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${accent.badge}`}
          >
            {status}
          </span>
        ) : (
          <span className="text-[10px] text-[#64748B] italic">
            Global Enterprise Platform
          </span>
        )}

        {subtitle && (
          <span className="text-[10px] text-[#64748B] font-medium tracking-tight text-right truncate max-w-[130px]">
            {subtitle}
          </span>
        )}
      </div>
    </motion.div>
  );
}
