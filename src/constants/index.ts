// Single source of truth for all Rise Analytics claims and statistics.
// All files should reference these constants instead of hardcoding values.

export const RISE_STATS = {
  averageROI: '150-200%',
  customerRetention: '96%',
  clientCount: '150+',
  averagePayback: '4-6 months',
  implementationTime: '4-6 weeks',
  reportingTimeReduction: '65%',
  attritionReduction: '15%',
  crossSellImprovement: '25%',
  loanDefaultReduction: '10%',
  nps: '72',
} as const;

export const DISCLAIMERS = {
  estimated: '(estimated)',
  simulated: '(simulated based on institution profile)',
  illustrative: '(illustrative)',
  basedOnCustomerAverages: '(based on customer averages)',
  pricingDisclaimer: 'Pricing shown is illustrative. Contact sales for a custom quote.',
  competitorDisclaimer: 'Competitor presence inferred from institution profile — not verified.',
  roiDisclaimer: 'ROI projections are estimates based on industry benchmarks and may vary.',
} as const;
