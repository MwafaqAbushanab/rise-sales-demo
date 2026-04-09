import { TrendingUp, TrendingDown, Minus, Shield, AlertTriangle, BarChart3, Users, CreditCard } from 'lucide-react';
import type { CallReportData, FinancialHealthScore } from '../types/callReport';
import { getRiskColor, getRiskBgColor, getHealthLabel } from '../utils/financialHealth';
import { formatCurrency } from '../types';
import { cn } from '../lib/utils';

interface FinancialHealthCardProps {
  callReport: CallReportData;
  financialHealth: FinancialHealthScore;
  compact?: boolean;
}

function TrendIndicator({ value, unit = 'bp', invert = false }: { value: number; unit?: string; invert?: boolean }) {
  const isPositive = invert ? value < 0 : value > 0;
  const isNegative = invert ? value > 0 : value < 0;
  const color = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-400';
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs ${color}`}>
      <Icon className="w-3 h-3" />
      {value > 0 ? '+' : ''}{value}{unit}
    </span>
  );
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className={cn('font-semibold', score >= 70 ? 'text-gray-800' : score >= 50 ? 'text-amber-700' : 'text-red-700')}>{score}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-2 rounded-full transition-all duration-500', color)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function FinancialHealthCard({ callReport, financialHealth, compact = false }: FinancialHealthCardProps) {
  const q = callReport.latestQuarter;
  const t = callReport.trends;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`px-2 py-1 rounded-lg ${getRiskBgColor(financialHealth.riskLevel)}`}>
          <span className={`text-sm font-bold ${getRiskColor(financialHealth.riskLevel)}`}>
            {financialHealth.overall}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Health: {getHealthLabel(financialHealth.overall)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Health Score */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl border border-gray-100">
        <div className={cn('relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm', getRiskBgColor(financialHealth.riskLevel))}>
          <span className={cn('text-2xl font-bold', getRiskColor(financialHealth.riskLevel))}>
            {financialHealth.overall}
          </span>
          <div className={cn('absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm',
            financialHealth.riskLevel === 'low' ? 'bg-green-500' :
            financialHealth.riskLevel === 'moderate' ? 'bg-amber-500' :
            financialHealth.riskLevel === 'elevated' ? 'bg-orange-500' : 'bg-red-500'
          )}>
            {financialHealth.riskLevel === 'low' ? '✓' : '!'}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">Financial Health Score</span>
          </div>
          <div className={cn('text-xs font-semibold', getRiskColor(financialHealth.riskLevel))}>
            {financialHealth.riskLevel.charAt(0).toUpperCase() + financialHealth.riskLevel.slice(1)} Risk
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            Based on NCUA 5300 Call Report ({q.cycleDate})
          </div>
        </div>
      </div>

      {/* Sub-scores */}
      <div className="space-y-2">
        <ScoreBar label="Capital Adequacy" score={financialHealth.capitalAdequacy} color="bg-blue-500" />
        <ScoreBar label="Asset Quality" score={financialHealth.assetQuality} color="bg-emerald-500" />
        <ScoreBar label="Earnings" score={financialHealth.earnings} color="bg-purple-500" />
        <ScoreBar label="Liquidity" score={financialHealth.liquidity} color="bg-amber-500" />
        <ScoreBar label="Growth" score={financialHealth.growth} color="bg-indigo-500" />
      </div>

      {/* Key Ratios */}
      <div>
        <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3" /> Key Financial Ratios
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white border rounded-lg p-2">
            <div className="text-xs text-gray-500">Net Worth Ratio</div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${q.netWorthRatio >= 7 ? 'text-green-600' : q.netWorthRatio >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                {q.netWorthRatio.toFixed(1)}%
              </span>
              {t && <TrendIndicator value={t.netWorthRatioChange} />}
            </div>
            <div className="text-[10px] text-gray-400">
              {q.netWorthRatio >= 7 ? 'Well-capitalized' : q.netWorthRatio >= 5 ? 'Adequately capitalized' : 'Undercapitalized'}
            </div>
          </div>

          <div className="bg-white border rounded-lg p-2">
            <div className="text-xs text-gray-500">Delinquency Ratio</div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${delinquencyPct(q) <= 1 ? 'text-green-600' : delinquencyPct(q) <= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                {(q.delinquencyRatio * 100).toFixed(2)}%
              </span>
              {t && <TrendIndicator value={t.delinquencyChange} invert />}
            </div>
            <div className="text-[10px] text-gray-400">
              {formatCurrency(q.totalDelinquentLoans)} delinquent
            </div>
          </div>

          <div className="bg-white border rounded-lg p-2">
            <div className="text-xs text-gray-500">Net Charge-Off</div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${chargeOffPct(q) <= 0.5 ? 'text-green-600' : chargeOffPct(q) <= 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                {(q.netChargeOffRatio * 100).toFixed(2)}%
              </span>
              {t && <TrendIndicator value={t.netChargeOffChange} invert />}
            </div>
          </div>

          <div className="bg-white border rounded-lg p-2">
            <div className="text-xs text-gray-500">Efficiency Ratio</div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${q.efficiencyRatio <= 70 ? 'text-green-600' : q.efficiencyRatio <= 82 ? 'text-yellow-600' : 'text-red-600'}`}>
                {q.efficiencyRatio.toFixed(1)}%
              </span>
              {t && <TrendIndicator value={t.efficiencyChange} unit="" invert />}
            </div>
            <div className="text-[10px] text-gray-400">
              {q.efficiencyRatio <= 70 ? 'Highly efficient' : q.efficiencyRatio <= 82 ? 'Average' : 'Needs improvement'}
            </div>
          </div>
        </div>
      </div>

      {/* Loan Composition */}
      <div>
        <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
          <CreditCard className="w-3 h-3" /> Loan Composition
        </h4>
        <div className="h-3.5 rounded-full overflow-hidden flex mb-2 shadow-inner">
          <div className="bg-blue-500" style={{ width: `${q.loanComposition.realEstate}%` }} title={`Real Estate: ${q.loanComposition.realEstate}%`} />
          <div className="bg-emerald-500" style={{ width: `${q.loanComposition.auto}%` }} title={`Auto: ${q.loanComposition.auto}%`} />
          <div className="bg-amber-500" style={{ width: `${q.loanComposition.creditCard}%` }} title={`Credit Cards: ${q.loanComposition.creditCard}%`} />
          <div className="bg-purple-500" style={{ width: `${q.loanComposition.otherConsumer}%` }} title={`Consumer: ${q.loanComposition.otherConsumer}%`} />
          <div className="bg-rose-500" style={{ width: `${q.loanComposition.commercial}%` }} title={`Commercial: ${q.loanComposition.commercial}%`} />
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded" />RE {q.loanComposition.realEstate}%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded" />Auto {q.loanComposition.auto}%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded" />Cards {q.loanComposition.creditCard}%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded" />Consumer {q.loanComposition.otherConsumer}%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded" />Commercial {q.loanComposition.commercial}%</span>
        </div>
      </div>

      {/* Membership & CECL */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <Users className="w-3 h-3 text-blue-500" />
            <span className="text-xs text-blue-700 font-medium">Membership</span>
          </div>
          <div className="text-sm font-bold text-blue-800">{q.currentMembers.toLocaleString()}</div>
          <div className="text-[10px] text-blue-600">
            {(q.memberPenetration * 100).toFixed(0)}% penetration
            {t && <span className="ml-1">({t.memberGrowthRate > 0 ? '+' : ''}{t.memberGrowthRate}% QoQ)</span>}
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3 text-orange-500" />
            <span className="text-xs text-orange-700 font-medium">CECL Reserves</span>
          </div>
          <div className="text-sm font-bold text-orange-800">{formatCurrency(q.allowanceForLoanLosses)}</div>
          <div className="text-[10px] text-orange-600">
            Coverage: {q.coverageRatio.toFixed(1)}x
            {t && <span className="ml-1">({t.coverageRatioChange > 0 ? '+' : ''}{t.coverageRatioChange.toFixed(2)})</span>}
          </div>
        </div>
      </div>

      {/* Data source */}
      <p className="text-[10px] text-gray-400 italic">
        Source: NCUA 5300 Call Report ({q.cycleDate}). Financial metrics are from official regulatory filings.
      </p>
    </div>
  );
}

function delinquencyPct(q: FinancialHealthCardProps['callReport']['latestQuarter']): number {
  return q.delinquencyRatio * 100;
}

function chargeOffPct(q: FinancialHealthCardProps['callReport']['latestQuarter']): number {
  return q.netChargeOffRatio * 100;
}
