import React, { useState } from "react";
import { Company, LeadStatus } from "../types";
import {
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  FileCheck,
  PenTool,
  X,
  Activity,
  Clock,
  Calendar,
  Building2,
  Users,
} from "lucide-react";

interface KanbanBoardProps {
  companies: Company[];
  onMoveCompany: (companyId: string, newStatus: LeadStatus) => void;
  onUpdateCompanyNotes?: (
    companyId: string,
    author: string,
    noteContent: string,
  ) => void;
}

export default function KanbanBoard({
  companies,
  onMoveCompany,
  onUpdateCompanyNotes,
}: KanbanBoardProps) {
  const columns: LeadStatus[] = [
    "New Leads",
    "Qualified",
    "Contacted",
    "Meeting Scheduled",
    "Proposal Sent",
    "Negotiation",
    "Won",
    "Lost",
  ];

  const [activeLane, setActiveLane] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Company | null>(null);
  const [commentContent, setCommentContent] = useState("");

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, companyId: string) => {
    e.dataTransfer.setData("text/plain", companyId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, column: LeadStatus) => {
    e.preventDefault();
    setActiveLane(column);
  };

  const handleDrop = (e: React.DragEvent, targetColumn: LeadStatus) => {
    e.preventDefault();
    setActiveLane(null);
    const companyId = e.dataTransfer.getData("text/plain");
    if (companyId) {
      onMoveCompany(companyId, targetColumn);

      // Update drawer if opened
      if (selectedLead && selectedLead.id === companyId) {
        setSelectedLead({
          ...selectedLead,
          status: targetColumn,
        });
      }
    }
  };

  const handleDragLeave = () => {
    setActiveLane(null);
  };

  // Add Comment note
  const handleAddComment = () => {
    if (!commentContent.trim() || !selectedLead) return;

    if (onUpdateCompanyNotes) {
      onUpdateCompanyNotes(selectedLead.id, "Yash Modi", commentContent);
    }

    // Update local drawer state concurrently
    const updatedNotes = [
      {
        id: `local-note-${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        author: "Yash Modi",
        content: commentContent,
      },
      ...selectedLead.notes,
    ];

    setSelectedLead({
      ...selectedLead,
      notes: updatedNotes,
    });
    setCommentContent("");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-50 p-4 border border-[#E2E8F0] rounded-xl shadow-3xs">
        <div>
          <h3 className="font-sans font-bold text-sm text-[#0F172A]">
            Sales Lead Pipeline Board
          </h3>
          <p className="text-xs text-[#64748B]">
            Drag and drop lead cards across sales stages to synchronize CRM
            pipelines
          </p>
        </div>
        <div className="text-[10px] text-blue-600 font-sans font-medium flex items-center gap-1 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span>REAL-TIME PIPELINE AUTOMATION</span>
        </div>
      </div>

      {/* Grid container with responsive horizontal scroll on tablets */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 xl:grid xl:grid-cols-4 lg:grid-cols-2">
        {columns.map((colName) => {
          const matchingLeads = companies.filter((c) => c.status === colName);
          const isLaneHovered = activeLane === colName;

          return (
            <div
              key={colName}
              id={`kanban-lane-${colName.replace(/\s+/g, "-").toLowerCase()}`}
              onDragOver={(e) => handleDragOver(e, colName)}
              onDrop={(e) => handleDrop(e, colName)}
              onDragLeave={handleDragLeave}
              className={`flex-shrink-0 w-80 min-h-[450px] bg-[#F8FAFC] rounded-2xl border p-4.5 flex flex-col justify-between transition-all duration-350 ${
                isLaneHovered
                  ? "border-blue-500 bg-blue-50/50 ring-4 ring-blue-500/5"
                  : "border-[#E2E8F0]"
              }`}
            >
              <div>
                {/* Column Name */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
                  <span className="font-sans font-bold text-xs text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {colName}
                  </span>
                  <span className="bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-lg text-xs font-sans font-medium font-bold text-[#475569] shadow-3xs">
                    {matchingLeads.length}
                  </span>
                </div>

                {/* Draggable Lead Cards Stack */}
                <div className="space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin">
                  {matchingLeads.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl py-10 text-center text-[11px] text-[#64748B] italic bg-white">
                      No Leads in this Stage
                    </div>
                  ) : (
                    matchingLeads.map((lead) => (
                      <div
                        key={lead.id}
                        id={`kanban-card-${lead.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="bg-white border border-[#E2E8F0] p-3.5 rounded-xl shadow-xs cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-2xs transition-all select-none group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500/45 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm bg-slate-50 w-6 h-6 rounded flex items-center justify-center border border-[#E2E8F0] font-sans">
                              {lead.logo}
                            </span>
                            <span className="font-sans font-bold text-xs text-[#0F172A] group-hover:text-blue-600 transition-colors">
                              {lead.name}
                            </span>
                          </div>

                          <div className="bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-lg text-[10px] font-sans font-medium font-bold text-blue-600">
                            {lead.leadScore} pts
                          </div>
                        </div>

                        <p className="text-[11px] text-[#64748B] font-sans truncate mt-2 font-medium">
                          {lead.industry}
                        </p>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E2E8F0] text-[10px] text-[#64748B] font-sans font-medium">
                          <span className="font-medium">{lead.country}</span>
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5 group-hover:underline cursor-pointer"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3 h-3 text-blue-600" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2E8F0] text-center text-[10px] text-[#64748B] font-sans font-medium font-bold">
                {colName === "Won"
                  ? "🎉 Closed Wins Lane"
                  : colName === "Lost"
                    ? "🗑️ Inactive Projects"
                    : "⚡ Drag Cards to Move"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-over CRM Drawer details */}
      {selectedLead && (
        <div
          id="crm-lead-drawer"
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        >
          {/* Backdrop Dismiss trigger */}
          <div className="flex-1" onClick={() => setSelectedLead(null)} />
          {/* Drawer Body container */}
          <div className="w-full max-w-lg bg-white border-l border-[#E2E8F0] h-full overflow-y-auto shadow-2xl p-6.5 flex flex-col justify-between">
            <div>
              {/* Drawer Header info */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-[#E2E8F0] flex items-center justify-center text-xl shadow-2xs">
                    {selectedLead.logo}
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-[#0F172A] text-lg leading-tight">
                      {selectedLead.name}
                    </h4>
                    <p className="text-xs text-blue-600 font-sans font-medium font-semibold mt-1">
                      {selectedLead.website.replace("https://", "")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1 px-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Status and Score matrices */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center shadow-3xs">
                  <span className="text-[10px] text-[#64748B] uppercase font-sans font-medium tracking-wider block font-bold">
                    Lead Intelligence rating
                  </span>
                  <span className="text-lg font-sans font-medium font-bold text-blue-600 mt-1 block">
                    {selectedLead.leadScore} Points
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center shadow-3xs">
                  <span className="text-[10px] text-[#64748B] uppercase font-sans font-medium tracking-wider block font-bold">
                    Active Pipeline Lane
                  </span>
                  <span className="text-xs font-sans font-bold text-emerald-600 mt-1.5 block uppercase tracking-wide">
                    {selectedLead.status}
                  </span>
                </div>
              </div>

              {/* Target Service recommendations */}
              <div className="mb-6 bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                <span className="text-[10px] font-sans font-medium text-blue-600 tracking-wider uppercase font-bold block">
                  Assigned Playbook Proposal Target
                </span>
                <span className="block text-xs font-sans font-extrabold text-[#0F172A] mt-1.5 leading-snug">
                  {selectedLead.recommendedService}
                </span>
                <p className="text-[11px] text-[#475569] font-sans mt-2.5 leading-normal font-medium">
                  {selectedLead.opportunityAnalysis}
                </p>
              </div>

              {/* Technologies Stack tags */}
              <div className="mb-6 space-y-2">
                <span className="text-xs font-sans font-medium font-bold text-[#64748B] uppercase block tracking-wider">
                  Discovered Tech Stack
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedLead.techStack.map((tech, i) => (
                    <span
                      key={i}
                      className="text-[10px] cursor-default bg-slate-50 border border-[#E2E8F0] text-[#475569] px-2.5 py-1 rounded-lg font-semibold shadow-3xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hiring status indicator */}
              <div className="mb-6 bg-slate-50 border border-[#E2E8F0] rounded-xl p-3.5 space-y-1">
                <span className="text-xs font-sans font-medium font-bold text-[#64748B] uppercase block tracking-wider">
                  Hiring Status Indicator
                </span>
                <span className="text-xs font-sans font-bold text-emerald-600 block mt-1">
                  Active Hiring Level: {selectedLead.hiringActivity}
                </span>
                {selectedLead.hiringDetails && (
                  <p className="text-[11px] text-[#475569] leading-normal mt-1 italic font-medium">
                    {selectedLead.hiringDetails}
                  </p>
                )}
              </div>

              {/* Activity Timeline logs */}
              <div className="mb-6.5 border-t border-[#E2E8F0] pt-4 space-y-3">
                <span className="text-xs font-sans font-medium font-bold text-[#64748B] uppercase block tracking-wider">
                  Audit Operations Logs
                </span>
                <div className="space-y-3.5 max-h-40 overflow-y-auto pr-1">
                  {selectedLead.activityTimeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2.5 items-start text-xs text-[#475569]"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="font-extrabold text-[#0F172A] text-[11px] flex items-center justify-between">
                          <span>{item.title}</span>
                          <span className="text-[10px] text-[#64748B] font-sans font-medium font-semibold">
                            {item.date}
                          </span>
                        </p>
                        <p className="text-[11px] leading-relaxed mt-0.5 text-[#475569] font-medium">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes composer and listing */}
              <div className="space-y-3 border-t border-[#E2E8F0] pt-4">
                <span className="text-xs font-sans font-medium font-bold text-[#64748B] uppercase block tracking-wider">
                  Collaborative Sales Notes
                </span>

                {/* Textarea comments block */}
                <div className="flex gap-2 items-end">
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Write private CRM update note..."
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 min-h-16 resize-none transition-all shadow-3xs"
                  />
                  <button
                    onClick={handleAddComment}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-bold px-4 py-2.5 rounded-xl h-9 flex items-center shrink-0 cursor-pointer shadow-sm transition-all"
                  >
                    Add
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-3 mt-4">
                  {selectedLead.notes.length === 0 ? (
                    <p className="text-xs text-[#64748B] italic">
                      No updates posted yet.
                    </p>
                  ) : (
                    selectedLead.notes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs space-y-1 shadow-3xs"
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#64748B] font-sans font-medium">
                          <span className="font-sans font-bold text-[#0F172A]">
                            {note.author}
                          </span>
                          <span>{note.date}</span>
                        </div>
                        <p className="text-[#475569] font-sans leading-relaxed font-semibold">
                          {note.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex justify-between gap-3">
              <span className="text-[10px] text-[#64748B] font-sans font-medium flex items-center font-bold">
                ID: {selectedLead.id}
              </span>
              <a
                href={selectedLead.website}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-50 border border-[#E2E8F0] hover:bg-slate-100 text-[#475569] font-sans text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
              >
                <span>Navigate Site</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#475569]" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
