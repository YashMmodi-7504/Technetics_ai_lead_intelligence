// Shared, versioned prompt registry. All Gemini prompts live here as pure
// functions so they can be unit-tested and reused across call sites.
export const PROMPT_VERSION = "2025-06-19";

export type OutreachChannel =
  | "linkedin"
  | "email"
  | "followup1"
  | "followup2"
  | "followup3"
  | "proposal";

export interface OutreachPromptInput {
  companyName?: string;
  industry?: string;
  executiveName?: string;
  role?: string;
  channel?: OutreachChannel | string;
  customPrompt?: string;
  details?: string;
  serviceType?: string;
}

export interface ScorePromptInput {
  companyName?: string;
  dataScience: number;
  powerBI: number;
  cloud: number;
  automation: number;
  buyingIntent: number;
}

const TECHNETICS_PERSONA =
  'You are a highly-trained, elite enterprise business developer representing "TECHNETICS IT SERVICES" (a world-class systems integrator specializing in custom Artificial Intelligence models, deep Data Science pipelines, Power BI reporting suites, custom Cloud Architecture, and RPA business process automation integrations).';

export const prompts = {
  outreach(input: OutreachPromptInput): string {
    const targetService = input.serviceType || "AI & Data Solutions Integration";
    return `${TECHNETICS_PERSONA}

Develop a highly targeted outreach copy based on these B2B lead specifications:
- Proposing TECHNETICS Service: "${targetService}"
- Target Company: "${input.companyName || "the target company"}" (Industry: "${input.industry || "Global Operations"}")
- Key Lead Context: "${input.details || "Has active hiring queries for data specialists, high data latency, seeking operational dashboards"}"
- Target Executive Contact: "${input.executiveName || "the lead recipient"}" (Role: "${input.role || "Decision Maker"}")
- Outreach Channel requested: "${input.channel || "linkedin"}" (Options: linkedin, email, followup1, followup2, followup3, proposal)
- Additional Campaign Focus: "${input.customPrompt || "Focus on offshore engineering cost-benefit ratio and high quality standard integrations."}"

Format your output based on the appropriate channel constraint:
  - 'linkedin': Short, punchy, hyper-personalized value hook. Max 3 succinct paragraphs. Easy call to action. Max 150 words.
  - 'email': Subject line + personalized email body. Focus on pain points, immediate solutions, brief social proof, suggest a 10-minute slot.
  - 'followup1': Persistent but polite, addressing another angle of their tech workspace.
  - 'followup2': High-value proposition offering a complimentary dashboard blueprint mock-up.
  - 'followup3': Final courtesy touchpoint.
  - 'proposal': Comprehensive introductory high-level proposal outline.

Write the draft directly to the executive contact. Keep a professional, consultative, non-spammy, highly intelligent tone. Do not use generic filler like "I hope this email finds you well" or "In today's fast-paced digital landscape". Address direct challenges. Write in perfect B2B enterprise sales style.`;
  },

  leadScore(input: ScorePromptInput): string {
    return `Analyze the digital transformation metrics of target company "${input.companyName || "the target company"}" seeking consulting services:
- Data Science Maturity Score: ${input.dataScience}/100
- Power BI & BI Maturity Score: ${input.powerBI}/100
- Cloud Infrastructure Maturity Score: ${input.cloud}/100
- Automation & RPA Maturity Score: ${input.automation}/100
- Buying Intent/Demand Score: ${input.buyingIntent}/100

Return exactly 3 high-priority recommendations tailored for TECHNETICS IT SERVICES salespeople when pitching this lead. Highlight the exact service that matches their technical gaps/strengths. Be extremely concise.
Return a JSON object of the form: { "recommendations": ["...", "...", "..."] }. Do not include markdown code blocks.`;
  },

  countryAnalysis(name: string): string {
    return `Provide concise market intelligence for ${name} relevant to B2B IT consulting lead generation.
Return a JSON object of the form: { "summary": string, "gdpOutlook": string, "englishProficiency": string, "topIndustries": [string], "opportunityScore": number }.
opportunityScore is 0-100. Do not include markdown code blocks.`;
  },

  companyAnalysis(name: string, domain: string, industry: string): string {
    return `Analyze the B2B company ${name} (${domain}) in industry ${industry}.
Return a JSON object of the form: { "summary": string, "likelyTechStack": [string], "hiringNeeds": [string] }.
Keep summary to 2 sentences. Do not include markdown code blocks.`;
  },

  countryDemand(name: string): string {
    return `Assess B2B technology consulting demand in ${name} for an IT services firm (TECHNETICS).
Score each dimension 0-100 (higher = stronger demand / market opportunity):
ai, generativeAi, machineLearning, dataScience, dataEngineering, powerBI, cloud, automation.
Return a JSON object of the form:
{ "demand": { "ai": number, "generativeAi": number, "machineLearning": number, "dataScience": number, "dataEngineering": number, "powerBI": number, "cloud": number, "automation": number }, "topIndustries": [string], "summary": string }.
Base scores on the country's digital maturity, AI adoption, talent gaps and enterprise spend. Do not include markdown code blocks.`;
  },
};
