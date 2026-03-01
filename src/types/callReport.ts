// NCUA 5300 Call Report Types
// Real quarterly financial data from NCUA bulk CSV downloads
// Data source: https://ncua.gov/analysis/credit-union-corporate-call-report-data/quarterly-data

export interface CallReportQuarter {
  cycleDate: string;       // "2024-09-30" format
  cuNumber: number;        // Charter number (join key)

  // Core financials
  totalAssets: number;      // Acct_010
  totalShares: number;      // Acct_013
  totalLoans: number;       // Acct_025B

  // Delinquency & Credit Quality
  totalDelinquentLoans: number;   // Acct_041B
  delinquencyRatio: number;       // Acct_041B / Acct_025B (as decimal, e.g. 0.012 = 1.2%)
  totalChargeOffs: number;        // Acct_550
  totalRecoveries: number;        // Acct_551
  netChargeOffs: number;          // Acct_550 - Acct_551
  netChargeOffRatio: number;      // netChargeOffs / Acct_025B (as decimal)

  // CECL / Reserves
  allowanceForLoanLosses: number; // Acct_719
  coverageRatio: number;          // Acct_719 / Acct_041B (times coverage)

  // Capital Adequacy
  netWorthRatio: number;          // Acct_998 (pre-calculated, as percentage e.g. 10.5)

  // Membership
  currentMembers: number;         // Acct_083
  potentialMembers: number;       // Acct_084
  memberPenetration: number;      // Acct_083 / Acct_084 (as decimal)

  // Loan Composition (dollar amounts)
  realEstateLoans: number;        // Acct_385
  autoLoans: number;              // Acct_370
  creditCardLoans: number;        // Acct_703
  otherConsumerLoans: number;     // Acct_396
  commercialLoans: number;        // Acct_397

  // Loan Composition (percentages, 0-100)
  loanComposition: {
    realEstate: number;
    auto: number;
    creditCard: number;
    otherConsumer: number;
    commercial: number;
  };

  // Efficiency
  operatingExpenses: number;      // Acct_657A
  totalRevenue: number;           // Acct_115
  efficiencyRatio: number;        // Acct_657A / Acct_115 (as percentage, e.g. 72.5)
}

export interface CallReportTrends {
  delinquencyChange: number;        // basis points change (e.g. +15 = delinquency rose 0.15%)
  netChargeOffChange: number;       // basis points change
  netWorthRatioChange: number;      // basis points change
  efficiencyChange: number;         // basis points change
  memberGrowthRate: number;         // percentage (e.g. 2.5 = 2.5% growth)
  assetGrowthRate: number;          // percentage
  loanGrowthRate: number;           // percentage
  coverageRatioChange: number;      // absolute change in coverage times
}

export interface CallReportData {
  cuNumber: number;
  cuName: string;
  latestQuarter: CallReportQuarter;
  previousQuarter: CallReportQuarter | null;
  trends: CallReportTrends | null;
}

export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'high';

export interface FinancialHealthScore {
  overall: number;          // 0-100
  riskLevel: RiskLevel;
  capitalAdequacy: number;  // 0-100 (net worth ratio based)
  assetQuality: number;     // 0-100 (delinquency/charge-off based)
  liquidity: number;        // 0-100 (share-to-loan ratio)
  earnings: number;         // 0-100 (efficiency ratio based)
  growth: number;           // 0-100 (member + asset growth)
}

export interface CallReportCacheMeta {
  latestCycleDate: string;
  previousCycleDate: string;
  cuCount: number;
  fetchedAt: string;
  source: 'bulk-csv' | 'pre-seeded';
}
