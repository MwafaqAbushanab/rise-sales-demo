// Sales Acceleration Module
// Identifies WHY specific credit unions and banks need Rise Analytics products
// Based on their characteristics, pain points, and buying signals

import { calculateROI, getDefaultInputs, calculateRisePricing, formatCurrencyShort } from './roiCalculator';

// Rise Analytics Product Catalog with detailed targeting criteria
export const RISE_PRODUCTS = {
  platform: {
    id: 'platform',
    name: 'Rise Analytics Platform',
    shortName: 'Core Platform',
    description: 'Core BI and reporting platform for real-time insights',
    priceRange: '$2,500-$15,000/mo',
    idealFor: 'All institutions seeking to modernize reporting',
    icon: '📊',
  },
  dataWarehouse: {
    id: 'dataWarehouse',
    name: 'Rise Data Warehouse',
    shortName: 'Data Warehouse',
    description: 'Cloud data warehouse optimized for financial institutions',
    priceRange: '$5,000-$25,000/mo',
    idealFor: 'Institutions with multiple core systems or data silos',
    icon: '🗄️',
  },
  member360: {
    id: 'member360',
    name: 'Rise Member/Customer 360',
    shortName: 'Member 360',
    description: 'Complete view of members/customers across all touchpoints',
    priceRange: '$3,000-$20,000/mo',
    idealFor: 'Growth-focused institutions with 50K+ members',
    icon: '👥',
  },
  lending: {
    id: 'lending',
    name: 'Rise Lending Analytics',
    shortName: 'Lending Analytics',
    description: 'Loan portfolio analysis, risk management, and performance tracking',
    priceRange: '$4,000-$30,000/mo',
    idealFor: 'Institutions with $200M+ loan portfolio',
    icon: '💳',
  },
  marketing: {
    id: 'marketing',
    name: 'Rise Marketing Insights',
    shortName: 'Marketing Insights',
    description: 'Campaign performance tracking and member targeting',
    priceRange: '$2,000-$12,000/mo',
    idealFor: 'Institutions investing in digital marketing',
    icon: '📣',
  },
  compliance: {
    id: 'compliance',
    name: 'Rise Compliance Suite',
    shortName: 'Compliance Suite',
    description: 'Automated regulatory reporting and audit trails',
    priceRange: '$3,000-$18,000/mo',
    idealFor: 'All regulated financial institutions',
    icon: '✅',
  },
};

export type ProductId = keyof typeof RISE_PRODUCTS;

export interface Lead {
  id: string;
  name: string;
  type: 'Credit Union' | 'Community Bank';
  city: string;
  state: string;
  assets: number;
  members: number;
  deposits: number;
  roa: number;
  score: number;
  status: string;
}

export interface ProductRecommendation {
  productId: ProductId;
  productName: string;
  shortName: string;
  icon: string;
  fitScore: number; // 0-100 - how well this product fits their needs
  whyTheyNeedIt: string; // Primary reason they need this product
  specificBenefits: string[]; // Specific benefits for THIS institution
  painPointsSolved: string[]; // What problems this solves for them
  estimatedImpact: string; // Quantified impact
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface HotLead extends Lead {
  priorityRank: number;
  priorityScore: number;
  // Product-focused fields
  productRecommendations: ProductRecommendation[];
  topProduct: ProductRecommendation;
  whyTheyNeedRise: string[]; // Top 3 reasons this institution needs Rise
  buyingSignals: string[];
  // Business metrics
  estimatedDealValue: number;
  roi: {
    annualROI: number;
    paybackMonths: number;
    totalAnnualBenefit: number;
  };
  urgencyLevel: 'Critical' | 'High' | 'Medium' | 'Standard';
  // Sales tools
  outreachMessage: string;
  emailSubjectLine: string;
}

export interface SalesDashboardMetrics {
  totalPipelineValue: number;
  hotLeadsCount: number;
  averageDealSize: number;
  topProducts: { product: string; count: number; value: number }[];
  topStates: { state: string; count: number; value: number }[];
  weeklyTargets: {
    emailsToSend: number;
    demosToBook: number;
    proposalsToSend: number;
    targetRevenue: number;
  };
}

// Analyze product fit for an institution
function analyzeProductFit(lead: Lead): ProductRecommendation[] {
  const recommendations: ProductRecommendation[] = [];
  const typeLabel = lead.type === 'Credit Union' ? 'member' : 'customer';
  const typeLabels = lead.type === 'Credit Union' ? 'members' : 'customers';
  const estimatedLoanPortfolio = lead.assets * 0.65;

  // 1. RISE ANALYTICS PLATFORM - Foundation product
  const platformRec: ProductRecommendation = {
    productId: 'platform',
    productName: RISE_PRODUCTS.platform.name,
    shortName: RISE_PRODUCTS.platform.shortName,
    icon: RISE_PRODUCTS.platform.icon,
    fitScore: 0,
    whyTheyNeedIt: '',
    specificBenefits: [],
    painPointsSolved: [],
    estimatedImpact: '',
    urgency: 'Medium',
  };

  // Calculate platform fit
  if (lead.assets >= 1000000000) {
    platformRec.fitScore = 95;
    platformRec.whyTheyNeedIt = `At ${formatCurrencyShort(lead.assets)}, ${lead.name} is too large to manage with spreadsheets - they need real-time dashboards to track performance`;
    platformRec.specificBenefits = [
      'Replace 40+ hours/month of manual Excel reporting',
      'Real-time visibility into branch/product performance',
      'Automated executive dashboards for board meetings',
    ];
    platformRec.urgency = 'Critical';
  } else if (lead.assets >= 500000000) {
    platformRec.fitScore = 90;
    platformRec.whyTheyNeedIt = `${lead.name}'s growth to ${formatCurrencyShort(lead.assets)} demands sophisticated analytics - spreadsheets can't keep up`;
    platformRec.specificBenefits = [
      'Automated performance reporting saves 20+ hours/month',
      'Track KPIs across all products in one place',
      'Easy-to-use dashboards for non-technical staff',
    ];
    platformRec.urgency = 'High';
  } else {
    platformRec.fitScore = 75;
    platformRec.whyTheyNeedIt = `Help ${lead.name} make faster decisions with real-time data instead of monthly reports`;
    platformRec.specificBenefits = [
      'See all key metrics in one dashboard',
      'No more waiting for monthly reports',
      'Simple setup, fast time to value',
    ];
    platformRec.urgency = 'Medium';
  }

  platformRec.painPointsSolved = [
    'Manual Excel-based reporting taking hours each week',
    'Delayed insights from outdated data',
    'No single source of truth for performance metrics',
  ];
  platformRec.estimatedImpact = 'Reduce reporting time by 65%, enable data-driven decisions in hours not days';
  recommendations.push(platformRec);

  // 2. MEMBER/CUSTOMER 360 - For institutions with significant base
  if (lead.members >= 25000 || (lead.type === 'Community Bank' && lead.assets >= 500000000)) {
    const member360Rec: ProductRecommendation = {
      productId: 'member360',
      productName: RISE_PRODUCTS.member360.name,
      shortName: RISE_PRODUCTS.member360.shortName,
      icon: RISE_PRODUCTS.member360.icon,
      fitScore: 0,
      whyTheyNeedIt: '',
      specificBenefits: [],
      painPointsSolved: [],
      estimatedImpact: '',
      urgency: 'Medium',
    };

    if (lead.members >= 100000) {
      member360Rec.fitScore = 98;
      member360Rec.whyTheyNeedIt = `With ${lead.members.toLocaleString()} ${typeLabels}, ${lead.name} can't personalize experiences without a unified view - they're leaving money on the table`;
      member360Rec.specificBenefits = [
        `See complete relationship history for all ${lead.members.toLocaleString()} ${typeLabels}`,
        'Identify cross-sell opportunities automatically',
        'Predict and prevent attrition before it happens',
      ];
      member360Rec.urgency = 'Critical';
    } else if (lead.members >= 50000) {
      member360Rec.fitScore = 92;
      member360Rec.whyTheyNeedIt = `${lead.members.toLocaleString()} ${typeLabels} = significant untapped revenue if ${lead.name} can personalize engagement`;
      member360Rec.specificBenefits = [
        `Unified view of each ${typeLabel}'s relationship`,
        'AI-powered product recommendations',
        'Early warning system for at-risk relationships',
      ];
      member360Rec.urgency = 'High';
    } else {
      member360Rec.fitScore = 78;
      member360Rec.whyTheyNeedIt = `Help ${lead.name} deepen ${typeLabel} relationships with data-driven insights`;
      member360Rec.specificBenefits = [
        `Complete ${typeLabel} profile at a glance`,
        'Identify best cross-sell opportunities',
        'Track relationship health over time',
      ];
      member360Rec.urgency = 'Medium';
    }

    member360Rec.painPointsSolved = [
      `Fragmented ${typeLabel} data across multiple systems`,
      'Staff lack complete picture of relationships',
      `High ${typeLabel} attrition from poor personalization`,
    ];
    member360Rec.estimatedImpact = `Reduce ${typeLabel} attrition by 15%, increase cross-sell rate by 25%`;
    recommendations.push(member360Rec);
  }

  // 3. LENDING ANALYTICS - For institutions with loan portfolios
  if (estimatedLoanPortfolio >= 100000000) {
    const lendingRec: ProductRecommendation = {
      productId: 'lending',
      productName: RISE_PRODUCTS.lending.name,
      shortName: RISE_PRODUCTS.lending.shortName,
      icon: RISE_PRODUCTS.lending.icon,
      fitScore: 0,
      whyTheyNeedIt: '',
      specificBenefits: [],
      painPointsSolved: [],
      estimatedImpact: '',
      urgency: 'Medium',
    };

    if (estimatedLoanPortfolio >= 1000000000) {
      lendingRec.fitScore = 96;
      lendingRec.whyTheyNeedIt = `${lead.name}'s ${formatCurrencyShort(estimatedLoanPortfolio)} loan portfolio requires sophisticated risk monitoring - early warning can save millions`;
      lendingRec.specificBenefits = [
        'Real-time portfolio risk dashboard',
        'Automated early warning for at-risk loans',
        'Pricing optimization across all loan products',
      ];
      lendingRec.urgency = 'Critical';
    } else if (estimatedLoanPortfolio >= 500000000) {
      lendingRec.fitScore = 90;
      lendingRec.whyTheyNeedIt = `${formatCurrencyShort(estimatedLoanPortfolio)} in loans means ${lead.name} needs better visibility into portfolio health`;
      lendingRec.specificBenefits = [
        'Track loan performance by product/officer/channel',
        'Identify problem loans before they default',
        'Benchmark pricing against market',
      ];
      lendingRec.urgency = 'High';
    } else {
      lendingRec.fitScore = 80;
      lendingRec.whyTheyNeedIt = `Help ${lead.name} optimize their ${formatCurrencyShort(estimatedLoanPortfolio)} loan portfolio`;
      lendingRec.specificBenefits = [
        'Easy loan performance tracking',
        'Concentration risk monitoring',
        'Loan officer scorecards',
      ];
      lendingRec.urgency = 'Medium';
    }

    // Adjust for ROA
    if (lead.roa < 0.8 && lead.roa > 0) {
      lendingRec.fitScore = Math.min(100, lendingRec.fitScore + 5);
      lendingRec.specificBenefits.push('ROA improvement through better loan pricing and reduced losses');
    }

    lendingRec.painPointsSolved = [
      'Manual loan tracking in spreadsheets',
      'Limited visibility into portfolio risk',
      'Reactive vs proactive credit management',
    ];
    lendingRec.estimatedImpact = 'Reduce loan losses by 10%, improve net interest margin by 15 bps';
    recommendations.push(lendingRec);
  }

  // 4. MARKETING INSIGHTS - For growth-oriented institutions
  if (lead.members >= 30000 || lead.assets >= 300000000) {
    const marketingRec: ProductRecommendation = {
      productId: 'marketing',
      productName: RISE_PRODUCTS.marketing.name,
      shortName: RISE_PRODUCTS.marketing.shortName,
      icon: RISE_PRODUCTS.marketing.icon,
      fitScore: 0,
      whyTheyNeedIt: '',
      specificBenefits: [],
      painPointsSolved: [],
      estimatedImpact: '',
      urgency: 'Medium',
    };

    if (lead.members >= 75000 || lead.assets >= 1000000000) {
      marketingRec.fitScore = 88;
      marketingRec.whyTheyNeedIt = `${lead.name} likely spends $500K+ on marketing - without analytics, half that budget is wasted`;
      marketingRec.specificBenefits = [
        'Track ROI of every marketing campaign',
        'AI-powered audience segmentation',
        'Personalized campaign recommendations',
      ];
      marketingRec.urgency = 'High';
    } else {
      marketingRec.fitScore = 72;
      marketingRec.whyTheyNeedIt = `Help ${lead.name} get more from their marketing budget with data-driven targeting`;
      marketingRec.specificBenefits = [
        'See which campaigns actually drive results',
        'Target the right products to the right members',
        'Measure and improve over time',
      ];
      marketingRec.urgency = 'Medium';
    }

    marketingRec.painPointsSolved = [
      'No visibility into campaign ROI',
      'Spray-and-pray marketing approach',
      'Low cross-sell conversion rates',
    ];
    marketingRec.estimatedImpact = 'Improve campaign conversion by 40%, double cross-sell success rate';
    recommendations.push(marketingRec);
  }

  // 5. COMPLIANCE SUITE - All regulated institutions need this
  const complianceRec: ProductRecommendation = {
    productId: 'compliance',
    productName: RISE_PRODUCTS.compliance.name,
    shortName: RISE_PRODUCTS.compliance.shortName,
    icon: RISE_PRODUCTS.compliance.icon,
    fitScore: 0,
    whyTheyNeedIt: '',
    specificBenefits: [],
    painPointsSolved: [],
    estimatedImpact: '',
    urgency: 'Medium',
  };

  const regulator = lead.type === 'Credit Union' ? 'NCUA' : 'FDIC';

  if (lead.assets >= 1000000000) {
    complianceRec.fitScore = 90;
    complianceRec.whyTheyNeedIt = `Larger institutions face increased ${regulator} scrutiny - ${lead.name} needs audit-ready data at all times`;
    complianceRec.specificBenefits = [
      `Automated ${regulator} Call Report preparation`,
      'Real-time compliance dashboards',
      'Complete audit trail for examiners',
    ];
    complianceRec.urgency = 'High';
  } else {
    complianceRec.fitScore = 75;
    complianceRec.whyTheyNeedIt = `Stop spending 40+ hours per quarter on ${regulator} reporting - automate it`;
    complianceRec.specificBenefits = [
      'Pre-built regulatory report templates',
      'Automated data validation',
      'Examiner-ready documentation',
    ];
    complianceRec.urgency = 'Medium';
  }

  complianceRec.painPointsSolved = [
    'Manual regulatory report compilation taking days',
    'Audit preparation stress and overtime',
    'Risk of compliance errors and fines',
  ];
  complianceRec.estimatedImpact = 'Reduce compliance reporting time by 70%, eliminate manual errors';
  recommendations.push(complianceRec);

  // 6. DATA WAREHOUSE - For complex institutions
  if (lead.assets >= 1000000000 || lead.members >= 100000) {
    const dwRec: ProductRecommendation = {
      productId: 'dataWarehouse',
      productName: RISE_PRODUCTS.dataWarehouse.name,
      shortName: RISE_PRODUCTS.dataWarehouse.shortName,
      icon: RISE_PRODUCTS.dataWarehouse.icon,
      fitScore: 0,
      whyTheyNeedIt: '',
      specificBenefits: [],
      painPointsSolved: [],
      estimatedImpact: '',
      urgency: 'Medium',
    };

    if (lead.assets >= 5000000000) {
      dwRec.fitScore = 95;
      dwRec.whyTheyNeedIt = `${lead.name}'s size means data in 10+ systems - they need a single source of truth`;
      dwRec.specificBenefits = [
        'Unify data from core, digital banking, cards, and more',
        'Enable self-service analytics for business users',
        'Eliminate IT bottleneck for reports',
      ];
      dwRec.urgency = 'Critical';
    } else {
      dwRec.fitScore = 82;
      dwRec.whyTheyNeedIt = `Break down data silos and give ${lead.name}'s team access to unified data`;
      dwRec.specificBenefits = [
        'Connect all data sources in one place',
        'Business users can create their own reports',
        'Faster time to insight',
      ];
      dwRec.urgency = 'High';
    }

    dwRec.painPointsSolved = [
      'Data scattered across disconnected systems',
      'IT team overwhelmed with ad-hoc report requests',
      'No single source of truth',
    ];
    dwRec.estimatedImpact = 'Create single source of truth, reduce report development time by 80%';
    recommendations.push(dwRec);
  }

  // Sort by fit score
  return recommendations.sort((a, b) => b.fitScore - a.fitScore);
}

// Generate buying signals
function identifyBuyingSignals(lead: Lead, productRecs: ProductRecommendation[]): string[] {
  const signals: string[] = [];

  // Size signal
  if (lead.assets >= 1000000000 && lead.assets <= 10000000000) {
    signals.push('IDEAL SIZE: $1B-$10B sweet spot - complex enough for advanced analytics, agile enough to implement');
  }

  // Financial health signals
  if (lead.roa < 0.8 && lead.roa > 0) {
    signals.push('EFFICIENCY NEED: Below-average ROA means they need better operational visibility');
  } else if (lead.roa >= 1.2) {
    signals.push('GROWTH READY: Strong ROA = budget for strategic investments');
  }

  // Product-specific signals
  const criticalProducts = productRecs.filter(p => p.urgency === 'Critical');
  if (criticalProducts.length > 0) {
    signals.push(`CRITICAL NEED: ${criticalProducts.map(p => p.shortName).join(', ')} - high urgency`);
  }

  // Type signal
  if (lead.type === 'Credit Union') {
    signals.push('CU EXPERTISE: Rise has 150+ credit union clients, deep CU workflow knowledge');
  }

  // Scale signal
  if (lead.members >= 100000) {
    signals.push(`SCALE REQUIRED: ${lead.members.toLocaleString()} members demands enterprise analytics`);
  }

  return signals.slice(0, 4);
}

// Generate top reasons why they need Rise
function generateWhyTheyNeedRise(lead: Lead, productRecs: ProductRecommendation[]): string[] {
  const reasons: string[] = [];
  const topProduct = productRecs[0];

  // Lead with their top product need
  reasons.push(`${topProduct.icon} **${topProduct.shortName}**: ${topProduct.whyTheyNeedIt}`);

  // Add second product if different urgency
  if (productRecs.length > 1 && productRecs[1].urgency !== 'Low') {
    reasons.push(`${productRecs[1].icon} **${productRecs[1].shortName}**: ${productRecs[1].whyTheyNeedIt}`);
  }

  // Add financial context
  if (lead.roa < 0.8 && lead.roa > 0) {
    reasons.push(`📉 **Performance Gap**: ${(lead.roa * 100).toFixed(2)}% ROA is below industry average - analytics reveals what's holding them back`);
  } else if (lead.roa >= 1.2) {
    reasons.push(`📈 **Growth Potential**: Strong ${(lead.roa * 100).toFixed(2)}% ROA shows effective management - analytics helps them stay ahead`);
  }

  return reasons.slice(0, 3);
}

// Generate outreach message
function generateOutreachMessage(lead: Lead, topProduct: ProductRecommendation, roi: { annualROI: number; totalAnnualBenefit: number }): string {
  const typeLabel = lead.type === 'Credit Union' ? 'credit unions' : 'community banks';
  return `${lead.name}'s growth to ${formatCurrencyShort(lead.assets)} caught my attention. We've helped similar ${typeLabel} achieve ${roi.annualROI}% ROI by ${topProduct.specificBenefits[0].toLowerCase()}. Interested in a 20-minute demo?`;
}

// Calculate priority score - aligned with lead.score from App.tsx for consistency
function calculatePriorityScore(lead: Lead, productRecs: ProductRecommendation[]): number {
  // Start with the lead's existing opportunity score as the base
  // This ensures consistency with the score shown in the main lead table
  let baseScore = lead.score;

  // Add product-market fit bonus (0-15 points)
  // This rewards leads where our products specifically match their needs
  const avgFitScore = productRecs.slice(0, 3).reduce((sum, p) => sum + p.fitScore, 0) / 3;
  const fitBonus = Math.floor((avgFitScore - 70) * 0.5); // Bonus for fit scores above 70

  // Add urgency bonus (0-10 points)
  // Leads with critical product needs get priority
  const hasCriticalProduct = productRecs.some(p => p.urgency === 'Critical');
  const hasHighProduct = productRecs.some(p => p.urgency === 'High');
  const urgencyBonus = hasCriticalProduct ? 10 : (hasHighProduct ? 5 : 0);

  // Final score is base + fit bonus + urgency bonus
  const finalScore = baseScore + Math.max(0, fitBonus) + urgencyBonus;

  return Math.min(Math.max(finalScore, 0), 100);
}

// Determine urgency level based on priority score and product urgency
function determineUrgencyLevel(productRecs: ProductRecommendation[], priorityScore: number): 'Critical' | 'High' | 'Medium' | 'Standard' {
  const hasCriticalProduct = productRecs.some(p => p.urgency === 'Critical');
  const hasHighProduct = productRecs.some(p => p.urgency === 'High');

  // Priority score now includes base score (50-100) + fit bonus (0-15) + urgency bonus (0-10)
  // So max is ~125, but capped at 100. High scores indicate both good base + good fit
  if (hasCriticalProduct && priorityScore >= 85) return 'Critical';
  if ((hasCriticalProduct || hasHighProduct) && priorityScore >= 75) return 'High';
  if (priorityScore >= 65) return 'Medium';
  return 'Standard';
}

// Main function: Identify hot leads
export function identifyHotLeads(leads: Lead[], limit: number = 20): HotLead[] {
  const hotLeads = leads
    .filter(lead => lead.status !== 'won' && lead.status !== 'lost' && lead.assets >= 50000000)
    .map(lead => {
      const roiInputs = getDefaultInputs({ assets: lead.assets, members: lead.members, type: lead.type });
      const roiProjection = calculateROI(roiInputs);
      const pricing = calculateRisePricing(lead.assets, lead.members);

      const productRecommendations = analyzeProductFit(lead);
      const topProduct = productRecommendations[0];
      const priorityScore = calculatePriorityScore(lead, productRecommendations);

      const roi = {
        annualROI: roiProjection.annualROI,
        paybackMonths: roiProjection.paybackMonths,
        totalAnnualBenefit: roiProjection.totalAnnualBenefit,
      };

      return {
        ...lead,
        priorityRank: 0,
        priorityScore,
        productRecommendations,
        topProduct,
        whyTheyNeedRise: generateWhyTheyNeedRise(lead, productRecommendations),
        buyingSignals: identifyBuyingSignals(lead, productRecommendations),
        estimatedDealValue: pricing.annualPrice,
        roi,
        urgencyLevel: determineUrgencyLevel(productRecommendations, priorityScore),
        outreachMessage: generateOutreachMessage(lead, topProduct, roi),
        emailSubjectLine: `${lead.name}: ${topProduct.shortName} opportunity (${formatCurrencyShort(roi.totalAnnualBenefit)} value)`,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, limit);

  hotLeads.forEach((lead, index) => {
    lead.priorityRank = index + 1;
  });

  return hotLeads;
}

// Get top credit unions
export function getTopCreditUnions(hotLeads: HotLead[], limit: number = 10): HotLead[] {
  return hotLeads.filter(lead => lead.type === 'Credit Union').slice(0, limit);
}

// Get top community banks
export function getTopCommunityBanks(hotLeads: HotLead[], limit: number = 10): HotLead[] {
  return hotLeads.filter(lead => lead.type === 'Community Bank').slice(0, limit);
}

// Calculate dashboard metrics
export function calculateDashboardMetrics(_leads: Lead[], hotLeads: HotLead[]): SalesDashboardMetrics {
  const totalPipelineValue = hotLeads.reduce((sum, lead) => sum + lead.estimatedDealValue, 0);
  const averageDealSize = hotLeads.length > 0 ? totalPipelineValue / hotLeads.length : 0;

  const productMap = new Map<string, { count: number; value: number }>();
  hotLeads.forEach(lead => {
    const product = lead.topProduct.shortName;
    const existing = productMap.get(product) || { count: 0, value: 0 };
    productMap.set(product, { count: existing.count + 1, value: existing.value + lead.estimatedDealValue });
  });

  const topProducts = Array.from(productMap.entries())
    .map(([product, data]) => ({ product, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const stateMap = new Map<string, { count: number; value: number }>();
  hotLeads.forEach(lead => {
    const existing = stateMap.get(lead.state) || { count: 0, value: 0 };
    stateMap.set(lead.state, { count: existing.count + 1, value: existing.value + lead.estimatedDealValue });
  });

  const topStates = Array.from(stateMap.entries())
    .map(([state, data]) => ({ state, ...data }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const criticalLeads = hotLeads.filter(l => l.urgencyLevel === 'Critical' || l.urgencyLevel === 'High').length;

  return {
    totalPipelineValue,
    hotLeadsCount: hotLeads.length,
    averageDealSize,
    topProducts,
    topStates,
    weeklyTargets: {
      emailsToSend: Math.min(criticalLeads, 25),
      demosToBook: Math.ceil(hotLeads.length * 0.15),
      proposalsToSend: Math.ceil(hotLeads.length * 0.08),
      targetRevenue: totalPipelineValue * 0.03,
    },
  };
}

// Generate cold email template
export function generateColdEmailTemplate(lead: HotLead): string {
  const topProduct = lead.topProduct;

  return `Subject: ${lead.emailSubjectLine}

Hi [First Name],

I noticed ${lead.name} has grown to ${formatCurrencyShort(lead.assets)} in assets - congratulations on the success in ${lead.city}.

I'm reaching out because we've helped 150+ ${lead.type === 'Credit Union' ? 'credit unions' : 'community banks'} solve the exact challenges you're likely facing:

**Why ${topProduct.shortName} for ${lead.name}:**
${topProduct.whyTheyNeedIt}

**What you'll get:**
${topProduct.specificBenefits.map(b => `• ${b}`).join('\n')}

**The numbers:**
• ${lead.roi.annualROI}% projected ROI
• ${lead.roi.paybackMonths}-month payback
• ${formatCurrencyShort(lead.roi.totalAnnualBenefit)} in annual value

Would you have 20 minutes this week for a quick demo? I've prepared a custom ROI analysis specifically for ${lead.name}.

Best regards,
[Your Name]
Rise Analytics`;
}

// Generate outreach plan
export function generateOutreachPlan(lead: HotLead): { day1: string; day3: string; day7: string; day14: string } {
  const topProduct = lead.topProduct;
  return {
    day1: `Send email: "${lead.emailSubjectLine}" - Lead with ${topProduct.shortName} value prop`,
    day3: `LinkedIn connect to CEO/CFO: "Noticed ${lead.name}'s growth - we help ${lead.type === 'Credit Union' ? 'CUs' : 'banks'} with ${topProduct.shortName}"`,
    day7: `Follow-up email with ${lead.state} ${lead.type === 'Credit Union' ? 'credit union' : 'bank'} case study`,
    day14: `Call + voicemail: "Following up on ${formatCurrencyShort(lead.roi.totalAnnualBenefit)} ${topProduct.shortName} opportunity"`,
  };
}
