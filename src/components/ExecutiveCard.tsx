import React from "react";
import { DecisionMaker } from "../types";
import {
  Linkedin,
  Mail,
  Phone,
  Flame,
  Radio,
  ArrowUpRight,
} from "lucide-react";

interface ExecutiveCardProps {
  key?: any;
  executive: DecisionMaker;
  onComposeClick: (exec: DecisionMaker) => void;
}

export default function ExecutiveCard({
  executive,
  onComposeClick,
}: ExecutiveCardProps) {
  // Priority color
  const getPriorityColor = (score: number) => {
    if (score >= 90) return "text-[#EF4444] bg-rose-50 border-rose-100";
    if (score >= 80) return "text-[#F59E0B] bg-amber-50 border-[#FDE68A]";
    return "text-blue-600 bg-blue-50 border-blue-100";
  };

  // Status badge styling
  const getStatusStyle = (status: DecisionMaker["contactStatus"]) => {
    return (
      {
        New: "bg-blue-50 text-blue-600 border-blue-100",
        Contacted: "bg-amber-50 text-[#F59E0B] border-[#FDE68A]",
        Nurturing: "bg-purple-50 text-purple-600 border-purple-100",
        Replied: "bg-teal-50 text-teal-700 border-teal-100",
        "Meeting Set":
          "bg-[#10B981] text-[#0F172A] border-transparent font-bold",
      }[status] || "bg-slate-100 text-[#475569] border-transparent"
    );
  };

  return (
    <div
      id={`exec-card-${executive.id}`}
      className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
    >
      <div>
        {/* Card Header stats */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4 text-xs font-sans font-medium">
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${getPriorityColor(executive.priorityScore)} font-semibold`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Priority: {executive.priorityScore}</span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded border text-[10px] ${getStatusStyle(executive.contactStatus)} font-semibold`}
          >
            {executive.contactStatus.toUpperCase()}
          </span>
        </div>

        {/* Profile Info */}
        <div className="flex items-start gap-4">
          <img
            src={executive.avatar}
            alt={executive.name}
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-full border border-[#E2E8F0] object-cover bg-slate-50"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-sans font-bold text-[#0F172A] hover:text-blue-600 cursor-pointer transition-colors max-w-full truncate text-[15px]">
              {executive.name}
            </h4>
            <p className="text-xs text-blue-600 font-sans font-semibold truncate mt-0.5">
              {executive.role}
            </p>
            <p className="text-[10px] text-[#64748B] font-sans font-medium mt-1 opacity-90 uppercase tracking-tight font-medium">
              @ {executive.companyName}
            </p>
          </div>
        </div>

        {/* Contact Coordinates */}
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-sans font-medium text-[#475569]">
            <Mail className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="truncate" title={executive.email}>
              {executive.email}
            </span>
          </div>
          {executive.phone && (
            <div className="flex items-center gap-2 text-xs font-sans font-medium text-[#475569]">
              <Phone className="w-3.5 h-3.5 text-[#64748B]" />
              <span>{executive.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-[#E2E8F0] grid grid-cols-2 gap-2">
        {/* LinkedIn Linkout */}
        <a
          href={executive.linkedin}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all text-xs font-bold"
        >
          <Linkedin className="w-3.5 h-3.5" />
          <span>LinkedIn</span>
          <ArrowUpRight className="w-3 h-3 opacity-60" />
        </a>

        {/* Generate outreach template */}
        <button
          onClick={() => onComposeClick(executive)}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 hover:bg-purple-100/60 hover:text-purple-700 transition-all text-xs font-bold shadow-2xs"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse text-purple-500" />
          <span>Draft Outreach</span>
        </button>
      </div>
    </div>
  );
}
