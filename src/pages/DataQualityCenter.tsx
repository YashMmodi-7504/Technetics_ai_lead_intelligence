import React, { useMemo } from "react";
import { motion } from "motion/react";
import {
  Database,
  Globe2,
  Linkedin,
  Mail,
  Phone,
  AlertTriangle,
  Copy,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { Company } from "../types";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";
import ScoreRing from "../components/ui/ScoreRing";
import {
  coverage,
  dataCompleteness,
  isIncomplete,
  hasWebsite,
  hasLinkedin,
  hasEmail,
  hasPhone,
  countryFlag,
} from "../utils/dataQuality";

interface DataQualityCenterProps {
  companies: Company[];
}

export default function DataQualityCenter({ companies }: DataQualityCenterProps) {
  const total = companies.length;

  const stats = useMemo(() => {
    const incomplete = companies.filter(isIncomplete);
    // Duplicate detection: same normalized name OR same website domain.
    const seen = new Map<string, number>();
    let duplicates = 0;
    companies.forEach((c) => {
      const key = (c.website?.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || c.name).toLowerCase().trim();
      const n = (seen.get(key) || 0) + 1;
      seen.set(key, n);
      if (n > 1) duplicates++;
    });
    const avgCompleteness = total ? Math.round(companies.reduce((s, c) => s + dataCompleteness(c), 0) / total) : 0;
    return { incomplete, duplicates, avgCompleteness };
  }, [companies, total]);

  const byGroup = (key: (c: Company) => string) => {
    const m: Record<string, Company[]> = {};
    companies.forEach((c) => { (m[key(c) || "Unknown"] ||= []).push(c); });
    return Object.entries(m).sort((a, b) => b[1].length - a[1].length);
  };

  if (total === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader icon={Database} title="Data Health Center" subtitle="Coverage, completeness, and import health for your records." />
        <div className="card-premium p-12 text-center">
          <Database className="w-10 h-10 text-blue-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#0F172A]">No records to audit yet</p>
          <p className="text-xs text-[#64748B] mt-1">Import a CSV to see coverage and completeness analytics.</p>
        </div>
      </div>
    );
  }

  const COVERAGE = [
    { label: "Website", icon: Globe2, pct: coverage(companies, hasWebsite), tone: "primary" as const },
    { label: "LinkedIn", icon: Linkedin, pct: coverage(companies, hasLinkedin), tone: "accent" as const },
    { label: "Email", icon: Mail, pct: coverage(companies, hasEmail), tone: "success" as const },
    { label: "Phone", icon: Phone, pct: coverage(companies, hasPhone), tone: "warning" as const },
  ];

  const barTone = (p: number) => (p >= 80 ? "bg-emerald-500" : p >= 50 ? "bg-amber-500" : "bg-rose-400");

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        icon={Database}
        title="Data Health Center"
        subtitle="Field coverage, record completeness, and import health — all from imported records."
        actions={<Badge tone={stats.avgCompleteness >= 80 ? "success" : "warning"} dot>{stats.avgCompleteness}% avg completeness</Badge>}
      />

      {/* Coverage rings — premium at-a-glance health (green glow ≥ 95%) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {COVERAGE.map((c, i) => {
          const CIcon = c.icon;
          const healthy = c.pct >= 95;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}
              className={`card-premium p-5 flex items-center gap-4 transition-all ${healthy ? "border-emerald-200 shadow-[0_10px_36px_rgba(16,185,129,0.20)]" : ""}`}
            >
              <ScoreRing value={c.pct} size={64} strokeWidth={7} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#64748B]"><CIcon className={`w-3.5 h-3.5 ${healthy ? "text-emerald-600" : "text-blue-600"}`} /> {c.label}</div>
                <div className={`text-[11px] mt-1 font-medium ${healthy ? "text-emerald-600" : "text-[#64748B]"}`}>{healthy ? "Excellent coverage" : `${c.pct}% of records`}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Headline counts — premium scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Companies", value: total, icon: Database, bar: "from-blue-400 to-blue-500", chip: "bg-blue-50 text-blue-600 border-blue-100", tint: "from-blue-50/70" },
          { label: "With Website", value: companies.filter(hasWebsite).length, icon: Globe2, bar: "from-cyan-400 to-cyan-500", chip: "bg-cyan-50 text-cyan-600 border-cyan-100", tint: "from-cyan-50/70" },
          { label: "With LinkedIn", value: companies.filter(hasLinkedin).length, icon: Linkedin, bar: "from-violet-400 to-purple-500", chip: "bg-violet-50 text-violet-600 border-violet-100", tint: "from-violet-50/70" },
          { label: "With Email", value: companies.filter(hasEmail).length, icon: Mail, bar: "from-emerald-400 to-emerald-500", chip: "bg-emerald-50 text-emerald-600 border-emerald-100", tint: "from-emerald-50/70" },
          { label: "With Phone", value: companies.filter(hasPhone).length, icon: Phone, bar: "from-indigo-400 to-indigo-500", chip: "bg-indigo-50 text-indigo-600 border-indigo-100", tint: "from-indigo-50/70" },
          { label: "Incomplete", value: stats.incomplete.length, icon: AlertTriangle, bar: "from-amber-400 to-amber-500", chip: "bg-amber-50 text-amber-600 border-amber-100", tint: "from-amber-50/70" },
        ].map((k, i) => {
          const KIcon = k.icon;
          return (
            <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.04 }} className={`card-premium p-3.5 relative overflow-hidden group bg-gradient-to-br ${k.tint} to-white`}>
              <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${k.bar}`} />
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748B] leading-tight">{k.label}</span>
                <span className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${k.chip}`}><KIcon className="w-3 h-3" /></span>
              </div>
              <div className="text-xl font-extrabold text-[#0F172A] mt-1.5">{k.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Coverage rings + duplicates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-premium p-5">
          <h3 className="font-bold text-sm text-[#0F172A] mb-4 pb-3 border-b border-[#E2E8F0]">Field Coverage</h3>
          <div className="space-y-3">
            {COVERAGE.map((c) => {
              const CIcon = c.icon;
              return (
                <div key={c.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-[#475569] font-medium"><CIcon className="w-3.5 h-3.5 text-[#94A3B8]" /> {c.label}</span>
                    <span className="font-bold text-[#0F172A]">{c.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${barTone(c.pct)}`} style={{ width: `${c.pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card-premium p-5 flex flex-col justify-center gap-3">
          <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] p-3">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#475569]"><Copy className="w-4 h-4 text-amber-500" /> Duplicate records</span>
            <span className="text-xl font-extrabold text-amber-600">{stats.duplicates}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] p-3">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#475569]"><AlertTriangle className="w-4 h-4 text-rose-500" /> Incomplete records</span>
            <span className="text-xl font-extrabold text-rose-600">{stats.incomplete.length}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
            <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Complete records</span>
            <span className="text-xl font-extrabold text-emerald-600">{total - stats.incomplete.length}</span>
          </div>
        </div>
      </div>

      {/* Coverage by country + industry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { title: "Coverage by Country", icon: Globe2, groups: byGroup((c) => c.country), flag: true },
          { title: "Coverage by Industry", icon: Layers, groups: byGroup((c) => c.industry), flag: false },
        ].map((panel) => (
          <div key={panel.title} className="card-premium p-5">
            <h3 className="font-bold text-sm text-[#0F172A] mb-3 pb-3 border-b border-[#E2E8F0] flex items-center gap-2"><panel.icon className="w-4 h-4 text-blue-500" /> {panel.title}</h3>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-[#64748B] border-b border-[#E2E8F0]">
                  <tr><th className="px-2 py-2">{panel.flag ? "Country" : "Industry"}</th><th className="px-2 py-2 text-right">Cos</th><th className="px-2 py-2 text-right">Email</th><th className="px-2 py-2 text-right">Phone</th><th className="px-2 py-2 text-right">LinkedIn</th></tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {panel.groups.slice(0, 12).map(([name, cs]) => (
                    <tr key={name} className="hover:bg-slate-50/60">
                      <td className="px-2 py-2 font-semibold text-[#0F172A] truncate max-w-[160px]">{panel.flag ? `${countryFlag(name)} ` : ""}{name}</td>
                      <td className="px-2 py-2 text-right text-[#0F172A] font-medium">{cs.length}</td>
                      <td className="px-2 py-2 text-right text-[#475569]">{coverage(cs, hasEmail)}%</td>
                      <td className="px-2 py-2 text-right text-[#475569]">{coverage(cs, hasPhone)}%</td>
                      <td className="px-2 py-2 text-right text-[#475569]">{coverage(cs, hasLinkedin)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
