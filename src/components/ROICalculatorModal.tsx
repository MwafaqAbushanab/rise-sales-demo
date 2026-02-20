import { useState, useEffect } from 'react';
import type { Lead } from '../types';
import { calculateROI, getDefaultInputs, calculateRisePricing, generateROISummary, formatCurrencyShort, type ROIInputs, type ROIProjection } from '../utils/roiCalculator';
import { DISCLAIMERS } from '../constants';
import { Calculator, X, BarChart3, Percent, Clock, PieChart } from 'lucide-react';

interface ROICalculatorModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ROICalculatorModal({ lead, isOpen, onClose }: ROICalculatorModalProps) {
  const [inputs, setInputs] = useState<ROIInputs | null>(null);
  const [projection, setProjection] = useState<ROIProjection | null>(null);

  useEffect(() => {
    if (lead && isOpen) {
      const defaultInputs = getDefaultInputs({
        assets: lead.assets,
        members: lead.members,
        type: lead.type
      });
      setInputs(defaultInputs);
      setProjection(calculateROI(defaultInputs));
    }
  }, [lead, isOpen]);

  const handleInputChange = (field: keyof ROIInputs, value: number) => {
    if (!inputs) return;
    const newInputs = { ...inputs, [field]: value };
    setInputs(newInputs);
    setProjection(calculateROI(newInputs));
  };

  if (!isOpen || !lead || !inputs || !projection) return null;

  const risePricing = calculateRisePricing(lead.assets, lead.members);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">ROI Calculator</h2>
                <p className="text-emerald-100 text-sm">{lead.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Inputs */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                  Current State Assumptions
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Monthly Analytics Spend
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={inputs.currentAnalyticsSpend}
                        onChange={(e) => handleInputChange('currentAnalyticsSpend', Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Manual Reporting Hours
                    </label>
                    <input
                      type="number"
                      value={inputs.manualReportingHours}
                      onChange={(e) => handleInputChange('manualReportingHours', Number(e.target.value))}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Average Hourly Rate (Loaded)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={inputs.avgHourlyRate}
                        onChange={(e) => handleInputChange('avgHourlyRate', Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {lead.type === 'Credit Union' ? 'Member' : 'Customer'} Attrition Rate
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={(inputs.memberAttritionRate * 100).toFixed(1)}
                          onChange={(e) => handleInputChange('memberAttritionRate', Number(e.target.value) / 100)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Avg {lead.type === 'Credit Union' ? 'Member' : 'Customer'} Value
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={inputs.avgMemberValue}
                          onChange={(e) => handleInputChange('avgMemberValue', Number(e.target.value))}
                          className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cross-Sell Rate
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={(inputs.crossSellRate * 100).toFixed(1)}
                          onChange={(e) => handleInputChange('crossSellRate', Number(e.target.value) / 100)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loan Default Rate
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={(inputs.loanDefaultRate * 100).toFixed(2)}
                          onChange={(e) => handleInputChange('loanDefaultRate', Number(e.target.value) / 100)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rise Pricing Info */}
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <h4 className="font-semibold text-emerald-800 mb-2">Recommended Rise Plan</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-emerald-700">{risePricing.tier.name}</span>
                    <span className="font-bold text-emerald-800">{formatCurrencyShort(risePricing.monthlyPrice)}/mo</span>
                  </div>
                  <div className="text-xs text-emerald-600">
                    {risePricing.tier.features.join(' • ')}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Percent className="w-4 h-4" />
                    <span className="text-sm text-emerald-100">Annual ROI</span>
                  </div>
                  <span className="text-3xl font-bold">{projection.annualROI}%</span>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm text-blue-100">Payback Period</span>
                  </div>
                  <span className="text-3xl font-bold">{projection.paybackMonths} mo</span>
                </div>
              </div>

              {/* Annual Value */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-gray-800">Annual Value Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rise Investment</span>
                    <span className="font-medium text-gray-900">-{formatCurrencyShort(risePricing.annualPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Benefits</span>
                    <span className="font-medium text-emerald-600">+{formatCurrencyShort(projection.totalAnnualBenefit)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Net Annual Value</span>
                      <span className="font-bold text-emerald-600">
                        {formatCurrencyShort(projection.totalAnnualBenefit - risePricing.annualPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefit Breakdown */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Benefit Breakdown</h4>
                <div className="space-y-3">
                  {projection.breakdown.map((item, i) => (
                    <div key={i} className="bg-white rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-800">{item.category}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          item.confidence === 'High' ? 'bg-green-100 text-green-700' :
                          item.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {item.confidence} confidence
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <div>Current: {item.currentState}</div>
                        <div>With Rise: {item.withRise}</div>
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-lg font-bold text-emerald-600">
                          +{formatCurrencyShort(item.annualImpact)}/yr
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Year Projection */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 text-white">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Multi-Year Value
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold">{formatCurrencyShort(projection.conservative)}</div>
                    <div className="text-xs text-gray-400">Conservative</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">{formatCurrencyShort(projection.threeYearValue)}</div>
                    <div className="text-xs text-gray-400">3-Year Value</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatCurrencyShort(projection.fiveYearValue)}</div>
                    <div className="text-xs text-gray-400">5-Year Value</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                const summary = generateROISummary(projection, lead.name);
                navigator.clipboard.writeText(summary);
                alert('ROI Summary copied to clipboard!');
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Copy Summary
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">{DISCLAIMERS.roiDisclaimer}</p>
        </div>
      </div>
    </div>
  );
}
