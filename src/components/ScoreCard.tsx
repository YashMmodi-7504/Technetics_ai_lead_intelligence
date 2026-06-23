import React, { useState } from "react";
import { Company } from "../types";
import {
  BadgeCheck,
  BrainCircuit,
  Settings2,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Activity,
  Award,
  Loader2,
} from "lucide-react";

interface ScoreCardProps {
  company: Company;
  onRefreshScores?: (updatedCompany: Company) => void;
}

export default function ScoreCard({
  company,
  onRefreshScores,
}: ScoreCardProps) {
  const [dataScience, setDataScience] = useState(company.dataScienceScore);
  const [powerBI, setPowerBI] = useState(company.powerBIScore);
  const [cloud, setCloud] = useState(company.cloudScore);
  const [automation, setAutomation] = useState(company.automationScore);
  const [buyingIntent, setBuyingIntent] = useState(company.buyingIntentScore);

  const [isScoring, setIsScoring] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [derivedScore, setDerivedScore] = useState<number>(company.leadScore);

  const calculateLeadStatus = (score: number) => {
    if (score >= 90)
      return {
        label: "HOT LEAD",
        color: "text-rose-600 bg-rose-50 border-rose-100 font-bold",
      };
    if (score >= 75)
      return {
        label: "WARM LEAD",
        color: "text-amber-600 bg-amber-50 border-[#FDE68A] font-bold",
      };
    return {
      label: "COLD LEAD",
      color: "text-blue-600 bg-blue-50 border-blue-100 font-bold",
    };
  };

  const handleRunAiAudit = async () => {
    setIsScoring(true);
    try {
      const response = await fetch("/api/score-comprehensive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: company.name,
          dataScience,
          powerBI,
          cloud,
          automation,
          buyingIntent,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setDerivedScore(result.score);
        setAiSuggestions(result.recommendations);

        // Notify parent state if needed
        if (onRefreshScores) {
          onRefreshScores({
            ...company,
            dataScienceScore: dataScience,
            powerBIScore: powerBI,
            cloudScore: cloud,
            automationScore: automation,
            buyingIntentScore: buyingIntent,
            leadScore: result.score,
          });
        }
      }
    } catch (err) {
      console.error("Failed to run Gemini audit score:", err);
    } finally {
      setIsScoring(false);
    }
  };

  const currentStatus = calculateLeadStatus(derivedScore);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
        <div>
          <h3 className="font-sans font-bold text-[#0F172A] text-lg flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-blue-600" /> Lead Score
            Intelligence Engine
          </h3>
          <p className="text-xs text-[#64748B]">
            Evaluate tech stack fit and trigger real-time advisory
            recommendations
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-sans font-medium font-bold rounded-lg border tracking-wider ${currentStatus.color}`}
        >
          {currentStatus.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Core adjustment sliders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-sans font-medium text-[#64748B]">
            <span className="uppercase text-[10px] tracking-wider text-[#64748B] font-bold">
              Metrics Category
            </span>
            <span className="text-blue-600 font-bold">Interactive Tuner</span>
          </div>

          {[
            {
              label: "Cloud Architecture Maturity",
              state: cloud,
              set: setCloud,
              desc: "Adoption level of major cloud infrastructure providers (Azure, AWS)",
            },
            {
              label: "Data Science & BigQuery",
              state: dataScience,
              set: setDataScience,
              desc: "Complex statistical modeling requirements",
            },
            {
              label: "Power BI / Business Intel",
              state: powerBI,
              set: setPowerBI,
              desc: "Adoption and execution of dashboard operations",
            },
            {
              label: "Automation & RPA Stack",
              state: automation,
              set: setAutomation,
              desc: "Process automation (UiPath, Power Automate) penetration",
            },
            {
              label: "B2B Buying Focus Intent",
              state: buyingIntent,
              set: setBuyingIntent,
              desc: "Web search frequency and technical hiring velocity signals",
            },
          ].map((slider, idx) => (
            <div
              key={idx}
              className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans font-semibold text-[#0F172A]">
                  {slider.label}
                </span>
                <span className="text-xs font-sans font-medium font-bold text-blue-600">
                  {slider.state}%
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={slider.state}
                onChange={(e) => slider.set(Number(e.target.value))}
                className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-[#64748B] italic">{slider.desc}</p>
            </div>
          ))}

          <button
            onClick={handleRunAiAudit}
            disabled={isScoring}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-800 disabled:to-blue-900 text-white font-sans text-sm font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-250 mt-2 cursor-pointer shadow-sm"
          >
            {isScoring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Running Algorithmic Assessment...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Trigger Intelligent Lead Scoring Audit</span>
              </>
            )}
          </button>
        </div>

        {/* Dynamic score summary output */}
        <div className="flex flex-col justify-between">
          <div className="bg-slate-50 border border-[#E2E8F0] rounded-xl p-5 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-[#64748B] uppercase tracking-wider font-sans font-medium font-bold">
              Normalized Platform Rating
            </span>

            <div className="relative mt-4 mb-3">
              <div className="w-32 h-32 rounded-full border-4 border-slate-200 flex items-center justify-center relative bg-white shadow-2xs">
                {/* SVG circular track with stroke dashes */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    strokeWidth="4"
                    stroke="#2563EB"
                    fill="transparent"
                    strokeDasharray="364"
                    strokeDashoffset={364 - (364 * derivedScore) / 100}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="text-center">
                  <span className="text-3xl font-extrabold font-sans font-medium text-[#0F172A] block leading-none">
                    {derivedScore}
                  </span>
                  <span className="text-[10px] text-[#64748B] font-sans font-medium uppercase tracking-widest mt-1 inline-block font-bold">
                    POINTS
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#64748B] italic px-10">
              Evaluated on {company.name}'s active digital signals across
              corporate databases, job vacancies, and public reports.
            </p>
          </div>

          <div className="mt-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4.5">
            <span className="text-xs font-sans font-medium font-bold text-blue-750 flex items-center gap-1 uppercase tracking-wide">
              <Award className="w-4 h-4 text-blue-600" /> AI Playbook
              Recommendations:
            </span>

            <div className="mt-3.5 space-y-2.5">
              {(aiSuggestions.length > 0
                ? aiSuggestions
                : [
                    "Adjust metrics sliders to customize score vectors.",
                    "Trigger the AI Scorer to evaluate gaps and fetch targeted consulting suggestions.",
                    "High data science indicator highlights predictive modeling requirements.",
                  ]
              ).map((rec, i) => (
                <div
                  key={i}
                  className="flex gap-2.5 items-start text-xs text-[#475569] font-sans"
                >
                  <div className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold font-sans font-medium text-[10px]">
                    {i + 1}
                  </div>
                  <p className="leading-relaxed font-medium">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
