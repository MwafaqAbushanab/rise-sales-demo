import { useState, useMemo } from 'react';
import { Flame, Users, Landmark, MapPin, ChevronUp, ChevronDown, Star, Eye, Check, Mail, Rocket } from 'lucide-react';
import { type Lead, formatCurrency } from '../../types';
import { identifyHotLeads, calculateDashboardMetrics, getTopCreditUnions, getTopCommunityBanks, generateColdEmailTemplate, type HotLead } from '../../utils/salesAcceleration';
import { formatCurrencyShort } from '../../utils/roiCalculator';

// Sales Acceleration Dashboard - Shows hot leads with product recommendations
export default function SalesAccelerationDashboard({ leads, onSelectLead }: {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}) {
  const [activeTab, setActiveTab] = useState<'all' | 'cu' | 'bank'>('all');
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Calculate hot leads
  const hotLeads = useMemo(() => {
    return identifyHotLeads(leads, 30);
  }, [leads]);

  const metrics = useMemo(() => {
    return calculateDashboardMetrics(leads, hotLeads);
  }, [leads, hotLeads]);

  const topCUs = useMemo(() => getTopCreditUnions(hotLeads, 15), [hotLeads]);
  const topBanks = useMemo(() => getTopCommunityBanks(hotLeads, 15), [hotLeads]);

  const displayLeads = activeTab === 'cu' ? topCUs : activeTab === 'bank' ? topBanks : hotLeads;

  // Find the full Lead object from the original leads array
  const selectFullLead = (hotLead: HotLead) => {
    const fullLead = leads.find(l => l.id === hotLead.id);
    if (fullLead) {
      onSelectLead(fullLead);
    }
  };

  const copyEmailTemplate = (lead: HotLead) => {
    const email = generateColdEmailTemplate(lead);
    navigator.clipboard.writeText(email);
    setCopiedEmail(lead.id);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const urgencyColors = {
    Critical: 'bg-red-100 text-red-700 border-red-200',
    High: 'bg-orange-100 text-orange-700 border-orange-200',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Standard: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  if (hotLeads.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
        <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Loading hot leads...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Hot Leads - Who Needs Rise Analytics</h2>
              <p className="text-orange-100 text-sm">Ranked by product-market fit & buying signals</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{formatCurrencyShort(metrics.totalPipelineValue)}</div>
            <div className="text-orange-100 text-xs">Pipeline Value</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50 border-b">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{hotLeads.filter(l => l.urgencyLevel === 'Critical').length}</div>
          <div className="text-xs text-red-600 font-medium">Critical Priority</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{hotLeads.filter(l => l.urgencyLevel === 'High').length}</div>
          <div className="text-xs text-orange-600 font-medium">High Priority</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{formatCurrencyShort(metrics.averageDealSize)}</div>
          <div className="text-xs text-gray-500">Avg Deal Size</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{metrics.weeklyTargets.emailsToSend}</div>
          <div className="text-xs text-blue-600 font-medium">Emails This Week</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'all' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Hot Leads ({hotLeads.length})
        </button>
        <button
          onClick={() => setActiveTab('cu')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'cu' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4 inline mr-1" />
          Credit Unions ({topCUs.length})
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'bank' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Landmark className="w-4 h-4 inline mr-1" />
          Banks ({topBanks.length})
        </button>
      </div>

      {/* Lead List */}
      <div className="max-h-[500px] overflow-y-auto">
        {displayLeads.map((lead, index) => (
          <div key={lead.id} className="border-b last:border-b-0">
            {/* Lead Header - Always visible */}
            <div
              className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
            >
              <div className="flex items-start gap-3">
                {/* Rank Badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index < 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                  index < 10 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {lead.priorityRank}
                </div>

                {/* Lead Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 truncate">{lead.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${urgencyColors[lead.urgencyLevel]}`}>
                      {lead.urgencyLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {lead.city}, {lead.state}
                    </span>
                    <span>{formatCurrency(lead.assets)}</span>
                    {lead.members > 0 && <span>{lead.members.toLocaleString()} members</span>}
                  </div>
                </div>

                {/* Product & Value */}
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <span className="text-lg">{lead.topProduct.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{lead.topProduct.shortName}</span>
                  </div>
                  <div className="text-xs text-emerald-600 font-medium">
                    {formatCurrencyShort(lead.estimatedDealValue)}/yr
                  </div>
                </div>

                {/* Expand Arrow */}
                <div className="self-center">
                  {expandedLead === lead.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedLead === lead.id && (
              <div className="px-4 pb-4 bg-gray-50 border-t">
                {/* Why They Need Rise */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Star className="w-3 h-3" /> Why They Need Rise Analytics
                  </h4>
                  <div className="space-y-2">
                    {lead.whyTheyNeedRise.map((reason, i) => (
                      <div key={i} className="text-sm text-gray-700 bg-white p-2 rounded border">
                        {reason.split('**').map((part, j) =>
                          j % 2 === 1 ? <strong key={j} className="text-gray-900">{part}</strong> : part
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Recommendations */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Recommended Products
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {lead.productRecommendations.slice(0, 4).map((product) => (
                      <div key={product.productId} className="bg-white p-2 rounded border">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{product.icon}</span>
                          <span className="text-sm font-medium text-gray-800">{product.shortName}</span>
                          <span className={`ml-auto px-1.5 py-0.5 rounded text-xs ${
                            product.urgency === 'Critical' ? 'bg-red-100 text-red-700' :
                            product.urgency === 'High' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {product.fitScore}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{product.whyTheyNeedIt}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buying Signals */}
                {lead.buyingSignals.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Buying Signals
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {lead.buyingSignals.map((signal, i) => (
                        <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ROI Preview */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-emerald-50 p-2 rounded border border-emerald-200 text-center">
                    <div className="text-lg font-bold text-emerald-700">{lead.roi.annualROI}%</div>
                    <div className="text-xs text-emerald-600">ROI</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded border border-blue-200 text-center">
                    <div className="text-lg font-bold text-blue-700">{lead.roi.paybackMonths} mo</div>
                    <div className="text-xs text-blue-600">Payback</div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded border border-purple-200 text-center">
                    <div className="text-lg font-bold text-purple-700">{formatCurrencyShort(lead.roi.totalAnnualBenefit)}</div>
                    <div className="text-xs text-purple-600">Annual Value</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => selectFullLead(lead)}
                    className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View Full Profile
                  </button>
                  <button
                    onClick={() => copyEmailTemplate(lead)}
                    className="flex-1 py-2 px-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {copiedEmail === lead.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Copy Email Template
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Top Products Summary */}
      <div className="p-4 bg-gray-50 border-t">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Top Product Opportunities</h4>
        <div className="flex flex-wrap gap-2">
          {metrics.topProducts.map(({ product, count, value }) => (
            <div key={product} className="px-3 py-1.5 bg-white rounded-lg border text-sm">
              <span className="font-medium text-gray-800">{product}</span>
              <span className="text-gray-500 ml-2">{count} leads</span>
              <span className="text-emerald-600 ml-2">{formatCurrencyShort(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
