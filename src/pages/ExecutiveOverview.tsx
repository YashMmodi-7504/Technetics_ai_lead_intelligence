import React from "react";
import { motion } from "motion/react";
import {
  Globe2, Building2, Layers, MapPin, Mail, Phone, Linkedin, Users2, Trophy, Briefcase, Sparkles, ArrowUpRight,
  BrainCircuit, TrendingUp, ShieldCheck, type LucideIcon,
} from "lucide-react";
import { Company, CountryOpportunity } from "../types";
import AnalyticsChart from "../components/AnalyticsChart";
import CountUp from "../components/ui/CountUp";
import { countryFlag } from "../utils/dataQuality";
import { useAnalytics } from "../hooks/useAnalytics";

interface ExecutiveOverviewProps {
  companies: Company[];
  countries: CountryOpportunity[];
  onNavigate: (tab: string) => void;
}

export default function ExecutiveOverview({ companies, onNavigate }: ExecutiveOverviewProps) {
  // Single source of truth — the centralized analytics service.
  const an = useAnalytics(companies);
  const m = {
    total: an.total,
    countries: an.countries.length,
    industries: an.industries.length,
    cities: an.cities.length,
    withWebsite: an.coverageCounts.website,
    withLinkedin: an.coverageCounts.linkedin,
    withEmail: an.coverageCounts.email,
    withPhone: an.coverageCounts.phone,
    avgEmp: an.avgEmployees,
    topCountry: an.topMarket?.country ?? "—",
    topIndustry: an.topIndustry?.industry ?? "—",
    coverWeb: an.coverage.website,
    coverLi: an.coverage.linkedin,
    coverEmail: an.coverage.email,
    coverPhone: an.coverage.phone,
    avgLeadScore: an.avgLeadScore,
    hotLeads: an.hotLeads,
    avgOpportunity: an.avgOpportunity,
    dataHealth: an.dataHealth,
  };

  if (m.total === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="hero-light rounded-2xl p-8 border border-blue-100 shadow-elevation-2">
          <h2 className="text-2xl font-extrabold text-[#0F172A]">Executive Overview</h2>
          <p className="text-sm text-[#475569] mt-1">Import a CSV to populate live company intelligence.</p>
        </div>
        <div className="card-premium p-12 text-center">
          <Building2 className="w-10 h-10 text-blue-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#0F172A]">No companies yet</p>
          <button onClick={() => onNavigate("import-leads")} className="mt-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 cursor-pointer">
            Go to Lead Import
          </button>
        </div>
      </div>
    );
  }

  // Command-center KPIs — all derived live from imported records.
  const COMMAND_KPIS: Array<{
    label: string; value: number; suffix?: string; sub: string; icon: LucideIcon;
    chip: string; tint: string;
  }> = [
    { label: "Total Companies", value: m.total, sub: `${m.countries} active markets`, icon: Building2, chip: "bg-blue-100 text-blue-600", tint: "from-blue-50" },
    { label: "Active Markets", value: m.countries, sub: `${m.cities} cities mapped`, icon: Globe2, chip: "bg-violet-100 text-violet-600", tint: "from-violet-50" },
    { label: "AI Lead Score", value: m.avgLeadScore, suffix: "/100", sub: `${m.hotLeads} hot leads`, icon: BrainCircuit, chip: "bg-cyan-100 text-cyan-600", tint: "from-cyan-50" },
    { label: "Opportunity Potential", value: m.avgOpportunity, suffix: "/100", sub: "blended potential", icon: TrendingUp, chip: "bg-emerald-100 text-emerald-600", tint: "from-emerald-50" },
    { label: "Data Health", value: m.dataHealth, suffix: "%", sub: "record completeness", icon: ShieldCheck, chip: "bg-amber-100 text-amber-600", tint: "from-amber-50" },
  ];

  // Accent palette cycled across the detail KPI grid (pastel tints + soft borders).
  const ACCENTS = [
    { bar: "from-blue-400 to-blue-500", chip: "bg-blue-50 text-blue-600 border-blue-100", tint: "from-blue-50/70" },
    { bar: "from-violet-400 to-purple-500", chip: "bg-violet-50 text-violet-600 border-violet-100", tint: "from-violet-50/70" },
    { bar: "from-cyan-400 to-cyan-500", chip: "bg-cyan-50 text-cyan-600 border-cyan-100", tint: "from-cyan-50/70" },
    { bar: "from-emerald-400 to-emerald-500", chip: "bg-emerald-50 text-emerald-600 border-emerald-100", tint: "from-emerald-50/70" },
    { bar: "from-amber-400 to-amber-500", chip: "bg-amber-50 text-amber-600 border-amber-100", tint: "from-amber-50/70" },
    { bar: "from-indigo-400 to-indigo-500", chip: "bg-indigo-50 text-indigo-600 border-indigo-100", tint: "from-indigo-50/70" },
  ];

  const TILES: Array<{ label: string; value: React.ReactNode; icon: typeof Globe2; sub?: string; text?: boolean }> = [
    { label: "Countries Covered", value: <CountUp value={m.countries} />, icon: Globe2 },
    { label: "Total Companies", value: <CountUp value={m.total} />, icon: Building2 },
    { label: "Industries Covered", value: <CountUp value={m.industries} />, icon: Layers },
    { label: "Cities Covered", value: <CountUp value={m.cities} />, icon: MapPin },
    { label: "With Website", value: <CountUp value={m.withWebsite} />, icon: Globe2, sub: `${m.coverWeb}%` },
    { label: "With LinkedIn", value: <CountUp value={m.withLinkedin} />, icon: Linkedin, sub: `${m.coverLi}%` },
    { label: "With Email", value: <CountUp value={m.withEmail} />, icon: Mail, sub: `${m.coverEmail}%` },
    { label: "With Phone", value: <CountUp value={m.withPhone} />, icon: Phone, sub: `${m.coverPhone}%` },
    { label: "Avg Employee Size", value: <CountUp value={m.avgEmp} />, icon: Users2 },
    { label: "Top Country", value: `${countryFlag(m.topCountry)} ${m.topCountry}`, icon: Trophy, text: true },
    { label: "Top Industry", value: m.topIndustry, icon: Briefcase, text: true },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in pb-10">
      {/* AI Command Center hero — light pastel */}
      <motion.section
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl hero-light border border-blue-100 card-float p-6 sm:p-8"
      >
        {/* Soft pastel orbs */}
        <div className="absolute -right-16 -top-20 w-80 h-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -left-10 bottom-0 w-72 h-72 rounded-full bg-cyan-200/25 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur border border-blue-100 text-[11px] font-bold tracking-wide text-blue-700 mb-3">
                <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>
                LIVE INTELLIGENCE • AI ENGINE ONLINE
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F172A] flex items-center gap-2.5">
                <Sparkles className="w-6 h-6 text-blue-500" /> TECHNETICS AI Command Center
              </h2>
              <p className="text-sm text-[#475569] mt-2 max-w-xl">
                <b className="text-[#0F172A]">{m.total}</b> companies across <b className="text-[#0F172A]">{m.countries}</b> markets and{" "}
                <b className="text-[#0F172A]">{m.industries}</b> industries — every metric computed live from imported records.
              </p>
            </div>
            <button
              onClick={() => onNavigate("country-intelligence")}
              className="group px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 transition-all cursor-pointer shadow-md shadow-blue-500/25 inline-flex items-center gap-1.5 w-fit"
            >
              <Globe2 className="w-3.5 h-3.5" /> Explore Markets <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* Pastel KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
            {COMMAND_KPIS.map((k, i) => {
              const KIcon = k.icon;
              return (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.15 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br ${k.tint} to-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${k.chip}`}>
                      <KIcon className="w-4 h-4" />
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748B] leading-tight">{k.label}</span>
                  </div>
                  <div className="text-2xl font-extrabold text-[#0F172A] mt-2.5 tracking-tight">
                    <CountUp value={k.value} />{k.suffix && <span className="text-sm text-[#94A3B8] font-bold">{k.suffix}</span>}
                  </div>
                  <div className="text-[10px] text-[#64748B] font-medium mt-0.5">{k.sub}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Executive metrics — premium KPI tiles with colored accents */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        {TILES.map((t, i) => {
          const TIcon = t.icon;
          const a = ACCENTS[i % ACCENTS.length];
          return (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
              className={`card-premium p-4 relative overflow-hidden group bg-gradient-to-br ${a.tint} to-white`}
            >
              {/* Colored top accent */}
              <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${a.bar}`} />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] leading-tight">{t.label}</span>
                <span className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${a.chip}`}>
                  <TIcon className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className={`font-extrabold text-[#0F172A] mt-2 tracking-tight ${t.text ? "text-sm truncate" : "text-2xl"}`}>{t.value}</div>
              {t.sub && <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">{t.sub} coverage</div>}
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="card-premium p-5 lg:col-span-2">
          <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
            <h3 className="font-bold text-sm text-[#0F172A]">Companies by Country</h3>
            <span className="text-[10px] font-semibold text-blue-600 uppercase">Live</span>
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

      {/* Market leaderboard */}
      <div className="card-premium p-5">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#E2E8F0]">
          <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Largest Markets</h3>
          <button onClick={() => onNavigate("country-intelligence")} className="text-[10px] font-bold text-blue-600 uppercase hover:underline cursor-pointer inline-flex items-center gap-1">
            All markets <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2">
          {an.marketRanking.slice(0, 6).map(({ country, count, share }, i) => (
              <div key={country} onClick={() => onNavigate("country-intelligence")} className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-all">
                <span className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-extrabold ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-200 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span>
                <span className="flex-1 min-w-0 text-sm font-semibold text-[#0F172A] truncate">{countryFlag(country)} {country}</span>
                <div className="hidden sm:block w-28 lg:w-40 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${share}%` }} /></div>
                <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[10px] shrink-0">{count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
