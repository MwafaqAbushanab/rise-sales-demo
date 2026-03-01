// Financial Health Score computation from NCUA 5300 Call Report data

import type { CallReportData, FinancialHealthScore, RiskLevel } from '../types/callReport';

export function computeFinancialHealth(cr: CallReportData): FinancialHealthScore {
  const q = cr.latestQuarter;

  // Capital Adequacy (net worth ratio): 7%+ well-capitalized
  // 12%+ = 100, <3% = 0
  const capitalAdequacy = Math.min(100, Math.max(0, (q.netWorthRatio - 3) / 9 * 100));

  // Asset Quality: inverse of delinquency + charge-off
  // <0.5% delinquency = 100, >4% = 0
  const delinquencyPct = q.delinquencyRatio * 100;
  const chargeOffPct = q.netChargeOffRatio * 100;
  const assetQualityDelinq = Math.min(100, Math.max(0, (4 - delinquencyPct) / 3.5 * 100));
  const assetQualityChargeOff = Math.min(100, Math.max(0, (2 - chargeOffPct) / 1.7 * 100));
  const assetQuality = Math.round(assetQualityDelinq * 0.6 + assetQualityChargeOff * 0.4);

  // Liquidity: loans-to-shares ratio (60-80% ideal)
  const loanToShare = q.totalLoans / Math.max(q.totalShares, 1);
  let liquidity: number;
  if (loanToShare >= 0.6 && loanToShare <= 0.8) {
    liquidity = 90;
  } else if (loanToShare < 0.6) {
    liquidity = 60 + (loanToShare / 0.6) * 30;
  } else {
    liquidity = Math.max(0, 90 - ((loanToShare - 0.8) / 0.2) * 60);
  }

  // Earnings: efficiency ratio (lower = better, <70% is good)
  const earnings = Math.min(100, Math.max(0, (100 - q.efficiencyRatio) * 1.25));

  // Growth: member + asset growth from trends
  let growth = 50;
  if (cr.trends) {
    const memberBonus = Math.min(25, Math.max(-25, cr.trends.memberGrowthRate * 5));
    const assetBonus = Math.min(25, Math.max(-25, cr.trends.assetGrowthRate * 3));
    growth = Math.min(100, Math.max(0, 50 + memberBonus + assetBonus));
  }

  const overall = Math.round(
    capitalAdequacy * 0.25 +
    assetQuality * 0.25 +
    liquidity * 0.15 +
    earnings * 0.20 +
    growth * 0.15
  );

  const riskLevel: RiskLevel =
    overall >= 75 ? 'low' :
    overall >= 55 ? 'moderate' :
    overall >= 35 ? 'elevated' : 'high';

  return {
    overall,
    riskLevel,
    capitalAdequacy: Math.round(capitalAdequacy),
    assetQuality,
    liquidity: Math.round(liquidity),
    earnings: Math.round(earnings),
    growth: Math.round(growth),
  };
}

// Format a financial health score component for display
export function getHealthLabel(score: number): string {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Weak';
  return 'Critical';
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'low': return 'text-green-600';
    case 'moderate': return 'text-yellow-600';
    case 'elevated': return 'text-orange-600';
    case 'high': return 'text-red-600';
  }
}

export function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case 'low': return 'bg-green-100';
    case 'moderate': return 'bg-yellow-100';
    case 'elevated': return 'bg-orange-100';
    case 'high': return 'bg-red-100';
  }
}
