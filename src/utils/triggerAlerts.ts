// Financial Trigger Alerts Engine
// Monitors FDIC/NCUA data changes to detect buying signals

import { type Lead, formatCurrency } from '../types';

// ── Types ──────────────────────────────────────────────────────────────

export type AlertType = 'growth' | 'distress' | 'scale' | 'opportunity';
export type PriorityTier = 'Critical' | 'High' | 'Medium' | 'Low';

export interface AlertMetric {
  label: string;
  previous: number;
  current: number;
  change: string;
}

export interface TriggerAlert {
  id: string;
  leadId: string;
  lead: Lead;
  type: AlertType;
  category: string;
  priority: number;
  priorityTier: PriorityTier;
  title: string;
  description: string;
  metrics: AlertMetric[];
  suggestedAction: string;
  suggestedProduct: string;
  detectedAt: string;
}

export interface InstitutionSnapshot {
  assets: number;
  deposits: number;
  members: number;
  roa: number;
  branches: number;
  // NCUA 5300 Call Report metrics (optional — available for CUs with call report data)
  delinquencyRatio?: number;
  netChargeOffRatio?: number;
  netWorthRatio?: number;
  efficiencyRatio?: number;
}

export interface FinancialSnapshot {
  timestamp: string;
  institutions: Record<string, InstitutionSnapshot>;
}

export interface AlertState {
  dismissed: string[];
  reviewed: string[];
}

export interface AlertSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: Record<AlertType, number>;
}

// ── Snapshot ───────────────────────────────────────────────────────────

export function createSnapshot(leads: Lead[]): FinancialSnapshot {
  const institutions: Record<string, InstitutionSnapshot> = {};
  for (const lead of leads) {
    const snap: InstitutionSnapshot = {
      assets: lead.assets,
      deposits: lead.deposits,
      members: lead.members,
      roa: lead.roa,
      branches: lead.branches,
    };
    // Include 5300 data if available
    if (lead.callReport?.latestQuarter) {
      snap.delinquencyRatio = lead.callReport.latestQuarter.delinquencyRatio;
      snap.netChargeOffRatio = lead.callReport.latestQuarter.netChargeOffRatio;
      snap.netWorthRatio = lead.callReport.latestQuarter.netWorthRatio;
      snap.efficiencyRatio = lead.callReport.latestQuarter.efficiencyRatio;
    }
    institutions[lead.id] = snap;
  }
  return { timestamp: new Date().toISOString(), institutions };
}

// ── Priority Scoring ──────────────────────────────────────────────────

const TYPE_WEIGHTS: Record<AlertType, number> = {
  distress: 30,
  growth: 25,
  opportunity: 20,
  scale: 15,
};

function getPriorityTier(priority: number): PriorityTier {
  if (priority >= 80) return 'Critical';
  if (priority >= 60) return 'High';
  if (priority >= 40) return 'Medium';
  return 'Low';
}

function calculateAlertPriority(type: AlertType, lead: Lead, changeMagnitude: number): number {
  let score = TYPE_WEIGHTS[type] || 15;

  // Magnitude bonus (capped at 30)
  score += Math.min(changeMagnitude * 1.5, 30);

  // Institution size bonus
  if (lead.assets >= 10_000_000_000) score += 25;
  else if (lead.assets >= 5_000_000_000) score += 20;
  else if (lead.assets >= 1_000_000_000) score += 15;
  else if (lead.assets >= 500_000_000) score += 10;
  else if (lead.assets >= 100_000_000) score += 5;

  // Already in pipeline = lower priority
  if (lead.status !== 'new') score -= 10;

  return Math.min(Math.max(Math.round(score), 0), 100);
}

// ── Suggested Actions & Products ──────────────────────────────────────

function getSuggestedAction(type: AlertType, category: string, lead: Lead): string {
  const inst = lead.type === 'Credit Union' ? 'credit union' : 'bank';
  switch (type) {
    case 'growth':
      if (category === 'Member Growth') return `Call to discuss member analytics — their growing base needs deeper insights`;
      if (category === 'Branch Expansion') return `Present multi-branch performance dashboards`;
      return `Reach out about scaling analytics infrastructure for this growing ${inst}`;
    case 'distress':
      if (category === 'ROA Decline') return `Offer a diagnostic analytics review to identify profitability drivers`;
      return `Reach out with data-driven solutions to help reverse the decline`;
    case 'scale':
      return `Present enterprise-grade compliance and reporting for their new size tier`;
    case 'opportunity':
      if (category === 'Greenfield Territory') return `Initiate outreach — landing this ${inst} creates a ${lead.state} reference`;
      return `Prioritize outreach — high-value untouched prospect with budget headroom`;
  }
}

function getSuggestedProduct(type: AlertType, lead: Lead): string {
  if (type === 'growth') {
    if (lead.type === 'Credit Union') return 'Rise Member/Customer 360';
    if (lead.assets >= 1_000_000_000) return 'Rise Data Warehouse';
    return 'Rise Analytics Platform';
  }
  if (type === 'distress') return 'Rise Analytics Platform';
  if (type === 'scale') {
    if (lead.assets >= 1_000_000_000) return 'Rise Compliance Suite';
    return 'Rise Performance Management';
  }
  return 'Rise Analytics Platform';
}

// ── Trigger Detectors ─────────────────────────────────────────────────

function detectGrowthTriggers(lead: Lead, prev: InstitutionSnapshot): TriggerAlert[] {
  const alerts: TriggerAlert[] = [];
  const now = new Date().toISOString();

  // Asset growth >10%
  if (prev.assets > 0) {
    const pct = (lead.assets - prev.assets) / prev.assets;
    if (pct > 0.10) {
      const priority = calculateAlertPriority('growth', lead, pct * 100);
      alerts.push({
        id: `growth-assets-${lead.id}`,
        leadId: lead.id, lead, type: 'growth', category: 'Asset Growth',
        priority, priorityTier: getPriorityTier(priority),
        title: `${lead.name} assets grew ${(pct * 100).toFixed(1)}% to ${formatCurrency(lead.assets)}`,
        description: `Significant asset growth signals expansion and potential need for upgraded analytics infrastructure.`,
        metrics: [{ label: 'Total Assets', previous: prev.assets, current: lead.assets, change: `+${(pct * 100).toFixed(1)}%` }],
        suggestedAction: getSuggestedAction('growth', 'Asset Growth', lead),
        suggestedProduct: getSuggestedProduct('growth', lead),
        detectedAt: now,
      });
    }
  }

  // Member growth >5% (CUs only)
  if (lead.type === 'Credit Union' && prev.members > 0) {
    const pct = (lead.members - prev.members) / prev.members;
    if (pct > 0.05) {
      const priority = calculateAlertPriority('growth', lead, pct * 100);
      alerts.push({
        id: `growth-members-${lead.id}`,
        leadId: lead.id, lead, type: 'growth', category: 'Member Growth',
        priority, priorityTier: getPriorityTier(priority),
        title: `${lead.name} gained ${(lead.members - prev.members).toLocaleString()} members (+${(pct * 100).toFixed(1)}%)`,
        description: `Rapid member growth means more data, more complexity, and a greater need for member analytics.`,
        metrics: [{ label: 'Members', previous: prev.members, current: lead.members, change: `+${(pct * 100).toFixed(1)}%` }],
        suggestedAction: getSuggestedAction('growth', 'Member Growth', lead),
        suggestedProduct: 'Rise Member/Customer 360',
        detectedAt: now,
      });
    }
  }

  // Deposit growth >10%
  if (prev.deposits > 0) {
    const pct = (lead.deposits - prev.deposits) / prev.deposits;
    if (pct > 0.10) {
      const priority = calculateAlertPriority('growth', lead, pct * 100);
      alerts.push({
        id: `growth-deposits-${lead.id}`,
        leadId: lead.id, lead, type: 'growth', category: 'Deposit Growth',
        priority, priorityTier: getPriorityTier(priority),
        title: `${lead.name} deposits grew ${(pct * 100).toFixed(1)}% to ${formatCurrency(lead.deposits)}`,
        description: `Strong deposit inflows indicate growing trust and market position — analytics can help manage and deploy these funds effectively.`,
        metrics: [{ label: 'Total Deposits', previous: prev.deposits, current: lead.deposits, change: `+${(pct * 100).toFixed(1)}%` }],
        suggestedAction: getSuggestedAction('growth', 'Deposit Growth', lead),
        suggestedProduct: getSuggestedProduct('growth', lead),
        detectedAt: now,
      });
    }
  }

  // Branch expansion (banks only)
  if (lead.type === 'Community Bank' && prev.branches > 0 && lead.branches > prev.branches) {
    const diff = lead.branches - prev.branches;
    const priority = calculateAlertPriority('growth', lead, diff * 5);
    alerts.push({
      id: `growth-branches-${lead.id}`,
      leadId: lead.id, lead, type: 'growth', category: 'Branch Expansion',
      priority, priorityTier: getPriorityTier(priority),
      title: `${lead.name} opened ${diff} new branch${diff > 1 ? 'es' : ''} (now ${lead.branches} total)`,
      description: `Branch expansion creates data complexity — multi-branch analytics becomes critical for performance tracking.`,
      metrics: [{ label: 'Branches', previous: prev.branches, current: lead.branches, change: `+${diff}` }],
      suggestedAction: getSuggestedAction('growth', 'Branch Expansion', lead),
      suggestedProduct: 'Rise Analytics Platform',
      detectedAt: now,
    });
  }

  return alerts;
}

function detectDistressTriggers(lead: Lead, prev: InstitutionSnapshot): TriggerAlert[] {
  const alerts: TriggerAlert[] = [];
  const now = new Date().toISOString();

  // ROA decline >0.2 absolute
  if (prev.roa > 0) {
    const drop = prev.roa - lead.roa;
    if (drop > 0.2) {
      const priority = calculateAlertPriority('distress', lead, drop * 20);
      alerts.push({
        id: `distress-roa-${lead.id}`,
        leadId: lead.id, lead, type: 'distress', category: 'ROA Decline',
        priority, priorityTier: getPriorityTier(priority),
        title: `${lead.name} ROA dropped ${drop.toFixed(2)}% to ${lead.roa.toFixed(2)}%`,
        description: `Declining return on assets signals profitability challenges — analytics can help identify root causes and optimize performance.`,
        metrics: [{ label: 'ROA', previous: prev.roa, current: lead.roa, change: `-${drop.toFixed(2)}%` }],
        suggestedAction: getSuggestedAction('distress', 'ROA Decline', lead),
        suggestedProduct: getSuggestedProduct('distress', lead),
        detectedAt: now,
      });
    }
  }

  // Asset decline >5%
  if (prev.assets > 0) {
    const pct = (prev.assets - lead.assets) / prev.assets;
    if (pct > 0.05) {
      const priority = calculateAlertPriority('distress', lead, pct * 100);
      alerts.push({
        id: `distress-assets-${lead.id}`,
        leadId: lead.id, lead, type: 'distress', category: 'Asset Decline',
        priority, priorityTier: getPriorityTier(priority),
        title: `${lead.name} assets declined ${(pct * 100).toFixed(1)}% to ${formatCurrency(lead.assets)}`,
        description: `Asset shrinkage may indicate member/customer attrition or market pressure — data-driven insights can help reverse the trend.`,
        metrics: [{ label: 'Total Assets', previous: prev.assets, current: lead.assets, change: `-${(pct * 100).toFixed(1)}%` }],
        suggestedAction: getSuggestedAction('distress', 'Asset Decline', lead),
        suggestedProduct: getSuggestedProduct('distress', lead),
        detectedAt: now,
      });
    }
  }

  // Member loss >3% (CUs only)
  if (lead.type === 'Credit Union' && prev.members > 0) {
    const pct = (prev.members - lead.members) / prev.members;
    if (pct > 0.03) {
      const priority = calculateAlertPriority('distress', lead, pct * 100);
      alerts.push({
        id: `distress-members-${lead.id}`,
        leadId: lead.id, lead, type: 'distress', category: 'Member Loss',
        priority, priorityTier: getPriorityTier(priority),
        title: `${lead.name} lost ${(prev.members - lead.members).toLocaleString()} members (-${(pct * 100).toFixed(1)}%)`,
        description: `Member attrition signals competitive pressure — member analytics and retention tools are urgently needed.`,
        metrics: [{ label: 'Members', previous: prev.members, current: lead.members, change: `-${(pct * 100).toFixed(1)}%` }],
        suggestedAction: getSuggestedAction('distress', 'Member Loss', lead),
        suggestedProduct: 'Rise Member/Customer 360',
        detectedAt: now,
      });
    }
  }

  // Deposit outflow >5%
  if (prev.deposits > 0) {
    const pct = (prev.deposits - lead.deposits) / prev.deposits;
    if (pct > 0.05) {
      const priority = calculateAlertPriority('distress', lead, pct * 100);
      alerts.push({
        id: `distress-deposits-${lead.id}`,
        leadId: lead.id, lead, type: 'distress', category: 'Deposit Outflow',
        priority, priorityTier: getPriorityTier(priority),
        title: `${lead.name} deposits declined ${(pct * 100).toFixed(1)}% (${formatCurrency(prev.deposits - lead.deposits)} outflow)`,
        description: `Deposit outflows may indicate rate competition or member/customer dissatisfaction — analytics can help track and respond.`,
        metrics: [{ label: 'Total Deposits', previous: prev.deposits, current: lead.deposits, change: `-${(pct * 100).toFixed(1)}%` }],
        suggestedAction: getSuggestedAction('distress', 'Deposit Outflow', lead),
        suggestedProduct: getSuggestedProduct('distress', lead),
        detectedAt: now,
      });
    }
  }

  return alerts;
}

// ── 5300-Based Credit Quality Detectors ──────────────────────────────

function detect5300Triggers(lead: Lead, prev: InstitutionSnapshot): TriggerAlert[] {
  const alerts: TriggerAlert[] = [];
  const now = new Date().toISOString();
  const cr = lead.callReport;
  if (!cr?.latestQuarter) return alerts;
  const q = cr.latestQuarter;

  // Rising delinquency: >50bp QoQ increase
  if (prev.delinquencyRatio !== undefined && q.delinquencyRatio > 0) {
    const bpChange = (q.delinquencyRatio - prev.delinquencyRatio) * 10000;
    if (bpChange > 50) {
      const priority = calculateAlertPriority('distress', lead, bpChange / 10);
      alerts.push({
        id: `5300-delinquency-${lead.id}`,
        leadId: lead.id, lead, type: 'distress', category: 'Rising Delinquency',
        priority, priorityTier: getPriorityTier(priority),
        title: `${lead.name} delinquency rose +${Math.round(bpChange)}bp to ${(q.delinquencyRatio * 100).toFixed(2)}%`,
        description: `NCUA 5300 data shows rising loan delinquency — they need Rise Lending Analytics to identify at-risk loans and act earlier.`,
        metrics: [
          { label: 'Delinquency Ratio', previous: prev.delinquencyRatio, current: q.delinquencyRatio, change: `+${Math.round(bpChange)}bp` },
          { label: 'Delinquent Loans', previous: 0, current: q.totalDelinquentLoans, change: formatCurrency(q.totalDelinquentLoans) },
        ],
        suggestedAction: 'Present Rise Lending Analytics — show how early detection reduces delinquency 15-20%',
        suggestedProduct: 'Rise Lending Analytics',
        detectedAt: now,
      });
    }
  }

  // Capital erosion: net worth drops below 7% or 5%
  if (prev.netWorthRatio !== undefined && q.netWorthRatio > 0) {
    const bpChange = (q.netWorthRatio - prev.netWorthRatio) * 100; // in basis points of percentage
    if ((prev.netWorthRatio >= 7 && q.netWorthRatio < 7) || (prev.netWorthRatio >= 5 && q.netWorthRatio < 5)) {
      const isCritical = q.netWorthRatio < 5;
      const priority = calculateAlertPriority('distress', lead, isCritical ? 25 : 15);
      alerts.push({
        id: `5300-capital-${lead.id}`,
        leadId: lead.id, lead, type: 'distress', category: 'Capital Erosion',
        priority: Math.min(priority + (isCritical ? 15 : 0), 100),
        priorityTier: getPriorityTier(Math.min(priority + (isCritical ? 15 : 0), 100)),
        title: `${lead.name} net worth fell ${Math.abs(Math.round(bpChange))}bp to ${q.netWorthRatio.toFixed(1)}% — ${isCritical ? 'UNDERCAPITALIZED' : 'below well-capitalized'}`,
        description: isCritical
          ? `Critical: net worth below 5% triggers NCUA concern. Rise Compliance Suite provides real-time capital monitoring.`
          : `Net worth dropped below 7% well-capitalized threshold. Rise Compliance Suite helps track and forecast capital ratios.`,
        metrics: [
          { label: 'Net Worth Ratio', previous: prev.netWorthRatio, current: q.netWorthRatio, change: `${Math.round(bpChange)}bp` },
        ],
        suggestedAction: 'Urgently present Rise Compliance Suite for NCUA monitoring and capital forecasting',
        suggestedProduct: 'Rise Compliance Suite',
        detectedAt: now,
      });
    }
  }

  // Charge-off spike: >25bp QoQ increase in net charge-off ratio
  if (prev.netChargeOffRatio !== undefined && q.netChargeOffRatio > 0) {
    const bpChange = (q.netChargeOffRatio - prev.netChargeOffRatio) * 10000;
    if (bpChange > 25) {
      const priority = calculateAlertPriority('distress', lead, bpChange / 8);
      alerts.push({
        id: `5300-chargeoffs-${lead.id}`,
        leadId: lead.id, lead, type: 'distress', category: 'Charge-Off Spike',
        priority, priorityTier: getPriorityTier(priority),
        title: `${lead.name} net charge-offs spiked +${Math.round(bpChange)}bp to ${(q.netChargeOffRatio * 100).toFixed(2)}%`,
        description: `Rising charge-offs signal credit quality deterioration. Rise Analytics can spot patterns before losses occur.`,
        metrics: [
          { label: 'Net Charge-Off Ratio', previous: prev.netChargeOffRatio, current: q.netChargeOffRatio, change: `+${Math.round(bpChange)}bp` },
          { label: 'Net Charge-Offs', previous: 0, current: q.netChargeOffs, change: formatCurrency(q.netChargeOffs) },
        ],
        suggestedAction: 'Present Rise Analytics — demonstrate pattern detection for early loss prevention',
        suggestedProduct: 'Rise Lending Analytics',
        detectedAt: now,
      });
    }
  }

  // Efficiency deterioration: ratio exceeds 85%
  if (prev.efficiencyRatio !== undefined && q.efficiencyRatio > 85 && prev.efficiencyRatio <= 85) {
    const priority = calculateAlertPriority('distress', lead, (q.efficiencyRatio - 85) * 3);
    alerts.push({
      id: `5300-efficiency-${lead.id}`,
      leadId: lead.id, lead, type: 'distress', category: 'Efficiency Deterioration',
      priority, priorityTier: getPriorityTier(priority),
      title: `${lead.name} efficiency ratio crossed 85% (now ${q.efficiencyRatio.toFixed(1)}%)`,
      description: `High efficiency ratio signals operational cost challenges. Rise Platform automates reporting and can reduce OpEx.`,
      metrics: [
        { label: 'Efficiency Ratio', previous: prev.efficiencyRatio, current: q.efficiencyRatio, change: `+${(q.efficiencyRatio - prev.efficiencyRatio).toFixed(1)}%` },
      ],
      suggestedAction: 'Show Rise Analytics ROI on reporting automation — typically 65% reduction in manual reporting time',
      suggestedProduct: 'Rise Analytics Platform',
      detectedAt: now,
    });
  }

  return alerts;
}

const ASSET_THRESHOLDS = [
  { value: 100_000_000, label: '$100M' },
  { value: 500_000_000, label: '$500M' },
  { value: 1_000_000_000, label: '$1B' },
  { value: 5_000_000_000, label: '$5B' },
  { value: 10_000_000_000, label: '$10B' },
];

function detectScaleTriggers(lead: Lead, prev: InstitutionSnapshot): TriggerAlert[] {
  const alerts: TriggerAlert[] = [];
  const now = new Date().toISOString();

  for (const threshold of ASSET_THRESHOLDS) {
    if (prev.assets < threshold.value && lead.assets >= threshold.value) {
      const priority = calculateAlertPriority('scale', lead, threshold.value / 1_000_000_000 * 10);
      alerts.push({
        id: `scale-${threshold.label}-${lead.id}`,
        leadId: lead.id, lead, type: 'scale', category: 'Threshold Crossed',
        priority, priorityTier: getPriorityTier(priority),
        title: `${lead.name} crossed the ${threshold.label} asset threshold`,
        description: `Crossing ${threshold.label} brings new regulatory requirements, operational complexity, and a need for enterprise-grade analytics.`,
        metrics: [{ label: 'Total Assets', previous: prev.assets, current: lead.assets, change: `→ ${threshold.label}+` }],
        suggestedAction: getSuggestedAction('scale', 'Threshold Crossed', lead),
        suggestedProduct: getSuggestedProduct('scale', lead),
        detectedAt: now,
      });
      break; // Only report the highest threshold crossed
    }
  }

  return alerts;
}

function detectOpportunityTriggers(lead: Lead, _prev: InstitutionSnapshot, allLeads: Lead[]): TriggerAlert[] {
  const alerts: TriggerAlert[] = [];
  const now = new Date().toISOString();

  // High performer, untouched
  if (lead.roa >= 1.5 && lead.status === 'new') {
    const priority = calculateAlertPriority('opportunity', lead, lead.roa * 10);
    alerts.push({
      id: `opp-highperf-${lead.id}`,
      leadId: lead.id, lead, type: 'opportunity', category: 'High Performer',
      priority, priorityTier: getPriorityTier(priority),
      title: `${lead.name} has exceptional ROA (${lead.roa.toFixed(2)}%) — untouched prospect`,
      description: `High-performing institution with budget headroom for strategic investments. No current relationship — first-mover advantage available.`,
      metrics: [{ label: 'ROA', previous: 0, current: lead.roa, change: `${lead.roa.toFixed(2)}%` }],
      suggestedAction: getSuggestedAction('opportunity', 'High Performer', lead),
      suggestedProduct: getSuggestedProduct('opportunity', lead),
      detectedAt: now,
    });
  }

  // Greenfield territory
  if (lead.assets >= 500_000_000) {
    const stateLeads = allLeads.filter(l => l.state === lead.state && l.id !== lead.id);
    const hasClientsInState = stateLeads.some(l => l.status !== 'new');
    if (!hasClientsInState && lead.status === 'new') {
      const priority = calculateAlertPriority('opportunity', lead, 15);
      alerts.push({
        id: `opp-greenfield-${lead.id}`,
        leadId: lead.id, lead, type: 'opportunity', category: 'Greenfield Territory',
        priority, priorityTier: getPriorityTier(priority),
        title: `${lead.name} (${formatCurrency(lead.assets)}) in greenfield state: ${lead.state}`,
        description: `No existing Rise clients in ${lead.state}. Landing this institution creates a reference point for the entire state market.`,
        metrics: [{ label: 'Assets', previous: 0, current: lead.assets, change: formatCurrency(lead.assets) }],
        suggestedAction: getSuggestedAction('opportunity', 'Greenfield Territory', lead),
        suggestedProduct: getSuggestedProduct('opportunity', lead),
        detectedAt: now,
      });
    }
  }

  return alerts;
}

// ── Core Alert Generator ──────────────────────────────────────────────

export function generateTriggerAlerts(
  currentLeads: Lead[],
  snapshot: FinancialSnapshot,
  alertState?: AlertState,
): TriggerAlert[] {
  const alerts: TriggerAlert[] = [];

  for (const lead of currentLeads) {
    const prev = snapshot.institutions[lead.id];
    if (!prev) continue;

    alerts.push(...detectGrowthTriggers(lead, prev));
    alerts.push(...detectDistressTriggers(lead, prev));
    alerts.push(...detect5300Triggers(lead, prev));
    alerts.push(...detectScaleTriggers(lead, prev));
    alerts.push(...detectOpportunityTriggers(lead, prev, currentLeads));
  }

  // Sort by priority descending
  alerts.sort((a, b) => b.priority - a.priority);

  // Filter dismissed
  if (alertState?.dismissed.length) {
    const dismissed = new Set(alertState.dismissed);
    return alerts.filter(a => !dismissed.has(a.id));
  }

  return alerts;
}

// ── Summary ───────────────────────────────────────────────────────────

export function computeAlertSummary(alerts: TriggerAlert[]): AlertSummary {
  const summary: AlertSummary = {
    total: alerts.length,
    critical: 0, high: 0, medium: 0, low: 0,
    byType: { growth: 0, distress: 0, scale: 0, opportunity: 0 },
  };
  for (const a of alerts) {
    summary[a.priorityTier.toLowerCase() as 'critical' | 'high' | 'medium' | 'low']++;
    summary.byType[a.type]++;
  }
  return summary;
}

// ── Simulation (for demo) ─────────────────────────────────────────────

export function simulateFinancialChanges(leads: Lead[]): Lead[] {
  // Deterministic seed based on current date — consistent during a demo session
  let seed = new Date().toDateString().split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  return leads.map(lead => {
    const roll = random();
    const newLead = { ...lead };

    if (roll < 0.15) {
      // 15%: asset growth 5-25%
      const g = 0.05 + random() * 0.20;
      newLead.assets = Math.round(lead.assets * (1 + g));
      newLead.deposits = Math.round(lead.deposits * (1 + g * 0.8));
      if (lead.members > 0) newLead.members = Math.round(lead.members * (1 + g * 0.5));
    } else if (roll < 0.25) {
      // 10%: asset decline 3-15%
      const d = 0.03 + random() * 0.12;
      newLead.assets = Math.round(lead.assets * (1 - d));
      newLead.deposits = Math.round(lead.deposits * (1 - d * 1.2));
      newLead.roa = Math.max(0, +(lead.roa - (0.1 + random() * 0.4)).toFixed(2));
    } else if (roll < 0.35) {
      // 10%: ROA shift ±0.5
      const shift = (random() - 0.5) * 1.0;
      newLead.roa = Math.max(0, +(lead.roa + shift).toFixed(2));
    } else if (roll < 0.40) {
      // 5%: member change
      if (lead.members > 0) {
        const pct = (random() - 0.4) * 0.15;
        newLead.members = Math.round(lead.members * (1 + pct));
      }
    }
    // 60%: no change

    return newLead;
  });
}

// ── Pre-seeded Sample Alerts ──────────────────────────────────────────

export function generateSampleAlerts(leads: Lead[]): TriggerAlert[] {
  if (leads.length === 0) return [];

  const topLeads = [...leads].sort((a, b) => b.assets - a.assets).slice(0, 20);
  const syntheticSnapshot: FinancialSnapshot = {
    timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    institutions: {},
  };

  topLeads.forEach((lead, i) => {
    const snap: InstitutionSnapshot = {
      assets: lead.assets,
      deposits: lead.deposits,
      members: lead.members,
      roa: lead.roa,
      branches: lead.branches,
    };

    // Create varied "previous" data for interesting alerts
    if (i % 5 === 0) {
      // Growth: previous was 12-18% smaller
      snap.assets = Math.round(lead.assets / (1.12 + i * 0.005));
      snap.deposits = Math.round(lead.deposits / 1.10);
    } else if (i % 5 === 1) {
      // ROA decline: previous was higher
      snap.roa = lead.roa + 0.3 + (i % 3) * 0.1;
    } else if (i % 5 === 2) {
      // Threshold: push previous just below nearest threshold
      for (const t of ASSET_THRESHOLDS) {
        if (lead.assets >= t.value && lead.assets < t.value * 1.15) {
          snap.assets = Math.round(t.value * 0.95);
          break;
        }
      }
    } else if (i % 5 === 3 && lead.members > 0) {
      // Member growth
      snap.members = Math.round(lead.members / 1.08);
    }
    // i % 5 === 4: no change (control)

    syntheticSnapshot.institutions[lead.id] = snap;
  });

  return generateTriggerAlerts(topLeads, syntheticSnapshot);
}
