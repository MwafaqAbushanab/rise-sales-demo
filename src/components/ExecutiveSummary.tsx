import { useMemo } from 'react';
import { PieChart, DollarSign, TrendingUp, Globe, Landmark, Flame, Target, Activity, Shield } from 'lucide-react';
import type { Lead } from '../types';
import { formatCurrency } from '../types';
import type { HotLead } from '../utils/salesAcceleration';
import { computeFinancialHealth } from '../utils/financialHealth';
import { KpiCard } from './ui/KpiCard';
import { SalesforceIcon, LinkedInIcon, SlackIcon } from './icons';

interface ExecutiveSummaryProps {
  leads: Lead[];
  hotLeads: HotLead[];
}

export default function ExecutiveSummary({ leads, hotLeads }: ExecutiveSummaryProps) {
  const totalPipelineValue = hotLeads.reduce((sum, lead) => {
    return sum + (lead.estimatedDealValue || 0);
  }, 0);

  const avgDealSize = hotLeads.length > 0 ? totalPipelineValue / hotLeads.length : 0;
  const cuCount = leads.filter(l => l.type === 'Credit Union').length;
  const bankCount = leads.filter(l => l.type === 'Community Bank').length;
  const qualifiedCount = leads.filter(l => l.status === 'qualified' || l.status === 'demo_scheduled' || l.status === 'proposal_sent').length;

  const totalMarketAssets = leads.reduce((sum, l) => sum + l.assets, 0);
  const avgLeadScore = leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length) : 0;

  const portfolioHealth = useMemo(() => {
    const cusWithData = leads.filter(l => l.callReport?.latestQuarter);
    if (cusWithData.length === 0) return null;
    const healthScores = cusWithData.map(l => computeFinancialHealth(l.callReport!));
    const avgHealth = Math.round(healthScores.reduce((s, h) => s + h.overall, 0) / healthScores.length);
    const avgDelinquency = cusWithData.reduce((s, l) => s + l.callReport!.latestQuarter.delinquencyRatio * 100, 0) / cusWithData.length;
    const elevatedCount = healthScores.filter(h => h.riskLevel === 'elevated' || h.riskLevel === 'high').length;
    return { avgHealth, avgDelinquency, elevatedCount, totalWithData: cusWithData.length };
  }, [leads]);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Executive Summary</h2>
            <p className="text-sm text-gray-500">Real-time pipeline & market intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-gray-500">Live Data</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Pipeline Value"
          value={`$${(totalPipelineValue / 1000000).toFixed(1)}M`}
          caption={`${hotLeads.length} active opportunities`}
          icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
          tone="success"
          trend="up"
          delta={12}
        />
        <KpiCard
          label="Avg Deal Size"
          value={`$${(avgDealSize / 1000).toFixed(0)}K`}
          caption="Per qualified lead"
          icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
          tone="primary"
          trend="up"
          delta={8}
        />
        <KpiCard
          label="Market Coverage"
          value={leads.length.toLocaleString()}
          caption={`${cuCount} Credit Unions · ${bankCount} Banks`}
          icon={<Globe className="h-4 w-4 text-purple-600" />}
          tone="default"
          trend="flat"
        />
        <KpiCard
          label="Total Addressable"
          value={formatCurrency(totalMarketAssets)}
          caption="Combined assets"
          icon={<Landmark className="h-4 w-4 text-amber-600" />}
          tone="warning"
          trend="up"
          delta={5}
        />
      </div>

      {/* Quick Stats Row */}
      <div className={`grid gap-4 ${portfolioHealth ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-700">Hot Leads</div>
              <div className="text-3xl font-bold text-green-600">{hotLeads.length}</div>
            </div>
            <Flame className="w-10 h-10 text-green-500 opacity-50" />
          </div>
          <div className="text-xs text-green-600 mt-1">Ready for immediate follow-up</div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-700">Avg Lead Score</div>
              <div className="text-3xl font-bold text-blue-600">{avgLeadScore}/100</div>
            </div>
            <Target className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
          <div className="text-xs text-blue-600 mt-1">AI-calculated opportunity score</div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-purple-700">In Pipeline</div>
              <div className="text-3xl font-bold text-purple-600">{qualifiedCount}</div>
            </div>
            <Activity className="w-10 h-10 text-purple-500 opacity-50" />
          </div>
          <div className="text-xs text-purple-600 mt-1">Qualified / Demo / Proposal stages</div>
        </div>

        {portfolioHealth && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-indigo-700">Portfolio Health</div>
                <div className="text-3xl font-bold text-indigo-600">{portfolioHealth.avgHealth}/100</div>
              </div>
              <Shield className="w-10 h-10 text-indigo-500 opacity-50" />
            </div>
            <div className="text-xs text-indigo-600 mt-1">
              {portfolioHealth.elevatedCount > 0 ? `${portfolioHealth.elevatedCount} at-risk` : 'All healthy'} · {portfolioHealth.avgDelinquency.toFixed(2)}% avg delinquency
            </div>
          </div>
        )}
      </div>

      {/* Data Source & Integrations Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <p className="text-[10px] text-gray-400">
          Institution data: NCUA (credit unions) & FDIC (banks) — live government sources. Scores, deal sizes, and competitive intel are estimates.
        </p>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-400 mr-1">Integrations:</span>
          <SalesforceIcon className="h-4 w-auto opacity-40 hover:opacity-80 transition-opacity" />
          <LinkedInIcon className="h-3.5 w-auto opacity-40 hover:opacity-80 transition-opacity" />
          <SlackIcon className="h-3.5 w-auto opacity-40 hover:opacity-80 transition-opacity" />
        </div>
      </div>
    </div>
  );
}
