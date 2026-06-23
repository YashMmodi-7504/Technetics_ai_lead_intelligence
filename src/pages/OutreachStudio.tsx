import React, { useState, useEffect } from "react";
import {
  Mail,
  Linkedin,
  PhoneCall,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  CheckCircle,
  ListOrdered,
  Activity,
  UserCheck,
  Target,
  MessageSquare,
} from "lucide-react";
import { Company } from "../types";
import { apiFetch, ApiError } from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import ScoreRing from "../components/ui/ScoreRing";

interface OutreachStudioProps {
  companies: Company[];
  selectedCompanyId: string;
  outreachChannel: "linkedin" | "email" | "followup1" | "followup2" | "followup3" | "proposal";
  setOutreachChannel: (channel: any) => void;
  outreachCustomPrompt: string;
  setOutreachCustomPrompt: (prompt: string) => void;
  outreachService: string;
  setOutreachService: (service: string) => void;
  generatedOutreachText: string;
  setGeneratedOutreachText: (text: string) => void;
  isGeneratingOutreach: boolean;
  setIsGeneratingOutreach: (val: boolean) => void;
  copiedSuccess: boolean;
  setCopiedSuccess: (val: boolean) => void;
  promptsHistory: string[];
  setPromptsHistory: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function OutreachStudio({
  companies,
  selectedCompanyId,
  outreachChannel,
  setOutreachChannel,
  outreachCustomPrompt,
  setOutreachCustomPrompt,
  outreachService,
  setOutreachService,
  generatedOutreachText,
  setGeneratedOutreachText,
  isGeneratingOutreach,
  setIsGeneratingOutreach,
  copiedSuccess,
  setCopiedSuccess,
  promptsHistory,
  setPromptsHistory,
}: OutreachStudioProps) {
  const [activeFormat, setActiveFormat] = useState<"email" | "linkedin" | "callscript" | "sequence">("linkedin");
  const [selectedTone, setSelectedTone] = useState<"Professional" | "Consultative" | "Technical" | "Executive">("Consultative");
  const [targetCompanyId, setTargetCompanyId] = useState<string>(selectedCompanyId);

  // Provider of the most recent generation (Gemini AI vs. fallback engine).
  const [lastProvider, setLastProvider] = useState<string>("");

  // Scoring states
  const [qualityScore, setQualityScore] = useState(85);
  const [personalizationScore, setPersonalizationScore] = useState(90);
  const [responseProbability, setResponseProbability] = useState(24);

  // V2: outreach targets a COMPANY, not an executive record.
  const targetComp = companies.find((c) => c.id === targetCompanyId) || companies.find((c) => c.id === selectedCompanyId) || companies[0];

  // Evaluate text quality dynamically
  useEffect(() => {
    if (!generatedOutreachText) return;
    
    const textLength = generatedOutreachText.length;
    const hasQuestion = generatedOutreachText.includes("?");
    const hasCompany = targetComp && generatedOutreachText.includes(targetComp.name);
    const hasCity = targetComp?.city && generatedOutreachText.includes(targetComp.city);

    let baseQuality = 75;
    if (textLength > 150 && textLength < 800) baseQuality += 10;
    if (hasQuestion) baseQuality += 10;

    let basePersonalization = 60;
    if (hasCompany) basePersonalization += 20;
    if (hasCity) basePersonalization += 15;
    if (generatedOutreachText.toLowerCase().includes(targetComp?.industry?.toLowerCase() || "")) basePersonalization += 5;

    let baseProb = 12;
    if (baseQuality > 85) baseProb += 6;
    if (basePersonalization > 85) baseProb += 8;
    if (activeFormat === "linkedin") baseProb += 5;
    if (activeFormat === "sequence") baseProb += 12;

    setQualityScore(Math.min(99, baseQuality));
    setPersonalizationScore(Math.min(99, basePersonalization));
    setResponseProbability(Math.min(45, baseProb));
  }, [generatedOutreachText, targetComp, activeFormat]);

  const handleGenerateOutreach = async () => {
    setIsGeneratingOutreach(true);
    setCopiedSuccess(false);

    let mappedChannel = outreachChannel;
    let customPromptText = outreachCustomPrompt;

    // Apply tone instructions
    const toneInstruction = `Tone guideline: ${selectedTone}.`;
    
    if (activeFormat === "email") {
      mappedChannel = "email";
      customPromptText = `${toneInstruction} ${customPromptText}`;
    } else if (activeFormat === "linkedin") {
      mappedChannel = "linkedin";
      customPromptText = `${toneInstruction} Keep it under 300 characters. ${customPromptText}`;
    } else if (activeFormat === "callscript") {
      mappedChannel = "proposal";
      customPromptText = `[TELEPHONE COLD CALL SCRIPT FORMAT] ${toneInstruction} ${customPromptText || "Create an engaging phone pitch."}`;
    } else if (activeFormat === "sequence") {
      mappedChannel = "email"; // Use email channel for long-form generation
      customPromptText = `[MULTI-STEP FOLLOW-UP SEQUENCE] Generate exactly 3 emails: 1. Initial Outreach, 2. Value-Add Follow-up, 3. Breakup Email. Label each clearly. ${toneInstruction} ${customPromptText}`;
    }

    try {
      // Route through apiFetch so the request carries the Bearer access token
      // (and auto-refreshes on 401). A bare fetch() here was rejected by the
      // requireAuth middleware with 401 before ever reaching the AI layer.
      const result = await apiFetch<{ content: string; provider: string; timestamp: string }>(
        "/generate-outreach",
        {
          method: "POST",
          body: JSON.stringify({
            companyName: targetComp?.name || "the company",
            industry: targetComp?.industry || "Technology",
            executiveName: "the leadership team",
            role: "Decision Maker",
            channel: mappedChannel,
            customPrompt: customPromptText || "Focus on speed and ROI metrics.",
            details: targetComp?.description || `${targetComp?.industry ?? ""} company in ${targetComp?.country ?? ""}`,
            serviceType: outreachService,
          }),
        },
      );

      setGeneratedOutreachText(result.content);
      setLastProvider(result.provider);
      if (outreachCustomPrompt.trim() && !promptsHistory.includes(outreachCustomPrompt)) {
        setPromptsHistory((prev) => [outreachCustomPrompt, ...prev]);
      }
    } catch (err) {
      console.error("[OutreachStudio] generate failed:", err);
      const message = err instanceof ApiError ? err.message : "Failed to generate outreach. Please try again.";
      setGeneratedOutreachText(message);
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  const handleCopy = () => {
    if (!generatedOutreachText) return;
    navigator.clipboard.writeText(generatedOutreachText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const insertPersonalizationToken = (token: string) => {
    setOutreachCustomPrompt(outreachCustomPrompt ? `${outreachCustomPrompt} Mention: ${token}` : `Mention: ${token}`);
  };

  // CSV-first empty state — no companies to write to until a CSV is imported.
  if (companies.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          icon={Sparkles}
          title="Outreach Studio"
          subtitle="Generate personalized emails, LinkedIn messages, call scripts, and follow-up sequences for any company."
        />
        <div className="card-premium p-12 text-center">
          <MessageSquare className="w-10 h-10 text-blue-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#0F172A]">No companies to reach yet</p>
          <p className="text-xs text-[#64748B] mt-1">Import a CSV to start composing company outreach.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        icon={Sparkles}
        title="Outreach Studio"
        subtitle="Generate highly personalized emails, LinkedIn messages, call scripts, and follow-up sequences."
        actions={
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-100 px-2.5 py-1 rounded-full">
            <Activity className="w-3 h-3" /> {lastProvider ? `Generated by ${lastProvider}` : "AI copilot active"}
          </span>
        }
      />

      {/* KPI Scoring Grid — premium accent cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="card-premium p-4 flex items-center gap-4 relative overflow-hidden bg-gradient-to-br from-emerald-50/70 to-white">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500" />
          <ScoreRing value={qualityScore} size={58} strokeWidth={6} />
          <div>
            <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Generation Quality</p>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded mt-1 inline-block">Optimal</span>
          </div>
        </div>
        <div className="card-premium p-4 flex items-center gap-4 relative overflow-hidden bg-gradient-to-br from-cyan-50/70 to-white">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 to-cyan-500" />
          <ScoreRing value={personalizationScore} size={58} strokeWidth={6} />
          <div>
            <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Personalization</p>
            <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-100 px-1.5 py-0.5 rounded mt-1 inline-block">Tailored</span>
          </div>
        </div>
        <div className="card-premium p-4 flex items-center gap-4 relative overflow-hidden bg-gradient-to-br from-amber-50/70 to-white">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0">
            <Activity className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Response Probability</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-bold text-[#0F172A]">{responseProbability}%</span>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">Est. conv.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Format Tabs */}
      <div className="bg-white border border-[#E2E8F0] p-1.5 rounded-xl flex gap-1 shadow-2xs">
        <button
          onClick={() => { setActiveFormat("linkedin"); setOutreachChannel("linkedin"); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeFormat === "linkedin" ? "bg-blue-600 text-white shadow-sm" : "text-[#64748B] hover:bg-slate-50"
          }`}
        >
          <Linkedin className="w-4 h-4" /> LinkedIn
        </button>
        <button
          onClick={() => { setActiveFormat("email"); setOutreachChannel("email"); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeFormat === "email" ? "bg-blue-600 text-white shadow-sm" : "text-[#64748B] hover:bg-slate-50"
          }`}
        >
          <Mail className="w-4 h-4" /> Cold Email
        </button>
        <button
          onClick={() => { setActiveFormat("callscript"); setOutreachChannel("proposal"); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeFormat === "callscript" ? "bg-blue-600 text-white shadow-sm" : "text-[#64748B] hover:bg-slate-50"
          }`}
        >
          <PhoneCall className="w-4 h-4" /> Call Script
        </button>
        <button
          onClick={() => { setActiveFormat("sequence"); setOutreachChannel("email"); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeFormat === "sequence" ? "bg-blue-600 text-white shadow-sm" : "text-[#64748B] hover:bg-slate-50"
          }`}
        >
          <ListOrdered className="w-4 h-4" /> Sequence
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Workspace controls LHS */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-5 shadow-sm">
            <h3 className="text-xs font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" /> Generator Directives
            </h3>

            {/* Target Company */}
            <div>
              <label className="text-[10px] text-[#64748B] uppercase font-bold block mb-1">Target Company</label>
              <select
                value={targetComp?.id ?? ""}
                onChange={(e) => setTargetCompanyId(e.target.value)}
                className="w-full bg-slate-50 border border-[#E2E8F0] rounded-lg p-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.industry} ({c.country})</option>
                ))}
              </select>
            </div>

            {/* Tone Selector */}
            <div>
              <label className="text-[10px] text-[#64748B] uppercase font-bold block mb-1">Outreach Tone</label>
              <div className="grid grid-cols-2 gap-2">
                {["Professional", "Consultative", "Technical", "Executive"].map(tone => (
                  <button
                    key={tone}
                    onClick={() => setSelectedTone(tone as any)}
                    className={`text-xs py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                      selectedTone === tone ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-slate-50"
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* Proposal / output type (V4) */}
            <div>
              <label className="text-[10px] text-[#64748B] uppercase font-bold block mb-1">Proposal Type</label>
              <select
                value={outreachService}
                onChange={(e) => setOutreachService(e.target.value)}
                className="w-full bg-slate-50 border border-[#E2E8F0] rounded-lg p-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Cold Email">Cold Email</option>
                <option value="LinkedIn Message">LinkedIn Message</option>
                <option value="Partnership Proposal">Partnership Proposal</option>
                <option value="AI Services Proposal">AI Services Proposal</option>
                <option value="Cloud Transformation Proposal">Cloud Transformation Proposal</option>
                <option value="Data Engineering Proposal">Data Engineering Proposal</option>
              </select>
            </div>

            {/* Personalization Engine Signals */}
            <div>
              <label className="text-[10px] text-[#64748B] uppercase font-bold block mb-1">Data Signals (Click to Inject)</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => insertPersonalizationToken(`Sector: ${targetComp?.industry}`)} className="text-[10px] px-2 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 font-semibold cursor-pointer hover:bg-blue-100">+{targetComp?.industry}</button>
                <button onClick={() => insertPersonalizationToken(`Location: ${targetComp?.country}`)} className="text-[10px] px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold cursor-pointer hover:bg-emerald-100">+{targetComp?.country}</button>
                <button onClick={() => insertPersonalizationToken(`Hiring: ${targetComp?.hiringActivity}`)} className="text-[10px] px-2 py-1 rounded-full border border-cyan-200 bg-cyan-50 text-cyan-700 font-semibold cursor-pointer hover:bg-cyan-100">+Hiring: {targetComp?.hiringActivity}</button>
              </div>
            </div>

            {/* Custom Prompt */}
            <div>
              <label className="text-[10px] text-[#64748B] uppercase font-bold block mb-1">Custom Prompt Directives</label>
              <textarea
                value={outreachCustomPrompt}
                onChange={(e) => setOutreachCustomPrompt(e.target.value)}
                placeholder="Add custom instructions..."
                className="w-full bg-slate-50 border border-[#E2E8F0] rounded-lg p-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 min-h-24 resize-none"
              />
            </div>

            <button
              onClick={handleGenerateOutreach}
              disabled={isGeneratingOutreach}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-sans text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              {isGeneratingOutreach ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating AI Copy...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5 text-blue-200 fill-blue-200 animate-pulse" /> Generate Outreach</>
              )}
            </button>
          </div>
        </div>

        {/* Professional Editor RHS */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[600px]">
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-800 font-bold uppercase tracking-wider">Editor Canvas</span>
                  <span className="bg-slate-100 border border-[#E2E8F0] px-2 py-0.5 rounded text-[9px] text-[#64748B] uppercase font-bold">
                    {activeFormat.toUpperCase()} MODEL - {selectedTone.toUpperCase()}
                  </span>
                </div>

                <button
                  onClick={handleCopy}
                  className="bg-slate-50 hover:bg-white border border-[#E2E8F0] text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] transition-all cursor-pointer shadow-2xs"
                >
                  {copiedSuccess ? (
                    <><Check className="w-3.5 h-3.5 text-[#10B981]" /><span className="text-[#10B981]">COPIED</span></>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /><span>COPY TEXT</span></>
                  )}
                </button>
              </div>

              {isGeneratingOutreach ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-xs text-[#64748B] uppercase tracking-widest font-bold">Synthesizing personalized copy...</p>
                </div>
              ) : (
                <textarea
                  value={generatedOutreachText}
                  onChange={(e) => setGeneratedOutreachText(e.target.value)}
                  className="flex-1 w-full bg-[#F8FAFC] border border-[#E2E8F0] p-5 rounded-xl text-[13px] font-sans font-medium text-[#1E293B] focus:outline-none focus:border-blue-500 resize-none min-h-[450px] leading-relaxed shadow-inner"
                />
              )}
            </div>

            <div className="bg-slate-50 border border-[#E2E8F0]/60 p-3 rounded-lg text-[10px] text-[#64748B] flex items-center justify-between mt-4">
              <span className="font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Real-time quality validation active. Edits impact scores automatically.
              </span>
              <span className="text-slate-500 font-bold uppercase tracking-wider">
                {generatedOutreachText?.split(" ").length || 0} Words
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
