import React, { useState } from "react";
import { History, SlidersHorizontal, Calendar, User, FileText, CheckCircle, AlertTriangle } from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  result: "Success" | "Failure";
  source: string;
}

const baselineAuditLogs: AuditLog[] = [
  {
    id: "a-101",
    timestamp: "2026-06-20 15:30:12",
    user: "dev@technetics.local",
    action: "Login",
    entity: "Session",
    result: "Success",
    source: "127.0.0.1",
  },
  {
    id: "a-102",
    timestamp: "2026-06-20 15:31:05",
    user: "dev@technetics.local",
    action: "Outreach Generated",
    entity: "Apex Global Logistics",
    result: "Success",
    source: "API Client (Vite)",
  },
  {
    id: "a-103",
    timestamp: "2026-06-20 15:32:44",
    user: "dev@technetics.local",
    action: "Lead Scored",
    entity: "Berlin Biotech Solutions",
    result: "Success",
    source: "API Client (Vite)",
  },
  {
    id: "a-104",
    timestamp: "2026-06-20 15:33:12",
    user: "System Daemon",
    action: "Country Analysis Requested",
    entity: "Germany (DE)",
    result: "Success",
    source: "Ingestion Cron",
  },
  {
    id: "a-105",
    timestamp: "2026-06-20 15:34:00",
    user: "dev@technetics.local",
    action: "Lead Updated",
    entity: "Vanguard Capital Asia",
    result: "Success",
    source: "API Client (Vite)",
  },
  {
    id: "a-106",
    timestamp: "2026-06-20 15:35:10",
    user: "guest@technetics.local",
    action: "Login",
    entity: "Session",
    result: "Failure",
    source: "192.168.1.42",
  },
  {
    id: "a-107",
    timestamp: "2026-06-20 15:36:22",
    user: "dev@technetics.local",
    action: "Lead Created",
    entity: "OmniChannel Retail Inc",
    result: "Success",
    source: "API Client (Vite)",
  },
];

export default function AuditActivityPage() {
  const [logs] = useState<AuditLog[]>(baselineAuditLogs);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("");

  const filteredLogs = logs.filter((log) => {
    const matchUser = selectedUser === "" || log.user.includes(selectedUser);
    const matchAction = selectedAction === "" || log.action === selectedAction;
    return matchUser && matchAction;
  });

  const uniqueUsers = Array.from(new Set(logs.map((log) => log.user)));
  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
        <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
          <History className="w-5 h-5 text-blue-500" />
          Enterprise Security Audit Log
        </h2>
        <p className="text-xs text-[#64748B] mt-1">
          Historical timeline registry documenting access attempts, database modifications, and AI generation requests.
        </p>
      </div>

      {/* Query Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A] uppercase tracking-wider pb-3 border-b border-[#E2E8F0]">
          <SlidersHorizontal className="w-4 h-4 text-blue-500" />
          Filter Timeline
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#64748B]" /> Filter User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl p-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Users</option>
              {uniqueUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-[#64748B]" /> Filter Action Type
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl p-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Actions</option>
              {uniqueActions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#475569] border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] tracking-wider leading-loose">
                <th className="py-2.5">Timestamp</th>
                <th className="py-2.5">User</th>
                <th className="py-2.5">Action Event</th>
                <th className="py-2.5">Target Entity</th>
                <th className="py-2.5 text-center">Result</th>
                <th className="py-2.5 text-right">Source IP/Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A] font-medium">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-3 text-[#64748B] font-mono">{log.timestamp}</td>
                  <td className="py-3 font-semibold">{log.user}</td>
                  <td className="py-3">
                    <span className="bg-slate-100 text-[#0F172A] px-2 py-0.5 rounded text-[10px] font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 text-slate-700">{log.entity}</td>
                  <td className="py-3 text-center">
                    {log.result === "Success" ? (
                      <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 justify-center w-24 mx-auto">
                        <CheckCircle className="w-3 h-3" />
                        Success
                      </span>
                    ) : (
                      <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 justify-center w-24 mx-auto">
                        <AlertTriangle className="w-3 h-3" />
                        Failure
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right text-[#64748B] font-mono">{log.source}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#64748B] italic">
                    No matching audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
