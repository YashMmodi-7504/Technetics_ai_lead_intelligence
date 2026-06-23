import React, { useEffect, useState } from "react";
import { BrainCircuit, Trophy, Check, X, Activity, Flame, TrendingUp, Gauge, Snowflake, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { Company } from "../types";
import type { AssistantDirective } from "../utils/assistantEngine";
import PageHeader from "../components/ui/PageHeader";
import ScoreRing from "../components/ui/ScoreRing";
import Badge from "../components/ui/Badge";
import { computeLeadScore, scoreFactors, employeesLabel, leadBand, type LeadBand } from "../utils/leadScoring";

interface AILeadScoringProps {
  companies: Company[];
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;
  directive?: AssistantDirective | null;
  onDirectiveApplied?: () => void;
}

const BAND_TONE: Record<LeadBand, "success" | "warning" | "primary" | "neutral"> = {
  Hot: "success",
  Warm: "warning",
  Medium: "primary",
  Cold: "neutral",
};
const ALL_BANDS: LeadBand[] = ["Hot", "Warm", "Medium", "Cold"];
function band(score: number): { label: LeadBand; tone: "success" | "warning" | "primary" | "neutral" } {
  const label = leadBand(score);
  return { label, tone: BAND_TONE[label] };
}

// Premium scorecard styling per band (Hot=green, Warm=amber, Medium=blue, Cold=slate).
const BAND_META: Record<LeadBand, { icon: LucideIcon; bar: string; chip: string; tint: string }> = {
  Hot: { icon: Flame, bar: "from-emerald-400 to-emerald-500", chip: "bg-emerald-50 text-emerald-600 border-emerald-100", tint: "from-emerald-50/70" },
  Warm: { icon: TrendingUp, bar: "from-amber-400 to-amber-500", chip: "bg-amber-50 text-amber-600 border-amber-100", tint: "from-amber-50/70" },
  Medium: { icon: Gauge, bar: "from-blue-400 to-blue-500", chip: "bg-blue-50 text-blue-600 border-blue-100", tint: "from-blue-50/70" },
  Cold: { icon: Snowflake, bar: "from-slate-300 to-slate-400", chip: "bg-slate-100 text-slate-500 border-slate-200", tint: "from-slate-50/80" },
};

const PAGE_SIZE = 10;

export default function AILeadScoring({
  companies,
  selectedCompanyId,
  setSelectedCompanyId,
  directive,
  onDirectiveApplied,
}: AILeadScoringProps) {
  const [bandFilter, setBandFilter] = useState<LeadBand | "All">("All");
  const [minScore, setMinScore] = useState(0);
  const [page, setPage] = useState(1);

  // Consume an assistant directive (e.g. "show highest intent" → Hot, score ≥ 80).
  useEffect(() => {
    if (!directive || directive.target !== "ai-lead-scoring") return;
    setBandFilter(directive.band ?? "All");
    setMinScore(directive.minScore ?? 0);
    onDirectiveApplied?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directive]);

  // Reset to the first page whenever the filter or dataset changes.
  useEffect(() => { setPage(1); }, [bandFilter, minScore, companies.length]);

  if (companies.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader icon={BrainCircuit} title="AI Lead Scoring" subtitle="Deterministic scoring from company industry, size, web presence, and contactability." />
        <div className="card-premium p-12 text-center">
          <BrainCircuit className="w-10 h-10 text-blue-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#0F172A]">No accounts to score yet</p>
          <p className="text-xs text-[#64748B] mt-1">Import a CSV to populate the scoring matrix.</p>
        </div>
      </div>
    );
  }

  const rankedAll = [...companies]
    .map((c) => ({ company: c, score: computeLeadScore(c) }))
    .sort((a, b) => b.score - a.score);

  // Leaderboard respects the active band + minimum-score filters.
  const ranked = rankedAll.filter(
    (r) => (bandFilter === "All" || leadBand(r.score) === bandFilter) && r.score >= minScore,
  );

  const totalPages = Math.max(1, Math.ceil(ranked.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = ranked.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const active = ranked.find((r) => r.company.id === selectedCompanyId) ?? ranked[0] ?? rankedAll[0];
  const factors = scoreFactors(active.company);
  const activeBand = band(active.score);

  const bandCounts = ALL_BANDS.map((b) => ({ band: b, count: rankedAll.filter((r) => leadBand(r.score) === b).length }));
  const filterActive = bandFilter !== "All" || minScore > 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        icon={BrainCircuit}
        title="AI Lead Scoring"
        subtitle="Score from industry, employee size, country, business keywords & data completeness — 35 base, capped at 100."
      />

      {/* Band summary (Hot / Warm / Medium / Cold) — click to filter the leaderboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {bandCounts.map(({ band: b, count }) => {
          const on = bandFilter === b;
          const meta = BAND_META[b];
          const BIcon = meta.icon;
          return (
            <button
              key={b}
              onClick={() => setBandFilter(on ? "All" : b)}
              className={`card-premium p-4 relative overflow-hidden group text-left transition-all cursor-pointer bg-gradient-to-br ${meta.tint} to-white ${on ? "ring-2 ring-blue-500/40 border-blue-300" : ""}`}
            >
              <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${meta.bar}`} />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">{b} Leads</span>
                <span className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${meta.chip}`}>
                  <BIcon className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-extrabold text-[#0F172A] mt-2 tracking-tight">{count}</div>
              <div className="text-[10px] text-[#64748B] font-medium mt-0.5">{on ? "Filtering" : "Click to filter"}</div>
            </button>
          );
        })}
      </div>

      {/* Active filter indicator */}
      {filterActive && (
        <div className="flex items-center gap-2 -mt-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-100">
            Showing {bandFilter === "All" ? "all bands" : `${bandFilter} leads`}{minScore > 0 ? ` · score ≥ ${minScore}` : ""}
            <button onClick={() => { setBandFilter("All"); setMinScore(0); }} aria-label="Clear filter" className="hover:text-blue-900 cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="xl:col-span-2 card-premium overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] bg-slate-50/70 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-[#0F172A]">Prioritized Accounts ({ranked.length})</h3>
            {ranked.length > 0 && (
              <span className="ml-auto text-[10px] font-semibold text-[#94A3B8]">
                {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, ranked.length)} of {ranked.length}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white border-b border-[#E2E8F0] text-[10px] uppercase text-[#64748B]">
                <tr>
                  <th className="px-5 py-3">Rank</th>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Industry</th>
                  <th className="px-5 py-3 text-right">Employees</th>
                  <th className="px-5 py-3">Band</th>
                  <th className="px-5 py-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {ranked.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-xs text-[#64748B]">
                      No accounts match this filter. <button onClick={() => { setBandFilter("All"); setMinScore(0); }} className="text-blue-600 font-semibold hover:underline cursor-pointer">Clear filter</button>
                    </td>
                  </tr>
                )}
                {pageItems.map((r, i) => {
                  const b = band(r.score);
                  const sel = r.company.id === active.company.id;
                  const rank = (safePage - 1) * PAGE_SIZE + i + 1;
                  return (
                    <tr
                      key={r.company.id}
                      onClick={() => setSelectedCompanyId(r.company.id)}
                      className={`cursor-pointer transition-colors ${sel ? "bg-blue-50/50" : "hover:bg-slate-50"}`}
                    >
                      <td className="px-5 py-3 font-bold text-[#0F172A]">#{rank}</td>
                      <td className="px-5 py-3 font-semibold text-[#0F172A]">{r.company.name}</td>
                      <td className="px-5 py-3 text-[#475569]">{r.company.industry || "—"}</td>
                      <td className="px-5 py-3 text-right text-[#0F172A]">{employeesLabel(r.company)}</td>
                      <td className="px-5 py-3"><Badge tone={b.tone}>{b.label}</Badge></td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:inline-block">
                            <span className="block h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${r.score}%` }} />
                          </span>
                          <span className="font-bold text-[#0F172A]">{r.score}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination — 10 accounts per page */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-[#E2E8F0]">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="text-xs text-[#64748B] font-medium">Page {safePage} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold disabled:opacity-50 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Score breakdown */}
        <div className="xl:col-span-1 space-y-6">
          <div className="card-premium p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-[#0F172A] truncate">{active.company.name}</h3>
                <p className="text-[11px] text-[#64748B] truncate">{active.company.industry} · {active.company.country}</p>
              </div>
              <ScoreRing value={active.score} size={56} strokeWidth={6} />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Badge tone={activeBand.tone}>{activeBand.label} priority</Badge>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-100 px-2 py-0.5 rounded-full">
                <Activity className="w-3 h-3" /> {employeesLabel(active.company)} employees
              </span>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Score breakdown</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#475569]">Base score</span>
                <span className="font-bold text-[#0F172A]">35</span>
              </div>
              {factors.map((f) => (
                <div key={f.label} className="flex items-center justify-between text-xs">
                  <span className={`flex items-center gap-1.5 ${f.hit ? "text-[#0F172A]" : "text-[#94A3B8] line-through"}`}>
                    {f.hit ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                    {f.label}
                  </span>
                  <span className={`font-bold ${f.hit ? "text-emerald-600" : "text-slate-300"}`}>+{f.points}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm pt-2 mt-2 border-t border-[#E2E8F0]">
                <span className="font-bold text-[#0F172A]">Final score</span>
                <span className="font-extrabold text-blue-600">{active.score} / 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
