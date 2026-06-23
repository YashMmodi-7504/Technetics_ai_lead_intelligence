import React, { useMemo, useState, useRef } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie,
  LabelList,
} from "recharts";
import { Database } from "lucide-react";
import { Company } from "../types";
import { ChartSkeleton } from "./ui/Skeleton";

interface ChartProps {
  type: "country" | "industry" | "demand" | "funnel" | "revenue" | "conversion";
  companies?: Company[];
  loading?: boolean;
}

// Sector palette — 6 flat colors max: blue, cyan, purple, green, amber, indigo.
const COLORS = ["#3B82F6", "#06B6D4", "#8B5CF6", "#10B981", "#F59E0B", "#6366F1"];
const ANIM = { duration: 900, easing: "ease-out" as const };

// ── Pipeline maths (single source of truth, mirrors the rest of the app) ──────
const STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"] as const;
type Stage = (typeof STAGES)[number];
const STAGE_PROBABILITIES: Record<Stage, number> = {
  Lead: 0.1, Qualified: 0.25, Proposal: 0.5, Negotiation: 0.75, Won: 1.0, Lost: 0.0,
};
function statusToStage(status: string): Stage {
  if (status === "Qualified") return "Qualified";
  if (status === "Proposal Sent") return "Proposal";
  if (status === "Negotiation") return "Negotiation";
  if (status === "Won") return "Won";
  if (status === "Lost") return "Lost";
  return "Lead";
}
const dealValue = (c: Company) => c.leadScore * 2500;

function GradientDefs() {
  return (
    <defs>
      <linearGradient id="grad-blue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
        <stop offset="100%" stopColor="#2563EB" stopOpacity={0.75} />
      </linearGradient>
      <linearGradient id="grad-cyan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22D3EE" stopOpacity={1} />
        <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.75} />
      </linearGradient>
      <linearGradient id="grad-area-won" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="grad-area-proj" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.28} />
        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
      </linearGradient>
      {/* Per-bar vertical gradients (premium multi-color bars) */}
      {BAR_GRADIENTS.map((g, i) => (
        <linearGradient key={i} id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={g[0]} stopOpacity={1} />
          <stop offset="100%" stopColor={g[1]} stopOpacity={0.7} />
        </linearGradient>
      ))}
    </defs>
  );
}

// Soft pastel per-bar gradient palette: blue, cyan, violet, emerald, amber, indigo.
const BAR_GRADIENTS: Array<[string, string]> = [
  ["#BFDBFE", "#93C5FD"],
  ["#A5F3FC", "#67E8F9"],
  ["#DDD6FE", "#C4B5FD"],
  ["#A7F3D0", "#6EE7B7"],
  ["#FDE68A", "#FCD34D"],
  ["#C7D2FE", "#A5B4FC"],
];

// White value label rendered above each bar.
function BarValueLabel(props: any) {
  const { x, y, width, value } = props;
  if (value == null || width <= 0) return null;
  return (
    <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill="#475569">
      {value}
    </text>
  );
}

const renderLegend = (props: any) => {
  const { payload } = props;
  if (!payload) return null;
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2">
      {payload.map((entry: any, i: number) => (
        <li key={i} className="flex items-center gap-1.5 text-[11px] font-medium text-[#475569]">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.color }} />
          {entry.value}
        </li>
      ))}
    </ul>
  );
};

function EmptyState() {
  return (
    <div className="w-full h-80 flex flex-col items-center justify-center text-center text-[#94A3B8]">
      <Database className="w-8 h-8 mb-2 text-slate-300" />
      <p className="text-xs font-semibold text-[#64748B]">No data to chart yet</p>
      <p className="text-[11px]">Import a CSV to populate this visualization.</p>
    </div>
  );
}

export default function AnalyticsChart({ type, companies, loading }: ChartProps) {
  const list = companies ?? [];

  // Custom donut tooltip — a floating glass card tracked to the cursor and
  // pinned to the side, so it never overlaps the center KPI, segments, or legend.
  const donutWrapRef = useRef<HTMLDivElement>(null);
  const [donutActive, setDonutActive] = useState<number | null>(null);
  const [donutPos, setDonutPos] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const handleDonutMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = donutWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDonutPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height });
  };
  const clearDonut = () => { setDonutActive(null); setDonutPos(null); };

  // Industry mix — dynamic.
  const industryData = useMemo(() => {
    const counts: Record<string, number> = {};
    list.forEach((c) => { counts[c.industry || "Unknown"] = (counts[c.industry || "Unknown"] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, Companies]) => ({ name, Companies }))
      .sort((a, b) => b.Companies - a.Companies)
      .slice(0, 6);
  }, [list]);

  // Country volume — dynamic.
  const countryData = useMemo(() => {
    const counts: Record<string, { leads: number; active: number }> = {};
    list.forEach((c) => {
      const k = c.country || "Unknown";
      if (!counts[k]) counts[k] = { leads: 0, active: 0 };
      counts[k].leads += 1;
      if (c.buyingIntentScore >= 80) counts[k].active += 1;
    });
    return Object.entries(counts)
      .map(([name, d]) => ({ name, Leads: d.leads, Active: d.active }))
      .sort((a, b) => b.Leads - a.Leads)
      .slice(0, 6);
  }, [list]);

  // Lead-score distribution — dynamic.
  const demandData = useMemo(() => {
    const b = [0, 0, 0, 0, 0];
    list.forEach((c) => {
      const s = c.leadScore;
      if (s <= 20) b[0]++; else if (s <= 40) b[1]++; else if (s <= 60) b[2]++;
      else if (s <= 80) b[3]++; else b[4]++;
    });
    return [
      { range: "0-20 (Very Low)", Count: b[0] },
      { range: "21-40 (Low)", Count: b[1] },
      { range: "41-60 (Medium)", Count: b[2] },
      { range: "61-80 (High)", Count: b[3] },
      { range: "81-100 (Critical)", Count: b[4] },
    ];
  }, [list]);

  // Per-stage pipeline value + counts — dynamic (replaces the old static arrays).
  const stageData = useMemo(() => {
    return STAGES.map((stage) => {
      const inStage = list.filter((c) => statusToStage(c.status) === stage);
      const pipeline = inStage.reduce((s, c) => s + dealValue(c), 0);
      return {
        name: stage,
        Pipeline: pipeline,
        Weighted: Math.round(pipeline * STAGE_PROBABILITIES[stage]),
        count: inStage.length,
        active: inStage.filter((c) => c.buyingIntentScore >= 70).length,
      };
    });
  }, [list]);

  const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur border border-[#E2E8F0] p-3 rounded-xl shadow-elevation-3 text-xs font-medium text-[#0F172A]">
          <p className="font-bold text-sm mb-1.5 text-[#0F172A] border-b border-[#E2E8F0] pb-1.5">{label}</p>
          {payload.map((item: any, i: number) => (
            <p key={i} className="mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color || "#2563EB" }} />
              <span className="uppercase text-[9px] text-[#64748B] mr-1 inline-block w-20">{item.name}:</span>
              <span className="font-bold text-[#0F172A]">
                {typeof item.value === "number" && item.value > 1000 ? `$${item.value.toLocaleString()}` : item.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="w-full h-80 flex items-center"><ChartSkeleton height={300} /></div>;
  }
  if (list.length === 0) return <EmptyState />;

  switch (type) {
    case "country":
      return (
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={countryData} margin={{ top: 24, right: 10, left: -20, bottom: 0 }} barCategoryGap="8%" barGap={2} maxBarSize={72}>
              <GradientDefs />
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltipContent />} cursor={false} />
              <Legend content={renderLegend} />
              <Bar dataKey="Leads" radius={[8, 8, 0, 0]} name="Companies" animationDuration={ANIM.duration} animationEasing={ANIM.easing}>
                {countryData.map((_, index) => (
                  <Cell key={index} fill={`url(#bar-grad-${index % BAR_GRADIENTS.length})`} />
                ))}
                <LabelList dataKey="Leads" content={<BarValueLabel />} />
              </Bar>
              <Bar dataKey="Active" radius={[8, 8, 0, 0]} name="High Intent" fill="#A5F3FC" animationDuration={ANIM.duration} animationEasing={ANIM.easing} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );

    case "industry": {
      const totalIndustries = new Set(list.map((c) => c.industry || "Unknown")).size;
      const totalCos = list.length;
      return (
        <div className="w-full h-80 flex flex-col">
          {/* Generous white space around a quiet, flat donut */}
          <div ref={donutWrapRef} className="relative flex-1 py-3" onMouseMove={handleDonutMove} onMouseLeave={clearDonut}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={industryData}
                  dataKey="Companies"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={97}
                  paddingAngle={1.5}
                  stroke="#fff"
                  strokeWidth={2}
                  isAnimationActive
                  animationDuration={ANIM.duration}
                  animationEasing={ANIM.easing}
                  onMouseEnter={(_, index) => setDonutActive(index)}
                >
                  {industryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} style={{ outline: "none" }} />
                  ))}
                </Pie>
                {/* No Recharts Tooltip — custom floating card below avoids the center overlap */}
              </PieChart>
            </ResponsiveContainer>
            {/* Clean center label — count + "Industries" only, always visible */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-extrabold text-[#0F172A] tracking-tight leading-none">{totalIndustries}</span>
              <span className="text-[11px] tracking-[0.12em] text-[#94A3B8] font-semibold mt-1.5">Industries</span>
            </div>

            {/* Floating glass tooltip — pinned to the side opposite the cursor */}
            {donutActive != null && donutPos && industryData[donutActive] && (() => {
              const CARD_W = 168;
              const CARD_H = 76;
              const onLeftHalf = donutPos.x < donutPos.w / 2;
              const left = onLeftHalf
                ? Math.min(donutPos.x + 20, donutPos.w - CARD_W - 6)
                : Math.max(donutPos.x - CARD_W - 20, 6);
              const top = Math.max(6, Math.min(donutPos.y - CARD_H / 2, donutPos.h - CARD_H - 6));
              const d = industryData[donutActive];
              const pct = totalCos ? Math.round((d.Companies / totalCos) * 100) : 0;
              return (
                <div
                  className="absolute z-50 pointer-events-none rounded-xl px-3.5 py-2.5"
                  style={{
                    left, top, width: CARD_W,
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[donutActive % COLORS.length] }} />
                    <span className="text-xs font-bold text-[#0F172A] truncate">{d.name}</span>
                  </div>
                  <div className="text-[11px] text-[#475569] font-semibold">{d.Companies} {d.Companies === 1 ? "Company" : "Companies"}</div>
                  <div className="text-[11px] text-[#94A3B8] font-medium">{pct}%</div>
                </div>
              );
            })()}
          </div>
          {/* Simple horizontal legend: ● Name (18%) */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-3">
            {industryData.map((d, i) => (
              <span key={d.name} className="inline-flex items-center gap-1.5 text-[11px] text-[#475569]">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                {String(d.name).length > 22 ? String(d.name).slice(0, 21) + "…" : d.name}
                <span className="text-[#94A3B8]">({totalCos ? Math.round((d.Companies / totalCos) * 100) : 0}%)</span>
              </span>
            ))}
          </div>
        </div>
      );
    }

    case "demand":
      return (
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demandData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
              <GradientDefs />
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="range" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltipContent />} cursor={false} />
              <Bar dataKey="Count" radius={[6, 6, 0, 0]} name="Companies" animationDuration={ANIM.duration} animationEasing={ANIM.easing}>
                {demandData.map((entry, index) => (
                  <Cell key={index} fill={entry.range.includes("Critical") ? "url(#grad-blue)" : "url(#grad-cyan)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );

    case "funnel":
    case "conversion":
      return (
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stageData} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltipContent />} />
              <Legend content={renderLegend} />
              <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 7 }} name="Accounts in stage" animationDuration={ANIM.duration} animationEasing={ANIM.easing} />
              <Line type="monotone" dataKey="active" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 3 }} name="High intent" animationDuration={ANIM.duration} animationEasing={ANIM.easing} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );

    case "revenue":
    default:
      return (
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stageData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <GradientDefs />
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltipContent />} />
              <Legend content={renderLegend} />
              <Area type="monotone" dataKey="Pipeline" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#grad-area-proj)" name="Pipeline value ($)" animationDuration={ANIM.duration} animationEasing={ANIM.easing} />
              <Area type="monotone" dataKey="Weighted" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#grad-area-won)" name="Weighted forecast ($)" animationDuration={ANIM.duration} animationEasing={ANIM.easing} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
  }
}
