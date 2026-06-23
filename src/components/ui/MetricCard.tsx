import React from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import CountUp from "./CountUp";
import Sparkline from "./Sparkline";

export type MetricVariant = "revenue" | "forecast" | "opportunity" | "winrate" | "intent" | "default";

interface MetricCardProps {
  title: string;
  icon: LucideIcon;
  variant?: MetricVariant;
  /** Preformatted display value (used when countTo is not supplied). */
  value?: string | number;
  /** Numeric target to animate up to. */
  countTo?: number;
  format?: (n: number) => string;
  trend?: { value: string; isPositive: boolean };
  sparkline?: number[];
  confidence?: number; // forecast AI confidence 0-100
  intentScore?: number; // intent heat 0-100
  timeline?: string[]; // opportunity activity labels
  subtitle?: string;
  live?: string; // live status caption
  loading?: boolean;
  index?: number;
}

export default function MetricCard({
  title,
  icon: Icon,
  variant = "default",
  value,
  countTo,
  format,
  trend,
  sparkline,
  confidence,
  intentScore,
  timeline,
  subtitle,
  live,
  loading,
  index = 0,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="card-premium p-5">
        <div className="flex items-center justify-between">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-9 w-9 rounded-xl" />
        </div>
        <div className="skeleton h-8 w-28 mt-4" />
        <div className="skeleton h-8 w-full mt-4 rounded-lg" />
      </div>
    );
  }

  const isRevenue = variant === "revenue";
  const valueNode =
    countTo != null ? (
      <CountUp value={countTo} format={format} />
    ) : (
      <>{value}</>
    );

  const trendChip = trend && (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-bold ${
        isRevenue
          ? "text-white/90"
          : trend.isPositive
          ? "text-emerald-600"
          : "text-rose-600"
      }`}
    >
      {trend.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {trend.value}
    </span>
  );

  // ── Revenue: premium gradient ──────────────────────────────────────────────
  if (isRevenue) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-2xl p-5 text-white shadow-elevation-3 bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-500 transition-transform duration-300 hover:-translate-y-1"
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">{title}</p>
          <div className="p-2 rounded-xl bg-white/15 border border-white/20">
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <h3 className="relative text-3xl font-extrabold mt-2 tracking-tight">{valueNode}</h3>
        <div className="relative flex items-center justify-between mt-3">
          {trendChip}
          {subtitle && <span className="text-[10px] text-white/70">{subtitle}</span>}
        </div>
        {sparkline && sparkline.length > 1 && (
          <div className="relative mt-2 -mx-1">
            <Sparkline data={sparkline} width={260} height={30} stroke="#ffffff" fill="#ffffff" className="w-full h-8" />
          </div>
        )}
      </motion.div>
    );
  }

  // ── Other variants share the light card frame ──────────────────────────────
  const frame =
    variant === "forecast"
      ? "glass border border-white/60"
      : "card-premium";
  const accentIcon =
    variant === "winrate"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : variant === "intent"
      ? "bg-amber-50 text-amber-600 border-amber-100"
      : variant === "forecast"
      ? "bg-cyan-50 text-cyan-600 border-cyan-100"
      : "bg-blue-50 text-blue-600 border-blue-100";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className={`${frame} p-5 transition-transform duration-300 hover:-translate-y-1`}
    >
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">{title}</p>
        <div className={`p-2 rounded-xl border ${accentIcon}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <h3 className="text-2xl font-extrabold text-[#0F172A] mt-2 tracking-tight">{valueNode}</h3>

      {/* Forecast: AI confidence */}
      {variant === "forecast" && confidence != null && (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-semibold text-[#64748B] mb-1">
            <span>AI confidence</span>
            <span className="text-cyan-700 font-bold">{confidence}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${confidence}%` }} />
          </div>
        </div>
      )}

      {/* Win rate: success ring bar */}
      {variant === "winrate" && (
        <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            style={{ width: typeof countTo === "number" ? `${Math.min(countTo, 100)}%` : "68%" }}
          />
        </div>
      )}

      {/* Intent: heat visualization */}
      {variant === "intent" && intentScore != null && (
        <div className="mt-3">
          <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 relative">
            <div
              className="absolute -top-0.5 h-3 w-1.5 rounded-full bg-white border border-slate-300 shadow"
              style={{ left: `calc(${Math.min(Math.max(intentScore, 0), 100)}% - 3px)` }}
            />
          </div>
          <p className="text-[10px] text-[#64748B] mt-1">Heat score {intentScore}/100</p>
        </div>
      )}

      {/* Opportunity: mini activity timeline */}
      {variant === "opportunity" && timeline && timeline.length > 0 && (
        <div className="mt-3 space-y-1">
          {timeline.slice(0, 3).map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] text-[#64748B]">
              <span className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-blue-500" : "bg-slate-300"}`} />
              <span className="truncate">{t}</span>
            </div>
          ))}
        </div>
      )}

      {sparkline && sparkline.length > 1 && (
        <div className="mt-3 -mx-1">
          <Sparkline data={sparkline} width={260} height={28} className="w-full h-7" />
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E2E8F0]">
        {trendChip ?? (live ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            {live}
          </span>
        ) : <span />)}
        {subtitle && <span className="text-[10px] text-[#64748B] text-right truncate max-w-[140px]">{subtitle}</span>}
      </div>
    </motion.div>
  );
}
