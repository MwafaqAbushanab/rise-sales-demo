import { useState, useMemo } from 'react';
import { Search, Copy, Printer, Users, Landmark, TrendingUp, Shield, Target, DollarSign, MessageSquare, Phone, ChevronDown, ChevronUp, Check } from 'lucide-react';
import type { Lead } from '../../types';
import { formatCurrency } from '../../types';
import { generatePreCallBrief, briefToClipboardText, type PreCallBrief } from '../../utils/preCallBrief';
import { useCallReport } from '../../hooks/useCallReport';
import { getRiskColor, getRiskBgColor } from '../../utils/financialHealth';

interface PreCallPrepProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
}

function ScoreCircle({ score, tier }: { score: number; tier: string }) {
  const color = tier === 'Hot' ? 'text-green-600' : tier === 'Warm' ? 'text-amber-600' : tier === 'Nurture' ? 'text-blue-600' : 'text-gray-500';
  const bg = tier === 'Hot' ? 'bg-green-50 border-green-200' : tier === 'Warm' ? 'bg-amber-50 border-amber-200' : tier === 'Nurture' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200';
  return (
    <div className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center ${bg}`}>
      <span className={`text-xl font-bold ${color}`}>{score}</span>
      <span className={`text-[9px] font-medium ${color}`}>{tier}</span>
    </div>
  );
}

function FitBar({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-green-500' : score >= 80 ? 'bg-blue-500' : score >= 70 ? 'bg-amber-500' : 'bg-gray-400';
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-600 w-8 text-right">{score}%</span>
    </div>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const cls = urgency === 'Critical' ? 'bg-red-100 text-red-700' : urgency === 'High' ? 'bg-amber-100 text-amber-700' : urgency === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600';
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${cls}`}>{urgency}</span>;
}

export default function PreCallPrep({ leads, selectedLead, onSelectLead }: PreCallPrepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedObjection, setExpandedObjection] = useState<number | null>(null);

  // Load 5300 data for selected CU
  const { callReport, financialHealth } = useCallReport(
    selectedLead?.type === 'Credit Union' ? selectedLead.certNumber : undefined
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return leads.filter(l => l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q) || l.state.toLowerCase().includes(q)).slice(0, 10);
  }, [searchQuery, leads]);

  const brief: PreCallBrief | null = useMemo(() => {
    if (!selectedLead || leads.length === 0) return null;
    return generatePreCallBrief(selectedLead, leads);
  }, [selectedLead, leads]);

  const handleCopy = () => {
    if (!brief) return;
    navigator.clipboard.writeText(briefToClipboardText(brief));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (!brief) return;
    const text = briefToClipboardText(brief);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Pre-Call Brief: ${brief.institution.name}</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;font-size:14px;line-height:1.6;color:#333}h1{font-size:20px;border-bottom:2px solid #2563eb;padding-bottom:8px}pre{white-space:pre-wrap;font-family:inherit}</style></head><body><h1>Pre-Call Brief: ${brief.institution.name}</h1><pre>${text}</pre></body></html>`);
    w.document.close();
    w.print();
  };

  const handleSelectLead = (lead: Lead) => {
    onSelectLead(lead);
    setSearchQuery('');
    setShowDropdown(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
        <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/20">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Pre-Call Intelligence Brief</h2>
                <p className="text-xs text-blue-200">Select an institution to generate a comprehensive briefing</p>
              </div>
            </div>
          {brief && (
            <div className="flex items-center gap-2">
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-lg text-xs font-medium text-white hover:bg-white/25 transition-all ring-1 ring-white/10">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-lg text-xs font-medium text-white hover:bg-white/25 transition-all ring-1 ring-white/10">
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
            </div>
          )}
        </div>
        </div>

        {/* Lead Selector */}
        <div className="relative p-4">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery || (selectedLead ? selectedLead.name : '')}
            onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search institutions by name, city, or state..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 bg-gray-50 transition-all"
          />
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {searchResults.map(lead => (
                <button
                  key={lead.id}
                  onClick={() => handleSelectLead(lead)}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 border-b last:border-b-0"
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${lead.type === 'Credit Union' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {lead.type === 'Credit Union' ? <Users className="w-3 h-3 text-blue-600" /> : <Landmark className="w-3 h-3 text-green-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
                    <p className="text-xs text-gray-500">{lead.city}, {lead.state} · {formatCurrency(lead.assets)}</p>
                  </div>
                  <span className={`text-xs font-bold ${lead.score >= 85 ? 'text-green-600' : lead.score >= 70 ? 'text-amber-600' : 'text-gray-500'}`}>{lead.score}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Brief Content */}
      {!brief ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No Institution Selected</h3>
          <p className="text-sm text-gray-500">Search for an institution above to generate your pre-call intelligence brief</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 1: Institution Overview */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${brief.institution.type === 'Credit Union' ? 'bg-blue-100' : 'bg-green-100'}`}>
                {brief.institution.type === 'Credit Union' ? <Users className="w-4 h-4 text-blue-600" /> : <Landmark className="w-4 h-4 text-green-600" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm">{brief.institution.name}</h3>
                  {financialHealth && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getRiskBgColor(financialHealth.riskLevel)} ${getRiskColor(financialHealth.riskLevel)}`}>
                      {financialHealth.overall}/100
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{brief.institution.city}, {brief.institution.state} · {brief.institution.type}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Assets</span><p className="font-semibold text-gray-800">{formatCurrency(brief.institution.assets)}</p></div>
              <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Members</span><p className="font-semibold text-gray-800">{brief.institution.members > 0 ? brief.institution.members.toLocaleString() : 'N/A'}</p></div>
              {callReport ? (
                <>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <span className="text-gray-500">Net Worth</span>
                    <p className={`font-semibold ${callReport.latestQuarter.netWorthRatio >= 7 ? 'text-green-700' : callReport.latestQuarter.netWorthRatio >= 5 ? 'text-yellow-700' : 'text-red-700'}`}>
                      {callReport.latestQuarter.netWorthRatio.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <span className="text-gray-500">Delinquency</span>
                    <p className={`font-semibold ${callReport.latestQuarter.delinquencyRatio * 100 <= 1 ? 'text-green-700' : callReport.latestQuarter.delinquencyRatio * 100 <= 2 ? 'text-yellow-700' : 'text-red-700'}`}>
                      {(callReport.latestQuarter.delinquencyRatio * 100).toFixed(2)}%
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">ROA</span><p className="font-semibold text-gray-800">{brief.institution.roa.toFixed(2)}%</p></div>
                  <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Branches</span><p className="font-semibold text-gray-800">{brief.institution.branches > 0 ? brief.institution.branches : 'N/A'}</p></div>
                </>
              )}
            </div>
            {callReport && (
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Efficiency</span><p className="font-semibold text-gray-800">{callReport.latestQuarter.efficiencyRatio.toFixed(1)}%</p></div>
                <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">Charge-Offs</span><p className="font-semibold text-gray-800">{(callReport.latestQuarter.netChargeOffRatio * 100).toFixed(2)}%</p></div>
                <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-500">CECL Coverage</span><p className="font-semibold text-gray-800">{callReport.latestQuarter.coverageRatio.toFixed(1)}x</p></div>
              </div>
            )}
          </div>

          {/* Card 2: Opportunity Assessment */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Opportunity Assessment</h3>
            </div>
            <div className="flex items-center gap-4">
              <ScoreCircle score={brief.opportunity.score} tier={brief.opportunity.tier} />
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between text-xs"><span className="text-gray-500">Deal Size</span><span className="font-semibold text-gray-800">{brief.opportunity.dealSize}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Win Probability</span><span className="font-semibold text-gray-800">{Math.round(brief.competitive.winProbability)}%</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Displacement</span><span className="font-semibold text-gray-800">{brief.competitive.vendors.length > 0 ? brief.competitive.vendors[0].name : 'Unknown'}</span></div>
              </div>
            </div>
          </div>

          {/* Card 3: Top 3 Talking Points */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Top Talking Points</h3>
            </div>
            <div className="space-y-2.5">
              {brief.talkingPoints.map((tp, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-xs text-gray-700 leading-relaxed">{tp}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Competitive Landscape */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-red-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Competitive Landscape</h3>
            </div>
            {brief.competitive.vendors.length > 0 ? (
              <div className="space-y-2 mb-3">
                {brief.competitive.vendors.map((v, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-gray-800">{v.name}</p>
                      <p className="text-[10px] text-gray-500">{v.products.join(', ')}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${v.satisfaction === 'Low' ? 'bg-green-100 text-green-700' : v.satisfaction === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {v.satisfaction} satisfaction
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mb-3">No known competitors</p>
            )}
            <div className="bg-blue-50 rounded-lg p-2.5">
              <p className="text-[10px] font-semibold text-blue-700 mb-0.5">Strategy</p>
              <p className="text-xs text-blue-800">{brief.competitive.displacementStrategy}</p>
            </div>
          </div>

          {/* Card 5: Product Recommendations */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Product Recommendations</h3>
            </div>
            <div className="space-y-3">
              {brief.products.map((p, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-800">{p.name}</span>
                    <UrgencyBadge urgency={p.urgency} />
                  </div>
                  <FitBar score={p.fitScore} />
                  <p className="text-[10px] text-gray-500 mt-0.5">{p.whyTheyNeedIt}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card 6: ROI Preview */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-gray-900 text-sm">ROI Preview</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-emerald-700">{brief.roi.annualROI}%</p>
                <p className="text-[10px] text-emerald-600">Annual ROI</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-emerald-700">{brief.roi.paybackMonths}mo</p>
                <p className="text-[10px] text-emerald-600">Payback</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <p className="text-sm font-bold text-gray-800">{formatCurrency(brief.roi.riseInvestment)}</p>
                <p className="text-[10px] text-gray-500">Annual Investment</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <p className="text-sm font-bold text-gray-800">{formatCurrency(brief.roi.threeYearValue)}</p>
                <p className="text-[10px] text-gray-500">3-Year Value</p>
              </div>
            </div>
            <div className="bg-emerald-50 rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] text-emerald-600">Estimated Annual Benefit</p>
              <p className="text-base font-bold text-emerald-700">{formatCurrency(brief.roi.annualBenefit)}</p>
            </div>
          </div>

          {/* Card 7: Objection Prep */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Objection Prep</h3>
            </div>
            <div className="space-y-2">
              {brief.objections.map((o, i) => (
                <div key={i} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedObjection(expandedObjection === i ? null : i)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
                  >
                    <span className="text-xs font-medium text-gray-800">"{o.objection}"</span>
                    {expandedObjection === i ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                  </button>
                  {expandedObjection === i && (
                    <div className="px-3 pb-3 border-t bg-gray-50">
                      <p className="text-xs text-gray-700 mt-2 leading-relaxed">{o.response}</p>
                      <div className="mt-2">
                        <p className="text-[10px] font-semibold text-gray-500 mb-1">Proof Points:</p>
                        <ul className="space-y-0.5">
                          {o.proofPoints.map((pp, j) => (
                            <li key={j} className="text-[10px] text-gray-600 flex items-start gap-1">
                              <span className="text-green-500 mt-0.5">•</span>{pp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Card 8: Call Strategy */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Call Strategy</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-green-600 uppercase mb-1">Suggested Opening</p>
                <div className="bg-green-50 rounded-lg p-2.5">
                  <p className="text-xs text-green-800 leading-relaxed italic">{brief.callStrategy.opening}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-blue-600 uppercase mb-1">Recommended Approach</p>
                <div className="bg-blue-50 rounded-lg p-2.5">
                  <p className="text-xs text-blue-800 leading-relaxed">{brief.callStrategy.approach}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-purple-600 uppercase mb-1">Closing Ask</p>
                <div className="bg-purple-50 rounded-lg p-2.5">
                  <p className="text-xs text-purple-800 leading-relaxed italic">{brief.callStrategy.closingAsk}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {brief && (
        <p className="text-[10px] text-gray-400 text-center mt-4">
          Intelligence is estimated based on public FDIC/NCUA data and industry benchmarks. Verify details before your call.
        </p>
      )}
    </div>
  );
}
