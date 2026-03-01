// Pre-Call Intelligence Brief Generator
// Orchestrates all existing intelligence utils into a single briefing document

import type { Lead } from '../types';
import { formatCurrency } from '../types';
import { analyzeProspect, type ProspectIntelligence } from './prospectingIntelligence';
import { analyzeCompetitiveLandscape, type CompetitiveIntel } from './competitiveIntelligence';
import { calculateROI, getDefaultInputs, calculateRisePricing, type ROIProjection } from './roiCalculator';
import { analyzeProductFit, type ProductRecommendation } from './salesAcceleration';
import { OBJECTION_LIBRARY, type ObjectionResponse } from './dealCoaching';

export interface PreCallBrief {
  institution: {
    name: string;
    type: 'Credit Union' | 'Community Bank';
    city: string;
    state: string;
    assets: number;
    members: number;
    deposits: number;
    roa: number;
    branches: number;
    source: string;
  };
  opportunity: {
    score: number;
    tier: string;
    dealSize: string;
  };
  talkingPoints: string[];
  competitive: {
    vendors: { name: string; products: string[]; satisfaction: string }[];
    winProbability: number;
    displacementStrategy: string;
    battleCardHighlights: string[];
  };
  products: {
    name: string;
    fitScore: number;
    whyTheyNeedIt: string;
    urgency: string;
  }[];
  roi: {
    annualROI: number;
    paybackMonths: number;
    threeYearValue: number;
    riseInvestment: number;
    annualBenefit: number;
  };
  objections: {
    objection: string;
    response: string;
    proofPoints: string[];
  }[];
  callStrategy: {
    opening: string;
    approach: string;
    closingAsk: string;
  };
  generatedAt: string;
}

function pickTopObjections(lead: Lead, competitiveIntel: CompetitiveIntel): ObjectionResponse[] {
  const picked: ObjectionResponse[] = [];
  const byCategory = (cat: string) => OBJECTION_LIBRARY.find(o => o.category === cat);

  // Always include price objection
  const price = byCategory('price');
  if (price) picked.push(price);

  // If strong competitor, include competition objection
  if (competitiveIntel.displacementDifficulty >= 6) {
    const comp = byCategory('competition');
    if (comp) picked.push(comp);
  } else {
    // Otherwise include need objection
    const need = byCategory('need');
    if (need) picked.push(need);
  }

  // Include authority for large institutions
  if (lead.assets >= 1000000000) {
    const auth = byCategory('authority');
    if (auth) picked.push(auth);
  } else {
    const timing = byCategory('timing');
    if (timing) picked.push(timing);
  }

  return picked.slice(0, 3);
}

function generateOpening(lead: Lead, intelligence: ProspectIntelligence): string {
  const tier = intelligence.opportunityTier;
  if (tier === 'Hot') {
    return `"Hi [Name], I've been researching ${lead.name} and I'm impressed by your growth to ${formatCurrency(lead.assets)} in assets. I work with ${lead.type === 'Credit Union' ? 'credit unions' : 'community banks'} your size on analytics, and I think there's a significant opportunity here. Do you have a few minutes?"`;
  }
  if (tier === 'Warm') {
    return `"Hi [Name], I noticed ${lead.name} in ${lead.city} — we work with several ${lead.type === 'Credit Union' ? 'credit unions' : 'banks'} in ${lead.state} and I thought you'd find some of our benchmarking data interesting. Quick question — how are you handling analytics and reporting today?"`;
  }
  return `"Hi [Name], I'm reaching out to ${lead.type === 'Credit Union' ? 'credit union' : 'community bank'} leaders in ${lead.state} who are thinking about modernizing their data and analytics. Would you be open to a brief conversation about what we're seeing in the market?"`;
}

function generateClosingAsk(intelligence: ProspectIntelligence, topProduct: ProductRecommendation): string {
  const tier = intelligence.opportunityTier;
  if (tier === 'Hot') {
    return `"Based on what we've discussed, I'd love to show you a customized demo of ${topProduct.shortName} with your actual metrics. Can we schedule 30 minutes this week?"`;
  }
  if (tier === 'Warm') {
    return `"Would it be valuable to see a quick 15-minute demo of how ${topProduct.shortName} works for institutions your size? No commitment, just a look."`;
  }
  return `"Can I send you a brief case study of how a similar ${topProduct.shortName} customer achieved results? Happy to follow up after you've had a chance to review."`;
}

export function generatePreCallBrief(lead: Lead, allLeads: Lead[]): PreCallBrief {
  const leadForAnalysis = {
    id: lead.id, name: lead.name, type: lead.type,
    city: lead.city, state: lead.state, assets: lead.assets,
    members: lead.members, deposits: lead.deposits,
    roa: lead.roa, branches: lead.branches,
  };
  const allForAnalysis = allLeads.map(l => ({
    id: l.id, name: l.name, type: l.type, city: l.city, state: l.state,
    assets: l.assets, members: l.members, deposits: l.deposits,
    roa: l.roa, branches: l.branches,
  }));

  const intelligence = analyzeProspect(leadForAnalysis, allForAnalysis);
  const competitiveIntel = analyzeCompetitiveLandscape({
    type: lead.type, assets: lead.assets, state: lead.state, name: lead.name,
  });

  const roiInputs = getDefaultInputs({ assets: lead.assets, members: lead.members, type: lead.type });
  const roiProjection: ROIProjection = calculateROI(roiInputs);
  const pricing = calculateRisePricing(lead.assets, lead.members);

  const productRecs = analyzeProductFit({
    id: lead.id, name: lead.name, type: lead.type, city: lead.city, state: lead.state,
    assets: lead.assets, members: lead.members, deposits: lead.deposits,
    roa: lead.roa, score: lead.score, status: lead.status,
  });

  const topObjections = pickTopObjections(lead, competitiveIntel);
  const topProduct = productRecs[0];

  // Competitive battle card highlights
  const battleCardHighlights: string[] = [];
  for (const vp of competitiveIntel.currentVendors.slice(0, 2)) {
    const bc = vp.competitor.battleCard;
    battleCardHighlights.push(...bc.keyDifferentiators.slice(0, 2));
  }

  return {
    institution: {
      name: lead.name,
      type: lead.type,
      city: lead.city,
      state: lead.state,
      assets: lead.assets,
      members: lead.members,
      deposits: lead.deposits,
      roa: lead.roa,
      branches: lead.branches,
      source: lead.source,
    },
    opportunity: {
      score: intelligence.opportunityScore,
      tier: intelligence.opportunityTier,
      dealSize: intelligence.estimatedDealSize,
    },
    talkingPoints: intelligence.keyTalkingPoints.slice(0, 3),
    competitive: {
      vendors: competitiveIntel.currentVendors.slice(0, 3).map(vp => ({
        name: vp.competitor.name,
        products: vp.products,
        satisfaction: vp.satisfaction,
      })),
      winProbability: competitiveIntel.currentVendors.length > 0
        ? competitiveIntel.currentVendors.reduce((sum, v) => sum + v.competitor.winRate, 0) / competitiveIntel.currentVendors.length
        : 50,
      displacementStrategy: competitiveIntel.winBackStrategy,
      battleCardHighlights: [...new Set(battleCardHighlights)].slice(0, 4),
    },
    products: productRecs.slice(0, 3).map(p => ({
      name: p.shortName,
      fitScore: p.fitScore,
      whyTheyNeedIt: p.whyTheyNeedIt,
      urgency: p.urgency,
    })),
    roi: {
      annualROI: roiProjection.annualROI,
      paybackMonths: roiProjection.paybackMonths,
      threeYearValue: roiProjection.threeYearValue,
      riseInvestment: pricing.annualPrice,
      annualBenefit: roiProjection.totalAnnualBenefit,
    },
    objections: topObjections.map(o => ({
      objection: o.objection,
      response: o.response
        .replace('[ANNUAL_BENEFIT]', formatCurrency(roiProjection.totalAnnualBenefit))
        .replace('[INSTITUTION_NAME]', lead.name),
      proofPoints: o.proofPoints,
    })),
    callStrategy: {
      opening: generateOpening(lead, intelligence),
      approach: intelligence.recommendedApproach,
      closingAsk: generateClosingAsk(intelligence, topProduct),
    },
    generatedAt: new Date().toISOString(),
  };
}

export function briefToClipboardText(brief: PreCallBrief): string {
  const lines: string[] = [];
  lines.push(`PRE-CALL BRIEF: ${brief.institution.name}`);
  lines.push(`Generated: ${new Date(brief.generatedAt).toLocaleString()}`);
  lines.push('');
  lines.push('--- INSTITUTION ---');
  lines.push(`Type: ${brief.institution.type} | ${brief.institution.city}, ${brief.institution.state}`);
  lines.push(`Assets: ${formatCurrency(brief.institution.assets)} | Members: ${brief.institution.members.toLocaleString()} | ROA: ${brief.institution.roa.toFixed(2)}%`);
  lines.push('');
  lines.push('--- OPPORTUNITY ---');
  lines.push(`Score: ${brief.opportunity.score}/100 (${brief.opportunity.tier}) | Deal Size: ${brief.opportunity.dealSize}`);
  lines.push('');
  lines.push('--- TOP TALKING POINTS ---');
  brief.talkingPoints.forEach((tp, i) => lines.push(`${i + 1}. ${tp}`));
  lines.push('');
  lines.push('--- COMPETITIVE LANDSCAPE ---');
  brief.competitive.vendors.forEach(v => lines.push(`- ${v.name}: ${v.products.join(', ')} (Satisfaction: ${v.satisfaction})`));
  lines.push(`Win Probability: ${brief.competitive.winProbability}% | Strategy: ${brief.competitive.displacementStrategy}`);
  lines.push('');
  lines.push('--- PRODUCT RECOMMENDATIONS ---');
  brief.products.forEach(p => lines.push(`- ${p.name} (Fit: ${p.fitScore}%, ${p.urgency}): ${p.whyTheyNeedIt}`));
  lines.push('');
  lines.push('--- ROI PREVIEW ---');
  lines.push(`Annual ROI: ${brief.roi.annualROI}% | Payback: ${brief.roi.paybackMonths} months | 3-Year Value: ${formatCurrency(brief.roi.threeYearValue)}`);
  lines.push(`Investment: ${formatCurrency(brief.roi.riseInvestment)}/yr | Benefit: ${formatCurrency(brief.roi.annualBenefit)}/yr`);
  lines.push('');
  lines.push('--- OBJECTION PREP ---');
  brief.objections.forEach(o => {
    lines.push(`Q: "${o.objection}"`);
    lines.push(`A: ${o.response.slice(0, 200)}...`);
    lines.push('');
  });
  lines.push('--- CALL STRATEGY ---');
  lines.push(`Opening: ${brief.callStrategy.opening}`);
  lines.push(`Approach: ${brief.callStrategy.approach}`);
  lines.push(`Closing: ${brief.callStrategy.closingAsk}`);
  return lines.join('\n');
}
