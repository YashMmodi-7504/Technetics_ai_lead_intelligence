import React, { useEffect, useState } from "react";
import {
  Cpu,
  Bell,
  Loader2,
  Clock,
  Menu,
  Globe2,
  Search,
} from "lucide-react";
import { API_BASE } from "../config/api";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
  countryFilter?: string;
  setCountryFilter?: (v: string) => void;
  countryOptions?: string[];
  onSearch?: (term: string) => void;
}

export default function Header({
  title,
  onMenuClick,
  countryFilter = "",
  setCountryFilter,
  countryOptions = [],
  onSearch,
}: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [healthStatus, setHealthStatus] = useState<{
    isLoading: boolean;
    geminiConnected: boolean;
    hasKey: boolean;
  }>({
    isLoading: true,
    geminiConnected: false,
    hasKey: false,
  });

  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    // 1. Live server check
    async function checkServerHealth() {
      try {
        const response = await fetch(`${API_BASE}/api/health`);
        if (response.ok) {
          const data = await response.json();
          setHealthStatus({
            isLoading: false,
            geminiConnected: data.geminiConnected,
            hasKey: data.hasKeySecret,
          });
        } else {
          setHealthStatus({
            isLoading: false,
            geminiConnected: false,
            hasKey: false,
          });
        }
      } catch (err) {
        setHealthStatus({
          isLoading: false,
          geminiConnected: false,
          hasKey: false,
        });
      }
    }

    checkServerHealth();

    // Update active clock based on UTC offset or local timezone
    const timer = setInterval(() => {
      const now = new Date();
      setDateStr(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }) + " (UTC-7)",
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header
      id="main-header"
      className="sticky top-0 h-16 glass border-b border-[#E2E8F0] flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20"
    >
      {/* Title block */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 text-[#475569] hover:text-[#0F172A] hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-xl font-sans font-bold text-[#0F172A] tracking-tight truncate">
          {title}
        </h1>
        <div className="hidden sm:block h-4 w-[1px] bg-[#E2E8F0]" />
        <span className="hidden md:inline text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-sans font-medium border border-blue-100 uppercase tracking-widest text-[9px] font-bold">
          ENTERPRISE ARCHITECTURE
        </span>
      </div>

      {/* Operations Panel */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Global search */}
        <form
          onSubmit={(e) => { e.preventDefault(); if (searchTerm.trim()) onSearch?.(searchTerm.trim()); }}
          className="hidden md:block relative"
        >
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search companies…"
            aria-label="Search companies"
            className="w-44 lg:w-56 bg-slate-50 border border-[#E2E8F0] rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
          />
        </form>

        {/* Global country filter (Req #5) */}
        {setCountryFilter && countryOptions.length > 0 && (
          <div className="relative">
            <Globe2 className="w-3.5 h-3.5 text-blue-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              aria-label="Filter by country"
              className={`appearance-none bg-slate-50 border rounded-lg pl-8 pr-7 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer transition-colors ${
                countryFilter ? "border-blue-300 text-blue-700" : "border-[#E2E8F0] text-[#475569]"
              }`}
            >
              <option value="">All Countries</option>
              {countryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <svg className="w-3 h-3 text-[#94A3B8] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        )}
        {/* Dynamic UTC live clock */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-[#E2E8F0] px-3 py-1 rounded-md text-xs font-sans font-medium text-[#475569]">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>{dateStr || "Loading UTC..."}</span>
        </div>

        {/* AI Engine status — single live badge */}
        <div className="flex items-center gap-2">
          {healthStatus.isLoading ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-[#64748B] font-sans font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
              <span>Verifying AI Core...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-sans font-bold">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI ENGINE ONLINE</span>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-lg transition-colors" aria-label="Notifications">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EF4444]" />
        </button>
      </div>
    </header>
  );
}
