import React, { useState } from "react";
import {
  FolderLock,
  Lock,
  Activity,
  Brain,
  History,
  Server,
  Settings as SettingsIcon,
  Cpu,
  Eye,
} from "lucide-react";
import AuthenticationPage from "./platform/AuthenticationPage";
import SystemHealthPage from "./platform/SystemHealthPage";
import AIGovernancePage from "./platform/AIGovernancePage";
import APIMetricsPage from "./platform/APIMetricsPage";
import AuditActivityPage from "./platform/AuditActivityPage";
import DeploymentStatusPage from "./platform/DeploymentStatusPage";

interface SettingsProps {
  sandboxApiKey: string;
  setSandboxApiKey: (key: string) => void;
  aiModelChoice: string;
  setAiModelChoice: (choice: string) => void;
  isScrapingActive: boolean;
  setIsScrapingActive: (val: boolean) => void;
}

type AdminTab = "auth" | "health" | "ai" | "audit" | "metrics" | "deploy";

export default function Settings({
  sandboxApiKey,
  setSandboxApiKey,
  aiModelChoice,
  setAiModelChoice,
  isScrapingActive,
  setIsScrapingActive,
}: SettingsProps) {
  // Tab control inside settings: general configs vs nested platform administration sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<"general" | "admin">("general");
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>("auth");

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Panel */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-500" />
            Platform Preferences & Administration
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Configure operational thresholds, NLP engines, or examine core technical integrity monitors.
          </p>
        </div>
      </div>

      {/* Tabs Switcher (General Settings vs Platform Administration) */}
      <div className="bg-white border border-[#E2E8F0] p-1.5 rounded-xl flex gap-1 shadow-2xs max-w-md">
        <button
          onClick={() => setActiveSubTab("general")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "general"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-[#64748B] hover:bg-slate-50"
          }`}
        >
          General Settings
        </button>
        <button
          onClick={() => setActiveSubTab("admin")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "admin"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-[#64748B] hover:bg-slate-50"
          }`}
        >
          Platform Administration
        </button>
      </div>

      {/* View Switcher content */}
      {activeSubTab === "general" ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-6 max-w-4xl">
          <div className="flex items-center gap-2 pb-4 border-b border-[#E2E8F0]">
            <FolderLock className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-[#0F172A]">General API Keys & NLP Engines</h3>
          </div>

          <div className="space-y-4">
            {/* API Keys */}
            <div className="bg-slate-50 border p-4 rounded-xl space-y-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">
                Google Gemini API Secret Key
              </span>
              <p className="text-xs text-[#64748B]">
                The platform securely loads the secret key from target environmental profiles. Configure secondary sandbox credentials below:
              </p>
              <div className="flex gap-3 pt-2">
                <input
                  type="password"
                  value={sandboxApiKey}
                  onChange={(e) => setSandboxApiKey(e.target.value)}
                  className="flex-1 bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-medium text-[#64748B]"
                />
                <button
                  onClick={() => alert("Credentials saved locally inside this session scope.")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Save Key
                </button>
              </div>
            </div>

            {/* Models */}
            <div className="bg-slate-50 border p-4 rounded-xl space-y-2">
              <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block">
                Target NLP Engine Selection
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#64748B] font-bold block mb-1">
                    PRIMARY LLM PROVIDER
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[#475569] cursor-pointer">
                    <input
                      type="radio"
                      name="llmModel"
                      checked={aiModelChoice === "gemini-3.5-flash"}
                      onChange={() => setAiModelChoice("gemini-3.5-flash")}
                      className="accent-blue-600"
                    />
                    <span>Gemini 3.5 Flash (Optimized for Latency)</span>
                  </label>
                </div>

                <div>
                  <label className="text-[10px] text-[#64748B] font-bold block mb-1">
                    SCRAPING INTENSITY
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[#475569] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isScrapingActive}
                      onChange={() => setIsScrapingActive(!isScrapingActive)}
                      className="accent-blue-600 rounded"
                    />
                    <span>Automated daily B2B intelligence enrichment</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Integrations checklist */}
            <div className="bg-slate-50 border p-4 rounded-xl space-y-3">
              <span className="text-xs font-bold text-[#10B981] uppercase tracking-wider block">
                Integrated B2B Pipelines Status
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#64748B]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>LinkedIn Scraper Sync (ACTIVE)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Salesforce Integration OAuth Bridge (STABLE)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Hubspot CRM Sync (STANDBY)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Technetics Local Datastore Cache (SECURED)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sub-navigation for Platform Administration tabs */}
          <div className="bg-white border border-[#E2E8F0] p-2 rounded-xl flex flex-wrap gap-2 shadow-2xs">
            <button
              onClick={() => setActiveAdminTab("auth")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeAdminTab === "auth"
                  ? "bg-slate-100 text-blue-600 border border-blue-200"
                  : "text-[#64748B] hover:bg-slate-50"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Auth Status
            </button>
            <button
              onClick={() => setActiveAdminTab("health")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeAdminTab === "health"
                  ? "bg-slate-100 text-blue-600 border border-blue-200"
                  : "text-[#64748B] hover:bg-slate-50"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              API Health
            </button>
            <button
              onClick={() => setActiveAdminTab("ai")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeAdminTab === "ai"
                  ? "bg-slate-100 text-blue-600 border border-blue-200"
                  : "text-[#64748B] hover:bg-slate-50"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              AI Usage
            </button>
            <button
              onClick={() => setActiveAdminTab("audit")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeAdminTab === "audit"
                  ? "bg-slate-100 text-blue-600 border border-blue-200"
                  : "text-[#64748B] hover:bg-slate-50"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Audit Logs
            </button>
            <button
              onClick={() => setActiveAdminTab("metrics")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeAdminTab === "metrics"
                  ? "bg-slate-100 text-blue-600 border border-blue-200"
                  : "text-[#64748B] hover:bg-slate-50"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Traffic Metrics
            </button>
            <button
              onClick={() => setActiveAdminTab("deploy")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeAdminTab === "deploy"
                  ? "bg-slate-100 text-blue-600 border border-blue-200"
                  : "text-[#64748B] hover:bg-slate-50"
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              Deploy Readiness
            </button>
          </div>

          {/* Renders Selected Sub-tab component */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
            {activeAdminTab === "auth" && <AuthenticationPage />}
            {activeAdminTab === "health" && <SystemHealthPage />}
            {activeAdminTab === "ai" && <AIGovernancePage />}
            {activeAdminTab === "audit" && <AuditActivityPage />}
            {activeAdminTab === "metrics" && <APIMetricsPage />}
            {activeAdminTab === "deploy" && <DeploymentStatusPage />}
          </div>
        </div>
      )}
    </div>
  );
}
