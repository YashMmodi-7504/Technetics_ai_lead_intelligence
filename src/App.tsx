import { useState, useMemo } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ImportCompanyModal from "./components/ImportCompanyModal";

import LoginScreen from "./components/LoginScreen";
import RegisterScreen from "./components/RegisterScreen";
import { useAuth } from "./hooks/useAuth";

import ExecutiveOverview from "./pages/ExecutiveOverview";
import CountryIntelligence from "./pages/CountryIntelligence";
import IndustryIntelligence from "./pages/IndustryIntelligence";
import CompanyDiscovery from "./pages/CompanyDiscovery";
import AILeadScoring from "./pages/AILeadScoring";
import OutreachStudio from "./pages/OutreachStudio";
import OpportunityIntelligence from "./pages/OpportunityIntelligence";
import DataQualityCenter from "./pages/DataQualityCenter";
import Settings from "./pages/Settings";
import ImportLeads from "./pages/ImportLeads";
import AiCopilot from "./components/AiCopilot";
import DashboardSkeleton from "./components/DashboardSkeleton";

import { useCrmData } from "./hooks/useCrmData";
import { Company } from "./types";

import { RefreshCw } from "lucide-react";
import { computeLeadScore } from "./utils/leadScoring";
import { normalizeCountry } from "./utils/dataQuality";
import type { AssistantDirective } from "./utils/assistantEngine";

export default function App() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [activeTab, setActiveTab] = useState<string>("executive-overview");

  // Company + country data sourced from the backend (CSV imports only).
  const { companies, countries, loading, error, refetch } = useCrmData();

  // Lead score derived purely from each company's imported fields (V2 — no
  // decision-maker dependency), so every dashboard reads a computed value.
  const enrichedCompanies = useMemo(
    () => companies.map((c) => {
      const country = normalizeCountry(c.country);
      const withCountry = { ...c, country };
      const score = computeLeadScore(withCountry);
      return { ...withCountry, leadScore: score, aiScore: score };
    }),
    [companies],
  );

  // Global country filter — scopes every page.
  const [countryFilter, setCountryFilter] = useState<string>("");
  const countryOptions = useMemo(
    () => Array.from(new Set(enrichedCompanies.map((c) => c.country).filter(Boolean))).sort(),
    [enrichedCompanies],
  );
  const visibleCompanies = useMemo(
    () => (countryFilter ? enrichedCompanies.filter((c) => c.country === countryFilter) : enrichedCompanies),
    [enrichedCompanies, countryFilter],
  );

  const [promptsHistory, setPromptsHistory] = useState<string[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // Assistant directive — a navigation + filter instruction from Ask TECHNETICS AI.
  // Pages consume it on mount and clear it via onDirectiveApplied.
  const [assistantDirective, setAssistantDirective] = useState<AssistantDirective | null>(null);
  const applyDirective = (d: AssistantDirective) => {
    if (d.country !== undefined) setCountryFilter(d.country);
    if (d.companyIds?.length) setSelectedCompanyId(d.companyIds[0]);
    setAssistantDirective(d);
    setActiveTab(d.target);
  };

  // Outreach workspace state (company-targeted).
  const [outreachChannel, setOutreachChannel] = useState<
    "linkedin" | "email" | "followup1" | "followup2" | "followup3" | "proposal"
  >("linkedin");
  const [outreachCustomPrompt, setOutreachCustomPrompt] = useState<string>("");
  const [outreachService, setOutreachService] = useState<string>("Cold Email");
  const [generatedOutreachText, setGeneratedOutreachText] = useState<string>("");
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Settings workspace state
  const [sandboxApiKey, setSandboxApiKey] = useState<string>("••••••••••••••••••••••••");
  const [aiModelChoice, setAiModelChoice] = useState<string>("gemini-2.5-pro");
  const [isScrapingActive, setIsScrapingActive] = useState<boolean>(true);

  // Modal + shell layout state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Company-level quick actions from cards / drawer.
  const handleTableAction = (comp: Company, action: "view" | "analyze" | "score" | "outreach") => {
    setSelectedCompanyId(comp.id);
    if (action === "score") setActiveTab("ai-lead-scoring");
    else if (action === "outreach") setActiveTab("outreach-studio");
    else setActiveTab("company-discovery");
  };

  // Auth gate
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#64748B]">
          <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
          <span className="text-sm font-sans font-medium">Verifying your security credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === "register") return <RegisterScreen onSwitchToLogin={() => setAuthView("login")} />;
    return <LoginScreen onSwitchToRegister={() => setAuthView("register")} />;
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4 bg-white border border-rose-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-lg font-bold text-rose-600">Failed to load data</h2>
          <p className="text-sm text-[#64748B]">{error}</p>
          <button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl cursor-pointer">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // CSV-first: an empty dataset is a normal pre-import state. The shell always
  // renders; each page shows its own empty state and Lead Import is in the nav.

  return (
    <div className="min-h-screen app-shell text-[#0F172A] font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex flex-col min-h-screen lg:pl-64">
        <Header
          title={activeTab.replaceAll("-", " ").toUpperCase()}
          onMenuClick={() => setMobileNavOpen(true)}
          countryFilter={countryFilter}
          setCountryFilter={setCountryFilter}
          countryOptions={countryOptions}
          onSearch={(term) => applyDirective({ target: "company-discovery", search: term })}
        />

        <main className="flex-grow p-4 sm:p-6 lg:p-8">
          {activeTab === "executive-overview" && (
            <ExecutiveOverview companies={visibleCompanies} countries={countries} onNavigate={setActiveTab} />
          )}

          {activeTab === "country-intelligence" && <CountryIntelligence companies={visibleCompanies} />}

          {activeTab === "industry-intelligence" && <IndustryIntelligence companies={visibleCompanies} />}

          {activeTab === "company-discovery" && (
            <CompanyDiscovery
              companies={enrichedCompanies}
              countries={countries}
              selectedCompanyId={selectedCompanyId}
              setSelectedCompanyId={setSelectedCompanyId}
              countryFilter={countryFilter}
              setCountryFilter={setCountryFilter}
              onActionClick={handleTableAction}
              onImportClick={() => setIsImportModalOpen(true)}
              directive={assistantDirective}
              onDirectiveApplied={() => setAssistantDirective(null)}
            />
          )}

          {activeTab === "ai-lead-scoring" && (
            <AILeadScoring
              companies={visibleCompanies}
              selectedCompanyId={selectedCompanyId}
              setSelectedCompanyId={setSelectedCompanyId}
              directive={assistantDirective}
              onDirectiveApplied={() => setAssistantDirective(null)}
            />
          )}

          {activeTab === "outreach-studio" && (
            <OutreachStudio
              companies={visibleCompanies}
              selectedCompanyId={selectedCompanyId}
              outreachChannel={outreachChannel}
              setOutreachChannel={setOutreachChannel}
              outreachCustomPrompt={outreachCustomPrompt}
              setOutreachCustomPrompt={setOutreachCustomPrompt}
              outreachService={outreachService}
              setOutreachService={setOutreachService}
              generatedOutreachText={generatedOutreachText}
              setGeneratedOutreachText={setGeneratedOutreachText}
              isGeneratingOutreach={isGeneratingOutreach}
              setIsGeneratingOutreach={setIsGeneratingOutreach}
              copiedSuccess={copiedSuccess}
              setCopiedSuccess={setCopiedSuccess}
              promptsHistory={promptsHistory}
              setPromptsHistory={setPromptsHistory}
            />
          )}

          {activeTab === "opportunity-intelligence" && (
            <OpportunityIntelligence companies={visibleCompanies} />
          )}

          {activeTab === "import-leads" && (
            <ImportLeads onImportComplete={refetch} onNavigate={setActiveTab} companies={enrichedCompanies} />
          )}

          {activeTab === "data-quality" && <DataQualityCenter companies={visibleCompanies} />}

          {activeTab === "settings" && (
            <Settings
              sandboxApiKey={sandboxApiKey}
              setSandboxApiKey={setSandboxApiKey}
              aiModelChoice={aiModelChoice}
              setAiModelChoice={setAiModelChoice}
              isScrapingActive={isScrapingActive}
              setIsScrapingActive={setIsScrapingActive}
            />
          )}

          <ImportCompanyModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImported={refetch}
          />
        </main>
      </div>

      {/* Global AI copilot */}
      <AiCopilot companies={enrichedCompanies} onApplyDirective={applyDirective} />
    </div>
  );
}
