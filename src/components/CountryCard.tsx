import React from "react";
import { CountryOpportunity } from "../types";
import {
  Globe,
  Lightbulb,
  Landmark,
  Percent,
  Factory,
  HeartHandshake,
} from "lucide-react";

interface CountryCardProps {
  key?: any;
  country: CountryOpportunity;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function CountryCard({
  country,
  isSelected,
  onSelect,
}: CountryCardProps) {
  return (
    <div
      className={`bg-white border rounded-2xl p-6 transition-all duration-300 relative cursor-pointer ${
        isSelected
          ? "border-blue-500 shadow-xs ring-1 ring-blue-500/20 bg-white"
          : "border-[#E2E8F0] hover:border-blue-300 shadow-sm"
      }`}
      onClick={onSelect}
    >
      {/* Target marker score badge */}
      <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg px-3 py-1 text-center shadow-md">
        <span className="block text-[8px] text-blue-100 uppercase font-sans font-medium tracking-widest leading-none font-bold">
          OPPORTUNITY
        </span>
        <span className="text-lg font-bold text-white font-sans font-medium leading-none mt-1 inline-block">
          {country.opportunityScore}%
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl shadow-sm">
          <Globe className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-sans font-bold text-[#0F172A] text-lg leading-tight">
            {country.country}
          </h3>
          <p className="text-xs text-[#64748B] font-sans font-medium mt-0.5">
            Capital: {country.capital} | Code: {country.code}
          </p>
        </div>
      </div>

      <p className="text-xs text-[#475569] mt-4 font-sans leading-relaxed">
        {country.description}
      </p>

      {/* Grid of Key Tech Indicators */}
      <div className="grid grid-cols-2 gap-3 mt-4.5 bg-slate-50 p-3 rounded-xl border border-[#E2E8F0]">
        <div>
          <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-sans uppercase">
            <Landmark className="w-3 h-3 text-blue-600" /> GDP Market
          </span>
          <span className="block text-sm font-semibold text-[#0F172A] font-sans font-medium mt-0.5">
            {country.gdp}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-sans uppercase">
            <Percent className="w-3 h-3 text-[#10B981]" /> Cloud Core
          </span>
          <span className="block text-sm font-semibold text-[#0F172A] font-sans font-medium mt-0.5">
            {country.techAdoption}% Adoption
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-sans uppercase">
            <Percent className="w-3 h-3 text-amber-600" /> AI Maturity
          </span>
          <span className="block text-sm font-semibold text-[#0F172A] font-sans font-medium mt-0.5">
            {country.aiAdoption}% Readiness
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-sans uppercase">
            <HeartHandshake className="w-3 h-3 text-blue-500" /> Outreach Index
          </span>
          <span className="block text-sm font-semibold text-[#0F172A] font-sans font-medium mt-0.5">
            {country.outsourcingOpportunity}% Rate
          </span>
        </div>
      </div>

      {/* Top sectors and consulting firms */}
      <div className="mt-4 space-y-2">
        <div>
          <span className="text-[10px] font-sans font-medium font-semibold text-blue-600 uppercase tracking-widest block">
            Main Verticals Profile
          </span>
          <div className="flex flex-wrap gap-1 mt-1">
            {country.topIndustries.map((ind, i) => (
              <span
                key={i}
                className="text-[10px] bg-slate-100 text-[#475569] px-2 py-0.5 rounded border border-[#E2E8F0]"
              >
                {ind}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-sans font-medium font-semibold text-emerald-600 uppercase tracking-widest block">
            Regional Advisory Competitors
          </span>
          <span className="text-[11px] text-[#64748B] font-sans mt-0.5 block italic">
            {country.topConsultingFirms.join(" • ")}
          </span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
        <span className="text-[10px] font-sans font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 block tracking-wide uppercase text-center font-bold">
          Focus Recommended TECHNETICS Solution
        </span>
        <ul className="text-[11px] text-[#475569] space-y-1.5 mt-2.5">
          {country.recommendedServices.slice(0, 2).map((srv, i) => (
            <li key={i} className="flex items-start gap-1.5 font-sans">
              <span className="text-blue-500 font-bold">•</span>
              <span>{srv}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
