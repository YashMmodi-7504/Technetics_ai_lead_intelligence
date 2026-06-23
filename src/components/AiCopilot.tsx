import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles, X, Search, Users2, Mail, Flame, Send, ArrowRight,
  Building2, Download, BrainCircuit, Bot, User as UserIcon,
} from "lucide-react";
import { Company } from "../types";
import {
  runAssistantQuery,
  matchesToCsv,
  type AssistantResult,
  type AssistantAction,
  type AssistantDirective,
} from "../utils/assistantEngine";

interface AiCopilotProps {
  companies: Company[];
  onApplyDirective: (directive: AssistantDirective) => void;
  /** Controlled open state (e.g. opened from the sidebar "AI Copilot" item). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SUGGESTED = [
  { label: "Find AI consulting companies in UAE", icon: Search },
  { label: "Show top CTO opportunities", icon: Users2 },
  { label: "Generate outreach for top leads", icon: Mail },
  { label: "Show highest intent accounts", icon: Flame },
];

interface ChatMsg {
  id: number;
  role: "user" | "assistant";
  text: string;
  result?: AssistantResult;
}

const ACTION_ICON: Record<AssistantAction["kind"], typeof Search> = {
  view: Building2,
  outreach: Mail,
  score: BrainCircuit,
  export: Download,
};

function downloadCsv(matches: Company[]) {
  const csv = matchesToCsv(matches);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `technetics-results-${matches.length}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AiCopilot({ companies, onApplyDirective, open: controlledOpen, onOpenChange }: AiCopilotProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const idRef = useRef(0);
  const threadRef = useRef<HTMLDivElement>(null);

  const nextId = () => ++idRef.current;

  // Auto-scroll to the latest message.
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const ask = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    const result = runAssistantQuery(clean, companies);
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", text: clean },
      { id: nextId(), role: "assistant", text: result.answer, result },
    ]);
    setQuery("");
  };

  const handleAction = (action: AssistantAction, result: AssistantResult) => {
    if (action.kind === "export") {
      downloadCsv(result.matches);
      return;
    }
    if (action.directive) {
      onApplyDirective(action.directive);
      setOpen(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-16 right-0 w-[380px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-7rem)] rounded-2xl bg-white border border-[#E2E8F0] shadow-elevation-4 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                </span>
                <div>
                  <span className="text-sm font-bold block leading-none">TECHNETICS AI Copilot</span>
                  <span className="text-[10px] text-white/80">Querying {companies.length} live records</span>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close assistant" className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thread */}
            <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-blue-600" />
                    </span>
                    <div className="rounded-2xl rounded-tl-sm bg-slate-50 border border-[#E2E8F0] px-3 py-2 text-xs text-[#475569] leading-relaxed">
                      Ask me about your imported companies, markets, industries, or lead scores. I answer from real records — try a prompt below or type your own.
                    </div>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] pt-1">Suggested</p>
                  <div className="space-y-1.5">
                    {SUGGESTED.map((p) => {
                      const PIcon = p.icon;
                      return (
                        <button
                          key={p.label}
                          onClick={() => ask(p.label)}
                          className="w-full flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] px-3 py-2 text-left hover:border-blue-300 hover:bg-blue-50/50 transition-all group cursor-pointer"
                        >
                          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                            <PIcon className="w-3.5 h-3.5" />
                          </span>
                          <span className="flex-1 text-xs font-semibold text-[#0F172A]">{p.label}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-blue-600 transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex items-start gap-2 justify-end">
                    <div className="rounded-2xl rounded-tr-sm bg-blue-600 text-white px-3 py-2 text-xs font-medium max-w-[80%]">
                      {m.text}
                    </div>
                    <span className="w-7 h-7 rounded-full bg-slate-100 border border-[#E2E8F0] flex items-center justify-center shrink-0">
                      <UserIcon className="w-3.5 h-3.5 text-[#64748B]" />
                    </span>
                  </div>
                ) : (
                  <div key={m.id} className="flex items-start gap-2">
                    <span className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-blue-600" />
                    </span>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="rounded-2xl rounded-tl-sm bg-slate-50 border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A] font-semibold leading-relaxed">
                        {m.text}
                      </div>

                      {/* Top matches */}
                      {m.result && m.result.matches.length > 0 && (
                        <div className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">Top Matches</p>
                          <ol className="space-y-1">
                            {m.result.matches.slice(0, 5).map((c, i) => (
                              <li key={c.id} className="flex items-center gap-2 text-xs">
                                <span className="text-[#94A3B8] font-bold w-4 shrink-0">{i + 1}.</span>
                                <span className="font-semibold text-[#0F172A] truncate flex-1">{c.name}</span>
                                <span className="text-[10px] font-bold text-blue-600 shrink-0">{c.leadScore}</span>
                              </li>
                            ))}
                          </ol>
                          {m.result.matches.length > 5 && (
                            <p className="text-[10px] text-[#94A3B8] mt-1.5">+ {m.result.matches.length - 5} more records</p>
                          )}
                        </div>
                      )}

                      {/* Aggregation bullets */}
                      {m.result?.bullets && m.result.bullets.length > 0 && (
                        <div className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 space-y-1">
                          {m.result.bullets.map((b, i) => (
                            <p key={i} className="text-xs text-[#475569] font-medium">{b}</p>
                          ))}
                        </div>
                      )}

                      {m.result?.note && (
                        <p className="text-[10px] text-[#94A3B8] italic px-1">{m.result.note}</p>
                      )}

                      {/* Actions */}
                      {m.result && m.result.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {m.result.actions.map((a) => {
                            const AIcon = ACTION_ICON[a.kind];
                            return (
                              <button
                                key={a.label}
                                onClick={() => handleAction(a, m.result!)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                  a.primary
                                    ? "bg-blue-600 text-white border-transparent hover:bg-blue-700"
                                    : "bg-white text-[#475569] border-[#E2E8F0] hover:border-blue-300 hover:text-blue-600"
                                }`}
                              >
                                <AIcon className="w-3 h-3" /> {a.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[#E2E8F0] shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); ask(query); }} className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask about companies, markets, scores…"
                  aria-label="TECHNETICS AI Copilot"
                  className="w-full bg-slate-50 border border-[#E2E8F0] rounded-xl pl-3 pr-9 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <button type="submit" aria-label="Send" disabled={!query.trim()} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating launcher */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(!open)}
        aria-label="TECHNETICS AI Copilot"
        className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-elevation-4 flex items-center justify-center hover:shadow-glow-primary transition-shadow relative"
      >
        {!open && <span className="absolute inset-0 rounded-full bg-blue-500/40 animate-ping" />}
        <Sparkles className="w-6 h-6 relative" />
      </motion.button>
    </div>
  );
}
