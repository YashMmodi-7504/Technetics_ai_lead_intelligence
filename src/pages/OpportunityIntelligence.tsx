import React, { useMemo } from "react";
import { motion } from "motion/react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList,
} from "recharts";
import { TrendingUp, Gauge, Trophy, Layers, Globe2, Target, ShieldCheck, Sparkles, Award } from "lucide-react";
import { Company } from "../types";
import PageHeader from "../components/ui/PageHeader";
import ScoreRing from "../components/ui/ScoreRing";
import Badge from "../components/ui/Badge";
import { leadBand, type LeadBand } from "../utils/leadScoring";
import {
  opportunityPotential,
  marketAttractiveness,
  dataCompleteness,
  coverage,
  hasWebsite,
  hasLinkedin,
  hasEmail,
  hasPhone,
  countryFlag,
} from "../utils/dataQuality";

interface OpportunityIntelligenceProps {
  companies: Company[];
}

const BANDS: LeadBand[] = ["Hot", "Warm", "Medium", "Cold"];
const BAND_TONE: Record<LeadBand, "success" | "warning" | "primary" | "neutral"> = {
  Hot: "success", Warm: "warning", Medium: "primary", Cold: "neutral",
};
const BAND_BAR: Record<LeadBand, string> = {
  Hot: "bg-emerald-500", Warm: "bg-amber-500", Medium: "bg-blue-500", Cold: "bg-slate-300",
};

// Bubble palette — flat enterprise colors, one per market.
const BUBBLE_COLORS = ["#3B82F6", "#06B6D4", "#8B5CF6", "#10B981", "#F59E0B", "#6366F1", "#EC4899", "#14B8A6", "#F97316", "#0EA5E9"];

export default function OpportunityIntelligence({ companies }: OpportunityIntelligenceProps) {
  const total = companies.length;

  const data = useMemo(() => {
    const bandCounts: Record<LeadBand, number> = { Hot: 0, Warm: 0, Medium: 0, Cold: 0 };
    companies.forEach((c) => { bandCounts[leadBand(c.leadScore)]++; });

    const byCountry: Record<string, Company[]> = {};
    const byIndustry: Record<string, Company[]> = {};
    companies.forEach((c) => {
      (byCountry[c.country || "Unknown"] ||= []).push(c);
      (byIndustry[c.industry || "Unknown"] ||= []).push(c);
    });
    const maxCountry = Math.max(1, ...Object.values(byCountry).map((a) => a.length));

    const countryRanking = Object.entries(byCountry)
      .map(([country, cs]) => ({
        country, count: cs.length,
        attractiveness: marketAttractiveness(cs, maxCountry),
        avgQuality: Math.round(cs.reduce((s, c) => s + c.leadScore, 0) / cs.length),
        avgCoverage: Math.round(cs.reduce((s, c) => s + dataCompleteness(c), 0) / cs.length),
      }))
      .sort((a, b) => b.attractiveness - a.attractiveness);

    const industryRanking = Object.entries(byIndustry)
      .map(([industry, cs]) => ({
        industry, count: cs.length,
        avgPotential: Math.round(cs.reduce((s, c) => s + opportunityPotential(c), 0) / cs.length),
      }))
      .sort((a, b) => b.avgPotential - a.avgPotential || b.count - a.count);

    const topOpportunities = [...companies]
      .map((c) => ({ company: c, potential: opportunityPotential(c) }))
      .sort((a, b) => b.potential - a.potential)
      .slice(0, 10);

    const avgPotential = total ? Math.round(companies.reduce((s, c) => s + opportunityPotential(c), 0) / total) : 0;
    const avgCompleteness = total ? Math.round(companies.reduce((s, c) => s + dataCompleteness(c), 0) / total) : 0;
    const avgQuality = total ? Math.round(companies.reduce((s, c) => s + c.leadScore, 0) / total) : 0;
    const conversionReady = bandCounts.Hot + bandCounts.Warm;
    const conversionPotential = total ? Math.round((conversionReady / total) * 100) : 0;

    // Opportunity Matrix — one bubble per market.
    const matrix = countryRanking.map((c) => ({
      name: c.country, x: c.attractiveness, y: c.avgQuality, z: c.count,
      flag: countryFlag(c.country),
    }));

    // AI insight picks (data-driven, no fabricated trends).
    const bestMarket = countryRanking[0];
    const bestConversion = [...countryRanking].sort((a, b) => b.avgQuality - a.avgQuality)[0];
    const bestCoverage = [...countryRanking].sort((a, b) => b.avgCoverage - a.avgCoverage)[0];

    return {
      bandCounts, countryRanking, industryRanking, topOpportunities, matrix,
      avgPotential, avgCompleteness, avgQuality, conversionPotential, conversionReady,
      bestMarket, bestConversion, bestCoverage,
      topOpportunity: topOpportunities[0],
    };
  }, [companies, total]);

  if (total === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader icon={TrendingUp} title="Opportunity Intelligence" subtitle="Opportunity potential and market attractiveness — derived from imported records." />
        <div className="card-premium p-12 text-center">
          <TrendingUp className="w-10 h-10 text-blue-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#0F172A]">No opportunities yet</p>
          <p className="text-xs text-[#64748B] mt-1">Import companies to rank markets and surface top opportunities.</p>
        </div>
      </div>
    );
  }

  // Premium opportunity scorecards.
  const SCORECARDS = [
    { label: "Market Potential", value: data.avgPotential, suffix: "/100", icon: Target, bar: "from-blue-400 to-blue-500", chip: "bg-blue-50 text-blue-600 border-blue-100", tint: "from-blue-50/70", sub: "avg opportunity potential" },
    { label: "Lead Quality", value: data.avgQuality, suffix: "/100", icon: Gauge, bar: "from-violet-400 to-purple-500", chip: "bg-violet-50 text-violet-600 border-violet-100", tint: "from-violet-50/70", sub: `${data.bandCounts.Hot} hot leads` },
    { label: "Data Coverage", value: data.avgCompleteness, suffix: "%", icon: ShieldCheck, bar: "from-cyan-400 to-cyan-500", chip: "bg-cyan-50 text-cyan-600 border-cyan-100", tint: "from-cyan-50/70", sub: "record completeness" },
    { label: "Conversion Potential", value: data.conversionPotential, suffix: "%", icon: TrendingUp, bar: "from-emerald-400 to-emerald-500", chip: "bg-emerald-50 text-emerald-600 border-emerald-100", tint: "from-emerald-50/70", sub: `${data.conversionReady} hot + warm` },
  ];

  const MatrixTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
      <div className="rounded-xl px-3.5 py-2.5" style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", border: "1px solid #E2E8F0", boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }}>
        <div className="text-xs font-bold text-[#0F172A] mb-1">{p.flag} {p.name}</div>
        <div className="text-[11px] text-[#475569]">Market attractiveness: <b className="text-[#0F172A]">{p.x}</b></div>
        <div className="text-[11px] text-[#475569]">Lead quality: <b className="text-[#0F172A]">{p.y}</b></div>
        <div className="text-[11px] text-[#475569]">Companies: <b className="text-[#0F172A]">{p.z}</b></div>
      </div>
    );
  };

  const INSIGHTS = [
    { label: "Top Opportunity", icon: Trophy, color: "text-amber-600 bg-amber-50 border-amber-100", title: data.topOpportunity?.company.name ?? "—", detail: `${countryFlag(data.topOpportunity?.company.country)} ${data.topOpportunity?.company.country} · potential ${data.topOpportunity?.potential}` },
    { label: "Most Attractive Market", icon: Globe2, color: "text-blue-600 bg-blue-50 border-blue-100", title: data.bestMarket ? `${countryFlag(data.bestMarket.country)} ${data.bestMarket.country}` : "—", detail: data.bestMarket ? `${data.bestMarket.count} companies · score ${data.bestMarket.attractiveness}` : "" },
    { label: "Best Conversion Market", icon: Target, color: "text-emerald-600 bg-emerald-50 border-emerald-100", title: data.bestConversion ? `${countryFlag(data.bestConversion.country)} ${data.bestConversion.country}` : "—", detail: data.bestConversion ? `avg lead quality ${data.bestConversion.avgQuality}` : "" },
    { label: "Highest Data Quality", icon: ShieldCheck, color: "text-violet-600 bg-violet-50 border-violet-100", title: data.bestCoverage ? `${countryFlag(data.bestCoverage.country)} ${data.bestCoverage.country}` : "—", detail: data.bestCoverage ? `${data.bestCoverage.avgCoverage}% completeness` : "" },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        icon={TrendingUp}
        title="Opportunity Intelligence"
        subtitle="Non-monetary opportunity potential, market attractiveness, and lead-quality distribution — all computed from imported data."
        actions={<Badge tone="primary" dot pulse>{total} companies</Badge>}
      />

      {/* Opportunity scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {SCORECARDS.map((k, i) => {
          const KIcon = k.icon;
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}
              className={`card-premium p-4 relative overflow-hidden group bg-gradient-to-br ${k.tint} to-white`}
            >
              <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${k.bar}`} />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] leading-tight">{k.label}</span>
                <span className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${k.chip}`}>
                  <KIcon className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-[#0F172A] mt-2 tracking-tight">
                {k.value}<span className="text-sm text-[#94A3B8] font-bold">{k.suffix}</span>
              </div>
              <div className="text-[10px] text-[#64748B] font-medium mt-0.5">{k.sub}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Market attractiveness bar chart */}
      <div className="card-premium p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
          <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-500" /> Market Attractiveness</h3>
          <span className="text-[10px] font-semibold text-[#94A3B8] uppercase">Ranked by opportunity score</span>
        </div>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.matrix} margin={{ top: 24, right: 10, left: -20, bottom: 0 }} barCategoryGap="20%" maxBarSize={64}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<MatrixTooltip />} cursor={false} />
              <Bar dataKey="x" name="Attractiveness" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out">
                {data.matrix.map((_, i) => (
                  <Cell key={i} fill={BUBBLE_COLORS[i % BUBBLE_COLORS.length]} />
                ))}
                <LabelList dataKey="x" position="top" fontSize={11} fontWeight={700} fill="#475569" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-[#94A3B8] mt-1">Attractiveness = opportunity potential + data completeness + market density. Hover a bar for lead quality and company count.</p>
      </div>

      {/* AI insight cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {INSIGHTS.map((ins, i) => {
          const IIcon = ins.icon;
          return (
            <motion.div
              key={ins.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}
              className="card-premium p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-8 h-8 rounded-lg border flex items-center justify-center ${ins.color}`}><IIcon className="w-4 h-4" /></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">{ins.label}</span>
              </div>
              <div className="text-sm font-extrabold text-[#0F172A] truncate">{ins.title}</div>
              <div className="text-[11px] text-[#64748B] mt-0.5 truncate">{ins.detail}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Lead quality distribution + data coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-premium p-5">
          <h3 className="font-bold text-sm text-[#0F172A] mb-4 pb-3 border-b border-[#E2E8F0]">Lead Quality Distribution</h3>
          <div className="space-y-3">
            {BANDS.map((b) => {
              const n = data.bandCounts[b];
              const pct = total ? Math.round((n / total) * 100) : 0;
              return (
                <div key={b}>
                  <div className="flex justify-between text-xs mb-1"><span className="flex items-center gap-1.5"><Badge tone={BAND_TONE[b]}>{b}</Badge></span><span className="font-bold text-[#0F172A]">{n} · {pct}%</span></div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${BAND_BAR[b]}`} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card-premium p-5">
          <h3 className="font-bold text-sm text-[#0F172A] mb-4 pb-3 border-b border-[#E2E8F0]">Data Coverage</h3>
          <div className="space-y-3">
            {[
              { label: "Website", pct: coverage(companies, hasWebsite) },
              { label: "LinkedIn", pct: coverage(companies, hasLinkedin) },
              { label: "Email", pct: coverage(companies, hasEmail) },
              { label: "Phone", pct: coverage(companies, hasPhone) },
            ].map((c) => (
              <div key={c.label}>
                <div className="flex justify-between text-xs mb-1"><span className="text-[#475569] font-medium">{c.label}</span><span className="font-bold text-[#0F172A]">{c.pct}%</span></div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${c.pct >= 80 ? "bg-emerald-500" : c.pct >= 50 ? "bg-amber-500" : "bg-rose-400"}`} style={{ width: `${c.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Country + Industry ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-premium p-5">
          <h3 className="font-bold text-sm text-[#0F172A] mb-3 pb-3 border-b border-[#E2E8F0] flex items-center gap-2"><Globe2 className="w-4 h-4 text-blue-500" /> Country Ranking</h3>
          <div className="space-y-2">
            {data.countryRanking.map((c, i) => (
              <div key={c.country} className="flex items-center gap-3 py-1.5">
                <span className="text-xs font-extrabold text-[#94A3B8] w-5">{i + 1}</span>
                <span className="flex-1 min-w-0 text-xs font-semibold text-[#0F172A] truncate">{countryFlag(c.country)} {c.country} <span className="text-[#94A3B8] font-normal">({c.count})</span></span>
                <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${c.attractiveness}%` }} /></div>
                <span className="text-xs font-bold text-blue-600 w-8 text-right">{c.attractiveness}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#94A3B8] mt-2">Attractiveness = opportunity potential + completeness + market density.</p>
        </div>
        <div className="card-premium p-5 flex flex-col">
          <h3 className="font-bold text-sm text-[#0F172A] mb-3 pb-3 border-b border-[#E2E8F0] flex items-center gap-2"><Layers className="w-4 h-4 text-blue-500" /> Industry Ranking</h3>
          {/* Relative flex-1 wrapper: the Country card sets the row height and the
              absolute list fills it exactly (scrolls internally) — no bottom gap. */}
          <div className="relative flex-1 min-h-0">
            <div className="absolute inset-0 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
              {data.industryRanking.map((ind, i) => (
                <div key={ind.industry} className="flex items-center gap-3 py-1.5">
                  <span className="text-xs font-extrabold text-[#94A3B8] w-5">{i + 1}</span>
                  <span className="flex-1 min-w-0 text-xs font-semibold text-[#0F172A] truncate">{ind.industry} <span className="text-[#94A3B8] font-normal">({ind.count})</span></span>
                  <span className="text-xs font-bold text-blue-600 w-8 text-right">{ind.avgPotential}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top opportunities */}
      <div className="card-premium overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] bg-slate-50/70 flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /><h3 className="font-bold text-sm text-[#0F172A]">Top Opportunities</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white border-b border-[#E2E8F0] text-[10px] uppercase text-[#64748B]">
              <tr><th className="px-5 py-3">Rank</th><th className="px-5 py-3">Company</th><th className="px-5 py-3">Country</th><th className="px-5 py-3">Industry</th><th className="px-5 py-3">Band</th><th className="px-5 py-3 text-right">Potential</th></tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {data.topOpportunities.map((o, i) => (
                <tr key={o.company.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-bold text-[#0F172A]">#{i + 1}</td>
                  <td className="px-5 py-3 font-semibold text-[#0F172A]">{o.company.name}</td>
                  <td className="px-5 py-3 text-[#475569]">{countryFlag(o.company.country)} {o.company.country}</td>
                  <td className="px-5 py-3 text-[#475569]">{o.company.industry}</td>
                  <td className="px-5 py-3"><Badge tone={BAND_TONE[leadBand(o.company.leadScore)]}>{leadBand(o.company.leadScore)}</Badge></td>
                  <td className="px-5 py-3 text-right"><span className="inline-flex items-center gap-2"><ScoreRing value={o.potential} size={30} strokeWidth={4} label=" " /><span className="font-bold text-[#0F172A]">{o.potential}</span></span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
