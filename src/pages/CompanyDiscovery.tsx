import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Mail,
  Phone,
  Globe2,
  Linkedin,
  X,
  ExternalLink,
  Users2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Gauge,
  Database,
  Hash,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { Company, CountryOpportunity } from "../types";
import type { AssistantDirective } from "../utils/assistantEngine";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";
import ScoreRing from "../components/ui/ScoreRing";
import {
  employeesLabel,
  normalizedEmployees,
  opportunityTier,
} from "../utils/leadScoring";
import { dataCompleteness } from "../utils/dataQuality";
import { normalizeUrl, normalizeEmail, normalizePhone, telHref } from "../utils/url";

interface CompanyDiscoveryProps {
  companies: Company[]; // full set (country counts computed here)
  countries: CountryOpportunity[];
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;
  countryFilter: string;
  setCountryFilter: (v: string) => void;
  onActionClick: (comp: Company, action: "view" | "analyze" | "score" | "outreach") => void;
  onImportClick: () => void;
  directive?: AssistantDirective | null;
  onDirectiveApplied?: () => void;
}

const PAGE_SIZE = 12;
const importedDate = (c: Company) =>
  c.activityTimeline?.find((a) => /import/i.test(a.title))?.date ?? c.activityTimeline?.[0]?.date ?? "—";

export default function CompanyDiscovery({
  companies,
  setSelectedCompanyId,
  countryFilter,
  setCountryFilter,
  onActionClick,
  onImportClick,
  directive,
  onDirectiveApplied,
}: CompanyDiscoveryProps) {
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [sortBy, setSortBy] = useState("size-desc");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<Company | null>(null);
  const [copied, setCopied] = useState<string>("");
  // Keyword-based industry filter applied by the AI assistant (OR-match).
  const [kwFilter, setKwFilter] = useState<string[]>([]);
  const [kwLabel, setKwLabel] = useState<string>("");

  // Consume an assistant directive: apply industry keywords, sort, and search.
  useEffect(() => {
    if (!directive || directive.target !== "company-discovery") return;
    if (directive.industryKeywords?.length) {
      setKwFilter(directive.industryKeywords);
      setKwLabel(directive.industryKeywords.join(", "));
      setIndustryFilter("");
    } else {
      setKwFilter([]);
      setKwLabel("");
    }
    if (directive.sort) setSortBy(directive.sort === "score-desc" ? "score" : "size-desc");
    setSearch(directive.search ?? "");
    setCityFilter("");
    setSizeFilter("");
    onDirectiveApplied?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directive]);

  // Live per-country counts from the FULL dataset (Part 1).
  const countryCounts = useMemo(() => {
    const m: Record<string, number> = {};
    companies.forEach((c) => { const k = c.country || "Unknown"; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [companies]);

  // Scope by selected country first — drives cards, stats, and charts.
  const countryScoped = useMemo(
    () => (countryFilter ? companies.filter((c) => c.country === countryFilter) : companies),
    [companies, countryFilter],
  );

  const industries = useMemo(
    () => Array.from(new Set(countryScoped.map((c) => c.industry).filter(Boolean))).sort(),
    [countryScoped],
  );
  const cities = useMemo(
    () => Array.from(new Set(countryScoped.map((c) => c.city).filter(Boolean))).sort(),
    [countryScoped],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return countryScoped
      .filter((c) => {
        const matchesSearch =
          !q || [c.name, c.industry, c.city, c.country].some((v) => (v || "").toLowerCase().includes(q));
        const matchesIndustry = !industryFilter || c.industry === industryFilter;
        const matchesKeywords =
          !kwFilter.length || kwFilter.some((k) => (c.industry || "").toLowerCase().includes(k));
        const matchesCity = !cityFilter || c.city === cityFilter;
        const matchesSize = !sizeFilter || opportunityTier(c) === sizeFilter;
        return matchesSearch && matchesIndustry && matchesKeywords && matchesCity && matchesSize;
      })
      .sort((a, b) => {
        if (sortBy === "size-desc") return normalizedEmployees(b) - normalizedEmployees(a);
        if (sortBy === "size-asc") return normalizedEmployees(a) - normalizedEmployees(b);
        if (sortBy === "score") return b.leadScore - a.leadScore;
        return a.name.localeCompare(b.name);
      });
  }, [countryScoped, search, industryFilter, kwFilter, cityFilter, sizeFilter, sortBy]);

  useEffect(
    () => setPage(1),
    [countryFilter, search, industryFilter, kwFilter, cityFilter, sizeFilter, sortBy, companies.length],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openDrawer = (c: Company) => { setDrawer(c); setSelectedCompanyId(c.id); };
  const copy = (label: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 1800);
  };

  // Lead-score ring colors: green 80+, amber 60+, red below 60.
  const leadRingColor = (v: number) =>
    v >= 80 ? { from: "#10B981", to: "#34D399" } : v >= 60 ? { from: "#F59E0B", to: "#FBBF24" } : { from: "#EF4444", to: "#F87171" };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        icon={Building2}
        title="Company Discovery"
        subtitle="Every card is a live database record — filter by market, sector, and size."
        actions={
          <button onClick={onImportClick} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20 cursor-pointer">
            <Plus className="w-4 h-4" /> Ingest LinkedIn Company
          </button>
        }
      />

      {/* PART 1 — glass search toolbar */}
      <div className="card-glass p-4 space-y-3">
        {/* Assistant-applied keyword filter chip */}
        {kwFilter.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-100">
              <Sparkles className="w-3 h-3" /> AI filter: {kwLabel}
              <button onClick={() => { setKwFilter([]); setKwLabel(""); }} aria-label="Clear AI filter" className="hover:text-blue-900 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}

        {/* Country · Industry · City · Size · Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} aria-label="Country" className="bg-white/70 border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer">
            <option value="">All Countries ({companies.length})</option>
            {countryCounts.map(([country, count]) => <option key={country} value={country}>{country} ({count})</option>)}
          </select>
          <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} aria-label="Industry" className="bg-white/70 border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer">
            <option value="">All Industries ({industries.length})</option>
            {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
          </select>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} aria-label="City" className="bg-white/70 border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer">
            <option value="">All Cities ({cities.length})</option>
            {cities.map((ct) => <option key={ct} value={ct}>{ct}</option>)}
          </select>
          <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} aria-label="Company size" className="bg-white/70 border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer">
            <option value="">All Sizes</option>
            <option value="Small">Small (&lt;200)</option>
            <option value="Medium">Medium (200–1,000)</option>
            <option value="Large">Large (1,000+)</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" aria-label="Search" className="w-full bg-white/70 border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[#64748B] px-1">
        <span>{filtered.length} {countryFilter ? `in ${countryFilter}` : "companies"}</span>
        <span>Page {page} of {totalPages}</span>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="card-premium p-12 text-center">
          <Building2 className="w-10 h-10 text-blue-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#0F172A]">No companies match</p>
          <p className="text-xs text-[#64748B] mt-1">Adjust filters or import a CSV to populate the directory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {pageItems.map((c, i) => {
            const website = normalizeUrl(c.website);
            const linkedin = normalizeUrl(c.linkedin);
            const email = normalizeEmail(c.generalEmail);
            const phone = normalizePhone(c.generalPhone);
            const completeness = dataCompleteness(c);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
                className="relative card-glass p-5 flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-200 shadow-[0_8px_30px_rgba(37,99,235,0.10)] hover:shadow-[0_22px_55px_rgba(37,99,235,0.22)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 flex items-center justify-center text-blue-600 font-extrabold shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#0F172A] truncate">{c.name}</h4>
                      <p className="text-[11px] text-[#64748B] truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{[c.country, c.city].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                  </div>
                  <ScoreRing value={c.leadScore} size={54} strokeWidth={6} sublabel="lead" colorFor={leadRingColor} />
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Badge tone="primary">{c.industry || "—"}</Badge>
                  <Badge tone={opportunityTier(c) === "Large" ? "success" : opportunityTier(c) === "Medium" ? "accent" : "neutral"}>{employeesLabel(c)} staff</Badge>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${completeness >= 80 ? "text-emerald-700 bg-emerald-50 border-emerald-100" : completeness >= 50 ? "text-amber-700 bg-amber-50 border-amber-100" : "text-rose-700 bg-rose-50 border-rose-100"}`}><Gauge className="w-2.5 h-2.5" />{completeness}% complete</span>
                </div>

                {c.description && (
                  <p className="text-[11px] text-[#64748B] leading-relaxed mt-3 line-clamp-2">{c.description}</p>
                )}

                <div className="mt-3 space-y-1.5 text-[11px]">
                  {email ? (
                    <a href={`mailto:${email}`} className="flex items-center gap-1.5 text-[#475569] hover:text-blue-600 truncate"><Mail className="w-3 h-3 shrink-0 text-[#94A3B8]" /><span className="truncate">{email}</span></a>
                  ) : <span className="flex items-center gap-1.5 text-slate-300"><Mail className="w-3 h-3 shrink-0" />No email</span>}
                  {phone ? (
                    <a href={telHref(phone)} className="flex items-center gap-1.5 text-[#475569] hover:text-blue-600"><Phone className="w-3 h-3 shrink-0 text-[#94A3B8]" />{phone}</a>
                  ) : <span className="flex items-center gap-1.5 text-slate-300"><Phone className="w-3 h-3 shrink-0" />No phone</span>}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#E2E8F0]">
                  <a
                    href={website ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={!website}
                    onClick={(e) => { if (!website) e.preventDefault(); }}
                    className={`flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-bold rounded-lg py-2 border transition-colors ${website ? "text-[#475569] border-[#E2E8F0] hover:text-blue-600 hover:border-blue-300" : "text-slate-300 border-[#E2E8F0] cursor-not-allowed"}`}
                  >
                    <Globe2 className="w-3.5 h-3.5" /> Website
                  </a>
                  <a
                    href={linkedin ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={!linkedin}
                    onClick={(e) => { if (!linkedin) e.preventDefault(); }}
                    className={`flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-bold rounded-lg py-2 border transition-colors ${linkedin ? "text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100/60" : "text-slate-300 border-[#E2E8F0] cursor-not-allowed"}`}
                  >
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                  </a>
                  <button onClick={() => openDrawer(c)} className="px-3 py-2 rounded-lg text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer">Details</button>
                  <button onClick={() => onActionClick(c, "outreach")} title="Generate outreach" aria-label="Generate outreach" className="px-2.5 py-2 rounded-lg text-cyan-700 bg-cyan-50 border border-cyan-100 hover:bg-cyan-100/60 transition-colors cursor-pointer"><Mail className="w-3.5 h-3.5" /></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs disabled:opacity-50 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1"><ChevronLeft className="w-3.5 h-3.5" /> Prev</button>
          <span className="text-xs text-[#64748B] px-2">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs disabled:opacity-50 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1">Next <ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* PART 5 — details drawer */}
      <AnimatePresence>
        {drawer && (() => {
          const website = normalizeUrl(drawer.website);
          const linkedin = normalizeUrl(drawer.linkedin);
          const email = normalizeEmail(drawer.generalEmail);
          const phone = normalizePhone(drawer.generalPhone);
          return (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDrawer(null)} />
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-[#E2E8F0] shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-[#E2E8F0] px-5 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 flex items-center justify-center text-blue-600 font-extrabold shrink-0">{drawer.name.charAt(0).toUpperCase()}</div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#0F172A] truncate">{drawer.name}</h3>
                    <p className="text-[11px] text-[#64748B] truncate">{[drawer.country, drawer.city].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
                <button onClick={() => setDrawer(null)} aria-label="Close" className="p-2 rounded-lg hover:bg-slate-100 text-[#64748B] cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-5 space-y-5">
                {/* Scores */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-[#E2E8F0] p-3 text-center">
                    <ScoreRing value={drawer.leadScore} size={48} strokeWidth={5} />
                    <div className="text-[9px] uppercase tracking-wider text-[#64748B] font-semibold mt-1">Lead Score</div>
                  </div>
                  <div className="rounded-xl border border-[#E2E8F0] p-3 text-center">
                    <ScoreRing value={dataCompleteness(drawer)} size={48} strokeWidth={5} />
                    <div className="text-[9px] uppercase tracking-wider text-[#64748B] font-semibold mt-1">Data Completeness</div>
                  </div>
                </div>

                {drawer.description && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Description</p>
                    <p className="text-xs text-[#475569] leading-relaxed">{drawer.description}</p>
                  </div>
                )}

                {/* Field list */}
                <dl className="space-y-2 text-xs">
                  {[
                    { label: "Country", value: drawer.country, icon: Globe2 },
                    { label: "City", value: drawer.city || "—", icon: MapPin },
                    { label: "Industry", value: drawer.industry, icon: Briefcase },
                    { label: "Employee Size", value: `${employeesLabel(drawer)} (${opportunityTier(drawer)})`, icon: Users2 },
                    { label: "Data Completeness", value: `${dataCompleteness(drawer)}%`, icon: Gauge },
                    { label: "Source File", value: "CSV Import", icon: Database },
                    { label: "Import Date", value: importedDate(drawer), icon: CalendarDays },
                    { label: "Record ID", value: drawer.id, icon: Hash, mono: true },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center justify-between gap-3 border-b border-[#E2E8F0]/60 pb-2">
                      <dt className="flex items-center gap-1.5 text-[#64748B]"><f.icon className="w-3.5 h-3.5" />{f.label}</dt>
                      <dd className={`font-semibold text-[#0F172A] text-right truncate max-w-[55%] ${f.mono ? "font-mono text-[10px]" : ""}`}>{f.value}</dd>
                    </div>
                  ))}
                </dl>

                {/* Contact (clickable + copy) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2">
                    <a href={email ? `mailto:${email}` : undefined} className={`flex items-center gap-1.5 text-xs min-w-0 ${email ? "text-blue-600 hover:underline" : "text-slate-400"}`}><Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{email ?? "No email"}</span></a>
                    {email && <button onClick={() => copy("email", email)} className="text-[10px] font-bold text-[#64748B] hover:text-blue-600 inline-flex items-center gap-1 shrink-0">{copied === "email" ? <><Check className="w-3 h-3 text-emerald-500" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}</button>}
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2">
                    <a href={phone ? telHref(phone) : undefined} className={`flex items-center gap-1.5 text-xs min-w-0 ${phone ? "text-blue-600 hover:underline" : "text-slate-400"}`}><Phone className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{phone ?? "No phone"}</span></a>
                    {phone && <button onClick={() => copy("phone", phone)} className="text-[10px] font-bold text-[#64748B] hover:text-blue-600 inline-flex items-center gap-1 shrink-0">{copied === "phone" ? <><Check className="w-3 h-3 text-emerald-500" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}</button>}
                  </div>
                </div>

                {/* Visit buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <a href={website ?? undefined} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (!website) e.preventDefault(); }} className={`inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-colors ${website ? "text-[#475569] border-[#E2E8F0] hover:text-blue-600 hover:border-blue-300" : "text-slate-300 border-[#E2E8F0] cursor-not-allowed"}`}><Globe2 className="w-3.5 h-3.5" /> Visit Website <ExternalLink className="w-3 h-3" /></a>
                  <a href={linkedin ?? undefined} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (!linkedin) e.preventDefault(); }} className={`inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-colors ${linkedin ? "text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100/60" : "text-slate-300 border-[#E2E8F0] cursor-not-allowed"}`}><Linkedin className="w-3.5 h-3.5" /> Visit LinkedIn <ExternalLink className="w-3 h-3" /></a>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { onActionClick(drawer, "score"); setDrawer(null); }} className="py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer">Score lead</button>
                  <button onClick={() => { onActionClick(drawer, "outreach"); setDrawer(null); }} className="py-2.5 rounded-xl text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-100 hover:bg-cyan-100/60 transition-colors cursor-pointer">Draft outreach</button>
                </div>
              </div>
            </motion.aside>
          </>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
