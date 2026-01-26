// Territory Intelligence - Market penetration and geographic analysis
// Helps sales teams understand their market coverage and identify opportunities

export interface StateMarketData {
  state: string;
  totalInstitutions: number;
  creditUnions: number;
  communityBanks: number;
  totalAssets: number;
  averageAssets: number;
  topTier: number;
  midTier: number;
  smallTier: number;
  penetration?: number; // Percentage of market we've won
  pipelineValue?: number;
  hotLeadsCount?: number;
}

export interface MarketSegment {
  name: string;
  assetMin: number;
  assetMax: number;
  count: number;
  totalAssets: number;
  avgDealSize: string;
  winRate: number;
  avgSalesCycle: string;
  keyProducts: string[];
}

export interface TerritoryMetrics {
  totalAddressableMarket: number;
  servicedMarket: number;
  penetrationRate: number;
  pipelineValue: number;
  avgDealSize: number;
  topStates: StateMarketData[];
  marketSegments: MarketSegment[];
  growthOpportunities: GrowthOpportunity[];
  competitiveHeatmap: CompetitiveRegion[];
}

export interface GrowthOpportunity {
  type: 'geographic' | 'segment' | 'product' | 'competitive';
  title: string;
  description: string;
  potentialValue: number;
  difficulty: 'easy' | 'medium' | 'hard';
  recommendedAction: string;
}

export interface CompetitiveRegion {
  state: string;
  dominantCompetitor: string;
  competitorShare: number;
  ourShare: number;
  opportunity: 'high' | 'medium' | 'low';
  strategy: string;
}

// Asset tier definitions
const ASSET_TIERS = {
  enterprise: { min: 5000000000, max: Infinity, label: 'Enterprise ($5B+)' },
  large: { min: 1000000000, max: 5000000000, label: 'Large ($1B-$5B)' },
  midMarket: { min: 500000000, max: 1000000000, label: 'Mid-Market ($500M-$1B)' },
  small: { min: 100000000, max: 500000000, label: 'Small ($100M-$500M)' },
  micro: { min: 0, max: 100000000, label: 'Micro (<$100M)' }
};

// Market segment definitions with characteristics
export const MARKET_SEGMENTS: MarketSegment[] = [
  {
    name: 'Enterprise Credit Unions',
    assetMin: 5000000000,
    assetMax: Infinity,
    count: 0, // Will be calculated
    totalAssets: 0,
    avgDealSize: '$50,000-$75,000/mo',
    winRate: 25,
    avgSalesCycle: '9-12 months',
    keyProducts: ['Enterprise Platform', 'Data Warehouse', 'Compliance Suite']
  },
  {
    name: 'Large Credit Unions',
    assetMin: 1000000000,
    assetMax: 5000000000,
    count: 0,
    totalAssets: 0,
    avgDealSize: '$25,000-$50,000/mo',
    winRate: 35,
    avgSalesCycle: '6-9 months',
    keyProducts: ['Analytics Platform', 'Member 360', 'Lending Analytics']
  },
  {
    name: 'Mid-Market Credit Unions',
    assetMin: 500000000,
    assetMax: 1000000000,
    count: 0,
    totalAssets: 0,
    avgDealSize: '$10,000-$25,000/mo',
    winRate: 45,
    avgSalesCycle: '4-6 months',
    keyProducts: ['Analytics Platform', 'Marketing Insights']
  },
  {
    name: 'Small Credit Unions',
    assetMin: 100000000,
    assetMax: 500000000,
    count: 0,
    totalAssets: 0,
    avgDealSize: '$3,000-$10,000/mo',
    winRate: 55,
    avgSalesCycle: '2-4 months',
    keyProducts: ['Essential Analytics', 'Marketing Insights']
  },
  {
    name: 'Community Banks',
    assetMin: 100000000,
    assetMax: Infinity,
    count: 0,
    totalAssets: 0,
    avgDealSize: '$15,000-$35,000/mo',
    winRate: 30,
    avgSalesCycle: '6-9 months',
    keyProducts: ['Analytics Platform', 'Lending Analytics', 'Compliance Suite']
  }
];

// Competitor regional strength data (simulated)
const COMPETITOR_PRESENCE: Record<string, Record<string, number>> = {
  'Jack Henry': {
    'TX': 45, 'OK': 50, 'AR': 55, 'LA': 40, 'MO': 48,
    'KS': 52, 'NE': 45, 'IA': 42, 'MN': 35, 'WI': 38
  },
  'Fiserv': {
    'WI': 55, 'IL': 48, 'MI': 45, 'OH': 50, 'IN': 52,
    'PA': 42, 'NY': 38, 'NJ': 40, 'CT': 35, 'MA': 32
  },
  'Q2': {
    'CA': 35, 'WA': 38, 'OR': 40, 'AZ': 32, 'NV': 28,
    'CO': 30, 'UT': 35, 'ID': 25, 'MT': 20, 'WY': 18
  },
  'Alkami': {
    'NC': 30, 'SC': 28, 'GA': 32, 'FL': 35, 'AL': 25,
    'TN': 28, 'VA': 30, 'MD': 32, 'DE': 25, 'DC': 20
  }
};

// Calculate state-level market data
export function calculateStateMarketData(leads: Array<{
  state: string;
  type: string;
  assets: number;
  status?: string;
  score?: number;
}>): StateMarketData[] {
  const stateMap = new Map<string, StateMarketData>();

  leads.forEach(lead => {
    if (!stateMap.has(lead.state)) {
      stateMap.set(lead.state, {
        state: lead.state,
        totalInstitutions: 0,
        creditUnions: 0,
        communityBanks: 0,
        totalAssets: 0,
        averageAssets: 0,
        topTier: 0,
        midTier: 0,
        smallTier: 0,
        penetration: 0,
        pipelineValue: 0,
        hotLeadsCount: 0
      });
    }

    const stateData = stateMap.get(lead.state)!;
    stateData.totalInstitutions++;
    stateData.totalAssets += lead.assets;

    if (lead.type === 'Credit Union') {
      stateData.creditUnions++;
    } else {
      stateData.communityBanks++;
    }

    // Asset tier classification
    if (lead.assets >= ASSET_TIERS.enterprise.min) {
      stateData.topTier++;
    } else if (lead.assets >= ASSET_TIERS.midMarket.min) {
      stateData.midTier++;
    } else {
      stateData.smallTier++;
    }

    // Hot leads (score > 70)
    if (lead.score && lead.score > 70) {
      stateData.hotLeadsCount!++;
    }

    // Pipeline value (simplified calculation)
    if (lead.status && ['qualified', 'demo_scheduled', 'proposal_sent'].includes(lead.status)) {
      // Estimate monthly value based on assets
      const monthlyValue = estimateMonthlyValue(lead.assets);
      stateData.pipelineValue! += monthlyValue * 12; // Annual contract value
    }
  });

  // Calculate averages and sort
  const states = Array.from(stateMap.values())
    .map(state => ({
      ...state,
      averageAssets: state.totalAssets / state.totalInstitutions
    }))
    .sort((a, b) => b.totalAssets - a.totalAssets);

  return states;
}

// Estimate monthly contract value based on asset size
function estimateMonthlyValue(assets: number): number {
  if (assets >= 10000000000) return 60000; // $10B+ = $60K/mo
  if (assets >= 5000000000) return 45000;  // $5B-$10B = $45K/mo
  if (assets >= 1000000000) return 25000;  // $1B-$5B = $25K/mo
  if (assets >= 500000000) return 12000;   // $500M-$1B = $12K/mo
  if (assets >= 100000000) return 5000;    // $100M-$500M = $5K/mo
  return 2500; // <$100M = $2.5K/mo
}

// Calculate market segments from leads
export function calculateMarketSegments(leads: Array<{
  type: string;
  assets: number;
}>): MarketSegment[] {
  const segments = JSON.parse(JSON.stringify(MARKET_SEGMENTS)) as MarketSegment[];

  leads.forEach(lead => {
    // Find matching segment
    let matched = false;

    // Check type-specific segments first
    if (lead.type === 'Community Bank') {
      const bankSegment = segments.find(s => s.name === 'Community Banks');
      if (bankSegment && lead.assets >= bankSegment.assetMin) {
        bankSegment.count++;
        bankSegment.totalAssets += lead.assets;
        matched = true;
      }
    }

    if (!matched && lead.type === 'Credit Union') {
      for (const segment of segments) {
        if (segment.name.includes('Credit Union') &&
            lead.assets >= segment.assetMin &&
            lead.assets < segment.assetMax) {
          segment.count++;
          segment.totalAssets += lead.assets;
          break;
        }
      }
    }
  });

  return segments.filter(s => s.count > 0);
}

// Identify growth opportunities
export function identifyGrowthOpportunities(
  stateData: StateMarketData[],
  segments: MarketSegment[],
  leads: Array<{ state: string; assets: number; type: string; status?: string }>
): GrowthOpportunity[] {
  const opportunities: GrowthOpportunity[] = [];

  // Geographic opportunities - states with high assets but low penetration
  const topUnpenetratedStates = stateData
    .filter(s => s.totalInstitutions > 20 && (!s.penetration || s.penetration < 5))
    .slice(0, 3);

  topUnpenetratedStates.forEach(state => {
    opportunities.push({
      type: 'geographic',
      title: `Expand in ${state.state}`,
      description: `${state.totalInstitutions} institutions with $${(state.totalAssets / 1000000000).toFixed(1)}B in assets. Currently minimal presence.`,
      potentialValue: state.totalAssets * 0.0001, // Rough estimate of capturable revenue
      difficulty: state.topTier > 5 ? 'hard' : 'medium',
      recommendedAction: `Target top ${Math.min(10, state.topTier)} institutions with enterprise approach. Consider local events or partnerships.`
    });
  });

  // Segment opportunities
  const highPotentialSegment = segments
    .filter(s => s.count > 50 && s.winRate >= 40)
    .sort((a, b) => b.winRate - a.winRate)[0];

  if (highPotentialSegment) {
    opportunities.push({
      type: 'segment',
      title: `Focus on ${highPotentialSegment.name}`,
      description: `${highPotentialSegment.count} prospects with ${highPotentialSegment.winRate}% win rate. Avg deal: ${highPotentialSegment.avgDealSize}`,
      potentialValue: highPotentialSegment.count * 150000, // Rough ACV estimate
      difficulty: 'easy',
      recommendedAction: `Increase outreach to this segment. Consider targeted content and case studies for ${highPotentialSegment.keyProducts.join(', ')}.`
    });
  }

  // Product-based opportunities
  const largeLeads = leads.filter(l => l.assets > 1000000000);
  const enterprisePipelineGap = largeLeads.filter(l => !l.status || l.status === 'new').length;

  if (enterprisePipelineGap > 20) {
    opportunities.push({
      type: 'product',
      title: 'Enterprise Pipeline Development',
      description: `${enterprisePipelineGap} large institutions ($1B+) not yet in pipeline. High-value opportunity.`,
      potentialValue: enterprisePipelineGap * 300000,
      difficulty: 'hard',
      recommendedAction: 'Launch enterprise ABM campaign. Target executive sponsors with ROI-focused content.'
    });
  }

  // Competitive displacement opportunities
  const competitorWeakStates = stateData.filter(s => {
    const totalCompetitorShare = Object.values(COMPETITOR_PRESENCE)
      .reduce((sum, regions) => sum + (regions[s.state] || 0), 0);
    return totalCompetitorShare < 100 && s.totalInstitutions > 30;
  }).slice(0, 2);

  competitorWeakStates.forEach(state => {
    opportunities.push({
      type: 'competitive',
      title: `Competitive Gap in ${state.state}`,
      description: `Lower competitor presence in ${state.state}. ${state.totalInstitutions} institutions available.`,
      potentialValue: state.totalAssets * 0.00015,
      difficulty: 'medium',
      recommendedAction: 'First-mover advantage possible. Focus on speed-to-value messaging and references from similar markets.'
    });
  });

  // Sort by potential value
  return opportunities.sort((a, b) => b.potentialValue - a.potentialValue);
}

// Analyze competitive landscape by region
export function analyzeCompetitiveRegions(stateData: StateMarketData[]): CompetitiveRegion[] {
  return stateData.slice(0, 15).map(state => {
    // Find dominant competitor in this state
    let dominantCompetitor = 'Unknown';
    let maxShare = 0;

    Object.entries(COMPETITOR_PRESENCE).forEach(([competitor, regions]) => {
      const share = regions[state.state] || 0;
      if (share > maxShare) {
        maxShare = share;
        dominantCompetitor = competitor;
      }
    });

    // Calculate our estimated share (simulated)
    const ourShare = Math.floor(Math.random() * 15) + 2; // 2-17%

    // Determine opportunity level
    let opportunity: 'high' | 'medium' | 'low';
    let strategy: string;

    if (maxShare < 30) {
      opportunity = 'high';
      strategy = 'Fragmented market - focus on being first choice with speed and support differentiation.';
    } else if (maxShare < 50) {
      opportunity = 'medium';
      strategy = `Challenge ${dominantCompetitor} with implementation speed and modern UX. Target dissatisfied customers.`;
    } else {
      opportunity = 'low';
      strategy = `${dominantCompetitor} dominates. Focus on greenfield opportunities and long-term relationship building.`;
    }

    return {
      state: state.state,
      dominantCompetitor,
      competitorShare: maxShare,
      ourShare,
      opportunity,
      strategy
    };
  });
}

// Calculate overall territory metrics
export function calculateTerritoryMetrics(leads: Array<{
  state: string;
  type: string;
  assets: number;
  status?: string;
  score?: number;
}>): TerritoryMetrics {
  const stateData = calculateStateMarketData(leads);
  const segments = calculateMarketSegments(leads);
  const opportunities = identifyGrowthOpportunities(stateData, segments, leads);
  const competitiveRegions = analyzeCompetitiveRegions(stateData);

  const totalAssets = leads.reduce((sum, l) => sum + l.assets, 0);
  const pipelineLeads = leads.filter(l => l.status && ['qualified', 'demo_scheduled', 'proposal_sent'].includes(l.status));
  const pipelineValue = pipelineLeads.reduce((sum, l) => sum + estimateMonthlyValue(l.assets) * 12, 0);
  const wonLeads = leads.filter(l => l.status === 'won');

  return {
    totalAddressableMarket: totalAssets,
    servicedMarket: wonLeads.reduce((sum, l) => sum + l.assets, 0),
    penetrationRate: leads.length > 0 ? (wonLeads.length / leads.length) * 100 : 0,
    pipelineValue,
    avgDealSize: pipelineLeads.length > 0 ? pipelineValue / pipelineLeads.length : 0,
    topStates: stateData.slice(0, 10),
    marketSegments: segments,
    growthOpportunities: opportunities,
    competitiveHeatmap: competitiveRegions
  };
}

// Format currency for display
export function formatTerritoryValue(value: number): string {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

// Get state abbreviation name
export const STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
};
