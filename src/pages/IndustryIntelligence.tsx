import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Layers, Building2, Globe2, Trophy, Gauge, MapPin } from "lucide-react";
import { Company } from "../types";
import PageHeader from "../components/ui/PageHeader";
import ScoreRing from "../components/ui/ScoreRing";
import Badge from "../components/ui/Badge";
import AnalyticsChart from "../components/AnalyticsChart";
import { countryFlag } from "../utils/dataQuality";

interface IndustryIntelligenceProps {
  companies: Company[];
}

interface IndustryStat {
  industry: string;
  count: number;
  share: number;
  countries: Array<{ name: string; count: number }>;
  avgScore: number;
  companies: Company[];
}

function topCounts(items: string[]): Array<{ name: string; count: number }> {
  const m: Record<string, number> = {};
  items.forEach((i) => { const k = i || "Unknown"; m[k] = (m[k] || 0) + 1; });
  return Object.entries(m).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export default function IndustryIntelligence({ companies }: IndustryIntelligenceProps) {
  const total = companies.length;

  const industries = useMemo<IndustryStat[]>(() => {
    const byInd: Record<string, Company[]> = {};
    companies.forEach((c) => { (byInd[c.industry || "Unknown"] ||= []).push(c); });
    return Object.entries(byInd)
      .map(([industry, cs]) => ({
        industry,
        count: cs.length,
        share: total ? Math.round((cs.length / total) * 100) : 0,
        countries: topCounts(cs.map((c) => c.country)),
        avgScore: Math.round(cs.reduce((s, c) => s + c.leadScore, 0) / cs.length),
        companies: cs,
      }))
      .sort((a, b) => b.count - a.count);
  }, [companies, total]);

  const [selected, setSelected] = useState("");
  const active = industries.find((i) => i.industry === selected) ?? industries[0];
  const maxCount = industries[0]?.count ?? 1;

  if (total === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader icon={Layers} title="Industry Intelligence" subtitle="Sector distribution computed from your imported companies." />
        <div className="card-premium p-12 text-center">
          <Layers className="w-10 h-10 text-blue-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#0F172A]">No industry data yet</p>
          <p className="text-xs text-[#64748B] mt-1">Import companies to map sectors and cross-country coverage.</p>
        </div>
      </div>
    );
  }

  const heatTone = (count: number) => {
    const r = count / maxCount;
    if (r >= 0.66) return "bg-blue-600 text-white border-blue-600";
    if (r >= 0.33) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-slate-50 text-slate-600 border-[#E2E8F0]";
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        icon={Layers}
        title="Industry Intelligence"
        subtitle="Sector distribution, cross-country coverage, and leaders — computed live from imported records."
        actions={<Badge tone="primary" dot pulse>{industries.length} sectors · {total} firms</Badge>}
      />

      {/* KPIs — premium scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Industries", value: industries.length, icon: Layers, bar: "from-blue-400 to-blue-500", chip: "bg-blue-50 text-blue-600 border-blue-100", tint: "from-blue-50/70" },
          { label: "Companies", value: total, icon: Building2, bar: "from-violet-400 to-purple-500", chip: "bg-violet-50 text-violet-600 border-violet-100", tint: "from-violet-50/70" },
          { label: "Top Industry", value: industries[0]?.industry, icon: Trophy, text: true, bar: "from-cyan-400 to-cyan-500", chip: "bg-cyan-50 text-cyan-600 border-cyan-100", tint: "from-cyan-50/70" },
          { label: "Top sector share", value: `${industries[0]?.share ?? 0}%`, icon: Gauge, bar: "from-emerald-400 to-emerald-500", chip: "bg-emerald-50 text-emerald-600 border-emerald-100", tint: "from-emerald-50/70" },
        ].map((k, i) => {
          const KIcon = k.icon;
          return (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }} className={`card-premium p-4 relative overflow-hidden group bg-gradient-to-br ${k.tint} to-white`}>
              <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${k.bar}`} />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] leading-tight">{k.label}</span>
                <span className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${k.chip}`}><KIcon className="w-3.5 h-3.5" /></span>
              </div>
              <div className={`font-extrabold text-[#0F172A] mt-2 tracking-tight ${k.text ? "text-base truncate" : "text-2xl"}`}>{k.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Distribution chart + heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-premium p-5">
          <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
            <h3 className="font-bold text-sm text-[#0F172A]">Industry Distribution</h3>
            <Badge tone="primary">Live</Badge>
          </div>
          <AnalyticsChart type="industry" companies={companies} />
        </div>
        <div className="card-premium p-5">
          <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
            <h3 className="font-bold text-sm text-[#0F172A]">Industry Heatmap</h3>
            <span className="text-[10px] font-semibold text-[#64748B] uppercase">by company count</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
            {industries.map((ind) => (
              <button key={ind.industry} onClick={() => setSelected(ind.industry)} className={`border rounded-xl p-3 text-left transition-all hover:-translate-y-0.5 ${heatTone(ind.count)} ${active.industry === ind.industry ? "ring-2 ring-blue-500/30" : ""}`}>
                <div className="text-[11px] font-bold truncate">{ind.industry}</div>
                <div className="text-xl font-extrabold leading-none mt-1">{ind.count}</div>
                <div className="text-[9px] opacity-80 mt-0.5">{ind.share}% · {ind.countries.length} {ind.countries.length === 1 ? "country" : "countries"}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 card-premium p-5 flex flex-col">
          <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2 mb-3 pb-3 border-b border-[#E2E8F0]"><Trophy className="w-4 h-4 text-amber-500" /> Industry Leaderboard</h3>
          {/* Relative flex-1 wrapper: the detail card sets the row height and the
              absolute list fills it to the bottom (scrolls internally) — no gap. */}
          <div className="relative flex-1 min-h-0">
            <div className="absolute inset-0 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
              {industries.map((ind, i) => (
                <button key={ind.industry} onClick={() => setSelected(ind.industry)} className={`w-full flex items-center gap-3 py-2 px-2 rounded-xl transition-all ${active.industry === ind.industry ? "bg-blue-50/60" : "hover:bg-slate-50"}`}>
                  <span className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-extrabold ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-200 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold text-[#0F172A] truncate">{ind.industry}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${ind.share}%` }} /></div>
                  </div>
                  <span className="text-xs font-extrabold text-blue-600 shrink-0">{ind.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 card-premium p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
            <div className="min-w-0">
              <h3 className="font-bold text-lg text-[#0F172A] truncate">{active.industry}</h3>
              <p className="text-xs text-[#64748B]">{active.count} companies · {active.share}% of dataset · {active.countries.length} countries</p>
            </div>
            <ScoreRing value={active.avgScore} size={64} strokeWidth={6} sublabel="avg" />
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Countries in this sector</h4>
            <div className="space-y-2">
              {active.countries.map((co) => (
                <div key={co.name}>
                  <div className="flex justify-between text-[11px] mb-0.5"><span className="text-[#475569]">{countryFlag(co.name)} {co.name}</span><span className="font-bold text-[#0F172A]">{co.count}</span></div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${(co.count / active.count) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Companies</h4>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]"><tr><th className="px-2 py-2">Company</th><th className="px-2 py-2">Country</th><th className="px-2 py-2">City</th><th className="px-2 py-2 text-right">Lead score</th></tr></thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {active.companies.slice(0, 12).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="px-2 py-2 font-semibold text-[#0F172A]">{c.name}</td>
                      <td className="px-2 py-2 text-[#475569]">{countryFlag(c.country)} {c.country}</td>
                      <td className="px-2 py-2 text-[#64748B]">{c.city || "—"}</td>
                      <td className="px-2 py-2 text-right"><Badge tone={c.leadScore >= 80 ? "success" : c.leadScore >= 65 ? "warning" : "neutral"}>{c.leadScore}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {active.companies.length > 12 && <p className="text-[10px] text-[#64748B] mt-2 px-2">+ {active.companies.length - 12} more</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
