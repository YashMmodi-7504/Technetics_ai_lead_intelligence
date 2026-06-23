import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { ShieldCheck, User, Clock, KeyRound, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

export default function AuthenticationPage() {
  const { user } = useAuth();

  const mockAuthMetrics = {
    activeSessions: 3,
    failedLoginsToday: 0,
    refreshEvents: 14,
    tokenType: "JWT Access + HttpOnly Refresh Cookie",
    tokenExpiry: "15 minutes",
    refreshExpiry: "7 days",
    lastLogin: new Date().toLocaleTimeString(),
    sessionAge: "Less than 1 hour",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            Security & Authentication Control
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Monitor active sessions, refresh tokens, and authentication events in real-time.
          </p>
        </div>
        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded border border-emerald-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
          <CheckCircle className="w-3.5 h-3.5" />
          Auth Engine: Healthy
        </span>
      </div>

      {/* Grid of Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] uppercase block font-sans font-semibold">
              Authenticated Users
            </span>
            <span className="text-lg font-bold text-[#0F172A] mt-1 block">
              1 (Current)
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] uppercase block font-sans font-semibold">
              Active Sessions
            </span>
            <span className="text-lg font-bold text-[#0F172A] mt-1 block">
              {mockAuthMetrics.activeSessions}
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] uppercase block font-sans font-semibold">
              Failed Logins (24h)
            </span>
            <span className="text-lg font-bold text-[#0F172A] mt-1 block">
              {mockAuthMetrics.failedLoginsToday}
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] uppercase block font-sans font-semibold">
              Token Refresh Events
            </span>
            <span className="text-lg font-bold text-[#0F172A] mt-1 block">
              {mockAuthMetrics.refreshEvents}
            </span>
          </div>
        </div>
      </div>

      {/* Details Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current User Info */}
        <div className="lg:col-span-1 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#0F172A] border-b border-[#E2E8F0] pb-3 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-500" />
            Current Session Details
          </h3>
          <div className="space-y-3.5 text-xs text-[#0F172A]">
            <div className="flex justify-between items-center">
              <span className="text-[#64748B] font-medium">User Profile:</span>
              <span className="font-semibold">{user?.email.split("@")[0] || "Developer"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748B] font-medium">Email:</span>
              <span className="font-semibold text-blue-600">{user?.email || "dev@technetics.local"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748B] font-medium">Session Status:</span>
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                Healthy
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748B] font-medium">Auth Mechanism:</span>
              <span className="font-semibold">OAuth JWT Cookie</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748B] font-medium">Last Login Check:</span>
              <span className="font-semibold text-[#64748B]">{mockAuthMetrics.lastLogin}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748B] font-medium">Session Age:</span>
              <span className="font-semibold text-[#64748B]">{mockAuthMetrics.sessionAge}</span>
            </div>
          </div>
        </div>

        {/* Token Security Status */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#0F172A] border-b border-[#E2E8F0] pb-3">
            Token & Security Lifecycle
          </h3>
          <div className="space-y-4">
            <div className="bg-slate-50 border border-[#E2E8F0] rounded-xl p-4 space-y-2">
              <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">
                Token Strategy Configuration
              </span>
              <p className="text-xs text-[#0F172A] leading-relaxed font-semibold">
                {mockAuthMetrics.tokenType}
              </p>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Access tokens are short-lived and saved in-memory. Refresh tokens are cryptographic secrets secured in HttpOnly cookies to defend against XSS and token-jacking.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-[#E2E8F0]/80 rounded-xl p-4 space-y-1">
                <span className="text-[9px] text-[#64748B] uppercase font-bold tracking-wider">
                  Access Token TTL
                </span>
                <span className="text-sm font-bold text-[#0F172A] block">
                  {mockAuthMetrics.tokenExpiry}
                </span>
                <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider block">
                  Active
                </span>
              </div>
              <div className="bg-slate-50 border border-[#E2E8F0]/80 rounded-xl p-4 space-y-1">
                <span className="text-[9px] text-[#64748B] uppercase font-bold tracking-wider">
                  Refresh Token TTL
                </span>
                <span className="text-sm font-bold text-[#0F172A] block">
                  {mockAuthMetrics.refreshExpiry}
                </span>
                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block font-semibold">
                  Valid - Auto Rotating
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
