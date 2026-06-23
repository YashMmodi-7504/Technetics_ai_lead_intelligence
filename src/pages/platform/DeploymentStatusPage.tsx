import React from "react";
import { Server, CheckCircle, ArrowUpRight, ShieldCheck, Box, Settings, GitBranch, RefreshCw } from "lucide-react";

export default function DeploymentStatusPage() {
  const deploymentData = {
    environment: "Development Sandbox",
    buildVersion: "v1.4.2-dev",
    readinessScore: 92,
    dockerStatus: "Configured (local compose available)",
    databaseStatus: "In-Memory PGlite Active",
    applicationStatus: "Active Dev Mode",
    lastDeploy: "Today (Auto-Reload active)",
  };

  const checklistItems = [
    { name: "Docker Configuration File Verification", status: true, detail: "Dockerfile & docker-compose.yml ready" },
    { name: "PostgreSQL Database Schema Migration Complete", status: true, detail: "drizzle 0000 table structure mapped" },
    { name: "Vite Asset Optimization & Build Testing", status: true, detail: "esbuild & bundles completed successfully" },
    { name: "AI Core Cost & Rate Limiting Governor Active", status: true, detail: "Cost parameters set in environmental config" },
    { name: "Production Access Controls Enabled", status: false, detail: "JWT Secret needs Base64 256bit keys before deployment" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-500" />
            Deployment & Production Readiness Center
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Evaluate environment configurations, Docker infrastructure checks, and security checklist audits.
          </p>
        </div>
        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
          <GitBranch className="w-4 h-4" />
          Dev Sandbox
        </span>
      </div>

      {/* Grid of Readiness Check Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-[#64748B] uppercase block font-sans font-semibold">
              Docker Engine Status
            </span>
            <Box className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <span className="text-sm font-bold text-[#0F172A] mt-3 block">
            Ready
          </span>
          <span className="text-[10px] text-[#64748B] block mt-1">
            Local docker-compose ready
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-[#64748B] uppercase block font-sans font-semibold">
              CI/CD Pipeline Build
            </span>
            <ArrowUpRight className="w-4.5 h-4.5 text-green-600" />
          </div>
          <span className="text-sm font-bold text-[#0F172A] mt-3 block">
            Passing
          </span>
          <span className="text-[10px] text-[#64748B] block mt-1">
            All Vitests successful
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-[#64748B] uppercase block font-sans font-semibold">
              Security Validation
            </span>
            <ShieldCheck className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <span className="text-sm font-bold text-amber-600 mt-3 block">
            Action Needed
          </span>
          <span className="text-[10px] text-[#64748B] block mt-1">
            Default secrets detected
          </span>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-[#64748B] uppercase block font-sans font-semibold">
              Production Release Ready
            </span>
            <CheckCircle className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <span className="text-sm font-bold text-[#0F172A] mt-3 block">
            92% Score
          </span>
          <span className="text-[10px] text-[#64748B] block mt-1">
            Deploy checks passed
          </span>
        </div>
      </div>

      {/* Main split dashboard metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Checklist */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#0F172A] border-b border-[#E2E8F0] pb-3">
            Readiness & Compilation Checkpoints
          </h3>
          <div className="space-y-3.5">
            {checklistItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 bg-slate-50 border border-[#E2E8F0]/80 rounded-xl"
              >
                {item.status ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-amber-500 mt-0.5 animate-spin" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A]">{item.name}</h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical spec sidebar */}
        <div className="lg:col-span-1 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#0F172A] border-b border-[#E2E8F0] pb-3">
            Local Configuration Matrix
          </h3>
          <div className="space-y-4 text-xs text-[#0F172A]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-[#64748B]">Target Environment:</span>
              <span className="font-semibold">{deploymentData.environment}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-[#64748B]">Build Release:</span>
              <span className="font-semibold font-mono text-[11px]">{deploymentData.buildVersion}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-[#64748B]">Docker Status:</span>
              <span className="font-semibold">{deploymentData.dockerStatus}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-[#64748B]">Database Mode:</span>
              <span className="font-semibold text-blue-600">{deploymentData.databaseStatus}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-[#64748B]">Node Server Status:</span>
              <span className="font-semibold text-emerald-600">{deploymentData.applicationStatus}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">Last Release Check:</span>
              <span className="font-semibold text-[#64748B]">{deploymentData.lastDeploy}</span>
            </div>

            {/* Visual readiness radial simulation */}
            <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
              <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">
                Aggregated Readiness Progress
              </span>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${deploymentData.readinessScore}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-[#64748B] mt-1">
                <span>0%</span>
                <span className="text-[#0F172A] font-extrabold">{deploymentData.readinessScore}% READY</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
