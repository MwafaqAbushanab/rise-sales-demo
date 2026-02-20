import { useState, useMemo } from 'react';
import type { Lead } from '../types';
import type { ProspectIntelligence } from '../utils/prospectingIntelligence';
import { getTierColor, getTierEmoji } from '../utils/prospectingIntelligence';
import type { CompetitiveIntel } from '../utils/competitiveIntelligence';
import { calculateWinProbability } from '../utils/competitiveIntelligence';
import { calculateROI, getDefaultInputs, calculateRisePricing, formatCurrencyShort } from '../utils/roiCalculator';
import { Brain, Award, TrendingUp, Zap, ShoppingCart, ChevronDown, ChevronUp, Swords, Shield, Target, Eye, Trophy, CheckCircle, AlertTriangle, Lightbulb, Calculator, Percent, Clock } from 'lucide-react';

interface IntelligencePanelProps {
  intelligence: ProspectIntelligence | null;
  lead: Lead | null;
  competitiveIntel: CompetitiveIntel | null;
  onOpenROICalculator: () => void;
}

export default function IntelligencePanel({ intelligence, lead, competitiveIntel, onOpenROICalculator }: IntelligencePanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    growth: false,
    tech: false,
    buying: true,
    approach: true,
    competitive: true,
    roi: true
  });
  const [selectedBattleCard, setSelectedBattleCard] = useState<string | null>(null);

  // Quick ROI preview
  const quickROI = useMemo(() => {
    if (!lead) return null;
    const inputs = getDefaultInputs({ assets: lead.assets, members: lead.members, type: lead.type });
    return calculateROI(inputs);
  }, [lead]);

  const risePricing = useMemo(() => {
    if (!lead) return null;
    return calculateRisePricing(lead.assets, lead.members);
  }, [lead]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!intelligence || !lead) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full flex flex-col items-center justify-center text-center">
        <Brain className="w-12 h-12 text-gray-300 mb-3" />
        <h3 className="font-semibold text-gray-700 mb-1">Prospecting Intelligence</h3>
        <p className="text-sm text-gray-500">Select an institution to see AI-powered sales insights</p>
      </div>
    );
  }

  const tierColorClass = getTierColor(intelligence.opportunityTier);
  const tierEmoji = getTierEmoji(intelligence.opportunityTier);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Prospecting Intelligence</h3>
              <p className="text-xs text-purple-100">AI-Powered Analysis</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Opportunity Score Card */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Opportunity Score</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${tierColorClass}`}>
              {tierEmoji} {intelligence.opportunityTier}
            </span>
          </div>
          <div className="relative">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-900">{intelligence.opportunityScore}</span>
              <span className="text-gray-500 mb-1">/100</span>
            </div>
            <div className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  intelligence.opportunityScore >= 80 ? 'bg-red-500' :
                  intelligence.opportunityScore >= 65 ? 'bg-orange-500' :
                  intelligence.opportunityScore >= 50 ? 'bg-blue-500' : 'bg-gray-400'
                }`}
                style={{ width: `${intelligence.opportunityScore}%` }}
              />
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            <strong>Deal Size:</strong> {intelligence.estimatedDealSize}
          </div>
        </div>

        {/* Peer Comparison */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-800">Peer Comparison</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Asset Percentile</span>
              <span className="font-semibold text-gray-900">Top {100 - intelligence.peerComparison.assetPercentile}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Peer Group Size</span>
              <span className="font-semibold text-gray-900">{intelligence.peerComparison.peerGroupSize.toLocaleString()} similar institutions</span>
            </div>
            {intelligence.peerComparison.aboveAverageMetrics.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Strengths:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {intelligence.peerComparison.aboveAverageMetrics.map((metric, i) => (
                    <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      ✓ {metric}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {intelligence.peerComparison.belowAverageMetrics.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Opportunities:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {intelligence.peerComparison.belowAverageMetrics.map((metric, i) => (
                    <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                      ↑ {metric}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Growth Signals */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <button
            onClick={() => toggleSection('growth')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-800">Growth Signals</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {intelligence.growthSignals.score}/100
              </span>
            </div>
            {expandedSections.growth ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSections.growth && (
            <div className="px-4 pb-4 space-y-2">
              {intelligence.growthSignals.indicators.map((indicator, i) => (
                <div key={i} className={`p-3 rounded-lg ${
                  indicator.type === 'positive' ? 'bg-green-50 border border-green-200' :
                  indicator.type === 'negative' ? 'bg-red-50 border border-red-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-sm ${
                      indicator.type === 'positive' ? 'text-green-800' :
                      indicator.type === 'negative' ? 'text-red-800' : 'text-gray-800'
                    }`}>
                      {indicator.type === 'positive' ? '↑' : indicator.type === 'negative' ? '↓' : '•'} {indicator.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      indicator.impact === 'high' ? 'bg-purple-100 text-purple-700' :
                      indicator.impact === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {indicator.impact} impact
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{indicator.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tech Signals */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <button
            onClick={() => toggleSection('tech')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-gray-800">Tech Signals</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                {intelligence.techSignals.score}/100
              </span>
            </div>
            {expandedSections.tech ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSections.tech && (
            <div className="px-4 pb-4 space-y-2">
              {intelligence.techSignals.indicators.map((indicator, i) => (
                <div key={i} className={`p-3 rounded-lg ${
                  indicator.type === 'opportunity' ? 'bg-amber-50 border border-amber-200' :
                  indicator.type === 'risk' ? 'bg-red-50 border border-red-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-sm ${
                      indicator.type === 'opportunity' ? 'text-amber-800' :
                      indicator.type === 'risk' ? 'text-red-800' : 'text-gray-800'
                    }`}>
                      {indicator.type === 'opportunity' ? '🎯' : indicator.type === 'risk' ? '⚠️' : '•'} {indicator.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      indicator.impact === 'high' ? 'bg-purple-100 text-purple-700' :
                      indicator.impact === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {indicator.impact} impact
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{indicator.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buying Signals */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <button
            onClick={() => toggleSection('buying')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-800">Buying Signals</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {intelligence.buyingSignals.score}/100
              </span>
            </div>
            {expandedSections.buying ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSections.buying && (
            <div className="px-4 pb-4 space-y-2">
              {intelligence.buyingSignals.indicators.map((indicator, i) => (
                <div key={i} className={`p-3 rounded-lg flex items-start gap-2 ${
                  indicator.type === 'strong' ? 'bg-green-50 border border-green-200' :
                  indicator.type === 'moderate' ? 'bg-blue-50 border border-blue-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <span className="text-lg">
                    {indicator.type === 'strong' ? '✅' : indicator.type === 'moderate' ? '📊' : '📝'}
                  </span>
                  <div>
                    <span className={`font-medium text-sm ${
                      indicator.type === 'strong' ? 'text-green-800' :
                      indicator.type === 'moderate' ? 'text-blue-800' : 'text-gray-800'
                    }`}>
                      {indicator.label}
                    </span>
                    <p className="text-xs text-gray-600 mt-0.5">{indicator.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Competitive Intelligence */}
        {competitiveIntel && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <button
              onClick={() => toggleSection('competitive')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-gray-800">Competitive Landscape</span>
                {competitiveIntel?.isSimulated && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Simulated</span>}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  calculateWinProbability(competitiveIntel.currentVendors) >= 70 ? 'bg-green-100 text-green-700' :
                  calculateWinProbability(competitiveIntel.currentVendors) >= 50 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {calculateWinProbability(competitiveIntel.currentVendors)}% Win Rate
                </span>
              </div>
              {expandedSections.competitive ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expandedSections.competitive && (
              <div className="px-4 pb-4 space-y-3">
                {/* Displacement Difficulty */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Displacement Difficulty</span>
                    <p className="text-xs text-gray-500">Switching cost: {competitiveIntel.switchingCost}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-4 rounded-sm ${
                          i < competitiveIntel.displacementDifficulty
                            ? competitiveIntel.displacementDifficulty >= 7 ? 'bg-red-500' :
                              competitiveIntel.displacementDifficulty >= 4 ? 'bg-amber-500' : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm font-bold text-gray-700">{competitiveIntel.displacementDifficulty}/10</span>
                  </div>
                </div>

                {/* Current Vendors */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Likely Current Vendors</h4>
                  <div className="space-y-2">
                    {competitiveIntel.currentVendors.map((cp, i) => (
                      <div key={i} className="p-3 bg-white border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className={`w-4 h-4 ${
                              cp.competitor.strength === 'Strong' ? 'text-red-500' :
                              cp.competitor.strength === 'Moderate' ? 'text-amber-500' : 'text-green-500'
                            }`} />
                            <span className="font-medium text-sm text-gray-800">{cp.competitor.name}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            cp.satisfaction === 'Low' ? 'bg-green-100 text-green-700' :
                            cp.satisfaction === 'High' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {cp.satisfaction === 'Low' ? '🎯 Opportunity' : cp.satisfaction === 'High' ? '🔒 Locked' : 'Unknown'}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="font-medium">{cp.competitor.category}</span> • {cp.products.join(', ')}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-500">Est. spend: {cp.estimatedSpend}</span>
                          <button
                            onClick={() => setSelectedBattleCard(selectedBattleCard === cp.competitor.id ? null : cp.competitor.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Battle Card
                          </button>
                        </div>

                        {/* Battle Card Expansion */}
                        {selectedBattleCard === cp.competitor.id && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            <div className="p-2 bg-blue-50 rounded border border-blue-200">
                              <p className="text-xs font-medium text-blue-800">Positioning:</p>
                              <p className="text-xs text-blue-700 mt-1">{cp.competitor.battleCard.positioning}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1">Key Differentiators:</p>
                              <ul className="space-y-1">
                                {cp.competitor.battleCard.keyDifferentiators.slice(0, 3).map((diff, j) => (
                                  <li key={j} className="text-xs text-gray-600 flex items-start gap-1">
                                    <Trophy className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                    {diff}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1">Winning Tactics:</p>
                              <ul className="space-y-1">
                                {cp.competitor.battleCard.winningTactics.slice(0, 2).map((tactic, j) => (
                                  <li key={j} className="text-xs text-gray-600 flex items-start gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                    {tactic}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="p-2 bg-amber-50 rounded border border-amber-200">
                              <p className="text-xs font-medium text-amber-800">Rise Win Rate vs {cp.competitor.name}:</p>
                              <p className="text-lg font-bold text-amber-700">{cp.competitor.winRate}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Win-Back Strategy */}
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Win-Back Strategy</span>
                  </div>
                  <p className="text-xs text-green-700">{competitiveIntel.winBackStrategy}</p>
                </div>

                {/* Competitive Threats */}
                {competitiveIntel.competitiveThreats.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Watch Out For</h4>
                    <ul className="space-y-1">
                      {competitiveIntel.competitiveThreats.map((threat, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          {threat}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recommended Approach */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <button
            onClick={() => toggleSection('approach')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-gray-800">Sales Approach</span>
            </div>
            {expandedSections.approach ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSections.approach && (
            <div className="px-4 pb-4 space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">{intelligence.recommendedApproach}</p>
              </div>

              {intelligence.keyTalkingPoints.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Key Talking Points</h4>
                  <ul className="space-y-1">
                    {intelligence.keyTalkingPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {intelligence.potentialChallenges.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Potential Challenges</h4>
                  <ul className="space-y-1">
                    {intelligence.potentialChallenges.map((challenge, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ROI Preview */}
        {quickROI && risePricing && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <button
              onClick={() => toggleSection('roi')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-gray-800">ROI Calculator</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  {quickROI.annualROI}% ROI
                </span>
              </div>
              {expandedSections.roi ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expandedSections.roi && (
              <div className="px-4 pb-4 space-y-3">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                    <div className="flex items-center gap-1 mb-1">
                      <Percent className="w-3 h-3 text-emerald-600" />
                      <span className="text-xs text-emerald-600 font-medium">Annual ROI</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-700">{quickROI.annualROI}%</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">Payback</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-700">{quickROI.paybackMonths} mo</span>
                  </div>
                </div>

                {/* Investment & Returns */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rise Investment</span>
                    <span className="font-semibold text-gray-900">{formatCurrencyShort(risePricing.annualPrice)}/yr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Annual Benefit</span>
                    <span className="font-semibold text-emerald-600">+{formatCurrencyShort(quickROI.totalAnnualBenefit)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">3-Year Value</span>
                      <span className="font-bold text-gray-900">{formatCurrencyShort(quickROI.threeYearValue)}</span>
                    </div>
                  </div>
                </div>

                {/* Benefit Breakdown Mini */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Value Drivers</h4>
                  {quickROI.breakdown.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{item.category}</span>
                      <span className={`font-medium ${item.annualImpact > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                        +{formatCurrencyShort(item.annualImpact)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Open Full Calculator Button */}
                <button
                  onClick={onOpenROICalculator}
                  className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Calculator className="w-4 h-4" />
                  Open Full ROI Calculator
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
