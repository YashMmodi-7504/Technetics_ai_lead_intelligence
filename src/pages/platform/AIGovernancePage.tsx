import React from "react";
import { Brain, Coins, ShieldAlert, Sparkles, TrendingUp, Cpu } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from "recharts";

export default function AIGovernancePage() {
  const budgetData = {
    dailyBudget: "$25.00",
    usedBudget: "$3.42",
    remainingBudget: "$21.58",
    totalCalls: 184,
    avgCostPerCall: "$0.018",
    mostUsedModel: "Gemini 2.5 Flash",
    budgetPercentage: 13.68,
  };

  const usageTrend = [
    { hour: "09:00", Gemini: 12, Fallback: 2, Cost: 0.22 },
    { hour: "10:00", Gemini: 24, Fallback: 1, Cost: 0.44 },
    { hour: "11:00", Gemini: 38, Fallback: 0, Cost: 0.72 },
    { hour: "12:00", Gemini: 18, Fallback: 4, Cost: 0.38 },
    { hour: "13:00", Gemini: 42, Fallback: 1, Cost: 0.82 },
    { hour: "14:00", Gemini: 31, Fallback: 0, Cost: 0.58 },
    { hour: "15:00", Gemini: 15, Fallback: 2, Cost: 0.28 },
  ];

  const serviceDistribution = [
    { name: "Outreach Gen", Calls: 120, Tokens: 48000 },
    { name: "Lead Scoring", Calls: 48, Tokens: 12000 },
    { name: "Country Intel", Calls: 16, Tokens: 24000 },
  ];

  const getWarningStateBadge = (percentage: number) => {
    if (percentage > 85) {
      return (
        <span className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
          <ShieldAlert className="w-4 h-4" />
          Budget State: Red Alert
        </span>
      );
    } else if (percentage > 50) {
      return (
        <span className="bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4" />
          Budget State: Warning Amber
        </span>
      );
    }
    return (
      <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 animate-bounce" />
        Budget State: Secure Green
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            AI Cost & Governance Center
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Track daily LLM token consumption limits, budget expenditures, and model latency governors.
          </p>
        </div>
        {getWarningStateBadge(budgetData.budgetPercentage)}
      </div>

      {/* Grid of Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] uppercase block font-sans font-semibold">
              Daily Allotted Budget
            </span>
            <span className="text-lg font-bold text-[#0F172A] mt-1 block">
              {budgetData.dailyBudget}
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] uppercase block font-sans font-semibold">
              Total Budget Expended
            </span>
            <span className="text-lg font-bold text-[#0F172A] mt-1 block">
              {budgetData.usedBudget} ({budgetData.budgetPercentage}%)
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] uppercase block font-sans font-semibold">
              Remaining Safe Balance
            </span>
            <span className="text-lg font-bold text-[#0F172A] mt-1 block">
              {budgetData.remainingBudget}
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] uppercase block font-sans font-semibold">
              Active Serving LLM Model
            </span>
            <span className="text-lg font-bold text-[#0F172A] mt-1 block">
              {budgetData.mostUsedModel}
            </span>
          </div>
        </div>
      </div>

      {/* Usage Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Cost & Calls Trend */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
          <h3 className="font-bold text-sm text-[#0F172A] mb-4">
            Hourly AI Calls & Provider Splits
          </h3>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGemini" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="Gemini" stroke="#2563EB" fillOpacity={1} fill="url(#colorGemini)" name="Gemini AI Calls" />
                <Area type="monotone" dataKey="Fallback" stroke="#F59E0B" fillOpacity={0} name="Offline Fallback Calls" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calls by Service Component */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
          <h3 className="font-bold text-sm text-[#0F172A] mb-4">
            Token Expenditure by Service Module
          </h3>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Tokens" fill="#60A5FA" radius={[4, 4, 0, 0]} name="Tokens Used" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
