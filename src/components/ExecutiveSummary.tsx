import { PieChart, DollarSign, TrendingUp, Globe, Landmark, Flame, Target, Activity } from 'lucide-react';
import type { Lead } from '../types';
import { formatCurrency } from '../types';
import type { HotLead } from '../utils/salesAcceleration';

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

  // Calculate market opportunity
  const totalMarketAssets = leads.reduce((sum, l) => sum + l.assets, 0);
  const avgLeadScore = leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length) : 0;

  const kpis = [
    {
      label: 'Pipeline Value',
      value: `$${(totalPipelineValue / 1000000).toFixed(1)}M`,
      subtext: `${hotLeads.length} active opportunities`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Avg Deal Size',
      value: `$${(avgDealSize / 1000).toFixed(0)}K`,
      subtext: 'Per qualified lead',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Market Coverage',
      value: leads.length.toLocaleString(),
      subtext: `${cuCount} CUs / ${bankCount} Banks`,
      icon: Globe,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      label: 'Total Addressable',
      value: formatCurrency(totalMarketAssets),
      subtext: 'Combined assets',
      icon: Landmark,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    }
  ];

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

      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 ${kpi.bgColor} rounded-lg flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase">{kpi.label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
            <div className="text-xs text-gray-500">{kpi.subtext}</div>
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-4">
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
      </div>
    </div>
  );
}
