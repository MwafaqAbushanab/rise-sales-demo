// Deal Coaching Engine - Real-time AI-powered sales coaching
// Provides actionable suggestions at every stage of the sales process

export interface DealStage {
  id: string;
  name: string;
  description: string;
  typical_days: number;
  key_activities: string[];
  success_criteria: string[];
}

export interface CoachingTip {
  type: 'warning' | 'opportunity' | 'action' | 'insight';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestedAction?: string;
  impact?: string;
}

export interface DealRisk {
  category: 'stalled' | 'competitive' | 'budget' | 'champion' | 'timeline' | 'technical';
  severity: 'critical' | 'high' | 'medium' | 'low';
  indicator: string;
  mitigation: string;
}

export interface WinProbability {
  score: number;
  trend: 'up' | 'down' | 'stable';
  factors: {
    positive: string[];
    negative: string[];
  };
  recommendations: string[];
}

export interface FollowUpSequence {
  id: string;
  name: string;
  dayOffset: number;
  channel: 'email' | 'phone' | 'linkedin' | 'meeting';
  subject?: string;
  template: string;
  purpose: string;
}

export interface ObjectionResponse {
  objection: string;
  category: 'price' | 'timing' | 'competition' | 'need' | 'authority' | 'trust';
  response: string;
  proofPoints: string[];
  followUp: string;
}

// Sales stages with coaching guidance
export const DEAL_STAGES: DealStage[] = [
  {
    id: 'new',
    name: 'New Lead',
    description: 'Lead identified but not yet contacted',
    typical_days: 3,
    key_activities: ['Research company background', 'Identify decision makers', 'Prepare personalized outreach'],
    success_criteria: ['Initial contact made', 'Interest confirmed', 'Meeting scheduled']
  },
  {
    id: 'contacted',
    name: 'Contacted',
    description: 'Initial outreach made, awaiting response',
    typical_days: 7,
    key_activities: ['Follow up 3x', 'Try multiple channels', 'Provide value content'],
    success_criteria: ['Response received', 'Conversation started', 'Needs identified']
  },
  {
    id: 'qualified',
    name: 'Qualified',
    description: 'BANT criteria confirmed, genuine opportunity',
    typical_days: 14,
    key_activities: ['Deep discovery call', 'Stakeholder mapping', 'ROI discussion'],
    success_criteria: ['Budget confirmed', 'Timeline known', 'Champion identified']
  },
  {
    id: 'demo_scheduled',
    name: 'Demo Scheduled',
    description: 'Product demonstration scheduled',
    typical_days: 7,
    key_activities: ['Customize demo', 'Include decision makers', 'Prepare use cases'],
    success_criteria: ['Demo completed', 'Positive feedback', 'Next steps agreed']
  },
  {
    id: 'proposal_sent',
    name: 'Proposal Sent',
    description: 'Formal proposal submitted',
    typical_days: 14,
    key_activities: ['Follow up on proposal', 'Address questions', 'Negotiate terms'],
    success_criteria: ['Proposal reviewed', 'Objections handled', 'Verbal commitment']
  },
  {
    id: 'won',
    name: 'Closed Won',
    description: 'Deal closed successfully',
    typical_days: 0,
    key_activities: ['Contract signed', 'Kickoff scheduled', 'Success metrics defined'],
    success_criteria: ['Payment received', 'Implementation started']
  },
  {
    id: 'lost',
    name: 'Closed Lost',
    description: 'Opportunity did not close',
    typical_days: 0,
    key_activities: ['Win/loss analysis', 'Future nurture plan', 'Lessons learned'],
    success_criteria: ['Feedback gathered', 'Re-engagement plan created']
  }
];

// Objection handling library
export const OBJECTION_LIBRARY: ObjectionResponse[] = [
  // Price objections
  {
    objection: "Your solution is too expensive",
    category: 'price',
    response: "I understand budget is a concern. Let me share some context: our average customer sees 211% ROI within the first year, with payback in just 4.2 months. For an institution your size, we estimate $[ANNUAL_BENEFIT] in annual value from efficiency gains alone. Would it help to walk through the specific ROI calculation for [INSTITUTION_NAME]?",
    proofPoints: [
      "211% average first-year ROI across 150+ customers",
      "4.2 month average payback period",
      "20-30% reduction in reporting time",
      "15% improvement in loan decisioning speed"
    ],
    followUp: "Can I send you a detailed ROI analysis customized to your institution's metrics?"
  },
  {
    objection: "We need to cut costs right now",
    category: 'price',
    response: "That's exactly why analytics becomes even more critical during cost-conscious times. Our customers typically find $50K-$200K in hidden operational costs within 90 days. One credit union found they were losing $180K annually on dormant accounts they didn't know about. Would a cost-discovery analysis be valuable for your team?",
    proofPoints: [
      "Average $125K discovered in operational inefficiencies",
      "$180K found in dormant account losses at similar CU",
      "15% reduction in manual reporting costs"
    ],
    followUp: "Would your CFO be interested in a 30-minute cost discovery session?"
  },
  // Timing objections
  {
    objection: "We're not ready to make a decision right now",
    category: 'timing',
    response: "Completely understand. What timeline are you considering? I ask because we're currently offering priority implementation slots, and I'd hate for you to face a 3-month queue when you're ready. In the meantime, would it be helpful to share some benchmarking data comparing your metrics to similar institutions?",
    proofPoints: [
      "Implementation typically 4-6 weeks",
      "Queue times can extend to 3+ months in Q4",
      "Early planning enables Q1 budget allocation"
    ],
    followUp: "Can I set a reminder to reconnect in [TIMEFRAME] to check your priorities?"
  },
  {
    objection: "We're in the middle of a core conversion",
    category: 'timing',
    response: "Actually, that's perfect timing. Most institutions find post-conversion is when they need analytics most - validating data migration, ensuring reporting accuracy, and measuring performance changes. We can be ready to go-live alongside your new core. Would your project team benefit from seeing how others have handled analytics during conversions?",
    proofPoints: [
      "Integrated with 15+ core banking systems",
      "Data validation tools for conversion accuracy",
      "Same-day go-live with new core systems"
    ],
    followUp: "Who's leading your conversion project? I'd love to share some best practices."
  },
  // Competition objections
  {
    objection: "We're already using [Jack Henry/Fiserv]",
    category: 'competition',
    response: "Many of our customers started with their core provider's analytics too. The challenge they found was the lack of flexibility and the 6-12 month implementation cycles. We typically go live in 4-6 weeks with no IT burden. Would it be valuable to see a side-by-side comparison of capabilities?",
    proofPoints: [
      "4-6 week implementation vs 6-12 months",
      "No IT resources required",
      "Pre-built credit union-specific dashboards",
      "10x faster report creation"
    ],
    followUp: "Would you like to speak with a similar-sized credit union that switched from [COMPETITOR]?"
  },
  {
    objection: "We use Tableau/Power BI and it works fine",
    category: 'competition',
    response: "Both are powerful tools. What we hear from institutions who've made that work is they need 1-2 dedicated analysts and 6+ months to build credit union-specific reports. Rise Analytics gives you 50+ pre-built reports on day one, with no data modeling required. How much of your team's time goes into building and maintaining reports today?",
    proofPoints: [
      "50+ pre-built CU-specific dashboards",
      "No data engineering required",
      "Pre-mapped to NCUA call codes",
      "CECL-ready compliance reports"
    ],
    followUp: "Would your team benefit from seeing how much time they'd save with pre-built reports?"
  },
  // Need objections
  {
    objection: "We don't think we need analytics",
    category: 'need',
    response: "That's an interesting perspective. Can I ask - when the board asks about member growth trends or loan portfolio performance, how quickly can you get those answers? Most institutions we talk to spend 2-3 days pulling data from multiple systems. Our customers get those answers in seconds. What's that efficiency worth to your team?",
    proofPoints: [
      "Average 20 hours/month saved on reporting",
      "Real-time portfolio visibility",
      "Board-ready reports in one click"
    ],
    followUp: "Would a 15-minute demo showing how we answer common board questions be valuable?"
  },
  {
    objection: "Our spreadsheets work fine",
    category: 'need',
    response: "Spreadsheets definitely get the job done. The question is efficiency and risk. We recently helped a credit union that discovered $40K in errors from manual spreadsheet processes. Beyond errors, imagine reclaiming 15-20 hours per month currently spent on manual data pulling. What could your team accomplish with that time?",
    proofPoints: [
      "$40K discovered in spreadsheet errors",
      "15-20 hours/month saved on manual work",
      "Audit trail and data governance included",
      "Version control and collaboration built-in"
    ],
    followUp: "Could I show you a 10-minute demo of how we automate your top 3 reports?"
  },
  // Authority objections
  {
    objection: "I need to get buy-in from the board/CEO",
    category: 'authority',
    response: "Absolutely, that makes sense for an investment like this. I'd be happy to help prepare materials for that conversation. We have a board presentation deck that shows the ROI case in their language. Would it help if I customized it with your institution's specific metrics and potential value?",
    proofPoints: [
      "Board-ready ROI presentation included",
      "Peer comparison data available",
      "Customer references from similar institutions"
    ],
    followUp: "When is your next board meeting? I can have materials ready well in advance."
  },
  {
    objection: "IT needs to approve this",
    category: 'authority',
    response: "Great - IT involvement ensures a smooth implementation. Here's the good news: Rise Analytics is cloud-based with zero on-premise installation. We handle all maintenance, security, and updates. IT typically loves us because there's no burden on their team. Would your IT lead like to speak with our technical team?",
    proofPoints: [
      "Zero IT resources required for implementation",
      "SOC 2 Type II certified",
      "Bank-grade encryption",
      "99.9% uptime SLA"
    ],
    followUp: "Can I arrange a 20-minute technical call with your IT team?"
  },
  // Trust objections
  {
    objection: "We've never heard of Rise Analytics",
    category: 'trust',
    response: "That's fair - we focus our marketing on the credit union and community bank space rather than broad brand awareness. We're used by 150+ financial institutions, including several in your state. I'd be happy to connect you with reference customers of similar size. Would that be helpful?",
    proofPoints: [
      "150+ credit union and bank customers",
      "Founded 2018, profitable and growing",
      "Austin, Texas headquarters",
      "100% focused on financial institutions"
    ],
    followUp: "Would you like to speak with [REFERENCE_NAME] at [REFERENCE_CU]? They're a similar size and in your region."
  },
  {
    objection: "What if you go out of business?",
    category: 'trust',
    response: "A legitimate concern. Here's why our customers feel confident: we're profitable with 150+ customers, backed by strategic investors, and growing 40% year-over-year. We also offer data portability - your data is always yours. And because we use standard formats, transitioning would be straightforward if ever needed. Would you like to see our latest growth metrics?",
    proofPoints: [
      "Profitable company since 2021",
      "40% YoY revenue growth",
      "150+ customers (95% retention)",
      "Full data portability guaranteed"
    ],
    followUp: "Can I share our annual report and customer growth timeline?"
  }
];

// Generate deal coaching tips based on current state
export function generateCoachingTips(
  leadStatus: string,
  daysInStage: number,
  assets: number,
  hasCompetitor: boolean,
  lastContactDays: number
): CoachingTip[] {
  const tips: CoachingTip[] = [];
  const stage = DEAL_STAGES.find(s => s.id === leadStatus);

  if (!stage) return tips;

  // Check if deal is stalling
  if (daysInStage > stage.typical_days * 1.5) {
    tips.push({
      type: 'warning',
      priority: 'high',
      title: 'Deal Stalling',
      description: `This opportunity has been in "${stage.name}" for ${daysInStage} days (typical: ${stage.typical_days} days).`,
      suggestedAction: 'Schedule a check-in call to uncover blockers and re-establish momentum.',
      impact: 'Stalled deals close 40% less frequently than deals with steady progression.'
    });
  }

  // No contact in a while
  if (lastContactDays > 7 && leadStatus !== 'won' && leadStatus !== 'lost') {
    tips.push({
      type: 'action',
      priority: lastContactDays > 14 ? 'high' : 'medium',
      title: 'Follow Up Needed',
      description: `No contact in ${lastContactDays} days. Momentum may be fading.`,
      suggestedAction: 'Send a value-add email or share relevant content to re-engage.',
      impact: 'Response rates drop 21% for each week without contact.'
    });
  }

  // Large deal coaching
  if (assets > 5000000000) {
    tips.push({
      type: 'insight',
      priority: 'medium',
      title: 'Enterprise Deal Detected',
      description: `This is a $${(assets / 1000000000).toFixed(1)}B+ institution - enterprise sales process recommended.`,
      suggestedAction: 'Identify executive sponsor, map all stakeholders, prepare custom business case.',
      impact: 'Enterprise deals require 2-3x more stakeholder engagement but have 60% higher lifetime value.'
    });
  }

  // Competitive situation
  if (hasCompetitor) {
    tips.push({
      type: 'opportunity',
      priority: 'high',
      title: 'Competitive Displacement Opportunity',
      description: 'Incumbent vendor detected. Focus on implementation speed and modern UX.',
      suggestedAction: 'Lead with "4-6 week implementation vs 6-12 months" and offer proof-of-concept.',
      impact: 'Win rate increases 35% when leading with speed-to-value messaging.'
    });
  }

  // Stage-specific tips
  switch (leadStatus) {
    case 'new':
      tips.push({
        type: 'action',
        priority: 'high',
        title: 'Research Before Outreach',
        description: 'Personalized outreach gets 3x response rate.',
        suggestedAction: 'Check LinkedIn for recent hires, news, and strategic initiatives before reaching out.',
        impact: 'Personalized emails have 29% higher open rates and 41% higher reply rates.'
      });
      break;
    case 'contacted':
      tips.push({
        type: 'insight',
        priority: 'medium',
        title: 'Multi-Channel Follow-Up',
        description: 'Using 3+ channels increases response rate by 2.5x.',
        suggestedAction: 'Try email, phone, AND LinkedIn. Reference their specific situation.',
        impact: 'Prospects who engage across multiple channels close 24% faster.'
      });
      break;
    case 'qualified':
      tips.push({
        type: 'opportunity',
        priority: 'high',
        title: 'Build ROI Case Now',
        description: 'ROI-focused discussions win 30% more often.',
        suggestedAction: 'Use the ROI Calculator to build a custom business case before the demo.',
        impact: 'Deals with documented ROI cases have 43% higher close rates.'
      });
      break;
    case 'demo_scheduled':
      tips.push({
        type: 'action',
        priority: 'high',
        title: 'Demo Preparation',
        description: 'Customize the demo to their specific pain points.',
        suggestedAction: 'Prepare 3 use cases specific to their institution type and size.',
        impact: 'Customized demos generate 60% more follow-up meetings.'
      });
      break;
    case 'proposal_sent':
      tips.push({
        type: 'warning',
        priority: 'high',
        title: 'Proposal Follow-Up Critical',
        description: 'Win rate drops 50% if no response within 5 days.',
        suggestedAction: 'Schedule a call to walk through the proposal together.',
        impact: 'Proposals discussed live close 80% more often than email-only.'
      });
      break;
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return tips.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// Calculate deal risk score
export function assessDealRisks(
  leadStatus: string,
  daysInStage: number,
  lastContactDays: number,
  hasChampion: boolean,
  budgetConfirmed: boolean,
  timelineConfirmed: boolean,
  competitorStrength: 'weak' | 'moderate' | 'strong' | 'unknown'
): DealRisk[] {
  const risks: DealRisk[] = [];

  // Stalled deal risk
  const stage = DEAL_STAGES.find(s => s.id === leadStatus);
  if (stage && daysInStage > stage.typical_days * 2) {
    risks.push({
      category: 'stalled',
      severity: 'critical',
      indicator: `Deal has been in ${stage.name} for ${daysInStage} days (2x+ typical)`,
      mitigation: 'Immediate intervention needed. Offer incentive, escalate, or create urgency.'
    });
  } else if (stage && daysInStage > stage.typical_days * 1.5) {
    risks.push({
      category: 'stalled',
      severity: 'high',
      indicator: `Deal progressing slower than typical for ${stage.name} stage`,
      mitigation: 'Schedule discovery call to identify blockers.'
    });
  }

  // Champion risk
  if (!hasChampion && leadStatus !== 'new' && leadStatus !== 'contacted') {
    risks.push({
      category: 'champion',
      severity: 'critical',
      indicator: 'No internal champion identified',
      mitigation: 'Focus on building relationship with key stakeholder who will advocate internally.'
    });
  }

  // Budget risk
  if (!budgetConfirmed && ['qualified', 'demo_scheduled', 'proposal_sent'].includes(leadStatus)) {
    risks.push({
      category: 'budget',
      severity: leadStatus === 'proposal_sent' ? 'critical' : 'high',
      indicator: 'Budget not confirmed at this stage',
      mitigation: 'Discuss budget range and decision process before proceeding.'
    });
  }

  // Timeline risk
  if (!timelineConfirmed && ['demo_scheduled', 'proposal_sent'].includes(leadStatus)) {
    risks.push({
      category: 'timeline',
      severity: 'high',
      indicator: 'No clear timeline for decision',
      mitigation: 'Establish decision date and work backwards to create project plan.'
    });
  }

  // Competitive risk
  if (competitorStrength === 'strong') {
    risks.push({
      category: 'competitive',
      severity: 'high',
      indicator: 'Strong incumbent or competitor in play',
      mitigation: 'Lead with differentiation: speed, modern UX, pre-built compliance. Offer POC.'
    });
  } else if (competitorStrength === 'moderate') {
    risks.push({
      category: 'competitive',
      severity: 'medium',
      indicator: 'Competitive evaluation in progress',
      mitigation: 'Emphasize unique value and secure champion commitment.'
    });
  }

  // Contact frequency risk
  if (lastContactDays > 14) {
    risks.push({
      category: 'stalled',
      severity: lastContactDays > 21 ? 'critical' : 'high',
      indicator: `No contact in ${lastContactDays} days`,
      mitigation: 'Re-engage immediately with value-add content or compelling offer.'
    });
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return risks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

// Calculate win probability
export function calculateWinProbability(
  leadStatus: string,
  daysInStage: number,
  assets: number,
  hasChampion: boolean,
  budgetConfirmed: boolean,
  competitorStrength: 'weak' | 'moderate' | 'strong' | 'unknown',
  engagementLevel: 'low' | 'medium' | 'high'
): WinProbability {
  let baseScore = 0;
  const positive: string[] = [];
  const negative: string[] = [];
  const recommendations: string[] = [];

  // Base score by stage
  const stageScores: Record<string, number> = {
    new: 10,
    contacted: 15,
    qualified: 35,
    demo_scheduled: 55,
    proposal_sent: 70,
    won: 100,
    lost: 0
  };
  baseScore = stageScores[leadStatus] || 10;

  // Champion bonus/penalty
  if (hasChampion) {
    baseScore += 15;
    positive.push('Internal champion identified (+15%)');
  } else if (['qualified', 'demo_scheduled', 'proposal_sent'].includes(leadStatus)) {
    baseScore -= 10;
    negative.push('No internal champion (-10%)');
    recommendations.push('Focus on identifying and nurturing an internal advocate');
  }

  // Budget confirmation
  if (budgetConfirmed) {
    baseScore += 10;
    positive.push('Budget confirmed (+10%)');
  } else if (['demo_scheduled', 'proposal_sent'].includes(leadStatus)) {
    baseScore -= 8;
    negative.push('Budget not confirmed (-8%)');
    recommendations.push('Discuss budget range before proceeding');
  }

  // Competitor impact
  switch (competitorStrength) {
    case 'strong':
      baseScore -= 15;
      negative.push('Strong competitor presence (-15%)');
      recommendations.push('Lead with differentiation and speed-to-value');
      break;
    case 'moderate':
      baseScore -= 8;
      negative.push('Active competitive evaluation (-8%)');
      break;
    case 'weak':
      baseScore += 5;
      positive.push('Weak or no competition (+5%)');
      break;
  }

  // Engagement level
  switch (engagementLevel) {
    case 'high':
      baseScore += 10;
      positive.push('High engagement level (+10%)');
      break;
    case 'low':
      baseScore -= 12;
      negative.push('Low engagement level (-12%)');
      recommendations.push('Increase touchpoints and provide value content');
      break;
  }

  // Deal size impact (larger deals are harder to close)
  if (assets > 10000000000) {
    baseScore -= 10;
    negative.push('Enterprise deal complexity (-10%)');
    recommendations.push('Map all stakeholders and build executive relationships');
  } else if (assets > 5000000000) {
    baseScore -= 5;
    negative.push('Large deal, extended timeline expected (-5%)');
  } else if (assets < 500000000) {
    baseScore += 5;
    positive.push('SMB deal, faster decision cycle (+5%)');
  }

  // Stage timing impact
  const stage = DEAL_STAGES.find(s => s.id === leadStatus);
  if (stage) {
    if (daysInStage > stage.typical_days * 2) {
      baseScore -= 15;
      negative.push('Deal significantly stalled (-15%)');
      recommendations.push('Immediate intervention required - consider executive outreach');
    } else if (daysInStage > stage.typical_days * 1.5) {
      baseScore -= 8;
      negative.push('Deal progressing slowly (-8%)');
      recommendations.push('Schedule call to uncover and address blockers');
    } else if (daysInStage < stage.typical_days * 0.5) {
      baseScore += 5;
      positive.push('Fast progression (+5%)');
    }
  }

  // Clamp score
  const finalScore = Math.max(5, Math.min(95, baseScore));

  // Determine trend
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (engagementLevel === 'high' && !negative.some(n => n.includes('stalled'))) {
    trend = 'up';
  } else if (negative.length > positive.length || negative.some(n => n.includes('stalled'))) {
    trend = 'down';
  }

  return {
    score: finalScore,
    trend,
    factors: { positive, negative },
    recommendations: recommendations.slice(0, 3)
  };
}

// Generate automated follow-up sequence
export function generateFollowUpSequence(
  leadStatus: string,
  institutionName: string,
  contactName: string,
  productFocus: string,
  _customContext?: string
): FollowUpSequence[] {
  const sequences: Record<string, FollowUpSequence[]> = {
    new: [
      {
        id: 'new-1',
        name: 'Initial Outreach',
        dayOffset: 0,
        channel: 'email',
        subject: `Quick question about analytics at ${institutionName}`,
        template: `Hi ${contactName || '[Name]'},

I noticed ${institutionName} is [SPECIFIC_OBSERVATION].

Quick question - how is your team currently handling [RELEVANT_CHALLENGE]?

We've helped similar institutions reduce reporting time by 60% and improve decision-making speed significantly.

Would a 15-minute call to share what we're seeing in the market be valuable?

Best,
[Your Name]`,
        purpose: 'Initial value-based outreach to generate interest'
      },
      {
        id: 'new-2',
        name: 'Follow-Up Value Add',
        dayOffset: 3,
        channel: 'email',
        subject: `Resource for ${institutionName}: Analytics ROI Study`,
        template: `Hi ${contactName || '[Name]'},

Following up on my earlier note. Thought you might find this interesting:

We recently published a study showing credit unions are achieving 211% ROI on analytics investments, with payback in under 5 months.

Here's the key insight: institutions spending 15+ hours/month on manual reporting are seeing the biggest gains.

Worth a quick chat to see how ${institutionName} compares?

Best,
[Your Name]`,
        purpose: 'Provide value and re-engage with data'
      },
      {
        id: 'new-3',
        name: 'Phone Follow-Up',
        dayOffset: 5,
        channel: 'phone',
        template: `Hi ${contactName || 'there'}, this is [Your Name] from Rise Analytics. I sent you a couple of notes about analytics for ${institutionName}. I won't take much of your time - just wanted to see if you had a chance to review and if it's worth a quick conversation. What's your current approach to member analytics?`,
        purpose: 'Voice outreach to break through'
      },
      {
        id: 'new-4',
        name: 'LinkedIn Connect',
        dayOffset: 7,
        channel: 'linkedin',
        template: `Hi ${contactName || '[Name]'} - I work with credit unions on analytics and noticed ${institutionName}. Would love to connect and share some insights we're seeing in the industry. No pitch, just networking!`,
        purpose: 'Social touch to expand presence'
      },
      {
        id: 'new-5',
        name: 'Breakup Email',
        dayOffset: 14,
        channel: 'email',
        subject: `Closing the loop on analytics for ${institutionName}`,
        template: `Hi ${contactName || '[Name]'},

I've reached out a few times about analytics and data intelligence for ${institutionName}.

I don't want to be a pest, so I'll assume the timing isn't right.

If things change or you'd like to explore this down the road, I'm always happy to help.

Best of luck with everything!

[Your Name]

P.S. - If analytics does become a priority, our waitlist is currently 6-8 weeks for implementation.`,
        purpose: 'Close loop professionally, create urgency'
      }
    ],
    contacted: [
      {
        id: 'contacted-1',
        name: 'Discovery Meeting Request',
        dayOffset: 0,
        channel: 'email',
        subject: `Next step: Discovery call for ${institutionName}`,
        template: `Hi ${contactName || '[Name]'},

Great connecting! As promised, I'd love to learn more about ${institutionName}'s analytics priorities.

In our call, I'll share:
• How similar institutions are solving [THEIR_CHALLENGE]
• Our ROI benchmarks for institutions your size
• A quick look at our platform (optional, based on interest)

Do any of these times work for a 30-minute call?
• [TIME_OPTION_1]
• [TIME_OPTION_2]
• [TIME_OPTION_3]

Looking forward to it!

[Your Name]`,
        purpose: 'Convert interest to meeting'
      }
    ],
    qualified: [
      {
        id: 'qualified-1',
        name: 'Demo Scheduling',
        dayOffset: 0,
        channel: 'email',
        subject: `Customized demo for ${institutionName}`,
        template: `Hi ${contactName || '[Name]'},

Based on our conversation, I'd love to show you exactly how Rise Analytics would work for ${institutionName}.

For the demo, I'll focus on:
1. ${productFocus || 'Member 360'} - since this addresses your [PAIN_POINT]
2. Real-time dashboards you could use immediately
3. ROI calculator with your actual numbers

Who else should join from your team? I want to make sure we address everyone's questions.

Does [DATE/TIME] work for 45 minutes?

[Your Name]`,
        purpose: 'Schedule demo with full buying committee'
      },
      {
        id: 'qualified-2',
        name: 'Pre-Demo Prep',
        dayOffset: 3,
        channel: 'email',
        subject: `Preparing your demo - quick question`,
        template: `Hi ${contactName || '[Name]'},

Looking forward to our demo on [DATE].

To make sure I show you the most relevant capabilities, quick question:

What's the #1 report or analysis that takes your team the most time today?

I'll build it live in the demo so you can see exactly how Rise would handle it.

Thanks!
[Your Name]`,
        purpose: 'Customize demo and confirm commitment'
      }
    ],
    demo_scheduled: [
      {
        id: 'demo-1',
        name: 'Demo Confirmation',
        dayOffset: -1,
        channel: 'email',
        subject: `Tomorrow: Rise Analytics demo for ${institutionName}`,
        template: `Hi ${contactName || '[Name]'},

Quick reminder about our demo tomorrow at [TIME].

I've customized the session based on ${institutionName}'s priorities:
• [FOCUS_AREA_1]
• [FOCUS_AREA_2]
• [FOCUS_AREA_3]

Here's the meeting link: [LINK]

See you tomorrow!
[Your Name]`,
        purpose: 'Confirm attendance and set expectations'
      },
      {
        id: 'demo-2',
        name: 'Post-Demo Follow-Up',
        dayOffset: 1,
        channel: 'email',
        subject: `Next steps after our demo`,
        template: `Hi ${contactName || '[Name]'},

Thanks for your time yesterday! Based on our discussion, here's what I'm thinking for next steps:

**Key Takeaways:**
• ${productFocus || 'Member 360'} would address your [CHALLENGE]
• Implementation: 4-6 weeks, no IT required
• Estimated value: [ROI_ESTIMATE]

**Proposed Next Steps:**
1. Share demo recording with your team
2. Schedule technical call with IT (optional)
3. Review custom proposal

Questions on anything we covered?

[Your Name]`,
        purpose: 'Reinforce value and establish next steps'
      }
    ],
    proposal_sent: [
      {
        id: 'proposal-1',
        name: 'Proposal Review Call',
        dayOffset: 2,
        channel: 'phone',
        template: `Hi ${contactName || 'there'}, it's [Your Name] from Rise Analytics. I wanted to follow up on the proposal I sent over for ${institutionName}. Have you had a chance to review it? I'd love to walk through any questions live - it's much easier than email. Do you have 15 minutes this week?`,
        purpose: 'Get live discussion of proposal'
      },
      {
        id: 'proposal-2',
        name: 'Decision Timeline Check',
        dayOffset: 5,
        channel: 'email',
        subject: `Proposal timing for ${institutionName}`,
        template: `Hi ${contactName || '[Name]'},

Following up on the proposal - wanted to check on your timeline.

A few customers have asked about year-end pricing, so I want to make sure ${institutionName} doesn't miss out if that matters for your budget cycle.

What's your ideal timeline for making a decision?

[Your Name]`,
        purpose: 'Create urgency and understand decision timeline'
      },
      {
        id: 'proposal-3',
        name: 'Stakeholder Check',
        dayOffset: 10,
        channel: 'email',
        subject: `Question about your decision process`,
        template: `Hi ${contactName || '[Name]'},

Quick question - is there anyone else on your team who needs to weigh in on the proposal?

Happy to schedule a call with IT, finance, or executive leadership if that would help move things forward.

Also, if there are any concerns holding things up, I'd love to address them directly.

[Your Name]`,
        purpose: 'Identify blockers and engage stakeholders'
      }
    ]
  };

  return sequences[leadStatus] || sequences['new'];
}

// Find best objection response
export function findObjectionResponse(objectionText: string): ObjectionResponse | null {
  const lowerObjection = objectionText.toLowerCase();

  // Keywords for each category
  const categoryKeywords: Record<string, string[]> = {
    price: ['expensive', 'cost', 'price', 'budget', 'afford', 'cheaper', 'too much', 'money'],
    timing: ['not ready', 'later', 'next year', 'core conversion', 'busy', 'timing', 'wait'],
    competition: ['jack henry', 'fiserv', 'tableau', 'power bi', 'already using', 'current vendor'],
    need: ['don\'t need', 'not sure we need', 'spreadsheet', 'excel', 'works fine'],
    authority: ['board', 'ceo', 'it needs', 'approval', 'committee', 'buy-in'],
    trust: ['never heard', 'new company', 'go out of business', 'small company']
  };

  // Find matching category
  let matchedCategory: string | null = null;
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => lowerObjection.includes(kw))) {
      matchedCategory = category;
      break;
    }
  }

  if (!matchedCategory) return null;

  // Find best matching objection response
  const categoryResponses = OBJECTION_LIBRARY.filter(o => o.category === matchedCategory);

  // Simple matching - return first match in category
  // Could be enhanced with semantic similarity
  return categoryResponses[0] || null;
}

