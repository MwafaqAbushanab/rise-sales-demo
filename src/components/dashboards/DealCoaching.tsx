import { useState, useEffect } from 'react';
import { GraduationCap, MessageSquare, Mail, Activity, AlertTriangle, Lightbulb, Play, Brain, ChevronDown, CheckCircle, Search, Loader2, Sparkles, Gauge, TrendingUp, TrendingDown, ThumbsUp, ThumbsDown, ArrowRight, Copy, Check } from 'lucide-react';
import { type Lead } from '../../types';
import { generateCoachingTips, assessDealRisks, calculateWinProbability as calculateDealWinProbability, generateFollowUpSequence, findObjectionResponse, DEAL_STAGES, type CoachingTip, type DealRisk, type WinProbability as WinProbabilityType, type FollowUpSequence } from '../../utils/dealCoaching';
import { type ProspectIntelligence } from '../../utils/prospectingIntelligence';

// Deal Coaching Dashboard - AI-powered real-time sales coaching
export default function DealCoachingDashboard({ selectedLead, intelligence: _intelligence }: {
  selectedLead: Lead | null;
  intelligence: ProspectIntelligence | null;
}) {
  const [activeTab, setActiveTab] = useState<'coaching' | 'objections' | 'followup' | 'risks'>('coaching');
  const [coachingTips, setCoachingTips] = useState<CoachingTip[]>([]);
  const [dealRisks, setDealRisks] = useState<DealRisk[]>([]);
  const [winProb, setWinProb] = useState<WinProbabilityType | null>(null);
  const [followUpSequence, setFollowUpSequence] = useState<FollowUpSequence[]>([]);
  const [objectionInput, setObjectionInput] = useState('');
  const [objectionResponse, setObjectionResponse] = useState<ReturnType<typeof findObjectionResponse>>(null);
  const [expandedTip, setExpandedTip] = useState<number | null>(null);
  const [copiedSequence, setCopiedSequence] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Calculate coaching data when lead changes
  useEffect(() => {
    if (selectedLead) {
      const daysInStage = Math.floor(Math.random() * 20) + 1; // Simulated - would come from CRM
      const lastContactDays = Math.floor(Math.random() * 14) + 1; // Simulated

      // Generate coaching tips
      const tips = generateCoachingTips(
        selectedLead.status,
        daysInStage,
        selectedLead.assets,
        Math.random() > 0.5, // hasCompetitor
        lastContactDays
      );
      setCoachingTips(tips);

      // Assess risks
      const risks = assessDealRisks(
        selectedLead.status,
        daysInStage,
        lastContactDays,
        Math.random() > 0.5, // hasChampion
        Math.random() > 0.3, // budgetConfirmed
        Math.random() > 0.5, // timelineConfirmed
        ['weak', 'moderate', 'strong', 'unknown'][Math.floor(Math.random() * 4)] as 'weak' | 'moderate' | 'strong' | 'unknown'
      );
      setDealRisks(risks);

      // Calculate win probability
      const prob = calculateDealWinProbability(
        selectedLead.status,
        daysInStage,
        selectedLead.assets,
        Math.random() > 0.5,
        Math.random() > 0.3,
        ['weak', 'moderate', 'strong', 'unknown'][Math.floor(Math.random() * 4)] as 'weak' | 'moderate' | 'strong' | 'unknown',
        ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
      );
      setWinProb(prob);

      // Generate follow-up sequence
      const sequence = generateFollowUpSequence(
        selectedLead.status,
        selectedLead.name,
        selectedLead.contact || '',
        selectedLead.recommendedProducts[0] || 'Analytics Platform'
      );
      setFollowUpSequence(sequence);
    }
  }, [selectedLead]);

  const handleObjectionSearch = () => {
    if (!objectionInput.trim()) return;
    const response = findObjectionResponse(objectionInput);
    setObjectionResponse(response);
  };

  const handleAIObjectionHelp = async () => {
    if (!objectionInput.trim()) return;
    setIsLoadingAI(true);
    setAiResponse(null);

    try {
      const response = await fetch('http://localhost:3002/api/coaching/handle-objection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objection: objectionInput,
          leadContext: selectedLead ? {
            name: selectedLead.name,
            type: selectedLead.type,
            assets: selectedLead.assets,
          } : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiResponse(data.response);
      }
    } catch (error) {
      console.error('AI objection help error:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSequence(id);
    setTimeout(() => setCopiedSequence(null), 2000);
  };

  const tabs = [
    { id: 'coaching', label: 'Real-Time Coaching', icon: GraduationCap },
    { id: 'objections', label: 'Objection Handler', icon: MessageSquare },
    { id: 'followup', label: 'Follow-Up Sequences', icon: Mail },
    { id: 'risks', label: 'Deal Health', icon: Activity },
  ];

  const getTipIcon = (type: CoachingTip['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'opportunity': return <Lightbulb className="w-4 h-4 text-green-500" />;
      case 'action': return <Play className="w-4 h-4 text-blue-500" />;
      case 'insight': return <Brain className="w-4 h-4 text-purple-500" />;
    }
  };

  const getRiskColor = (severity: DealRisk['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-300 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium': return 'bg-amber-100 border-amber-300 text-amber-800';
      case 'low': return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header with Win Probability */}
      <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6" />
            <div>
              <h3 className="font-semibold text-lg">AI Deal Coach</h3>
              <p className="text-emerald-200 text-sm">Real-time sales coaching & deal intelligence</p>
            </div>
          </div>
          {selectedLead && winProb && (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Gauge className="w-5 h-5" />
                  <span className="font-bold text-2xl">{winProb.score}%</span>
                  {winProb.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-300" />}
                  {winProb.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-300" />}
                </div>
                <div className="text-emerald-200 text-xs">Win Probability</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{coachingTips.length}</div>
                <div className="text-emerald-200 text-xs">Active Tips</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{dealRisks.filter(r => r.severity === 'critical' || r.severity === 'high').length}</div>
                <div className="text-emerald-200 text-xs">Key Risks</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-4">
        {!selectedLead ? (
          <div className="text-center py-8 text-gray-500">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Select a lead to get AI-powered coaching</p>
            <p className="text-sm mt-1">Real-time suggestions, objection handling, and deal intelligence</p>
          </div>
        ) : (
          <>
            {activeTab === 'coaching' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  AI-generated coaching tips for <strong>{selectedLead.name}</strong> based on deal stage, timing, and prospect profile.
                </p>

                {coachingTips.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
                    <p>No urgent coaching tips - deal is progressing well!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {coachingTips.map((tip, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          tip.priority === 'high' ? 'bg-red-50 border-red-200' :
                          tip.priority === 'medium' ? 'bg-amber-50 border-amber-200' :
                          'bg-blue-50 border-blue-200'
                        }`}
                        onClick={() => setExpandedTip(expandedTip === index ? null : index)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getTipIcon(tip.type)}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800">{tip.title}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  tip.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  tip.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {tip.priority.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                            </div>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedTip === index ? 'rotate-180' : ''}`} />
                        </div>

                        {expandedTip === index && (
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                            {tip.suggestedAction && (
                              <div className="bg-white p-3 rounded-lg">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Suggested Action</p>
                                <p className="text-sm text-gray-800">{tip.suggestedAction}</p>
                              </div>
                            )}
                            {tip.impact && (
                              <div className="bg-white p-3 rounded-lg">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Impact</p>
                                <p className="text-sm text-gray-800">{tip.impact}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'objections' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter the objection you're facing:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={objectionInput}
                      onChange={(e) => setObjectionInput(e.target.value)}
                      placeholder="e.g., 'Your solution is too expensive' or 'We're using Jack Henry'"
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleObjectionSearch()}
                    />
                    <button
                      onClick={handleObjectionSearch}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Find Response
                    </button>
                    <button
                      onClick={handleAIObjectionHelp}
                      disabled={isLoadingAI || !objectionInput.trim()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isLoadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      AI Help
                    </button>
                  </div>
                </div>

                {objectionResponse && (
                  <div className="bg-white rounded-lg border overflow-hidden">
                    <div className="p-4 bg-emerald-50 border-b">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800">Objection: "{objectionResponse.objection}"</span>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium capitalize">
                          {objectionResponse.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Recommended Response:</h4>
                        <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">{objectionResponse.response}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Proof Points:</h4>
                        <ul className="space-y-1">
                          {objectionResponse.proofPoints.map((point, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Follow-Up Question:</h4>
                        <p className="text-sm text-gray-800 italic">"{objectionResponse.followUp}"</p>
                      </div>
                    </div>
                  </div>
                )}

                {aiResponse && (
                  <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-purple-800">AI-Powered Response</span>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-700">
                      <pre className="whitespace-pre-wrap font-sans text-sm">{aiResponse}</pre>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Common Objections Library</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Price concerns', 'Using Jack Henry', 'Not ready yet', 'Need board approval', "We use spreadsheets", 'Using Tableau'].map(obj => (
                      <button
                        key={obj}
                        onClick={() => setObjectionInput(obj)}
                        className="px-3 py-1.5 bg-white border rounded-lg text-sm text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                      >
                        {obj}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'followup' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800">Follow-Up Sequence for {selectedLead.name}</h4>
                    <p className="text-sm text-gray-600">Stage: {DEAL_STAGES.find(s => s.id === selectedLead.status)?.name || selectedLead.status}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    {followUpSequence.length} touches
                  </span>
                </div>

                <div className="space-y-3">
                  {followUpSequence.map((step, index) => (
                    <div key={step.id} className="bg-white rounded-lg border overflow-hidden">
                      <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            step.channel === 'email' ? 'bg-blue-500' :
                            step.channel === 'phone' ? 'bg-green-500' :
                            step.channel === 'linkedin' ? 'bg-indigo-500' : 'bg-purple-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{step.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <span className="capitalize">{step.channel}</span>
                              <span>•</span>
                              <span>Day {step.dayOffset >= 0 ? step.dayOffset : `${step.dayOffset} (before)`}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(step.template, step.id)}
                          className="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-100 flex items-center gap-1"
                        >
                          {copiedSequence === step.id ? (
                            <>
                              <Check className="w-3 h-3 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-4">
                        {step.subject && (
                          <div className="mb-2">
                            <span className="text-xs font-semibold text-gray-500">Subject: </span>
                            <span className="text-sm text-gray-700">{step.subject}</span>
                          </div>
                        )}
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{step.template}</pre>
                        <div className="mt-3 pt-3 border-t">
                          <span className="text-xs text-gray-500">Purpose: {step.purpose}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'risks' && (
              <div className="space-y-4">
                {/* Win Probability Card */}
                {winProb && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold text-gray-800">Deal Win Probability</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-3xl font-bold ${
                          winProb.score >= 70 ? 'text-green-600' :
                          winProb.score >= 50 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>{winProb.score}%</span>
                        {winProb.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
                        {winProb.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          winProb.score >= 70 ? 'bg-green-500' :
                          winProb.score >= 50 ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${winProb.score}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" /> Positive Factors
                        </h5>
                        <ul className="space-y-1">
                          {winProb.factors.positive.map((factor, i) => (
                            <li key={i} className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">{factor}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                          <ThumbsDown className="w-3 h-3" /> Negative Factors
                        </h5>
                        <ul className="space-y-1">
                          {winProb.factors.negative.map((factor, i) => (
                            <li key={i} className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded">{factor}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {winProb.recommendations.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Recommendations</h5>
                        <ul className="space-y-1">
                          {winProb.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <ArrowRight className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Deal Risks */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Deal Risks</h4>
                  {dealRisks.length === 0 ? (
                    <div className="text-center py-6 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                      <p className="text-green-700">No significant risks identified</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dealRisks.map((risk, index) => (
                        <div key={index} className={`p-4 rounded-lg border ${getRiskColor(risk.severity)}`}>
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-semibold capitalize">{risk.category} Risk</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                              risk.severity === 'critical' ? 'bg-red-200' :
                              risk.severity === 'high' ? 'bg-orange-200' :
                              risk.severity === 'medium' ? 'bg-amber-200' : 'bg-blue-200'
                            }`}>
                              {risk.severity}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{risk.indicator}</p>
                          <div className="pt-2 border-t border-current border-opacity-20">
                            <span className="text-xs font-semibold">Mitigation: </span>
                            <span className="text-sm">{risk.mitigation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
