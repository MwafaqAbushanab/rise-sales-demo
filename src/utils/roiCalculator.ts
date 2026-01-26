// ROI Calculator Module
// Calculate and present ROI projections for Rise Analytics products

export interface ROIInputs {
  // Institution metrics
  assets: number;
  members: number; // 0 for banks
  type: 'Credit Union' | 'Community Bank';

  // Current state estimates
  currentAnalyticsSpend: number; // Monthly spend on analytics tools
  manualReportingHours: number; // Hours per month spent on manual reporting
  avgHourlyRate: number; // Loaded cost per hour for staff
  memberAttritionRate: number; // Annual attrition rate (e.g., 0.12 for 12%)
  avgMemberValue: number; // Annual value per member/customer
  crossSellRate: number; // Current cross-sell rate (e.g., 0.15 for 15%)
  loanDefaultRate: number; // Current loan default rate (e.g., 0.02 for 2%)
  totalLoanPortfolio: number; // Total loan portfolio value
}

export interface ROIProjection {
  // Monthly costs
  currentMonthlyCost: number;
  riseMonthlyCost: number;
  monthlyNetSavings: number;

  // Annual benefits
  reportingTimeSavings: number;
  attritionReduction: number;
  crossSellImprovement: number;
  loanLossReduction: number;
  totalAnnualBenefit: number;

  // ROI metrics
  annualROI: number; // Percentage
  paybackMonths: number;
  threeYearValue: number;
  fiveYearValue: number;

  // Breakdown for presentation
  breakdown: {
    category: string;
    currentState: string;
    withRise: string;
    annualImpact: number;
    confidence: 'High' | 'Medium' | 'Low';
  }[];

  // Risk-adjusted projections
  conservative: number;
  moderate: number;
  aggressive: number;
}

// Rise Analytics pricing tiers (monthly)
export const RISE_PRICING = {
  essential: {
    name: 'Essential Analytics',
    basePrice: 2500,
    perMemberPrice: 0.02,
    minPrice: 2500,
    maxPrice: 15000,
    features: ['Core Dashboards', 'Basic Reports', 'Email Support'],
  },
  professional: {
    name: 'Professional',
    basePrice: 5000,
    perMemberPrice: 0.03,
    minPrice: 5000,
    maxPrice: 35000,
    features: ['Advanced Analytics', 'Custom Dashboards', 'API Access', 'Priority Support'],
  },
  enterprise: {
    name: 'Enterprise',
    basePrice: 10000,
    perMemberPrice: 0.04,
    minPrice: 10000,
    maxPrice: 75000,
    features: ['Full Platform', 'Dedicated Success Manager', 'Custom Integrations', 'SLA'],
  },
};

// Industry benchmarks
const BENCHMARKS = {
  reportingTimeReduction: 0.65, // 65% reduction in manual reporting time
  attritionReductionRate: 0.15, // 15% reduction in member attrition
  crossSellImprovement: 0.25, // 25% improvement in cross-sell rate
  loanDefaultReduction: 0.10, // 10% reduction in loan defaults
  avgHourlyRate: 45, // Default loaded hourly rate
  avgMemberValue: 350, // Average annual value per member
};

export function estimateCurrentAnalyticsSpend(assets: number, type: 'Credit Union' | 'Community Bank'): number {
  // Estimate based on asset size and industry averages
  const baseSpend = type === 'Credit Union' ? 2000 : 3000;

  if (assets >= 10000000000) return baseSpend * 15; // $10B+
  if (assets >= 5000000000) return baseSpend * 10; // $5B+
  if (assets >= 1000000000) return baseSpend * 6; // $1B+
  if (assets >= 500000000) return baseSpend * 4; // $500M+
  if (assets >= 100000000) return baseSpend * 2; // $100M+
  return baseSpend;
}

export function estimateManualReportingHours(assets: number, _members?: number): number {
  // Estimate hours spent on manual reporting per month
  // _members parameter reserved for future use with member-based calculations
  const baseHours = 40; // Base hours for smallest institutions

  if (assets >= 10000000000) return baseHours * 6;
  if (assets >= 5000000000) return baseHours * 4;
  if (assets >= 1000000000) return baseHours * 3;
  if (assets >= 500000000) return baseHours * 2;
  if (assets >= 100000000) return baseHours * 1.5;
  return baseHours;
}

// Estimate customer/member count from assets
// Banks typically have ~$30,000-$50,000 in assets per customer
// Credit unions typically have ~$15,000-$25,000 in assets per member
export function estimateCustomerCount(assets: number, members: number, type: 'Credit Union' | 'Community Bank'): number {
  if (members > 0) return members;

  // Use realistic assets-per-customer ratios
  const assetsPerCustomer = type === 'Credit Union' ? 20000 : 40000;
  return Math.floor(assets / assetsPerCustomer);
}

export function calculateRisePricing(assets: number, members: number): {
  recommended: keyof typeof RISE_PRICING;
  monthlyPrice: number;
  annualPrice: number;
  tier: typeof RISE_PRICING[keyof typeof RISE_PRICING];
} {
  // Determine recommended tier based on asset size
  let tier: keyof typeof RISE_PRICING;
  if (assets >= 5000000000) {
    tier = 'enterprise';
  } else if (assets >= 1000000000) {
    tier = 'professional';
  } else {
    tier = 'essential';
  }

  const pricing = RISE_PRICING[tier];
  // For pricing, use member count if available, otherwise estimate conservatively
  const memberCount = members > 0 ? members : Math.floor(assets / 40000);

  let monthlyPrice = pricing.basePrice + (memberCount * pricing.perMemberPrice);
  monthlyPrice = Math.max(pricing.minPrice, Math.min(pricing.maxPrice, monthlyPrice));

  return {
    recommended: tier,
    monthlyPrice: Math.round(monthlyPrice),
    annualPrice: Math.round(monthlyPrice * 12),
    tier: pricing,
  };
}

export function calculateROI(inputs: ROIInputs): ROIProjection {
  const {
    assets,
    members,
    type,
    currentAnalyticsSpend,
    manualReportingHours,
    avgHourlyRate,
    memberAttritionRate,
    avgMemberValue,
    crossSellRate,
    loanDefaultRate,
    totalLoanPortfolio,
  } = inputs;

  // Calculate Rise pricing
  const risePricing = calculateRisePricing(assets, members);
  const riseMonthlyCost = risePricing.monthlyPrice;
  const riseAnnualCost = risePricing.annualPrice;

  // Current monthly cost (existing analytics + manual labor)
  const monthlyLaborCost = manualReportingHours * avgHourlyRate;
  const currentMonthlyCost = currentAnalyticsSpend + monthlyLaborCost;

  // Calculate benefits

  // 1. Reporting time savings
  const reducedHours = manualReportingHours * BENCHMARKS.reportingTimeReduction;
  const reportingTimeSavings = reducedHours * avgHourlyRate * 12;

  // 2. Attrition reduction - use realistic customer estimates
  // Cap effective members for ROI calculation to avoid unrealistic projections for mega-banks
  // Rise Analytics is designed for credit unions and community banks, not trillion-dollar institutions
  const rawEffectiveMembers = estimateCustomerCount(assets, members, type);
  const effectiveMembers = Math.min(rawEffectiveMembers, 100000); // Cap at 100K members for ROI calc

  const currentAttritionLoss = effectiveMembers * memberAttritionRate * avgMemberValue;
  const rawAttritionReduction = currentAttritionLoss * BENCHMARKS.attritionReductionRate;
  // Cap attrition benefit at 3x Rise cost (realistic for analytics platform)
  const attritionReduction = Math.min(rawAttritionReduction, riseAnnualCost * 3);

  // 3. Cross-sell improvement
  const currentCrossSellRevenue = effectiveMembers * crossSellRate * (avgMemberValue * 0.3); // 30% of member value from cross-sell
  const rawCrossSellImprovement = currentCrossSellRevenue * BENCHMARKS.crossSellImprovement;
  // Cap cross-sell benefit at 2x Rise cost
  const crossSellImprovement = Math.min(rawCrossSellImprovement, riseAnnualCost * 2);

  // 4. Loan loss reduction - cap at a reasonable percentage of Rise investment for realism
  const currentLoanLosses = totalLoanPortfolio * loanDefaultRate;
  // Cap loan loss savings at 2x Rise cost (conservative - this is the hardest to prove)
  const rawLoanLossReduction = currentLoanLosses * BENCHMARKS.loanDefaultReduction;
  const loanLossReduction = Math.min(rawLoanLossReduction, riseAnnualCost * 2);

  // Total annual benefit
  const totalAnnualBenefit = reportingTimeSavings + attritionReduction + crossSellImprovement + loanLossReduction;

  // Net benefit after Rise cost
  const netAnnualBenefit = totalAnnualBenefit - riseAnnualCost;
  const monthlyNetSavings = (totalAnnualBenefit / 12) - riseMonthlyCost + currentAnalyticsSpend;

  // ROI calculations
  const annualROI = riseAnnualCost > 0 ? ((netAnnualBenefit / riseAnnualCost) * 100) : 0;
  const paybackMonths = netAnnualBenefit > 0 ? Math.ceil((riseAnnualCost / totalAnnualBenefit) * 12) : 99;

  // Multi-year projections (assuming 5% annual growth in benefits)
  const threeYearValue = netAnnualBenefit + (netAnnualBenefit * 1.05) + (netAnnualBenefit * 1.1);
  const fiveYearValue = threeYearValue + (netAnnualBenefit * 1.15) + (netAnnualBenefit * 1.2);

  // Breakdown for presentation
  const breakdown = [
    {
      category: 'Reporting Efficiency',
      currentState: `${manualReportingHours} hrs/month manual reporting`,
      withRise: `${Math.round(manualReportingHours * (1 - BENCHMARKS.reportingTimeReduction))} hrs/month (65% reduction)`,
      annualImpact: reportingTimeSavings,
      confidence: 'High' as const,
    },
    {
      category: `${type === 'Credit Union' ? 'Member' : 'Customer'} Retention`,
      currentState: `${(memberAttritionRate * 100).toFixed(1)}% annual attrition`,
      withRise: `${((memberAttritionRate * (1 - BENCHMARKS.attritionReductionRate)) * 100).toFixed(1)}% with predictive insights`,
      annualImpact: attritionReduction,
      confidence: 'Medium' as const,
    },
    {
      category: 'Cross-Sell Revenue',
      currentState: `${(crossSellRate * 100).toFixed(1)}% cross-sell rate`,
      withRise: `${((crossSellRate * (1 + BENCHMARKS.crossSellImprovement)) * 100).toFixed(1)}% with targeted campaigns`,
      annualImpact: crossSellImprovement,
      confidence: 'Medium' as const,
    },
    {
      category: 'Loan Loss Prevention',
      currentState: `${(loanDefaultRate * 100).toFixed(2)}% default rate`,
      withRise: `${((loanDefaultRate * (1 - BENCHMARKS.loanDefaultReduction)) * 100).toFixed(2)}% with early warning`,
      annualImpact: loanLossReduction,
      confidence: 'Low' as const,
    },
  ];

  // Risk-adjusted projections
  const conservative = netAnnualBenefit * 0.6; // 60% of projected
  const moderate = netAnnualBenefit * 0.8; // 80% of projected
  const aggressive = netAnnualBenefit; // Full projection

  return {
    currentMonthlyCost,
    riseMonthlyCost,
    monthlyNetSavings,
    reportingTimeSavings,
    attritionReduction,
    crossSellImprovement,
    loanLossReduction,
    totalAnnualBenefit,
    annualROI: Math.round(annualROI),
    paybackMonths,
    threeYearValue: Math.round(threeYearValue),
    fiveYearValue: Math.round(fiveYearValue),
    breakdown,
    conservative: Math.round(conservative),
    moderate: Math.round(moderate),
    aggressive: Math.round(aggressive),
  };
}

export function getDefaultInputs(lead: {
  assets: number;
  members: number;
  type: 'Credit Union' | 'Community Bank';
}): ROIInputs {
  const { assets, members, type } = lead;

  // Estimate loan portfolio (typically 60-70% of assets for FIs)
  const estimatedLoanPortfolio = assets * 0.65;

  return {
    assets,
    members,
    type,
    currentAnalyticsSpend: estimateCurrentAnalyticsSpend(assets, type),
    manualReportingHours: estimateManualReportingHours(assets, members),
    avgHourlyRate: BENCHMARKS.avgHourlyRate,
    memberAttritionRate: 0.10, // 10% default
    avgMemberValue: BENCHMARKS.avgMemberValue,
    crossSellRate: 0.15, // 15% default
    loanDefaultRate: 0.015, // 1.5% default
    totalLoanPortfolio: estimatedLoanPortfolio,
  };
}

export function formatCurrencyShort(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function generateROISummary(projection: ROIProjection, leadName: string): string {
  return `**ROI Summary for ${leadName}:**

💰 **Investment:** ${formatCurrencyShort(projection.riseMonthlyCost * 12)}/year

📈 **Projected Annual Benefits:**
• Reporting Efficiency: ${formatCurrencyShort(projection.reportingTimeSavings)}
• Retention Improvement: ${formatCurrencyShort(projection.attritionReduction)}
• Cross-Sell Growth: ${formatCurrencyShort(projection.crossSellImprovement)}
• Loan Loss Prevention: ${formatCurrencyShort(projection.loanLossReduction)}

**Total Annual Value:** ${formatCurrencyShort(projection.totalAnnualBenefit)}

🎯 **ROI Metrics:**
• Annual ROI: **${projection.annualROI}%**
• Payback Period: **${projection.paybackMonths} months**
• 3-Year Value: ${formatCurrencyShort(projection.threeYearValue)}
• 5-Year Value: ${formatCurrencyShort(projection.fiveYearValue)}

📊 **Risk-Adjusted Projections:**
• Conservative (60%): ${formatCurrencyShort(projection.conservative)}/year
• Moderate (80%): ${formatCurrencyShort(projection.moderate)}/year
• Aggressive (100%): ${formatCurrencyShort(projection.aggressive)}/year`;
}
