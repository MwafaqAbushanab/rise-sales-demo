// Prospecting Intelligence Module
// Analyzes institutions to identify best sales opportunities

export interface ProspectIntelligence {
  // Overall opportunity score (0-100)
  opportunityScore: number;
  opportunityTier: 'Hot' | 'Warm' | 'Nurture' | 'Cold';

  // Peer comparison
  peerComparison: {
    assetPercentile: number; // Where they rank among peers
    peerGroupSize: number;
    aboveAverageMetrics: string[];
    belowAverageMetrics: string[];
  };

  // Growth indicators
  growthSignals: {
    score: number;
    indicators: GrowthIndicator[];
  };

  // Technology signals (likelihood of needing new tech)
  techSignals: {
    score: number;
    indicators: TechIndicator[];
  };

  // Buying signals
  buyingSignals: {
    score: number;
    indicators: BuyingIndicator[];
  };

  // Recommended approach
  recommendedApproach: string;
  keyTalkingPoints: string[];
  potentialChallenges: string[];
  estimatedDealSize: string;
}

export interface GrowthIndicator {
  type: 'positive' | 'negative' | 'neutral';
  label: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface TechIndicator {
  type: 'opportunity' | 'risk' | 'neutral';
  label: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface BuyingIndicator {
  type: 'strong' | 'moderate' | 'weak';
  label: string;
  description: string;
}

interface Lead {
  id: string;
  name: string;
  type: 'Credit Union' | 'Community Bank';
  city: string;
  state: string;
  assets: number;
  members: number;
  deposits: number;
  roa: number;
  branches: number;
}

// Analyze a lead and generate intelligence
export function analyzeProspect(lead: Lead, allLeads: Lead[]): ProspectIntelligence {
  const peers = getPeerGroup(lead, allLeads);
  const peerComparison = analyzePeerComparison(lead, peers);
  const growthSignals = analyzeGrowthSignals(lead, peers);
  const techSignals = analyzeTechSignals(lead);
  const buyingSignals = analyzeBuyingSignals(lead, peerComparison, growthSignals);

  // Calculate overall opportunity score
  const opportunityScore = calculateOpportunityScore(
    peerComparison,
    growthSignals,
    techSignals,
    buyingSignals
  );

  const opportunityTier = getOpportunityTier(opportunityScore);

  return {
    opportunityScore,
    opportunityTier,
    peerComparison,
    growthSignals,
    techSignals,
    buyingSignals,
    recommendedApproach: getRecommendedApproach(lead, opportunityTier, techSignals),
    keyTalkingPoints: getKeyTalkingPoints(lead, peerComparison, growthSignals, techSignals),
    potentialChallenges: getPotentialChallenges(lead, techSignals),
    estimatedDealSize: estimateDealSize(lead),
  };
}

// Get peer group (similar-sized institutions of same type)
function getPeerGroup(lead: Lead, allLeads: Lead[]): Lead[] {
  const sameType = allLeads.filter(l => l.type === lead.type);

  // Define asset ranges for peer groups
  let minAssets: number, maxAssets: number;

  if (lead.assets >= 10000000000) {
    // $10B+ - peer with other large institutions
    minAssets = 5000000000;
    maxAssets = Infinity;
  } else if (lead.assets >= 1000000000) {
    // $1B-$10B
    minAssets = 500000000;
    maxAssets = 15000000000;
  } else if (lead.assets >= 500000000) {
    // $500M-$1B
    minAssets = 250000000;
    maxAssets = 2000000000;
  } else if (lead.assets >= 100000000) {
    // $100M-$500M
    minAssets = 50000000;
    maxAssets = 750000000;
  } else {
    // Under $100M
    minAssets = 0;
    maxAssets = 200000000;
  }

  return sameType.filter(l =>
    l.assets >= minAssets &&
    l.assets <= maxAssets &&
    l.id !== lead.id
  );
}

// Analyze how the lead compares to peers
function analyzePeerComparison(lead: Lead, peers: Lead[]): ProspectIntelligence['peerComparison'] {
  if (peers.length === 0) {
    return {
      assetPercentile: 50,
      peerGroupSize: 0,
      aboveAverageMetrics: [],
      belowAverageMetrics: [],
    };
  }

  // Calculate percentile rank by assets
  const sortedByAssets = [...peers, lead].sort((a, b) => a.assets - b.assets);
  const rank = sortedByAssets.findIndex(l => l.id === lead.id) + 1;
  const assetPercentile = Math.round((rank / sortedByAssets.length) * 100);

  // Compare key metrics
  const avgAssets = peers.reduce((sum, p) => sum + p.assets, 0) / peers.length;
  const avgROA = peers.filter(p => p.roa > 0).reduce((sum, p) => sum + p.roa, 0) / peers.filter(p => p.roa > 0).length || 0;
  const avgMembers = lead.type === 'Credit Union'
    ? peers.filter(p => p.members > 0).reduce((sum, p) => sum + p.members, 0) / peers.filter(p => p.members > 0).length || 0
    : 0;
  const avgBranches = peers.filter(p => p.branches > 0).reduce((sum, p) => sum + p.branches, 0) / peers.filter(p => p.branches > 0).length || 0;

  const aboveAverageMetrics: string[] = [];
  const belowAverageMetrics: string[] = [];

  if (lead.assets > avgAssets * 1.1) aboveAverageMetrics.push('Asset Size');
  else if (lead.assets < avgAssets * 0.9) belowAverageMetrics.push('Asset Size');

  if (lead.roa > 0 && avgROA > 0) {
    if (lead.roa > avgROA * 1.1) aboveAverageMetrics.push('Return on Assets');
    else if (lead.roa < avgROA * 0.9) belowAverageMetrics.push('Return on Assets');
  }

  if (lead.type === 'Credit Union' && lead.members > 0 && avgMembers > 0) {
    if (lead.members > avgMembers * 1.1) aboveAverageMetrics.push('Member Count');
    else if (lead.members < avgMembers * 0.9) belowAverageMetrics.push('Member Count');
  }

  if (lead.branches > 0 && avgBranches > 0) {
    if (lead.branches > avgBranches * 1.2) aboveAverageMetrics.push('Branch Network');
    else if (lead.branches < avgBranches * 0.8) belowAverageMetrics.push('Branch Network');
  }

  return {
    assetPercentile,
    peerGroupSize: peers.length,
    aboveAverageMetrics,
    belowAverageMetrics,
  };
}

// Analyze growth signals
function analyzeGrowthSignals(lead: Lead, _peers: Lead[]): ProspectIntelligence['growthSignals'] {
  const indicators: GrowthIndicator[] = [];
  let score = 50; // Base score

  // Asset size indicates established institution
  if (lead.assets >= 10000000000) {
    indicators.push({
      type: 'positive',
      label: 'Enterprise Scale',
      description: `With $${(lead.assets / 1000000000).toFixed(1)}B in assets, they have complex data needs`,
      impact: 'high'
    });
    score += 15;
  } else if (lead.assets >= 1000000000) {
    indicators.push({
      type: 'positive',
      label: 'Growth Stage',
      description: 'Mid-size institution likely investing in technology to compete',
      impact: 'high'
    });
    score += 20;
  } else if (lead.assets >= 500000000) {
    indicators.push({
      type: 'positive',
      label: 'Scaling Up',
      description: 'Growing institution that needs better analytics',
      impact: 'medium'
    });
    score += 15;
  } else {
    indicators.push({
      type: 'neutral',
      label: 'Community Focused',
      description: 'Smaller institution - focus on ROI and ease of use',
      impact: 'low'
    });
    score += 5;
  }

  // ROA analysis
  if (lead.roa >= 1.2) {
    indicators.push({
      type: 'positive',
      label: 'High Performance',
      description: `ROA of ${lead.roa.toFixed(2)}% indicates strong management`,
      impact: 'medium'
    });
    score += 10;
  } else if (lead.roa > 0 && lead.roa < 0.5) {
    indicators.push({
      type: 'positive',
      label: 'Improvement Opportunity',
      description: 'Lower ROA suggests they need better insights to optimize',
      impact: 'high'
    });
    score += 15;
  }

  // Member/branch density for CUs
  if (lead.type === 'Credit Union' && lead.members > 0) {
    const membersPerBillion = lead.members / (lead.assets / 1000000000);
    if (membersPerBillion > 100000) {
      indicators.push({
        type: 'positive',
        label: 'High Member Engagement',
        description: 'Strong member base relative to assets',
        impact: 'medium'
      });
      score += 10;
    }
  }

  // Geographic opportunity
  const highGrowthStates = ['TX', 'FL', 'AZ', 'NC', 'GA', 'TN', 'CO', 'UT'];
  if (highGrowthStates.includes(lead.state)) {
    indicators.push({
      type: 'positive',
      label: 'High-Growth Market',
      description: `${lead.state} is experiencing strong population and economic growth`,
      impact: 'medium'
    });
    score += 10;
  }

  return { score: Math.min(score, 100), indicators };
}

// Analyze technology signals
function analyzeTechSignals(lead: Lead): ProspectIntelligence['techSignals'] {
  const indicators: TechIndicator[] = [];
  let score = 50;

  // Size-based tech needs
  if (lead.assets >= 5000000000) {
    indicators.push({
      type: 'opportunity',
      label: 'Enterprise Complexity',
      description: 'Large institutions often have legacy systems needing modernization',
      impact: 'high'
    });
    score += 20;
  }

  if (lead.assets >= 1000000000 && lead.assets < 5000000000) {
    indicators.push({
      type: 'opportunity',
      label: 'Outgrowing Current Tools',
      description: 'Mid-size institutions often outgrow basic spreadsheet analytics',
      impact: 'high'
    });
    score += 25;
  }

  // Branch network complexity
  if (lead.branches > 50) {
    indicators.push({
      type: 'opportunity',
      label: 'Multi-Branch Complexity',
      description: `${lead.branches} branches create data consolidation challenges`,
      impact: 'high'
    });
    score += 15;
  } else if (lead.branches > 20) {
    indicators.push({
      type: 'opportunity',
      label: 'Growing Network',
      description: 'Branch expansion requires better performance tracking',
      impact: 'medium'
    });
    score += 10;
  }

  // Credit union specific
  if (lead.type === 'Credit Union') {
    indicators.push({
      type: 'opportunity',
      label: 'Member Analytics Need',
      description: 'CUs need member insights to compete with digital banks',
      impact: 'medium'
    });
    score += 10;

    if (lead.members > 500000) {
      indicators.push({
        type: 'opportunity',
        label: 'Scale Requires Automation',
        description: 'Large member base needs automated insights',
        impact: 'high'
      });
      score += 15;
    }
  }

  // Community bank specific
  if (lead.type === 'Community Bank') {
    indicators.push({
      type: 'opportunity',
      label: 'Regulatory Pressure',
      description: 'Community banks face increasing compliance requirements',
      impact: 'medium'
    });
    score += 10;
  }

  return { score: Math.min(score, 100), indicators };
}

// Analyze buying signals
function analyzeBuyingSignals(
  lead: Lead,
  peerComparison: ProspectIntelligence['peerComparison'],
  growthSignals: ProspectIntelligence['growthSignals']
): ProspectIntelligence['buyingSignals'] {
  const indicators: BuyingIndicator[] = [];
  let score = 50;

  // Competitive pressure
  if (peerComparison.belowAverageMetrics.length >= 2) {
    indicators.push({
      type: 'strong',
      label: 'Competitive Pressure',
      description: 'Underperforming vs peers creates urgency to improve'
    });
    score += 20;
  }

  // Budget capacity
  if (lead.assets >= 1000000000) {
    indicators.push({
      type: 'strong',
      label: 'Budget Available',
      description: 'Asset size suggests adequate technology budget'
    });
    score += 15;
  } else if (lead.assets >= 500000000) {
    indicators.push({
      type: 'moderate',
      label: 'Moderate Budget',
      description: 'May need ROI-focused pitch'
    });
    score += 10;
  }

  // Strategic timing
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 8 && currentMonth <= 11) {
    indicators.push({
      type: 'strong',
      label: 'Budget Season',
      description: 'Q4 is prime time for next-year budget planning'
    });
    score += 15;
  } else if (currentMonth >= 0 && currentMonth <= 2) {
    indicators.push({
      type: 'moderate',
      label: 'New Year Initiatives',
      description: 'Q1 often brings new strategic initiatives'
    });
    score += 10;
  }

  // High growth signals correlate with buying
  if (growthSignals.score >= 70) {
    indicators.push({
      type: 'strong',
      label: 'Growth Mindset',
      description: 'Growth-oriented institutions invest in tools'
    });
    score += 15;
  }

  return { score: Math.min(score, 100), indicators };
}

// Calculate overall opportunity score
function calculateOpportunityScore(
  peerComparison: ProspectIntelligence['peerComparison'],
  growthSignals: ProspectIntelligence['growthSignals'],
  techSignals: ProspectIntelligence['techSignals'],
  buyingSignals: ProspectIntelligence['buyingSignals']
): number {
  // Weighted average
  const weights = {
    growth: 0.25,
    tech: 0.30,
    buying: 0.30,
    peer: 0.15
  };

  const peerScore = peerComparison.assetPercentile;

  const score =
    (growthSignals.score * weights.growth) +
    (techSignals.score * weights.tech) +
    (buyingSignals.score * weights.buying) +
    (peerScore * weights.peer);

  return Math.round(score);
}

// Get opportunity tier
function getOpportunityTier(score: number): ProspectIntelligence['opportunityTier'] {
  if (score >= 80) return 'Hot';
  if (score >= 65) return 'Warm';
  if (score >= 50) return 'Nurture';
  return 'Cold';
}

// Get recommended approach
function getRecommendedApproach(
  lead: Lead,
  tier: ProspectIntelligence['opportunityTier'],
  techSignals: ProspectIntelligence['techSignals']
): string {
  if (tier === 'Hot') {
    if (lead.assets >= 5000000000) {
      return 'Executive briefing with custom ROI analysis. Request meeting with CEO/CFO. Prepare case studies from similar large institutions.';
    }
    return 'Schedule discovery call immediately. Lead with peer comparison data and quick-win use cases. Aim for 2-week pilot.';
  }

  if (tier === 'Warm') {
    if (techSignals.score >= 70) {
      return 'Educational approach - share industry insights and trends. Offer free assessment of their current analytics maturity.';
    }
    return 'Nurture with valuable content. Send quarterly industry benchmarks. Build relationship before hard pitch.';
  }

  if (tier === 'Nurture') {
    return 'Add to nurture campaign. Send monthly insights newsletter. Re-evaluate in 6 months or after trigger event.';
  }

  return 'Low priority - monitor for changes. Consider for future expansion once they grow.';
}

// Get key talking points
function getKeyTalkingPoints(
  lead: Lead,
  peerComparison: ProspectIntelligence['peerComparison'],
  growthSignals: ProspectIntelligence['growthSignals'],
  _techSignals: ProspectIntelligence['techSignals']
): string[] {
  const points: string[] = [];

  // Asset-based points
  if (lead.assets >= 10000000000) {
    points.push(`At $${(lead.assets / 1000000000).toFixed(1)}B in assets, you need enterprise-grade analytics that scales`);
  } else if (lead.assets >= 1000000000) {
    points.push(`Institutions your size typically see 6% revenue lift within 90 days of implementation`);
  }

  // Peer comparison points
  if (peerComparison.belowAverageMetrics.length > 0) {
    points.push(`Our data shows opportunities to improve ${peerComparison.belowAverageMetrics.join(' and ')}`);
  }
  if (peerComparison.aboveAverageMetrics.length > 0) {
    points.push(`You're outperforming peers in ${peerComparison.aboveAverageMetrics.join(' and ')} - let's build on that`);
  }

  // Type-specific points
  if (lead.type === 'Credit Union') {
    points.push('Help your team identify at-risk members before they leave');
    if (lead.members > 100000) {
      points.push(`With ${(lead.members / 1000).toFixed(0)}K members, personalized insights at scale is crucial`);
    }
  } else {
    points.push('Streamline regulatory reporting and reduce compliance burden');
    points.push('Get real-time visibility into loan portfolio performance');
  }

  // Growth points
  const highImpactGrowth = growthSignals.indicators.filter(i => i.impact === 'high' && i.type === 'positive');
  if (highImpactGrowth.length > 0) {
    points.push(`Capitalize on your ${highImpactGrowth[0].label.toLowerCase()} with better data insights`);
  }

  return points.slice(0, 5);
}

// Get potential challenges
function getPotentialChallenges(
  lead: Lead,
  techSignals: ProspectIntelligence['techSignals']
): string[] {
  const challenges: string[] = [];

  if (lead.assets < 500000000) {
    challenges.push('Budget constraints - emphasize ROI and quick payback');
  }

  if (lead.assets >= 10000000000) {
    challenges.push('Long sales cycle - expect 6-12 month decision process');
    challenges.push('Multiple stakeholders - need IT, Finance, and Ops buy-in');
  }

  if (lead.type === 'Credit Union') {
    challenges.push('Board approval may be required for new vendors');
  }

  if (lead.type === 'Community Bank') {
    challenges.push('May have existing vendor relationships to navigate');
  }

  if (techSignals.score < 50) {
    challenges.push('May not be actively looking for solutions - need to create urgency');
  }

  return challenges.slice(0, 4);
}

// Estimate deal size
function estimateDealSize(lead: Lead): string {
  // Based on typical analytics platform pricing
  if (lead.assets >= 50000000000) return '$250K - $500K ARR';
  if (lead.assets >= 10000000000) return '$150K - $250K ARR';
  if (lead.assets >= 5000000000) return '$100K - $150K ARR';
  if (lead.assets >= 1000000000) return '$60K - $100K ARR';
  if (lead.assets >= 500000000) return '$40K - $60K ARR';
  if (lead.assets >= 100000000) return '$25K - $40K ARR';
  return '$15K - $25K ARR';
}

// Get tier color for UI
export function getTierColor(tier: ProspectIntelligence['opportunityTier']): string {
  switch (tier) {
    case 'Hot': return 'text-red-600 bg-red-100';
    case 'Warm': return 'text-orange-600 bg-orange-100';
    case 'Nurture': return 'text-blue-600 bg-blue-100';
    case 'Cold': return 'text-gray-600 bg-gray-100';
  }
}

// Get tier icon
export function getTierEmoji(tier: ProspectIntelligence['opportunityTier']): string {
  switch (tier) {
    case 'Hot': return '🔥';
    case 'Warm': return '⚡';
    case 'Nurture': return '🌱';
    case 'Cold': return '❄️';
  }
}
