// High-fidelity local template fallbacks. Used when no Gemini key is
// configured or after the model call exhausts retries. Moved here verbatim
// from server.ts so the behaviour is preserved but no longer duplicated.
import type { OutreachPromptInput, ScorePromptInput } from "./prompts.js";

export function fallbackOutreach(input: OutreachPromptInput): string {
  const {
    companyName = "your company",
    industry = "your industry",
    executiveName = "there",
    role = "your role",
    channel = "linkedin",
    serviceType = "AI & Data Solutions Integration",
  } = input;

  switch (channel) {
    case "email":
      return `Subject: Unlocking secure analytics throughput for ${companyName}\n\nDear ${executiveName},\n\nI am writing because of your role leading ${role} at ${companyName}. Building highly performant data architectures to solve bottlenecks remains a primary priority in ${industry}.\n\nTECHNETICS specializes in high-fidelity ${serviceType}, deploying certified BI architects, automated pipelines, and custom AI tooling that typically reduces visual latency by 45%.\n\nCould we coordinate a brief 10-minute introductory call to discuss some regional case studies?\n\nSincerely,\nEnterprise B2B Dev\nTECHNETICS IT SERVICES`;
    case "followup1":
      return `Hi ${executiveName},\n\nFollowing up briefly on my earlier note regarding ${serviceType}. Many ${industry} leaders tell us their bottleneck isn't collecting data, but translating telemetry into real-time executive dashboards. We recently automated 80% of dispatch reporting for an international logistics partner.\n\nIs there a better time next week for a quick 10 minutes?\n\nRegards,\nTECHNETICS Team`;
    case "followup2":
      return `Hi ${executiveName},\n\nSince I know you are focused on scale challenges at ${companyName}, I prepared a complimentary sample Power BI High-Performance Analytics Wireframe based on standard ${industry} metrics.\n\nI would love to walk you through it. Do you have a window next Wednesday?\n\nBest,\nTECHNETICS`;
    case "followup3":
      return `Dear ${executiveName},\n\nI won't clutter your inbox further. I understand optimized ${serviceType} might not be on ${companyName}'s immediate roadmap this quarter.\n\nIf you ever require rapid support for custom data lakes, Power BI dashboards, or Cloud migration, please keep TECHNETICS in mind.\n\nWarmly,\nTECHNETICS IT SERVICES Team`;
    case "proposal":
      return `TECHNETICS IT SERVICES — STRATEGIC INITIATIVE PROPOSAL\n\nAttn: ${executiveName}, ${role}\nTarget: ${companyName}\nFocus Area: ${serviceType} Implementation\n\n1. Problem Statement: Modern ${industry} enterprises suffer from siloed ERP outputs and stale reporting cycles.\n2. Solution Matrix: TECHNETICS deploys hybrid teams to build automated data-science ingestion loops feeding interactive real-time dashboards.\n3. Implementation Plan: Two-week architectural audit followed by a six-week execution phase.\n\nLet's coordinate a workshop to customize this roadmap.`;
    default:
      return `Hi ${executiveName},\n\nI noticed your focus on ${role} at ${companyName}. Given your initiatives in ${industry}, many leaders struggle to manage decentralized tech footprints efficiently. At TECHNETICS, we scale engineering operations through bespoke ${serviceType}.\n\nWould you be open to a brief 5-minute sync to explore how we solved dashboard latency for similar enterprises?\n\nBest regards,\nEnterprise Development Lead\nTECHNETICS IT SERVICES`;
  }
}

export function fallbackLeadScoreRecommendations(
  input: ScorePromptInput,
): string[] {
  const recs: string[] = [];
  recs.push(
    input.powerBI < 75
      ? "Urgent need for cohesive dashboards. Pitch a custom 'Power BI QuickStart Integration' to replace Excel reporting."
      : "They already use Power BI extensively. Pitch 'Power BI Performance Tuning and Advanced DAX Optimizations'.",
  );
  recs.push(
    input.automation < 70
      ? `Automation is underdeveloped (${input.automation}/100). Highlight how UiPath/Power Automate bots save 20 hours/week on processing.`
      : "Medium-high automation maturity. Offer a 'Custom Orchestrator Audit and AI-Agent system loops'.",
  );
  recs.push(
    input.buyingIntent > 80
      ? `Extremely high buying intent (${input.buyingIntent}/100). Send a fast-tracked architectural workshop invitation immediately.`
      : "Buying intent is moderate. Nurture with a whitepaper on Azure integration savings.",
  );
  return recs;
}

export function computeAverageScore(input: ScorePromptInput): number {
  return Math.round(
    (input.dataScience +
      input.powerBI +
      input.cloud +
      input.automation +
      input.buyingIntent) /
      5,
  );
}
