import React from "react";
import { ActivityLog } from "../types";
import {
  Mail,
  Linkedin,
  Phone,
  Settings2,
  Handshake,
  ArrowUpRight,
  Compass,
  FileSpreadsheet,
} from "lucide-react";

interface ActivityFeedProps {
  logs: ActivityLog[];
}

export default function ActivityFeed({ logs }: ActivityFeedProps) {
  const getIcon = (type: ActivityLog["type"]) => {
    return (
      {
        email: <Mail className="w-3.5 h-3.5 text-blue-600" />,
        linkedin: <Linkedin className="w-3.5 h-3.5 text-blue-600" />,
        call: <Phone className="w-3.5 h-3.5 text-[#F59E0B]" />,
        system: <Settings2 className="w-3.5 h-3.5 text-[#10B981]" />,
        meeting: <Handshake className="w-3.5 h-3.5 text-purple-600" />,
        proposal: <FileSpreadsheet className="w-3.5 h-3.5 text-pink-600" />,
      }[type] || <Compass className="w-3.5 h-3.5 text-slate-450" />
    );
  };

  const getBadgeClass = (type: ActivityLog["type"]) => {
    return (
      {
        email: "bg-blue-50 border border-blue-100",
        linkedin: "bg-blue-50 border border-blue-100",
        call: "bg-amber-50 border border-[#FDE68A]",
        system: "bg-emerald-50 border border-emerald-100",
        meeting: "bg-purple-50 border border-purple-100",
        proposal: "bg-pink-50 border border-pink-100",
      }[type] || "bg-slate-150 border border-slate-200"
    );
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
        <div>
          <h4 className="font-sans font-bold text-[#0F172A] text-sm">
            Real-Time Activity Feed
          </h4>
          <p className="text-[11px] text-[#64748B]">
            Tracking automated scraping loops & manual outreach history
          </p>
        </div>
        <span className="text-[10px] bg-blue-50 px-2 py-0.5 border border-blue-100 rounded text-blue-600 font-sans font-medium font-bold">
          LIVE TELEMETRY
        </span>
      </div>

      <div className="relative border-l border-[#E2E8F0] ml-3 pl-6 space-y-6">
        {logs.map((log) => (
          <div key={log.id} className="relative group/log">
            {/* Timeline icon pointer */}
            <div
              className={`absolute -left-[35px] top-0.5 p-1.5 rounded-full ${getBadgeClass(log.type)} flex items-center justify-center shadow-2xs`}
            >
              {getIcon(log.type)}
            </div>

            <div className="bg-slate-50/50 border border-[#E2E8F0] rounded-xl p-3.5 hover:border-blue-200 hover:bg-slate-50 transition-all shadow-3xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-sans font-bold text-xs text-[#0F172A] group-hover/log:text-blue-600 transition-colors">
                  {log.title}
                </span>
                <span className="text-[10px] text-[#64748B] font-sans font-medium leading-none">
                  {log.date}
                </span>
              </div>
              <p className="text-xs text-[#475569] font-sans mt-2">
                {log.description}
              </p>

              <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[#E2E8F0]">
                <div className="w-4 h-4 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-[8px] font-bold font-sans font-medium">
                  OP
                </div>
                <span className="text-[10px] text-[#64748B] font-sans font-medium leading-none">
                  Triggered by:{" "}
                  <span className="text-[#0F172A] font-sans font-semibold">
                    {log.user}
                  </span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
