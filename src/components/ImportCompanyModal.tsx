import React, { useState } from "react";
import { X, Linkedin, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { ingestCompany } from "../api/crm";

interface ImportCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
}

export default function ImportCompanyModal({ isOpen, onClose, onImported }: ImportCompanyModalProps) {
  const [url, setUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleScrape = async () => {
    setErrorMsg("");
    if (!url.trim()) {
      setErrorMsg("Please enter a valid LinkedIn URL");
      return;
    }
    
    if (!url.includes("linkedin.com/company/")) {
      setErrorMsg("Must be a valid LinkedIn company URL");
      return;
    }

    setIsScraping(true);

    try {
      // Persist the company via the backend ingest endpoint. Full scraping /
      // enrichment is Task #9; this creates a real DB record now.
      await ingestCompany(url.trim());

      setSuccess(true);
      if (onImported) onImported();
      setTimeout(() => {
        setSuccess(false);
        setUrl("");
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(
        err?.message || "Failed to ingest company data. Please try again.",
      );
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-2xs">
              <Linkedin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[#0F172A] font-bold text-sm">Automated Ingestion</h2>
              <p className="text-[10px] text-[#64748B] font-sans font-medium uppercase tracking-wider">
                LinkedIn Profile Scraper
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] hover:bg-white p-1.5 rounded-lg border border-transparent hover:border-[#E2E8F0] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Company Ingested</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  The company profile and relevant decision-makers have been added to the database.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-xs text-[#475569] leading-relaxed">
                  Enter a target company's LinkedIn profile URL. The AI agent will extract technology demand signals, workforce metrics, and key decisions makers to generate a preliminary opportunity score.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                    LinkedIn Company URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Linkedin className="h-4 w-4 text-[#94A3B8]" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-3xs bg-white"
                      placeholder="https://www.linkedin.com/company/example/"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={isScraping}
                    />
                  </div>
                  {errorMsg && <p className="text-[10px] text-red-500 mt-1 font-medium">{errorMsg}</p>}
                </div>
              </div>

              {/* Status Simulation */}
              {isScraping && (
                <div className="bg-slate-50 border border-[#E2E8F0] p-4 rounded-xl space-y-3 text-xs text-[#475569] font-sans font-medium animate-fade-in shadow-2xs">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="font-bold">Scraping In Progress...</span>
                  </div>
                  <ul className="space-y-1 pl-5 list-disc text-[10px] text-[#64748B]">
                    <li>Resolving LinkedIn URL</li>
                    <li>Extracting company description and industry</li>
                    <li>Parsing technology demand signals</li>
                    <li>Identifying key decision makers (CTO, CIO)</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-6 py-4 border-t border-[#E2E8F0] bg-slate-50 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isScraping}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[#475569] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleScrape}
              disabled={isScraping}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm"
            >
              {isScraping ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Trigger Scrape
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
