import React from "react";
import {
  LayoutDashboard,
  Globe2,
  Building2,
  BrainCircuit,
  TrendingUp,
  Mail,
  Layers,
  Upload,
  Database,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import techneticsLogo from "../assets/technetics-logo.png";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

// Enterprise navigation. NOTE: item ids are the routing keys consumed by
// App.tsx (activeTab) and must remain unchanged.
const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Overview",
    items: [{ id: "executive-overview", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    heading: "Markets",
    items: [
      { id: "country-intelligence", label: "Country Intelligence", icon: Globe2 },
      { id: "industry-intelligence", label: "Industry Intelligence", icon: Layers },
    ],
  },
  {
    heading: "Companies",
    items: [{ id: "company-discovery", label: "Company Discovery", icon: Building2 }],
  },
  {
    heading: "Lead Intelligence",
    items: [
      { id: "ai-lead-scoring", label: "Lead Scoring", icon: BrainCircuit },
      { id: "opportunity-intelligence", label: "Opportunity Intelligence", icon: TrendingUp },
    ],
  },
  {
    heading: "AI Workspace",
    items: [
      { id: "outreach-studio", label: "Outreach Studio", icon: Mail },
    ],
  },
  {
    heading: "Data Hub",
    items: [
      { id: "import-leads", label: "Lead Import", icon: Upload },
      { id: "data-quality", label: "Data Health", icon: Database },
    ],
  },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const handleSelect = (item: NavItem) => {
    setActiveTab(item.id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        id="main-sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-white/80 backdrop-blur-xl border-r border-[#E2E8F0] shadow-elevation-2 lg:shadow-none
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Platform Branding */}
        <div className="h-16 flex items-center border-b border-[#E2E8F0] gap-3 px-6">
          <img src={techneticsLogo} alt="TECHNETICS" className="w-9 h-9 shrink-0 rounded-xl object-contain" />
          <div className="overflow-hidden">
            <span className="font-sans font-extrabold text-lg text-[#0F172A] tracking-wide whitespace-nowrap">
              TECHNETICS
            </span>
            <p className="text-[10px] text-[#64748B] tracking-[0.18em] uppercase font-semibold whitespace-nowrap">
              Lead Intelligence
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow px-3 py-5 space-y-5 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {NAV_GROUPS.map((group) => (
            <div key={group.heading}>
              <div className="text-[10px] font-bold tracking-[0.12em] text-[#94A3B8] uppercase px-3 mb-2">
                {group.heading}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-tab-${item.id}`}
                      onClick={() => handleSelect(item)}
                      aria-current={isActive ? "page" : undefined}
                      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group text-left
                        ${
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white nav-glow"
                            : "text-[#475569] hover:bg-blue-50 hover:text-[#0F172A]"
                        }`}
                    >
                      {/* Active rail accent */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-cyan-300" />
                      )}
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                          isActive ? "text-white" : "text-[#64748B] group-hover:text-blue-600"
                        }`}
                      />
                      <span className="whitespace-nowrap">{item.label}</span>
                      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Live AI engine indicator */}
        <div className="p-3 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-100">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <Cpu className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-bold text-emerald-700 tracking-wide">AI ENGINE ONLINE</span>
          </div>
        </div>
      </aside>
    </>
  );
}
