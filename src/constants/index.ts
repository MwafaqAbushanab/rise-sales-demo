// Single source of truth for all Rise Analytics claims and statistics.
// All files should reference these constants instead of hardcoding values.

export const RISE_STATS = {
  averageROI: '150-200%',           // estimated based on customer averages
  customerRetention: '96%',         // estimated
  clientCount: '150+',              // estimated
  averagePayback: '4-6 months',     // estimated
  implementationTime: '4-6 weeks',  // estimated
  reportingTimeReduction: '65%',    // industry benchmark
  attritionReduction: '15%',        // industry benchmark
  crossSellImprovement: '25%',      // industry benchmark
  loanDefaultReduction: '10%',      // industry benchmark
  nps: '72',                        // estimated target
} as const;

export const DISCLAIMERS = {
  estimated: '(estimated)',
  simulated: '(simulated based on institution profile)',
  illustrative: '(illustrative)',
  basedOnCustomerAverages: '(based on customer averages)',
  pricingDisclaimer: 'Pricing shown is illustrative. Contact sales for a custom quote.',
  competitorDisclaimer: 'Competitor presence inferred from institution profile — not verified.',
  roiDisclaimer: 'ROI projections are estimates based on industry benchmarks and may vary.',
  callReportDisclaimer: 'Financial metrics from NCUA 5300 Call Reports (quarterly). Data may be 1-2 quarters behind current.',
} as const;
