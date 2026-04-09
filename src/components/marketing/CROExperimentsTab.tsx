import { useState } from 'react';
import { TrendingUp, Sparkles, Loader2, Copy, Check, Zap, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import { CRO_CATEGORIES } from '../../data/marketingFrameworks';
import { useStreamingGeneration } from '../../hooks/useStreamingGeneration';

interface CROExperiment {
  id: string;
  name: string;
  category: string;
  hypothesis: string;
  expectedLift: string;
  effort: string;
  implementation: string;
}

const EXPERIMENTS: CROExperiment[] = [
  // Page CRO
  { id: 'hero-specificity', name: 'Hero Headline Specificity', category: 'page', hypothesis: 'Replacing vague headlines with specific outcomes and numbers will increase engagement', expectedLift: '10-30%', effort: 'low', implementation: 'Replace "Better Analytics" with "Cut Reporting Time by 80% — See Member Insights in Real Time". Use specific numbers, outcomes, and timeframes.' },
  { id: 'social-proof-placement', name: 'Social Proof Above Fold', category: 'page', hypothesis: 'Moving logos/testimonials above the fold reduces uncertainty earlier', expectedLift: '5-15%', effort: 'low', implementation: 'Add a logo bar of 5-8 customer logos directly below the hero. Include "Trusted by 150+ credit unions" text.' },
  { id: 'cta-value-prop', name: 'CTA Button Value Copy', category: 'page', hypothesis: 'CTAs that communicate value outperform generic "Submit" or "Sign Up"', expectedLift: '10-25%', effort: 'low', implementation: 'Change "Request Demo" to "See My Analytics Dashboard" or "Get My Custom ROI Report". Focus on what they GET.' },
  { id: 'remove-nav', name: 'Remove Navigation on Landing', category: 'page', hypothesis: 'Removing navigation reduces exit paths and increases conversion', expectedLift: '5-20%', effort: 'low', implementation: 'On dedicated landing pages, remove main nav. Keep only logo and CTA. Reduces choices from 10+ to 1.' },
  { id: 'directional-cues', name: 'Add Directional Cues', category: 'page', hypothesis: 'Visual arrows or eye gaze pointing toward CTA increase clicks', expectedLift: '5-15%', effort: 'low', implementation: 'Use images where people look toward the CTA. Add subtle arrow graphics. Ensure whitespace guides eyes to conversion.' },
  { id: 'risk-reversal', name: 'Risk Reversal Near CTA', category: 'page', hypothesis: 'Addressing fear of commitment near the CTA reduces friction', expectedLift: '10-20%', effort: 'low', implementation: 'Add "No credit card required", "Free 14-day trial", "Cancel anytime" directly beside the CTA button.' },
  { id: 'video-demo', name: 'Add Product Demo Video', category: 'page', hypothesis: 'Short demo video increases understanding and trust', expectedLift: '10-30%', effort: 'medium', implementation: 'Add a 60-90 second product demo video. Show the actual dashboard. Include a play button overlay on a screenshot.' },
  // Signup Flow
  { id: 'progressive-disclosure', name: 'Progressive Form Disclosure', category: 'signup', hypothesis: 'Breaking a long form into steps reduces perceived effort', expectedLift: '15-30%', effort: 'medium', implementation: 'Split signup into 2-3 steps with progress bar. Start with email only, then add details.' },
  { id: 'social-login', name: 'Add Social Login Options', category: 'signup', hypothesis: 'Social login removes the friction of creating another password', expectedLift: '10-25%', effort: 'medium', implementation: 'Add "Continue with Google" and "Continue with Microsoft" above email form.' },
  { id: 'remove-fields', name: 'Remove Non-Essential Fields', category: 'signup', hypothesis: 'Every additional field reduces conversion by 5-10%', expectedLift: '10-25%', effort: 'low', implementation: 'Remove phone, company size, job title from initial signup. Collect during onboarding instead.' },
  { id: 'inline-validation', name: 'Real-Time Inline Validation', category: 'signup', hypothesis: 'Immediate feedback reduces errors and form abandonment', expectedLift: '5-15%', effort: 'medium', implementation: 'Validate each field on blur. Show green checkmarks. Specific error messages inline.' },
  { id: 'password-requirements', name: 'Show Password Requirements', category: 'signup', hypothesis: 'Showing requirements prevents frustrating failed attempts', expectedLift: '5-10%', effort: 'low', implementation: 'Display password requirements below field. Check them off in real-time as user types.' },
  // Form CRO
  { id: 'multi-step-form', name: 'Multi-Step Form Layout', category: 'form', hypothesis: 'Multi-step forms feel less overwhelming than single long forms', expectedLift: '15-40%', effort: 'medium', implementation: 'Convert long forms to 3-4 step wizard. Group related fields. First step: just email.' },
  { id: 'smart-defaults', name: 'Smart Default Values', category: 'form', hypothesis: 'Pre-filling known information reduces effort', expectedLift: '5-15%', effort: 'medium', implementation: 'Auto-detect country, timezone, company name from email domain. Pre-fill what you can.' },
  { id: 'mobile-optimized', name: 'Mobile-Optimized Fields', category: 'form', hypothesis: 'Correct input types reduce mobile friction', expectedLift: '10-20%', effort: 'low', implementation: 'Use type="email", type="tel", inputmode="numeric" to trigger correct mobile keyboards.' },
  { id: 'benefit-labels', name: 'Benefit-Oriented Labels', category: 'form', hypothesis: 'Labels that explain WHY increase completion', expectedLift: '5-10%', effort: 'low', implementation: 'Change "Company Size" to "Company Size (so we can customize your demo)". Add context.' },
  { id: 'conditional-fields', name: 'Conditional Field Display', category: 'form', hypothesis: 'Showing only relevant fields reduces overwhelm', expectedLift: '10-20%', effort: 'medium', implementation: 'Show/hide fields based on answers. If "Credit Union" selected, show CU-specific fields.' },
];

const EFFORT_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

const CATEGORY_COLORS: Record<string, string> = {
  page: 'bg-purple-100 text-purple-700',
  signup: 'bg-blue-100 text-blue-700',
  form: 'bg-cyan-100 text-cyan-700',
};

export default function CROExperimentsTab() {
  const [category, setCategory] = useState('all');
  const [expandedExperiment, setExpandedExperiment] = useState<string | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'lift' | 'effort'>('lift');
  const [copiedContent, setCopiedContent] = useState(false);
  const { content, isGenerating, error, wordCount, generate } = useStreamingGeneration();

  const filtered = EXPERIMENTS
    .filter(e => category === 'all' || e.category === category)
    .sort((a, b) => {
      if (sortBy === 'effort') {
        const order = { low: 0, medium: 1, high: 2 };
        return (order[a.effort as keyof typeof order] ?? 1) - (order[b.effort as keyof typeof order] ?? 1);
      }
      // Sort by highest expected lift
      const liftA = parseInt(a.expectedLift.split('-').pop() ?? '0');
      const liftB = parseInt(b.expectedLift.split('-').pop() ?? '0');
      return liftB - liftA;
    });

  const handleGetPlan = (experiment: CROExperiment) => {
    setSelectedExperiment(experiment.id);
    generate('/api/marketing/generate/stream', {
      contentType: 'custom',
      customPrompt: `Create a detailed implementation plan for this CRO experiment for Rise Analytics (credit union analytics platform):

**Experiment:** ${experiment.name}
**Category:** ${experiment.category} CRO
**Hypothesis:** ${experiment.hypothesis}
**Expected Lift:** ${experiment.expectedLift}

Provide:
1. **Step-by-step implementation** (5-7 specific steps)
2. **What to measure** — primary metric, secondary metrics, and how to track them
3. **Test duration** — recommended sample size and timeline
4. **Variations to test** — 2-3 specific variations with descriptions
5. **Common mistakes** — 3 pitfalls to avoid
6. **Credit union context** — how this applies specifically to CU/bank landing pages

Be specific to Rise Analytics. Use "members" not "customers" for credit union context.
Format with clear markdown headers and bullet points.`,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-800">CRO Experiment Library</h4>
            <p className="text-sm text-gray-600 mt-1">
              {EXPERIMENTS.length} proven experiments with expected conversion lifts. Click any experiment for AI-generated implementation details.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {CRO_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                category === cat.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
              {cat.id !== 'all' && (
                <span className="ml-1 opacity-75">
                  ({EXPERIMENTS.filter(e => e.category === cat.id).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'lift' | 'effort')}
          className="px-3 py-1.5 border rounded-lg text-xs"
        >
          <option value="lift">Sort: Highest Lift</option>
          <option value="effort">Sort: Easiest First</option>
        </select>
      </div>

      {/* Experiment Cards */}
      <div className="space-y-2">
        {filtered.map(experiment => (
          <div
            key={experiment.id}
            className={`border rounded-lg overflow-hidden transition-all ${
              expandedExperiment === experiment.id ? 'border-green-300 shadow-sm' : 'border-gray-200'
            }`}
          >
            <button
              onClick={() => setExpandedExperiment(expandedExperiment === experiment.id ? null : experiment.id)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-sm font-medium text-gray-800">{experiment.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${CATEGORY_COLORS[experiment.category] ?? ''}`}>
                      {experiment.category}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${EFFORT_COLORS[experiment.effort] ?? ''}`}>
                      {experiment.effort} effort
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-600">
                    <ArrowUpRight className="w-3 h-3" />
                    <span className="text-sm font-semibold">{experiment.expectedLift}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">expected lift</span>
                </div>
                {expandedExperiment === experiment.id
                  ? <ChevronUp className="w-4 h-4 text-gray-400" />
                  : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {expandedExperiment === experiment.id && (
              <div className="px-3 pb-3 border-t bg-gray-50">
                <div className="mt-3 space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-500">Hypothesis</span>
                    <p className="text-sm text-gray-700">{experiment.hypothesis}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Quick Implementation</span>
                    <p className="text-sm text-gray-700">{experiment.implementation}</p>
                  </div>
                  <button
                    onClick={() => handleGetPlan(experiment)}
                    disabled={isGenerating}
                    className="mt-2 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isGenerating && selectedExperiment === experiment.id
                      ? <><Loader2 className="w-3 h-3 animate-spin" />Generating Plan...</>
                      : <><Sparkles className="w-3 h-3" />Get AI Implementation Plan</>}
                  </button>
                </div>

                {/* AI Plan output */}
                {content && selectedExperiment === experiment.id && (
                  <div className="mt-3 bg-white rounded-lg p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">AI Implementation Plan</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{wordCount} words</span>
                        <button
                          onClick={() => copyToClipboard(content)}
                          className="px-2 py-0.5 bg-gray-100 border rounded text-[10px] hover:bg-gray-200 flex items-center gap-1"
                        >
                          {copiedContent ? <Check className="w-2.5 h-2.5 text-green-600" /> : <Copy className="w-2.5 h-2.5" />}
                          Copy
                        </button>
                      </div>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs text-gray-700 font-sans max-h-64 overflow-y-auto">{content}</pre>
                  </div>
                )}

                {error && selectedExperiment === experiment.id && (
                  <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2 text-red-700 text-xs">{error}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
