import { Company, CountryOpportunity, DecisionMaker, OpportunityPrioritization } from "../types";
export function calculateOpportunityScores(
  company: Company,
  countries: CountryOpportunity[],
  decisionMakers: DecisionMaker[]
): OpportunityPrioritization {
  // 1. Country Opportunity Score
  const matchedCountry = countries.find(
    (c) => c.country === company.country || c.code === company.countryCode
  );
  const countryScore = matchedCountry?.opportunityScore ?? 75;

  // 2. Market Growth Score
  let marketGrowthScore = 60;
  if (company.hiringActivity === "High") marketGrowthScore = 92;
  else if (company.hiringActivity === "Medium") marketGrowthScore = 78;
  else if (company.hiringActivity === "Low") marketGrowthScore = 60;

  // 3. Industry Fit Score
  let rawIndustryFit = 70;
  const industry = company.industry.toLowerCase();
  if (
    industry.includes("finance") ||
    industry.includes("tech") ||
    industry.includes("e-commerce") ||
    industry.includes("management")
  ) {
    rawIndustryFit = 95;
  } else if (
    industry.includes("health") ||
    industry.includes("biotech") ||
    industry.includes("energy")
  ) {
    rawIndustryFit = 88;
  } else if (
    industry.includes("manufacturing") ||
    industry.includes("logistics") ||
    industry.includes("mining")
  ) {
    rawIndustryFit = 78;
  }
  // Adjust with tech scores from sliders (assume defaults if missing)
  const techFit =
    ((company.cloudScore || 70) +
      (company.dataScienceScore || 70) +
      (company.powerBIScore || 70) +
      (company.automationScore || 70)) /
    4;
  const industryFitScore = Math.round(rawIndustryFit * 0.6 + techFit * 0.4);

  // 4. Company Size Score
  let companySizeScore = 55;
  const emp = company.employees;
  if (emp > 10000) companySizeScore = 95;
  else if (emp > 5000) companySizeScore = 88;
  else if (emp > 1000) companySizeScore = 80;
  else if (emp > 100) companySizeScore = 70;

  // 5. Revenue Potential Score
  const revenuePotentialScore = Math.round(
    companySizeScore * 0.7 + countryScore * 0.3
  );

  // 6. Decision Maker Quality Score
  const companyDms = decisionMakers.filter((dm) => dm.companyId === company.id);
  let decisionMakerQualityScore = 65;
  if (companyDms.length > 0) {
    const avgDm =
      companyDms.reduce((sum, dm) => sum + dm.priorityScore, 0) /
      companyDms.length;
    decisionMakerQualityScore = Math.round(avgDm);
  }

  // 7. Engagement Score
  const timelineCount = company.activityTimeline?.length || 0;
  let engagementScore = 50;
  if (timelineCount >= 4) engagementScore = 98;
  else if (timelineCount === 3) engagementScore = 88;
  else if (timelineCount === 2) engagementScore = 78;
  else if (timelineCount === 1) engagementScore = 65;

  // 8. Buying Intent Score
  const intentScore = company.buyingIntentScore || 50;

  // Final Normalized Score
  const finalScore = Math.round(
    countryScore * 0.1 +
      marketGrowthScore * 0.1 +
      industryFitScore * 0.15 +
      companySizeScore * 0.1 +
      revenuePotentialScore * 0.15 +
      decisionMakerQualityScore * 0.15 +
      engagementScore * 0.1 +
      intentScore * 0.15
  );

  // Confidence calculation
  let confidence = 80;
  if (companyDms.length > 0) confidence += 8;
  if (matchedCountry) confidence += 6;
  if (engagementScore > 70) confidence += 5;
  confidence += Math.floor((intentScore / 100) * 5);
  confidence = Math.min(99, confidence);

  // Priority Classification
  let priority: OpportunityPrioritization["priority"] = "Ignore";
  if (finalScore >= 95) priority = "Critical";
  else if (finalScore >= 85) priority = "High";
  else if (finalScore >= 70) priority = "Medium";
  else if (finalScore >= 50) priority = "Low";

  // AI Reasoning Panel Adjustments
  const reasoning: { text: string; impact: number }[] = [];

  if (marketGrowthScore > 80) {
    reasoning.push({
      text: "High-growth market",
      impact: Math.round(marketGrowthScore * 0.1),
    });
  } else {
    reasoning.push({
      text: "Steady growth market",
      impact: Math.round(marketGrowthScore * 0.1),
    });
  }

  if (companySizeScore > 80) {
    reasoning.push({
      text: "Large enterprise scale",
      impact: Math.round(companySizeScore * 0.1),
    });
  } else {
    reasoning.push({
      text: "Mid-market scale",
      impact: Math.round(companySizeScore * 0.1),
    });
  }

  if (industryFitScore > 80) {
    reasoning.push({
      text: "Strong industry alignment",
      impact: Math.round(industryFitScore * 0.15),
    });
  } else {
    reasoning.push({
      text: "Standard industry fit",
      impact: Math.round(industryFitScore * 0.15),
    });
  }

  if (decisionMakerQualityScore > 80) {
    reasoning.push({
      text: "Executive decision maker identified",
      impact: Math.round(decisionMakerQualityScore * 0.15),
    });
  } else {
    reasoning.push({
      text: "Stakeholder outreach pending",
      impact: Math.round(decisionMakerQualityScore * 0.15),
    });
  }

  if (intentScore > 80) {
    reasoning.push({
      text: "High active buying intent",
      impact: Math.round(intentScore * 0.15),
    });
  } else {
    reasoning.push({
      text: "Emerging intent signals",
      impact: Math.round(intentScore * 0.15),
    });
  }

  // Recommended action
  let recommendedAction = "Monitor only";
  if (priority === "Critical") recommendedAction = "Contact immediately";
  else if (priority === "High") recommendedAction = "Executive outreach";
  else if (priority === "Medium") recommendedAction = "LinkedIn first";
  else if (priority === "Low") recommendedAction = "Nurture campaign";

  return {
    countryScore,
    marketGrowthScore,
    industryFitScore,
    companySizeScore,
    revenuePotentialScore,
    decisionMakerQualityScore,
    engagementScore,
    intentScore,
    finalScore,
    confidence,
    priority,
    reasoning,
    recommendedAction,
  };
}
