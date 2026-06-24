import React, { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users2,
  Copy,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Globe2,
  Loader2,
  RefreshCw,
  XCircle,
  Gauge,
  Wand2,
  ShieldCheck,
  Radar,
} from "lucide-react";
import {
  previewImport,
  confirmImport,
  fetchImportBatches,
  deleteImportBatch,
  type ImportPreviewResult,
  type ImportStats,
  type ImportBatch,
  type CsvProvider,
} from "../api/import";
import { Company } from "../types";
import { coverage, hasEmail, hasPhone, normalizeCountry } from "../utils/dataQuality";

interface ImportLeadsProps {
  onImportComplete: () => void;
  onNavigate: (tab: string) => void;
  companies?: Company[];
}

const PROVIDER_LABELS: Record<CsvProvider, string> = {
  apollo: "Apollo.io",
  linkedin: "LinkedIn",
  salesnavigator: "Sales Navigator",
  generic: "Generic CSV",
};

const PROVIDER_COLORS: Record<CsvProvider, string> = {
  apollo: "bg-orange-50 text-orange-700 border-orange-200",
  linkedin: "bg-blue-50 text-blue-700 border-blue-200",
  salesnavigator: "bg-cyan-50 text-cyan-700 border-cyan-200",
  generic: "bg-slate-50 text-slate-700 border-slate-200",
};

type Step = "upload" | "preview" | "results";

// Max CSV upload size — keep in sync with the backend multer limit
// (src/middleware/upload.ts).
const MAX_UPLOAD_MB = 100;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export default function ImportLeads({ onImportComplete, onNavigate, companies = [] }: ImportLeadsProps) {
  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // ── File handling ────────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only CSV files (.csv) are supported.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum is ${MAX_UPLOAD_MB} MB.`);
      return;
    }
    setSelectedFile(file);
    setError(null);
    setPreview(null);
    setPreviewing(true);
    try {
      const result = await previewImport(file);
      setPreview(result);
      setStep("preview");
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Failed to parse CSV file.");
    } finally {
      setPreviewing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ""; // reset input
  }, [handleFile]);

  // ── Import confirm ───────────────────────────────────────────────────────────

  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setError(null);
    try {
      const stats = await confirmImport(selectedFile);
      setImportStats(stats);
      setStep("results");
      onImportComplete(); // trigger CRM data refresh
      loadBatches();
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  // ── Batch history ────────────────────────────────────────────────────────────

  const loadBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const data = await fetchImportBatches();
      setBatches(data);
    } catch {
      // silently ignore
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  const handleDeleteBatch = async (slug: string) => {
    try {
      await deleteImportBatch(slug);
      setBatches((prev) => prev.filter((b) => b.slug !== slug));
    } catch {
      // silently ignore
    }
  };

  const reset = () => {
    setStep("upload");
    setSelectedFile(null);
    setPreview(null);
    setImportStats(null);
    setError(null);
    loadBatches();
  };

  // Load batches on first render
  React.useEffect(() => { loadBatches(); }, [loadBatches]);

  // ── Step indicators ──────────────────────────────────────────────────────────

  const steps: { id: Step; label: string }[] = [
    { id: "upload", label: "Upload CSV" },
    { id: "preview", label: "Preview & Map" },
    { id: "results", label: "Import Results" },
  ];

  const stepIdx = steps.findIndex((s) => s.id === step);

  // ── Import Summary (market-intelligence view of the imported dataset) ─────────
  const summary = React.useMemo(() => {
    const countries = new Set<string>();
    const industries = new Set<string>();
    companies.forEach((c) => {
      const country = normalizeCountry(c.country);
      if (country) countries.add(country);
      if (c.industry?.trim()) industries.add(c.industry.trim());
    });
    return {
      totalCompanies: companies.length,
      countries: countries.size,
      industries: industries.size,
      contactCoverage: coverage(companies, (c) => hasEmail(c) || hasPhone(c)),
    };
  }, [companies]);

  const SUMMARY_CARDS = [
    { label: "Total Companies", value: summary.totalCompanies.toLocaleString(), icon: Building2, bar: "from-blue-400 to-blue-500", chip: "bg-blue-50 text-blue-600 border-blue-100", tint: "from-blue-50/70" },
    { label: "Countries Covered", value: summary.countries.toLocaleString(), icon: Globe2, bar: "from-cyan-400 to-cyan-500", chip: "bg-cyan-50 text-cyan-600 border-cyan-100", tint: "from-cyan-50/70" },
    { label: "Industries Covered", value: summary.industries.toLocaleString(), icon: Radar, bar: "from-violet-400 to-purple-500", chip: "bg-violet-50 text-violet-600 border-violet-100", tint: "from-violet-50/70" },
    { label: "Contact Coverage", value: `${summary.contactCoverage}%`, icon: ShieldCheck, bar: "from-emerald-400 to-emerald-500", chip: "bg-emerald-50 text-emerald-600 border-emerald-100", tint: "from-emerald-50/70" },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            Lead Import System
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Import leads from Apollo, LinkedIn, Sales Navigator, or any generic CSV. Auto-detects format and normalizes data.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Multi-Provider Support
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl px-6 py-4 shadow-xs">
        <div className="flex items-center gap-0">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  i < stepIdx ? "bg-emerald-500 border-emerald-500 text-white" :
                  i === stepIdx ? "bg-blue-600 border-blue-600 text-white" :
                  "bg-white border-[#E2E8F0] text-[#64748B]"
                }`}>
                  {i < stepIdx ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-semibold ${i === stepIdx ? "text-blue-600" : "text-[#64748B]"}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className={`w-4 h-4 mx-3 ${i < stepIdx ? "text-emerald-400" : "text-[#E2E8F0]"}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-rose-700">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── STEP 1: UPLOAD ───────────────────────────────────────────────────────── */}
      {step === "upload" && (
        <div className="space-y-6">
          {/* Drag-drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
              dragOver
                ? "border-blue-400 bg-blue-50/60"
                : "border-[#E2E8F0] bg-white hover:border-blue-300 hover:bg-blue-50/30"
            }`}
          >
            <label htmlFor="csv-file-input" className="cursor-pointer block">
              {previewing ? (
                <div className="flex flex-col items-center gap-3 text-blue-600">
                  <Loader2 className="w-12 h-12 animate-spin" />
                  <p className="font-semibold text-sm">Analyzing CSV…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#0F172A]">
                      Drop your CSV file here
                    </p>
                    <p className="text-xs text-[#64748B] mt-1">
                      or click to browse · Max 100 MB · .csv files only
                    </p>
                  </div>
                </div>
              )}
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileInput}
                disabled={previewing}
              />
            </label>
          </div>

          {/* Import Summary — live intelligence on the imported dataset */}
          <div className="card-premium p-5">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-4">
              Import Summary
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {SUMMARY_CARDS.map((s) => {
                const SIcon = s.icon;
                return (
                  <div key={s.label} className={`card-premium p-4 relative overflow-hidden group bg-gradient-to-br ${s.tint} to-white`}>
                    <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.bar}`} />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] leading-tight">{s.label}</span>
                      <span className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${s.chip}`}><SIcon className="w-3.5 h-3.5" /></span>
                    </div>
                    <div className="text-2xl font-extrabold text-[#0F172A] mt-2 tracking-tight">{s.value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: PREVIEW ──────────────────────────────────────────────────────── */}
      {step === "preview" && preview && (
        <div className="space-y-6">
          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs text-center">
              <div className="text-2xl font-extrabold text-[#0F172A]">{preview.totalRows}</div>
              <div className="text-[10px] text-[#64748B] uppercase font-semibold mt-1">Total Rows</div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs text-center">
              <div className="text-2xl font-extrabold text-blue-600">{preview.companiesDetected}</div>
              <div className="text-[10px] text-[#64748B] uppercase font-semibold mt-1">Companies</div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs text-center">
              <div className="text-2xl font-extrabold text-purple-600">{preview.decisionMakersDetected}</div>
              <div className="text-[10px] text-[#64748B] uppercase font-semibold mt-1">Contacts</div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs text-center">
              <div className="text-2xl font-extrabold text-slate-500">{preview.skippedRows}</div>
              <div className="text-[10px] text-[#64748B] uppercase font-semibold mt-1">Skipped</div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs text-center">
              <div className="text-2xl font-extrabold text-rose-500">{preview.parseErrors.length}</div>
              <div className="text-[10px] text-[#64748B] uppercase font-semibold mt-1">Errors</div>
            </div>
          </div>

          {/* Provider badge + file */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex items-center gap-4">
            <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0F172A] truncate">{preview.filename}</p>
              <p className="text-xs text-[#64748B] mt-0.5">{preview.validRows} valid rows detected</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${PROVIDER_COLORS[preview.provider]}`}>
              {PROVIDER_LABELS[preview.provider]}
            </span>
          </div>

          {/* ── Import Quality Report ───────────────────────────────────────────── */}
          {preview.quality && (() => {
            const q = preview.quality;
            const gradeColor =
              q.grade === "A" ? "from-emerald-500 to-cyan-500" :
              q.grade === "B" ? "from-blue-600 to-cyan-500" :
              q.grade === "C" ? "from-amber-500 to-amber-400" :
              "from-rose-500 to-rose-400";
            const bar = (label: string, val: number) => (
              <div>
                <div className="flex justify-between text-[10px] font-semibold text-[#64748B] mb-1">
                  <span>{label}</span><span className="text-[#0F172A]">{val}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${val >= 70 ? "bg-emerald-500" : val >= 40 ? "bg-amber-500" : "bg-rose-400"}`}
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            );
            return (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-slate-50/70 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-[#0F172A]">Import Quality Report</h3>
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Overall score + source detection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradeColor} text-white flex flex-col items-center justify-center shadow-md`}>
                        <span className="text-2xl font-extrabold leading-none">{q.grade}</span>
                      </div>
                      <div>
                        <div className="text-2xl font-extrabold text-[#0F172A]">{q.score}<span className="text-sm text-[#64748B]">/100</span></div>
                        <p className="text-[10px] uppercase tracking-wider text-[#64748B] font-semibold">Data quality</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#E2E8F0] bg-slate-50/50 p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                        <Radar className="w-3.5 h-3.5 text-blue-500" /> Source Detection
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${PROVIDER_COLORS[q.sourceDetection.provider]}`}>
                          {PROVIDER_LABELS[q.sourceDetection.provider]}
                        </span>
                        <span className="text-xs font-bold text-emerald-600">{q.sourceDetection.confidence}% confident</span>
                      </div>
                      {q.sourceDetection.matchedSignals.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {q.sourceDetection.matchedSignals.map((s) => (
                            <span key={s} className="text-[9px] font-mono text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-3 flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-cyan-600 shrink-0" />
                      <p className="text-[11px] text-cyan-800">
                        <span className="font-bold">{q.titleNormalization.coverage}%</span> of job titles normalized to canonical roles
                        {q.titleNormalization.unmatched > 0 && ` · ${q.titleNormalization.unmatched} kept as-is`}.
                      </p>
                    </div>
                  </div>

                  {/* Field completeness */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Field Completeness
                    </div>
                    {bar("Company", q.completeness.company)}
                    {bar("Job title", q.completeness.title)}
                    {bar("Email", q.completeness.email)}
                    {bar("LinkedIn", q.completeness.linkedin)}
                    {bar("Country", q.completeness.country)}
                    {bar("Employees", q.completeness.employees)}
                  </div>

                  {/* Dedup + distribution + warnings */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-[#E2E8F0] p-2.5 text-center">
                        <div className="text-lg font-extrabold text-amber-600">{q.duplicatesInFile.companies}</div>
                        <div className="text-[9px] uppercase tracking-wider text-[#64748B] font-semibold">Dup companies</div>
                      </div>
                      <div className="rounded-xl border border-[#E2E8F0] p-2.5 text-center">
                        <div className="text-lg font-extrabold text-amber-600">{q.duplicatesInFile.decisionMakers}</div>
                        <div className="text-[9px] uppercase tracking-wider text-[#64748B] font-semibold">Dup contacts</div>
                      </div>
                    </div>
                    {q.topRoles.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Top roles detected</div>
                        <div className="flex flex-wrap gap-1.5">
                          {q.topRoles.map((r) => (
                            <span key={r.role} className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                              {r.role} · {r.count}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {q.warnings.length > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                          <AlertTriangle className="w-3 h-3" /> {q.warnings.length} advisories
                        </div>
                        <ul className="space-y-1">
                          {q.warnings.slice(0, 4).map((w, i) => (
                            <li key={i} className="text-[10px] text-amber-800 leading-snug">• {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Company preview table */}
          {preview.companyPreview.length > 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Companies Preview ({preview.companyPreview.length} shown)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold text-[#64748B] uppercase text-[10px]">Company</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-[#64748B] uppercase text-[10px]">Industry</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-[#64748B] uppercase text-[10px]">Country</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-[#64748B] uppercase text-[10px]">Contacts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]/60">
                    {preview.companyPreview.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="px-4 py-2.5 font-semibold text-[#0F172A]">{c.name || "—"}</td>
                        <td className="px-4 py-2.5 text-[#64748B]">{c.industry || "—"}</td>
                        <td className="px-4 py-2.5 text-[#64748B]">{c.country || "—"}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-blue-600">{c.dmCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Contacts preview table */}
          {preview.leadPreview.length > 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
                <Users2 className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Contacts Preview ({preview.leadPreview.length} shown)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold text-[#64748B] uppercase text-[10px]">Name</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-[#64748B] uppercase text-[10px]">Raw Title</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-[#64748B] uppercase text-[10px]">Normalized</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-[#64748B] uppercase text-[10px]">Email</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-[#64748B] uppercase text-[10px]">Company</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]/60">
                    {preview.leadPreview.map((l, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="px-4 py-2.5 font-semibold text-[#0F172A]">{l.name || "—"}</td>
                        <td className="px-4 py-2.5 text-[#64748B]">{l.role || "—"}</td>
                        <td className="px-4 py-2.5">
                          {l.normalizedRole ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-100 px-2 py-0.5 rounded-full">
                              <Wand2 className="w-2.5 h-2.5" />{l.normalizedRole}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-[#64748B]">{l.email || "—"}</td>
                        <td className="px-4 py-2.5 text-[#64748B]">{l.company || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Parse errors */}
          {preview.parseErrors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-amber-700 uppercase">
                  {preview.parseErrors.length} Parse Warnings
                </h3>
              </div>
              <ul className="space-y-1">
                {preview.parseErrors.slice(0, 5).map((e, i) => (
                  <li key={i} className="text-xs text-amber-700">
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-between">
            <button
              onClick={() => setStep("upload")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#64748B] bg-white border border-[#E2E8F0] hover:bg-slate-50 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Change File
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={importing || preview.companiesDetected === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm shadow-blue-500/20"
            >
              {importing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
              ) : (
                <><Upload className="w-4 h-4" /> Import {preview.companiesDetected} Companies</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: RESULTS ──────────────────────────────────────────────────────── */}
      {step === "results" && importStats && (
        <div className="space-y-6">
          {/* Success banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center gap-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-emerald-800">Import Complete</h3>
              <p className="text-xs text-emerald-700 mt-1">
                Your leads have been imported and are immediately visible across all dashboards.
              </p>
            </div>
          </div>

          {/* Result KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs text-center">
              <div className="text-2xl font-extrabold text-[#0F172A]">{importStats.totalRows}</div>
              <div className="text-[10px] text-[#64748B] uppercase font-semibold mt-1">Total Rows</div>
            </div>
            <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs text-center bg-emerald-50/40">
              <div className="text-2xl font-extrabold text-emerald-600">{importStats.companiesCreated}</div>
              <div className="text-[10px] text-[#64748B] uppercase font-semibold mt-1">Companies Created</div>
            </div>
            <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs text-center bg-emerald-50/40">
              <div className="text-2xl font-extrabold text-purple-600">{importStats.decisionMakersCreated}</div>
              <div className="text-[10px] text-[#64748B] uppercase font-semibold mt-1">Contacts Created</div>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs text-center">
              <div className="text-2xl font-extrabold text-slate-400">
                {importStats.companiesSkipped + importStats.decisionMakersSkipped}
              </div>
              <div className="text-[10px] text-[#64748B] uppercase font-semibold mt-1">Duplicates Skipped</div>
            </div>
            <div className={`bg-white border rounded-xl p-4 shadow-xs text-center ${importStats.errorCount > 0 ? "border-rose-200 bg-rose-50/30" : "border-[#E2E8F0]"}`}>
              <div className={`text-2xl font-extrabold ${importStats.errorCount > 0 ? "text-rose-500" : "text-slate-400"}`}>
                {importStats.errorCount}
              </div>
              <div className="text-[10px] text-[#64748B] uppercase font-semibold mt-1">Errors</div>
            </div>
          </div>

          {/* Provider badge */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex items-center gap-3">
            <Globe2 className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[#64748B]">Source detected:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${PROVIDER_COLORS[importStats.provider as CsvProvider]}`}>
              {PROVIDER_LABELS[importStats.provider as CsvProvider] ?? importStats.provider}
            </span>
            <span className="text-xs text-[#64748B] ml-auto font-mono">{importStats.batchSlug}</span>
          </div>

          {/* Navigate to dashboards */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">View Imported Data</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => onNavigate("company-discovery")}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100/60 transition-all cursor-pointer"
              >
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold text-blue-700">Company Discovery</span>
              </button>
              <button
                onClick={() => onNavigate("decision-intelligence")}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100/60 transition-all cursor-pointer"
              >
                <Users2 className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-bold text-purple-700">Decision Intelligence</span>
              </button>
              <button
                onClick={() => onNavigate("ai-lead-scoring")}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100/60 transition-all cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-bold text-amber-700">AI Lead Scoring</span>
              </button>
              <button
                onClick={() => onNavigate("outreach-studio")}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/60 transition-all cursor-pointer"
              >
                <Copy className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700">Outreach Studio</span>
              </button>
            </div>
          </div>

          {/* Import another */}
          <div className="text-center">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100/60 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Import Another CSV
            </button>
          </div>
        </div>
      )}

      {/* ── Import History ──────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0F172A]">Import History</h3>
          <button
            onClick={loadBatches}
            disabled={loadingBatches}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loadingBatches ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        {batches.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-[#64748B]">
            No imports yet. Upload a CSV file to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#64748B] uppercase text-[10px]">File</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#64748B] uppercase text-[10px]">Source</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-[#64748B] uppercase text-[10px]">Companies</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-[#64748B] uppercase text-[10px]">Contacts</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-[#64748B] uppercase text-[10px]">Status</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-[#64748B] uppercase text-[10px]">Date</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]/60">
                {batches.map((b) => (
                  <tr key={b.slug} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-[#0F172A] max-w-[180px] truncate">{b.filename}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${PROVIDER_COLORS[(b.provider as CsvProvider) ?? "generic"]}`}>
                        {PROVIDER_LABELS[(b.provider as CsvProvider) ?? "generic"] ?? b.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-600">{b.companiesCreated ?? 0}</td>
                    <td className="px-4 py-3 text-center font-bold text-purple-600">{b.decisionMakersCreated ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        b.status === "complete"
                          ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                          : b.status === "processing"
                          ? "text-blue-600 bg-blue-50 border-blue-200"
                          : "text-slate-600 bg-slate-50 border-slate-200"
                      }`}>
                        {b.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#64748B]">
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteBatch(b.slug)}
                        className="text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete batch record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
