import React, { useState, useEffect } from "react";
import { Company } from "../types";
import {
  ArrowUpDown,
  Search,
  Eye,
  BrainCircuit,
  Mail,
  Building,
} from "lucide-react";
import { employeesLabel, estimateOpportunityValue } from "../utils/leadScoring";

interface DataTableProps {
  companies: Company[];
  onActionClick: (
    company: Company,
    action: "view" | "analyze" | "score" | "outreach"
  ) => void;
  /** When true, keep the incoming company order (page controls sorting). */
  preSorted?: boolean;
}

export default function DataTable({ companies, onActionClick, preSorted = false }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Company>("leadScore");
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Opportunity value from the size-tier model ($10K / $25K / $50K).
  const fmtValue = (v: number) => (v >= 1e3 ? `$${(v / 1e3).toFixed(0)}K` : `$${v}`);

  // Sorting Handler
  const handleSort = (field: keyof Company) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
    setCurrentPage(1);
  };

  // Filter (always) + sort (unless the parent already sorted the list)
  const filtered = [...companies].filter((comp) => {
    const query = searchTerm.toLowerCase();
    return (
      comp.name.toLowerCase().includes(query) ||
      comp.industry.toLowerCase().includes(query) ||
      comp.country.toLowerCase().includes(query)
    );
  });
  const sortedAndFiltered = preSorted
    ? filtered
    : filtered.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortAsc ? aVal - bVal : bVal - aVal;
        }
        return sortAsc
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });

  // Paginate items
  const totalItems = sortedAndFiltered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedCompanies = sortedAndFiltered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Get status class — brand-aligned palette (blue / cyan / emerald / amber / rose / slate)
  const getStatusBadge = (status: Company["status"]) => {
    const classes =
      {
        "New Leads": "bg-slate-100 text-slate-600 border-slate-200",
        Qualified: "bg-blue-50 text-blue-600 border-blue-100",
        Contacted: "bg-amber-50 text-[#F59E0B] border-[#FDE68A]",
        "Meeting Scheduled": "bg-cyan-50 text-cyan-700 border-cyan-100",
        "Proposal Sent": "bg-blue-50 text-blue-700 border-blue-200",
        Negotiation: "bg-amber-50 text-amber-700 border-amber-200",
        Won: "bg-emerald-500 text-white border-transparent font-bold",
        Lost: "bg-rose-50 text-[#EF4444] border-rose-100",
      }[status] || "bg-slate-50 text-[#475569] border-slate-200";

    return `px-2.5 py-1 text-[10px] font-sans font-semibold rounded-full border uppercase tracking-wider ${classes}`;
  };

  // Score chip color by threshold
  const scoreChip = (score: number) => {
    if (score >= 90) return "bg-emerald-50 border-emerald-200 text-emerald-700";
    if (score >= 75) return "bg-blue-50 border-blue-200 text-blue-700";
    if (score >= 50) return "bg-amber-50 border-amber-200 text-amber-700";
    return "bg-rose-50 border-rose-200 text-rose-700";
  };

  // Buying-intent indicator
  const intentMeta = (score: number) => {
    if (score >= 80) return { tone: "bg-emerald-500", label: "Hot intent" };
    if (score >= 60) return { tone: "bg-amber-500", label: "Warm intent" };
    return { tone: "bg-slate-300", label: "Cold intent" };
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between min-h-[500px]">
      <div>
        {/* Table search header bar */}
        <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/70">
          <div>
            <h3 className="font-sans font-bold text-[#0F172A] text-base">
              Target Company Directory
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Automated enrichment and sizing analytics for qualified accounts.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              id="company-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search company, country, industry..."
              className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-2xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#EFF6FF] text-[10px] font-bold font-sans text-[#475569] uppercase tracking-wider">
                <th className="px-5 py-4">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1.5 hover:text-[#0F172A] transition-colors cursor-pointer"
                  >
                    <span>Company</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-5 py-4">
                  <button
                    onClick={() => handleSort("country")}
                    className="flex items-center gap-1.5 hover:text-[#0F172A] transition-colors cursor-pointer"
                  >
                    <span>Country</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-5 py-4">
                  <button
                    onClick={() => handleSort("industry")}
                    className="flex items-center gap-1.5 hover:text-[#0F172A] transition-colors cursor-pointer"
                  >
                    <span>Industry</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-5 py-4 text-right">Value</th>
                <th className="px-5 py-4 text-right">
                  <button
                    onClick={() => handleSort("employees")}
                    className="flex items-center gap-1.5 justify-end hover:text-[#0F172A] transition-colors ml-auto cursor-pointer"
                  >
                    <span>Employees</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-5 py-4 text-center">
                  <button
                    onClick={() => handleSort("leadScore")}
                    className="flex items-center gap-1.5 justify-center hover:text-[#0F172A] transition-colors mx-auto cursor-pointer"
                  >
                    <span>Opp Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {paginatedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#64748B] font-sans">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Building className="w-10 h-10 text-gray-300 animate-pulse" />
                      <span>No companies match your filters or search term "{searchTerm}".</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((comp) => (
                  <tr
                    key={comp.id}
                    id={`company-row-${comp.id}`}
                    className="hover:bg-blue-50/40 transition-colors group/row"
                  >
                    {/* Co. Profile */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-[#E2E8F0] flex items-center justify-center text-base shadow-2xs">
                          {comp.logo}
                        </div>
                        <div>
                          <span className="font-sans font-bold text-[#0F172A] group-hover/row:text-blue-600 transition-colors block text-xs">
                            {comp.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className="inline-flex items-center gap-1 text-[9px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-100 px-1.5 py-0.5 rounded"
                              title={`AI readiness ${comp.aiScore}%`}
                            >
                              <BrainCircuit className="w-2.5 h-2.5" />
                              AI {comp.aiScore}
                            </span>
                            <span
                              className="flex items-center gap-1 text-[9px] text-[#64748B]"
                              title={intentMeta(comp.buyingIntentScore).label}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${intentMeta(comp.buyingIntentScore).tone}`} />
                              {comp.buyingIntentScore}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Country Flag / Name */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-sans text-[#0F172A]">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded font-bold border border-blue-100 font-mono">
                          {comp.countryCode}
                        </span>
                        <span className="font-medium">{comp.country}</span>
                      </div>
                    </td>

                    {/* Industry */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs font-sans text-[#475569] font-medium">
                      {comp.industry}
                    </td>

                    {/* Opportunity value (size-tier model) */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs font-bold text-emerald-600">
                      {fmtValue(estimateOpportunityValue(comp))}
                    </td>

                    {/* Size */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs font-semibold text-[#0F172A]">
                      {employeesLabel(comp)}
                    </td>

                    {/* Total Lead Score (Opportunity Score) */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg border text-xs font-bold ${scoreChip(comp.leadScore)}`}>
                        {comp.leadScore}%
                      </span>
                    </td>

                    {/* B2B Status Tag */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={getStatusBadge(comp.status)}>{comp.status}</span>
                    </td>

                    {/* Event Actions */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onActionClick(comp, "view")}
                          title="Inspect Details"
                          aria-label={`Inspect ${comp.name}`}
                          className="p-1 px-1.5 rounded bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-blue-300 transition-all cursor-pointer shadow-3xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onActionClick(comp, "score")}
                          title="Lead Scoring"
                          aria-label={`Score ${comp.name}`}
                          className="p-1 px-1.5 rounded bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-3xs"
                        >
                          <BrainCircuit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onActionClick(comp, "outreach")}
                          title="Draft Copy"
                          aria-label={`Draft outreach for ${comp.name}`}
                          className="p-1 px-1.5 rounded bg-cyan-50 border border-cyan-100 text-cyan-600 hover:bg-cyan-600 hover:text-white transition-all cursor-pointer shadow-3xs"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between bg-slate-50/70 text-xs font-sans text-[#64748B] font-semibold">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, totalItems)} of {totalItems} accounts
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-lg disabled:opacity-50 text-[#0F172A] hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed shadow-3xs"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-lg disabled:opacity-50 text-[#0F172A] hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed shadow-3xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
