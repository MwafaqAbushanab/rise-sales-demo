import { useState, useEffect } from 'react';
import { PieChart, MapPin, Target, TrendingUp, Shield, Globe, Building2, DollarSign, Flame, Loader2, ShoppingCart, Swords } from 'lucide-react';
import { type Lead } from '../../types';
import { calculateTerritoryMetrics, formatTerritoryValue, STATE_NAMES, type TerritoryMetrics, type GrowthOpportunity, type CompetitiveRegion } from '../../utils/territoryIntelligence';

// Territory Intelligence Dashboard - Market penetration and geographic analysis
export default function TerritoryIntelligenceDashboard({ leads }: { leads: Lead[] }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'states' | 'segments' | 'opportunities' | 'competitive'>('overview');
  const [metrics, setMetrics] = useState<TerritoryMetrics | null>(null);

  // Calculate metrics when leads change
  useEffect(() => {
    if (leads.length > 0) {
      const territoryMetrics = calculateTerritoryMetrics(
        leads.map(l => ({
          state: l.state,
          type: l.type,
          assets: l.assets,
          status: l.status,
          score: l.score
        }))
      );
      setMetrics(territoryMetrics);
    }
  }, [leads]);

  const tabs = [
    { id: 'overview', label: 'Market Overview', icon: PieChart },
    { id: 'states', label: 'State Analysis', icon: MapPin },
    { id: 'segments', label: 'Segments', icon: Target },
    { id: 'opportunities', label: 'Growth Opportunities', icon: TrendingUp },
    { id: 'competitive', label: 'Competitive Map', icon: Shield },
  ];

  const getOpportunityColor = (diff: GrowthOpportunity['difficulty']) => {
    switch (diff) {
      case 'easy': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'hard': return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getCompetitiveColor = (opp: CompetitiveRegion['opportunity']) => {
    switch (opp) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-red-500';
    }
  };

  if (!metrics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
        <p className="text-gray-600">Analyzing territory data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header with Key Metrics */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6" />
            <div>
              <h3 className="font-semibold text-lg">Territory Intelligence</h3>
              <p className="text-blue-200 text-sm">Market penetration & geographic analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="font-bold text-2xl">{formatTerritoryValue(metrics.totalAddressableMarket)}</div>
              <div className="text-blue-200 text-xs">Total Market</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl">{formatTerritoryValue(metrics.pipelineValue)}</div>
              <div className="text-blue-200 text-xs">Pipeline Value</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl">{metrics.topStates.length}</div>
              <div className="text-blue-200 text-xs">Active States</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl">{metrics.growthOpportunities.length}</div>
              <div className="text-blue-200 text-xs">Opportunities</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">Institutions</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{leads.length.toLocaleString()}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {leads.filter(l => l.type === 'Credit Union').length} CUs / {leads.filter(l => l.type === 'Community Bank').length} Banks
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Avg Deal Size</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatTerritoryValue(metrics.avgDealSize)}</div>
                <div className="text-xs text-gray-600 mt-1">Annual contract value</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span className="text-xs text-purple-600 font-medium">Segments</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{metrics.marketSegments.length}</div>
                <div className="text-xs text-gray-600 mt-1">Active market segments</div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <Flame className="w-5 h-5 text-amber-600" />
                  <span className="text-xs text-amber-600 font-medium">Hot Leads</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {metrics.topStates.reduce((sum, s) => sum + (s.hotLeadsCount || 0), 0)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Score &gt; 70</div>
              </div>
            </div>

            {/* Top States Mini */}
            <div className="bg-gray-50 rounded-xl p-4 border">
              <h4 className="font-semibold text-gray-800 mb-3">Top 5 States by Assets</h4>
              <div className="space-y-2">
                {metrics.topStates.slice(0, 5).map((state, idx) => (
                  <div key={state.state} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-800 w-8">{state.state}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(state.totalAssets / metrics.topStates[0].totalAssets) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-24 text-right">{formatTerritoryValue(state.totalAssets)}</span>
                    <span className="text-xs text-gray-500 w-16 text-right">{state.totalInstitutions} inst.</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'states' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Geographic breakdown of your total addressable market.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold text-gray-700">State</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Institutions</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Credit Unions</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Banks</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Total Assets</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Avg Assets</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Hot Leads</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topStates.map(state => (
                    <tr key={state.state} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{state.state}</span>
                          <span className="text-xs text-gray-500">{STATE_NAMES[state.state]}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium">{state.totalInstitutions}</td>
                      <td className="p-3 text-right text-blue-600">{state.creditUnions}</td>
                      <td className="p-3 text-right text-green-600">{state.communityBanks}</td>
                      <td className="p-3 text-right font-semibold">{formatTerritoryValue(state.totalAssets)}</td>
                      <td className="p-3 text-right">{formatTerritoryValue(state.averageAssets)}</td>
                      <td className="p-3 text-right">
                        {state.hotLeadsCount && state.hotLeadsCount > 0 ? (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">
                            {state.hotLeadsCount}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'segments' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Market segments with historical win rates and characteristics.</p>
            <div className="grid gap-4">
              {metrics.marketSegments.map(segment => (
                <div key={segment.name} className="bg-white rounded-xl border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800">{segment.name}</h4>
                      <p className="text-sm text-gray-500">{segment.count} institutions • {formatTerritoryValue(segment.totalAssets)} total assets</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center px-3 py-1 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-lg font-bold text-green-700">{segment.winRate}%</div>
                        <div className="text-xs text-green-600">Win Rate</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Avg Deal Size:</span>
                      <span className="ml-2 font-medium text-gray-800">{segment.avgDealSize}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Sales Cycle:</span>
                      <span className="ml-2 font-medium text-gray-800">{segment.avgSalesCycle}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Key Products:</span>
                      <span className="ml-2 font-medium text-gray-800">{segment.keyProducts.join(', ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">AI-identified growth opportunities based on market analysis.</p>
            <div className="space-y-3">
              {metrics.growthOpportunities.map((opp, idx) => (
                <div key={idx} className={`rounded-xl border p-4 ${getOpportunityColor(opp.difficulty)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {opp.type === 'geographic' && <MapPin className="w-5 h-5" />}
                      {opp.type === 'segment' && <Target className="w-5 h-5" />}
                      {opp.type === 'product' && <ShoppingCart className="w-5 h-5" />}
                      {opp.type === 'competitive' && <Swords className="w-5 h-5" />}
                      <span className="font-semibold">{opp.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        opp.difficulty === 'easy' ? 'bg-green-200' :
                        opp.difficulty === 'medium' ? 'bg-amber-200' : 'bg-red-200'
                      }`}>
                        {opp.difficulty}
                      </span>
                      <span className="font-bold">{formatTerritoryValue(opp.potentialValue)}</span>
                    </div>
                  </div>
                  <p className="text-sm mb-3">{opp.description}</p>
                  <div className="bg-white/50 rounded-lg p-2">
                    <span className="text-xs font-semibold">Recommended Action: </span>
                    <span className="text-sm">{opp.recommendedAction}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'competitive' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Competitive landscape by state showing dominant vendors and opportunity levels.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold text-gray-700">State</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Dominant Competitor</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Their Share</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Our Share</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Opportunity</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.competitiveHeatmap.map(region => (
                    <tr key={region.state} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{region.state}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-medium">
                          {region.dominantCompetitor}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-medium text-red-600">{region.competitorShare}%</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-medium text-green-600">{region.ourShare}%</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${getCompetitiveColor(region.opportunity)}`}>
                          {region.opportunity.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-gray-600 max-w-xs">{region.strategy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
