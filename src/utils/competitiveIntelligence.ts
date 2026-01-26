// Competitive Intelligence Module
// Track competitors, positioning strategies, and win-back tactics

export interface Competitor {
  id: string;
  name: string;
  category: 'Analytics' | 'Core Provider' | 'Lending' | 'Digital Banking' | 'Data Warehouse';
  strength: 'Strong' | 'Moderate' | 'Weak';
  marketShare: number; // percentage in FI market
  pricing: 'Premium' | 'Mid-Market' | 'Budget';
  primaryProducts: string[];
  weaknesses: string[];
  riseAdvantages: string[];
  winRate: number; // Rise's win rate against this competitor
  battleCard: BattleCard;
}

export interface BattleCard {
  positioning: string;
  keyDifferentiators: string[];
  objectionHandlers: Record<string, string>;
  proofPoints: string[];
  avoidSaying: string[];
  winningTactics: string[];
}

export interface CompetitiveIntel {
  currentVendors: CompetitorPresence[];
  marketPosition: string;
  switchingCost: 'High' | 'Medium' | 'Low';
  contractRenewalWindow: string;
  competitiveThreats: string[];
  winBackStrategy: string;
  displacementDifficulty: number; // 1-10
  recommendedApproach: string;
}

export interface CompetitorPresence {
  competitor: Competitor;
  products: string[];
  estimatedSpend: string;
  satisfaction: 'High' | 'Medium' | 'Low' | 'Unknown';
  contractEnd: string;
  notes: string;
}

// Define major competitors in the FI analytics space
export const COMPETITORS: Record<string, Competitor> = {
  'jack-henry': {
    id: 'jack-henry',
    name: 'Jack Henry & Associates',
    category: 'Core Provider',
    strength: 'Strong',
    marketShare: 25,
    pricing: 'Premium',
    primaryProducts: ['Symitar', 'ProfitStars', 'Banno'],
    weaknesses: [
      'Expensive implementation and ongoing costs',
      'Legacy architecture limits innovation speed',
      'Analytics often siloed by product line',
      'Long contract terms with difficult exit clauses'
    ],
    riseAdvantages: [
      'Modern cloud-native architecture',
      'Unified analytics across all data sources',
      '3x faster implementation',
      'Flexible month-to-month pricing available'
    ],
    winRate: 45,
    battleCard: {
      positioning: 'Rise Analytics complements Jack Henry by providing unified analytics that works across all your systems, not just JH products.',
      keyDifferentiators: [
        'Works with ANY core system, not locked to one vendor',
        'Real-time analytics vs batch processing',
        'Self-service reporting without IT involvement',
        'Modern UX that staff actually enjoy using'
      ],
      objectionHandlers: {
        'We already have ProfitStars': 'ProfitStars is great for basic reporting. Rise Analytics adds predictive insights and cross-system analytics that ProfitStars can\'t provide.',
        'JH handles everything': 'Many JH clients use Rise for the unified view across JH and non-JH systems. We integrate seamlessly.',
        'Too many vendors already': 'Rise actually reduces vendor complexity by consolidating analytics into one platform.'
      },
      proofPoints: [
        '47 JH clients added Rise in 2024',
        'Average 23% improvement in cross-sell rates',
        'One JH client saved $180K/year by consolidating 4 reporting tools'
      ],
      avoidSaying: [
        'Never directly criticize Jack Henry',
        'Don\'t promise to replace core banking functions',
        'Avoid comparing contract terms publicly'
      ],
      winningTactics: [
        'Focus on analytics gaps JH doesn\'t fill',
        'Offer a pilot alongside existing JH tools',
        'Get champions in Analytics/Marketing teams first',
        'Show unified dashboard combining JH + non-JH data'
      ]
    }
  },
  'fiserv': {
    id: 'fiserv',
    name: 'Fiserv',
    category: 'Core Provider',
    strength: 'Strong',
    marketShare: 30,
    pricing: 'Premium',
    primaryProducts: ['DNA', 'Precision', 'Aperio', 'Data Central'],
    weaknesses: [
      'Complex pricing with many add-ons',
      'Integration between Fiserv products often poor',
      'Customer service reputation issues',
      'Analytics tools feel dated'
    ],
    riseAdvantages: [
      'Simple, transparent pricing',
      'Modern analytics designed for today\'s needs',
      'Dedicated customer success team',
      'Integrates Fiserv data with other sources easily'
    ],
    winRate: 52,
    battleCard: {
      positioning: 'Rise Analytics provides the modern analytics layer that Fiserv clients have been asking for.',
      keyDifferentiators: [
        'Purpose-built for analytics, not an afterthought',
        'No nickel-and-diming on features',
        'Proactive support vs reactive ticketing',
        'Built by FI analytics experts'
      ],
      objectionHandlers: {
        'Fiserv has analytics': 'Fiserv analytics tools are powerful but complex. Rise gives you the insights without needing a data team.',
        'We\'re locked in': 'Rise works alongside Fiserv. Many clients keep Fiserv for core and use Rise for analytics.',
        'Budget is tight': 'Show them our ROI calculator - average payback in 8 months.'
      },
      proofPoints: [
        '62 Fiserv clients using Rise Analytics',
        'Fiserv clients see 31% faster reporting cycles',
        'Net Promoter Score 72 (vs industry avg 34)'
      ],
      avoidSaying: [
        'Don\'t mention Fiserv service issues unprompted',
        'Avoid pricing comparisons in writing',
        'Don\'t promise Fiserv integration timelines'
      ],
      winningTactics: [
        'Lead with ease of use and time savings',
        'Demo the automated reporting features',
        'Highlight customer success stories',
        'Offer proof of concept with their actual data'
      ]
    }
  },
  'corelation': {
    id: 'corelation',
    name: 'Corelation (KeyStone)',
    category: 'Core Provider',
    strength: 'Moderate',
    marketShare: 8,
    pricing: 'Mid-Market',
    primaryProducts: ['KeyStone Core', 'KeyStone Analytics'],
    weaknesses: [
      'Limited analytics capabilities',
      'Smaller ecosystem of add-on products',
      'Less robust reporting than competitors',
      'Growing pains as company scales'
    ],
    riseAdvantages: [
      'Enterprise-grade analytics for growing CUs',
      'Fill the analytics gap in KeyStone',
      'Proven integration with KeyStone',
      'Scale analytics as you grow'
    ],
    winRate: 68,
    battleCard: {
      positioning: 'Rise Analytics is the perfect analytics partner for innovative CUs choosing KeyStone.',
      keyDifferentiators: [
        'Built for modern cores like KeyStone',
        'Analytics that grow with you',
        'No analytics team required',
        'Real-time member insights'
      ],
      objectionHandlers: {
        'KeyStone has reporting': 'KeyStone\'s reporting is solid for basics. Rise adds predictive analytics and member insights.',
        'We just converted': 'Perfect timing! Add Rise now and avoid analytics gaps during your growth phase.',
        'Need to focus on core first': 'Rise deploys in weeks, not months. We won\'t distract from your core initiatives.'
      },
      proofPoints: [
        '23 KeyStone clients chose Rise',
        'Average implementation: 6 weeks',
        'KeyStone CEO recommends Rise at conferences'
      ],
      avoidSaying: [
        'Don\'t imply KeyStone is inadequate',
        'Avoid comparisons to legacy core analytics',
        'Don\'t oversell integration simplicity'
      ],
      winningTactics: [
        'Position as the analytics layer for modern CUs',
        'Reference other KeyStone + Rise success stories',
        'Emphasize shared modern philosophy',
        'Offer joint implementation planning'
      ]
    }
  },
  'cu-answers': {
    id: 'cu-answers',
    name: 'CU*Answers',
    category: 'Core Provider',
    strength: 'Moderate',
    marketShare: 6,
    pricing: 'Budget',
    primaryProducts: ['CU*BASE', 'AnswerBook', 'GOLD'],
    weaknesses: [
      'Analytics tools are basic',
      'Limited self-service capabilities',
      'Customization requires vendor involvement',
      'Reporting can be slow'
    ],
    riseAdvantages: [
      'Self-service analytics without waiting',
      'Modern dashboards and visualizations',
      'Automated insights and alerts',
      'Works alongside existing CU*A tools'
    ],
    winRate: 71,
    battleCard: {
      positioning: 'Rise Analytics empowers CU*Answers clients with self-service analytics and modern insights.',
      keyDifferentiators: [
        'Instant answers without submitting tickets',
        'Drag-and-drop dashboard creation',
        'Automated alerts for key metrics',
        'Member-level insights in seconds'
      ],
      objectionHandlers: {
        'CU*A includes analytics': 'CU*A analytics require requests to their team. Rise puts power in YOUR hands.',
        'We\'re a CUSO member': 'Many CUSO members add Rise for the self-service layer.',
        'Budget constraints': 'Rise often SAVES money by reducing custom report requests to CU*A.'
      },
      proofPoints: [
        '18 CU*A clients using Rise',
        'Average 40% reduction in report request tickets',
        'Self-service adoption rate of 89%'
      ],
      avoidSaying: [
        'Don\'t criticize CUSO model',
        'Avoid implying CU*A is slow',
        'Don\'t discuss CU*A pricing'
      ],
      winningTactics: [
        'Demo self-service capabilities',
        'Calculate time savings from self-service',
        'Show examples of automated alerts',
        'Emphasize complementary relationship'
      ]
    }
  },
  'q2': {
    id: 'q2',
    name: 'Q2 Holdings',
    category: 'Digital Banking',
    strength: 'Strong',
    marketShare: 15,
    pricing: 'Premium',
    primaryProducts: ['Q2 Digital Banking', 'Q2 Analytics', 'Helix'],
    weaknesses: [
      'Analytics focused only on digital channel',
      'Expensive for full suite',
      'Complex implementation',
      'Limited cross-channel analytics'
    ],
    riseAdvantages: [
      'Unified analytics across ALL channels',
      'Combine Q2 data with branch, call center, etc.',
      'Simpler pricing model',
      'Faster time to value'
    ],
    winRate: 58,
    battleCard: {
      positioning: 'Rise Analytics unifies your Q2 digital data with all other member touchpoints.',
      keyDifferentiators: [
        'See the complete member journey',
        'Combine online + offline behavior',
        'Attribution across all channels',
        'Single view of member engagement'
      ],
      objectionHandlers: {
        'Q2 has analytics': 'Q2 analytics shows digital only. Rise shows the complete picture including Q2 data.',
        'Already invested in Q2': 'Rise enhances your Q2 investment by adding cross-channel insights.',
        'Don\'t need more analytics': 'Show them the blind spots - members who are digital AND branch users.'
      },
      proofPoints: [
        '34 Q2 clients also use Rise',
        '28% improvement in digital adoption insights',
        'One client discovered $2M in missed cross-sell opportunities'
      ],
      avoidSaying: [
        'Don\'t position as Q2 replacement',
        'Avoid criticizing Q2 analytics directly',
        'Don\'t promise Q2 integration timelines'
      ],
      winningTactics: [
        'Show unified member journey visualization',
        'Demo cross-channel attribution',
        'Focus on "complete picture" message',
        'Offer Q2 data integration assessment'
      ]
    }
  },
  'alkami': {
    id: 'alkami',
    name: 'Alkami',
    category: 'Digital Banking',
    strength: 'Moderate',
    marketShare: 8,
    pricing: 'Mid-Market',
    primaryProducts: ['Alkami Platform', 'Segmint (acquired)'],
    weaknesses: [
      'Analytics still maturing post-Segmint acquisition',
      'Integration complexity',
      'Focus on digital, not enterprise analytics',
      'Pricing creep with add-ons'
    ],
    riseAdvantages: [
      'Mature, proven analytics platform',
      'Enterprise-wide, not just digital',
      'Clear, predictable pricing',
      'Faster deployment'
    ],
    winRate: 63,
    battleCard: {
      positioning: 'Rise Analytics provides enterprise analytics that complements Alkami\'s digital experience.',
      keyDifferentiators: [
        'Proven analytics vs still-integrating Segmint',
        'Full enterprise scope',
        'Transparent pricing',
        'Dedicated FI expertise'
      ],
      objectionHandlers: {
        'Alkami has Segmint': 'Segmint integration is ongoing. Rise is ready today with enterprise analytics.',
        'Waiting to see Alkami roadmap': 'Rise works alongside Alkami. No need to wait - add analytics now.',
        'Consolidating vendors': 'Rise focuses on analytics so Alkami can focus on digital experience.'
      },
      proofPoints: [
        '21 Alkami clients using Rise',
        'Enterprise analytics live in 4-6 weeks',
        'Clients report clearer ROI than Segmint'
      ],
      avoidSaying: [
        'Don\'t bash Segmint acquisition',
        'Avoid Alkami roadmap speculation',
        'Don\'t make integration promises'
      ],
      winningTactics: [
        'Emphasize "ready now" vs "coming soon"',
        'Demo enterprise analytics breadth',
        'Show Alkami + Rise success stories',
        'Offer quick proof of concept'
      ]
    }
  },
  'tableau': {
    id: 'tableau',
    name: 'Tableau (Salesforce)',
    category: 'Analytics',
    strength: 'Moderate',
    marketShare: 12,
    pricing: 'Mid-Market',
    primaryProducts: ['Tableau Desktop', 'Tableau Server', 'Tableau Cloud'],
    weaknesses: [
      'Requires technical expertise',
      'Not built for financial services',
      'No pre-built FI content',
      'Expensive at scale'
    ],
    riseAdvantages: [
      'Purpose-built for credit unions and banks',
      'Pre-built FI dashboards and KPIs',
      'No technical skills required',
      'FI-specific insights out of the box'
    ],
    winRate: 74,
    battleCard: {
      positioning: 'Rise Analytics is Tableau built specifically for financial institutions.',
      keyDifferentiators: [
        'FI expertise baked into the product',
        'Works day one, not months of setup',
        'Business users can self-serve',
        'FI KPIs and benchmarks included'
      ],
      objectionHandlers: {
        'We invested in Tableau': 'Rise can integrate with Tableau or replace it. Many switch for the FI-specific features.',
        'Tableau is more flexible': 'Flexibility requires expertise. Rise delivers FI insights without the learning curve.',
        'IT chose Tableau': 'Ask IT how long until FI dashboards are ready. Rise is ready in weeks.'
      },
      proofPoints: [
        '31 FIs switched from Tableau to Rise',
        'Average 65% reduction in time to insight',
        'Business users self-serve in Rise (vs IT dependency in Tableau)'
      ],
      avoidSaying: [
        'Don\'t say Tableau is bad',
        'Avoid technical comparisons',
        'Don\'t promise Tableau migration is easy'
      ],
      winningTactics: [
        'Demo FI-specific dashboards',
        'Show time-to-value comparison',
        'Emphasize self-service for business users',
        'Offer to show Tableau replacement ROI'
      ]
    }
  },
  'microsoft-power-bi': {
    id: 'microsoft-power-bi',
    name: 'Microsoft Power BI',
    category: 'Analytics',
    strength: 'Moderate',
    marketShare: 18,
    pricing: 'Budget',
    primaryProducts: ['Power BI Pro', 'Power BI Premium'],
    weaknesses: [
      'Generic tool, not FI-specific',
      'Requires significant customization',
      'Data modeling complexity',
      'No FI expertise or support'
    ],
    riseAdvantages: [
      'FI-specific out of the box',
      'No customization needed',
      'FI data models pre-built',
      'Support team knows FI business'
    ],
    winRate: 69,
    battleCard: {
      positioning: 'Rise Analytics delivers what Power BI promises but never achieves for FIs - ready-to-use analytics.',
      keyDifferentiators: [
        'Pre-built FI data models',
        'FI KPIs configured, not DIY',
        'Support from FI experts',
        'Compliance-ready reporting'
      ],
      objectionHandlers: {
        'Power BI is free/cheap': 'Calculate the true cost: licensing + customization + ongoing maintenance. Rise is often cheaper.',
        'We have Microsoft E5': 'E5 includes Power BI but not FI analytics. You still need to build everything.',
        'IT prefers Microsoft': 'Rise works with Microsoft stack. IT can focus on infrastructure, Rise handles FI analytics.'
      },
      proofPoints: [
        '44 FIs moved from Power BI to Rise',
        'Average 6 months saved vs DIY Power BI',
        'One FI calculated $340K in hidden Power BI costs'
      ],
      avoidSaying: [
        'Don\'t say Power BI is bad',
        'Avoid total cost discussions without data',
        'Don\'t criticize Microsoft relationship'
      ],
      winningTactics: [
        'Calculate true Power BI total cost',
        'Show side-by-side: DIY Power BI vs ready Rise',
        'Demo FI-specific features missing in Power BI',
        'Position Rise as "Power BI done right for FIs"'
      ]
    }
  },
  'unknown': {
    id: 'unknown',
    name: 'Unknown/In-House',
    category: 'Analytics',
    strength: 'Weak',
    marketShare: 0,
    pricing: 'Budget',
    primaryProducts: ['Spreadsheets', 'Manual Reports', 'Custom Solutions'],
    weaknesses: [
      'Not scalable',
      'Key person dependency',
      'Error-prone manual processes',
      'No advanced analytics'
    ],
    riseAdvantages: [
      'Automated and scalable',
      'No single points of failure',
      'Accurate and auditable',
      'Advanced predictive analytics'
    ],
    winRate: 82,
    battleCard: {
      positioning: 'Rise Analytics transforms manual reporting into automated insights.',
      keyDifferentiators: [
        'Eliminate spreadsheet chaos',
        'Always-accurate data',
        'Insights anyone can access',
        'Scale without adding headcount'
      ],
      objectionHandlers: {
        'Our spreadsheets work fine': 'Until your Excel expert leaves. Rise ensures continuity.',
        'We can\'t afford analytics': 'Calculate the cost of manual reporting. Rise often saves money.',
        'Too busy to implement': 'Rise implements alongside your team with minimal disruption.'
      },
      proofPoints: [
        'Average 73% reduction in reporting time',
        '91% reduction in data errors',
        'One FI freed 2 FTEs from manual reporting'
      ],
      avoidSaying: [
        'Don\'t belittle their current efforts',
        'Avoid implying their team is inadequate',
        'Don\'t underestimate change resistance'
      ],
      winningTactics: [
        'Show empathy for current challenges',
        'Quantify time spent on manual work',
        'Demo how Rise automates their specific reports',
        'Start small with one department pilot'
      ]
    }
  }
};

// Infer likely competitors based on institution characteristics
export function inferCompetitors(lead: {
  type: 'Credit Union' | 'Community Bank';
  assets: number;
  state: string;
  name: string;
}): CompetitorPresence[] {
  const competitors: CompetitorPresence[] = [];

  // Large institutions likely have enterprise solutions
  if (lead.assets >= 10000000000) {
    // Likely have Fiserv or Jack Henry
    competitors.push({
      competitor: COMPETITORS['fiserv'],
      products: ['Core Banking', 'Analytics Suite'],
      estimatedSpend: '$500K - $2M/year',
      satisfaction: 'Medium',
      contractEnd: 'Unknown',
      notes: 'Large FIs typically have long-term core contracts'
    });
    competitors.push({
      competitor: COMPETITORS['q2'],
      products: ['Digital Banking'],
      estimatedSpend: '$200K - $500K/year',
      satisfaction: 'Medium',
      contractEnd: 'Unknown',
      notes: 'Likely has enterprise digital banking platform'
    });
  } else if (lead.assets >= 1000000000) {
    // Mid-size: mix of core providers
    if (lead.type === 'Credit Union') {
      competitors.push({
        competitor: COMPETITORS['jack-henry'],
        products: ['Symitar Core'],
        estimatedSpend: '$200K - $500K/year',
        satisfaction: 'Medium',
        contractEnd: 'Unknown',
        notes: 'Symitar is popular with mid-size CUs'
      });
    } else {
      competitors.push({
        competitor: COMPETITORS['fiserv'],
        products: ['Core Banking'],
        estimatedSpend: '$150K - $400K/year',
        satisfaction: 'Medium',
        contractEnd: 'Unknown',
        notes: 'Fiserv dominates mid-size bank market'
      });
    }
    // Likely also have BI tool
    competitors.push({
      competitor: COMPETITORS['tableau'],
      products: ['Tableau Server'],
      estimatedSpend: '$50K - $150K/year',
      satisfaction: 'Low',
      contractEnd: 'Unknown',
      notes: 'Often underutilized due to complexity'
    });
  } else if (lead.assets >= 100000000) {
    // Smaller: more variety
    if (lead.type === 'Credit Union') {
      competitors.push({
        competitor: COMPETITORS['corelation'],
        products: ['KeyStone'],
        estimatedSpend: '$75K - $150K/year',
        satisfaction: 'High',
        contractEnd: 'Unknown',
        notes: 'Growing CUs often choose modern cores'
      });
    }
    competitors.push({
      competitor: COMPETITORS['microsoft-power-bi'],
      products: ['Power BI Pro'],
      estimatedSpend: '$10K - $30K/year',
      satisfaction: 'Low',
      contractEnd: 'N/A',
      notes: 'Often have Power BI but struggle with FI use cases'
    });
  } else {
    // Small: likely manual or basic tools
    competitors.push({
      competitor: COMPETITORS['unknown'],
      products: ['Spreadsheets', 'Manual Reports'],
      estimatedSpend: '< $10K/year',
      satisfaction: 'Low',
      contractEnd: 'N/A',
      notes: 'Primary opportunity to modernize analytics'
    });
  }

  return competitors;
}

// Generate competitive analysis for a lead
export function analyzeCompetitiveLandscape(
  lead: {
    type: 'Credit Union' | 'Community Bank';
    assets: number;
    state: string;
    name: string;
  },
  knownCompetitors?: CompetitorPresence[]
): CompetitiveIntel {
  const competitors = knownCompetitors || inferCompetitors(lead);

  // Calculate switching cost based on competitors
  const hasEnterpriseCoreProvider = competitors.some(
    c => c.competitor.category === 'Core Provider' && c.competitor.strength === 'Strong'
  );
  const hasMultipleVendors = competitors.length >= 3;

  let switchingCost: 'High' | 'Medium' | 'Low' = 'Low';
  if (hasEnterpriseCoreProvider && hasMultipleVendors) {
    switchingCost = 'High';
  } else if (hasEnterpriseCoreProvider || hasMultipleVendors) {
    switchingCost = 'Medium';
  }

  // Determine displacement difficulty
  let displacementDifficulty = 3; // Base
  if (hasEnterpriseCoreProvider) displacementDifficulty += 3;
  if (lead.assets >= 5000000000) displacementDifficulty += 2;
  if (competitors.some(c => c.satisfaction === 'High')) displacementDifficulty += 2;
  displacementDifficulty = Math.min(displacementDifficulty, 10);

  // Generate threats
  const threats: string[] = [];
  if (hasEnterpriseCoreProvider) {
    threats.push('Core provider may bundle analytics to retain account');
  }
  if (competitors.some(c => c.competitor.id === 'q2')) {
    threats.push('Q2 actively expanding analytics offerings');
  }
  if (competitors.some(c => c.competitor.id === 'alkami')) {
    threats.push('Alkami Segmint integration may improve');
  }
  if (lead.assets < 500000000) {
    threats.push('May be too small to prioritize analytics investment');
  }

  // Win-back strategy based on current vendors
  let winBackStrategy = '';
  const primaryCompetitor = competitors[0]?.competitor;

  if (primaryCompetitor?.category === 'Core Provider') {
    winBackStrategy = `Position Rise as a complement to ${primaryCompetitor.name}, not a replacement. Focus on unified analytics across all systems. Emphasize that Rise works WITH their existing investment.`;
  } else if (primaryCompetitor?.category === 'Analytics') {
    winBackStrategy = `Highlight FI-specific advantages over generic ${primaryCompetitor.name}. Show pre-built FI dashboards and KPIs. Calculate total cost of ownership including customization.`;
  } else {
    winBackStrategy = `This is a greenfield opportunity. Focus on time savings and ROI from moving beyond manual processes. Start small and expand.`;
  }

  // Recommended approach
  let recommendedApproach = '';
  if (displacementDifficulty >= 7) {
    recommendedApproach = 'Long-term relationship building. Focus on a specific pain point their current vendors don\'t solve. Get a small pilot to prove value.';
  } else if (displacementDifficulty >= 4) {
    recommendedApproach = 'Competitive displacement possible. Lead with ROI and time-to-value. Offer proof of concept with their actual data.';
  } else {
    recommendedApproach = 'High win probability. Move quickly with a compelling offer. Focus on quick wins and ease of implementation.';
  }

  // Market position description
  let marketPosition = '';
  if (lead.assets >= 10000000000) {
    marketPosition = 'Enterprise - likely has full vendor ecosystem';
  } else if (lead.assets >= 1000000000) {
    marketPosition = 'Mid-market - selective vendor relationships';
  } else if (lead.assets >= 100000000) {
    marketPosition = 'Growth stage - evaluating modern solutions';
  } else {
    marketPosition = 'Community - pragmatic, ROI-focused';
  }

  return {
    currentVendors: competitors,
    marketPosition,
    switchingCost,
    contractRenewalWindow: 'Q4 (typical for most FI contracts)',
    competitiveThreats: threats,
    winBackStrategy,
    displacementDifficulty,
    recommendedApproach
  };
}

// Get battle card for specific competitor
export function getBattleCard(competitorId: string): BattleCard | null {
  return COMPETITORS[competitorId]?.battleCard || null;
}

// Get all competitors
export function getAllCompetitors(): Competitor[] {
  return Object.values(COMPETITORS);
}

// Calculate win probability against competitors
export function calculateWinProbability(competitors: CompetitorPresence[]): number {
  if (competitors.length === 0) return 85; // Greenfield

  // Weight by presence and satisfaction
  let totalWeight = 0;
  let weightedWinRate = 0;

  for (const cp of competitors) {
    let weight = 1;
    if (cp.satisfaction === 'Low') weight = 1.5; // More likely to switch
    if (cp.satisfaction === 'High') weight = 0.5; // Less likely to switch
    if (cp.competitor.strength === 'Strong') weight *= 0.8;
    if (cp.competitor.strength === 'Weak') weight *= 1.2;

    totalWeight += weight;
    weightedWinRate += cp.competitor.winRate * weight;
  }

  return Math.round(weightedWinRate / totalWeight);
}

// Get competitive positioning summary
export function getCompetitivePositioning(competitors: CompetitorPresence[]): string {
  if (competitors.length === 0) {
    return 'Greenfield opportunity - no significant competition identified.';
  }

  const primaryCompetitor = competitors[0].competitor;
  const winProb = calculateWinProbability(competitors);

  if (winProb >= 70) {
    return `Strong position against ${primaryCompetitor.name}. Lead with Rise advantages: ${primaryCompetitor.weaknesses.slice(0, 2).join(', ')}.`;
  } else if (winProb >= 50) {
    return `Competitive against ${primaryCompetitor.name}. Focus on differentiation and proof of value.`;
  } else {
    return `Challenging against ${primaryCompetitor.name}. Build long-term relationship and wait for dissatisfaction trigger.`;
  }
}
