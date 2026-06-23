import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Globe2,
  Building2,
  Layers,
  Trophy,
  MapPin,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { Company } from "../types";
import PageHeader from "../components/ui/PageHeader";
import ScoreRing from "../components/ui/ScoreRing";
import Badge from "../components/ui/Badge";
import AnalyticsChart from "../components/AnalyticsChart";
import { normalizedEmployees, employeesLabel, opportunityTier } from "../utils/leadScoring";
import { coverage, hasWebsite, hasLinkedin, hasEmail, hasPhone, countryFlag } from "../utils/dataQuality";

interface CountryIntelligenceProps {
  companies: Company[];
}

interface CountryStat {
  country: string;
  count: number;
  share: number;
  industries: Array<{ name: string; count: number }>;
  cities: Array<{ name: string; count: number }>;
  bands: { Small: number; Medium: number; Large: number };
  avgScore: number;
  largeShare: number;
  cov: { website: number; linkedin: number; email: number; phone: number };
  companies: Company[];
}

function topCounts(items: string[], n = 6): Array<{ name: string; count: number }> {
  const m: Record<string, number> = {};
  items.forEach((i) => { const k = i || "Unknown"; m[k] = (m[k] || 0) + 1; });
  return Object.entries(m).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, n);
}

export default function CountryIntelligence({ companies }: CountryIntelligenceProps) {
  const total = companies.length;

  const markets = useMemo<CountryStat[]>(() => {
    const byCountry: Record<string, Company[]> = {};
    companies.forEach((c) => {
      const k = c.country || "Unknown";
      (byCountry[k] ||= []).push(c);
    });
    return Object.entries(byCountry)
      .map(([country, cs]) => {
        const bands = { Small: 0, Medium: 0, Large: 0 };
        cs.forEach((c) => { bands[opportunityTier(c)] += 1; });
        const avgScore = Math.round(cs.reduce((s, c) => s + c.leadScore, 0) / cs.length);
        return {
          country,
          count: cs.length,
          share: total ? Math.round((cs.length / total) * 100) : 0,
          industries: topCounts(cs.map((c) => c.industry)),
          cities: topCounts(cs.map((c) => c.city || "—")),
          bands,
          avgScore,
          largeShare: Math.round((bands.Large / cs.length) * 100),
          cov: {
            website: coverage(cs, hasWebsite),
            linkedin: coverage(cs, hasLinkedin),
            email: coverage(cs, hasEmail),
            phone: coverage(cs, hasPhone),
          },
          companies: [...cs].sort((a, b) => normalizedEmployees(b) - normalizedEmployees(a)),
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [companies, total]);

  const [selected, setSelected] = useState<string>("");
  const active = markets.find((m) => m.country === selected) ?? markets[0];

  const distinctIndustries = new Set(companies.map((c) => c.industry).filter(Boolean)).size;
  const topMarket = markets[0]?.country ?? "—";
  const topIndustry = topCounts(companies.map((c) => c.industry), 1)[0]?.name ?? "—";

  if (total === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader icon={Globe2} title="Country Intelligence" subtitle="Geographic market map computed from your imported companies." />
        <div className="card-premium p-12 text-center">
          <Globe2 className="w-10 h-10 text-blue-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#0F172A]">No market data yet</p>
          <p className="text-xs text-[#64748B] mt-1">Import companies to map markets by country and sector.</p>
        </div>
      </div>
    );
  }

  const KPIS = [
    { label: "Markets", value: markets.length, icon: Globe2, bar: "from-blue-400 to-blue-500", chip: "bg-blue-50 text-blue-600 border-blue-100", tint: "from-blue-50/70" },
    { label: "Companies", value: total, icon: Building2, bar: "from-violet-400 to-purple-500", chip: "bg-violet-50 text-violet-600 border-violet-100", tint: "from-violet-50/70" },
    { label: "Top Market", value: topMarket, icon: Trophy, text: true, bar: "from-cyan-400 to-cyan-500", chip: "bg-cyan-50 text-cyan-600 border-cyan-100", tint: "from-cyan-50/70" },
    { label: "Industries", value: distinctIndustries, icon: Layers, bar: "from-emerald-400 to-emerald-500", chip: "bg-emerald-50 text-emerald-600 border-emerald-100", tint: "from-emerald-50/70" },
    { label: "Top Industry", value: topIndustry, icon: Briefcase, text: true, bar: "from-amber-400 to-amber-500", chip: "bg-amber-50 text-amber-600 border-amber-100", tint: "from-amber-50/70" },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        icon={Globe2}
        title="Country Intelligence"
        subtitle="Geographic market map computed live from imported companies — counts, sectors, and size mix per market."
        actions={<Badge tone="primary" dot pulse>{markets.length} markets · {total} firms</Badge>}
      />

      {/* KPI strip — premium scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {KPIS.map((k, i) => {
          const KIcon = k.icon;
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className={`card-premium p-4 relative overflow-hidden group bg-gradient-to-br ${k.tint} to-white`}
            >
              <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${k.bar}`} />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] leading-tight">{k.label}</span>
                <span className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${k.chip}`}>
                  <KIcon className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className={`font-extrabold text-[#0F172A] mt-2 tracking-tight ${k.text ? "text-base truncate" : "text-2xl"}`}>
                {k.value}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-premium p-5 lg:col-span-2">
          <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
            <h3 className="font-bold text-sm text-[#0F172A]">Companies by Country</h3>
            <Badge tone="primary">Live</Badge>
          </div>
          <AnalyticsChart type="country" companies={companies} />
        </div>
        <div className="card-premium p-5">
          <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
            <h3 className="font-bold text-sm text-[#0F172A]">Sector Mix</h3>
            <span className="text-[10px] font-semibold text-[#64748B] uppercase">Industries</span>
          </div>
          <AnalyticsChart type="industry" companies={companies} />
        </div>
      </div>

      {/* Market leaderboard + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="lg:col-span-1 space-y-3 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin">
          {markets.map((m, i) => {
            const isSel = m.country === active.country;
            return (
              <button
                key={m.country}
                onClick={() => setSelected(m.country)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                  isSel ? "bg-white border-blue-500 shadow-elevation-2 ring-2 ring-blue-500/10" : "bg-white border-[#E2E8F0] hover:border-blue-300 hover:shadow-elevation-1"
                }`}
              >
                <span className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-extrabold ${
                  i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-200 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#0F172A] truncate">{countryFlag(m.country)} {m.country}</p>
                  <p className="text-[10px] text-[#64748B] truncate">{m.count} firms · {m.industries[0]?.name}</p>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${m.share}%` }} />
                  </div>
                </div>
                <span className="text-xs font-extrabold text-blue-600 shrink-0">{m.share}%</span>
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 card-premium p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
            <div>
              <h3 className="font-bold text-lg text-[#0F172A] flex items-center gap-2">
                <span className="text-xl">{countryFlag(active.country)}</span> {active.country}
              </h3>
              <p className="text-xs text-[#64748B]">{active.count} companies · {active.share}% of tracked market</p>
            </div>
            <ScoreRing value={active.share} size={64} strokeWidth={6} sublabel="share" />
          </div>

          {/* Market stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Companies", value: active.count },
              { label: "Industries", value: active.industries.length },
              { label: "Cities", value: active.cities.length },
              { label: "Enterprise %", value: `${active.largeShare}%` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[#E2E8F0] bg-slate-50/50 p-3 text-center">
                <div className="text-xl font-extrabold text-[#0F172A]">{s.value}</div>
                <div className="text-[9px] uppercase tracking-wider text-[#64748B] font-semibold mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Data coverage */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Data coverage</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "LinkedIn", pct: active.cov.linkedin },
                { label: "Email", pct: active.cov.email },
                { label: "Phone", pct: active.cov.phone },
                { label: "Website", pct: active.cov.website },
              ].map((c) => (
                <div key={c.label}>
                  <div className="flex justify-between text-[10px] mb-1"><span className="text-[#475569] font-medium">{c.label}</span><span className="font-bold text-[#0F172A]">{c.pct}%</span></div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${c.pct >= 80 ? "bg-emerald-500" : c.pct >= 50 ? "bg-amber-500" : "bg-rose-400"}`} style={{ width: `${c.pct}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Industry breakdown + size mix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Top sectors</h4>
              <div className="space-y-2">
                {active.industries.map((ind) => (
                  <div key={ind.name}>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-[#475569] truncate pr-2">{ind.name}</span>
                      <span className="font-bold text-[#0F172A]">{ind.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${(ind.count / active.count) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Company size mix</h4>
              <div className="space-y-2">
                {(["Large", "Medium", "Small"] as const).map((b) => (
                  <div key={b} className="flex items-center justify-between rounded-lg border border-[#E2E8F0] px-3 py-2">
                    <span className="text-xs font-semibold text-[#475569]">{b === "Large" ? "Large (1,000+)" : b === "Medium" ? "Medium (200–1,000)" : "Small (<200)"}</span>
                    <Badge tone={b === "Large" ? "success" : b === "Medium" ? "primary" : "neutral"}>{active.bands[b]}</Badge>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] pt-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" /> Avg lead score {active.avgScore}
                </div>
              </div>
            </div>
          </div>

          {/* Company list */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Companies in {active.country}</h4>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-2 py-2">Company</th>
                    <th className="px-2 py-2">Industry</th>
                    <th className="px-2 py-2">City</th>
                    <th className="px-2 py-2 text-right">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {active.companies.slice(0, 12).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="px-2 py-2 font-semibold text-[#0F172A]">{c.name}</td>
                      <td className="px-2 py-2 text-[#475569]">{c.industry}</td>
                      <td className="px-2 py-2 text-[#64748B]">{c.city || "—"}</td>
                      <td className="px-2 py-2 text-right text-[#0F172A] font-medium">{employeesLabel(c)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {active.companies.length > 12 && (
                <p className="text-[10px] text-[#64748B] mt-2 px-2">+ {active.companies.length - 12} more in {active.country}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
