import { useState } from 'react';
import { Rocket, Sparkles, Loader2, Copy, Check, ChevronDown, ChevronUp, Clock, CheckCircle2 } from 'lucide-react';
import { LAUNCH_TYPES } from '../../data/marketingFrameworks';
import { useStreamingGeneration } from '../../hooks/useStreamingGeneration';

const PHASES = [
  { id: 'internal', name: 'Internal Launch', icon: '🏠', description: 'Align team, build assets, set benchmarks', duration: 'Week 1-2', actions: ['Define launch goals and success metrics', 'Create positioning and messaging doc', 'Brief sales team with battle cards and FAQ', 'Prepare demo environment and scripts', 'Set up tracking (UTMs, events, dashboards)'] },
  { id: 'alpha', name: 'Alpha / Soft Launch', icon: '🧪', description: 'Test with select customers, gather feedback', duration: 'Week 2-4', actions: ['Invite 5-10 existing customers for early access', 'Collect qualitative feedback and testimonials', 'Fix critical bugs and UX issues', 'Create initial case study from alpha users', 'Refine messaging based on real reactions'] },
  { id: 'beta', name: 'Beta / Pre-Launch', icon: '📣', description: 'Build anticipation and waitlist', duration: 'Week 4-6', actions: ['Publish teaser content (blog, social)', 'Launch waitlist or early access signup', 'Send preview to newsletter subscribers', 'Reach out to industry analysts and press', 'Prepare launch day assets (email, social, blog)'] },
  { id: 'public', name: 'Public Launch', icon: '🚀', description: 'Go live across all channels', duration: 'Launch day + Week 1', actions: ['Publish launch blog post / announcement', 'Send launch email to full list', 'Post across all social channels', 'Activate paid campaigns if budgeted', 'Enable sales outreach with new messaging', 'Submit to directories and listings'] },
  { id: 'post-launch', name: 'Post-Launch', icon: '📈', description: 'Sustain momentum and measure results', duration: 'Week 2-8', actions: ['Publish customer success stories', 'Run webinar or live demo event', 'Analyze launch metrics vs. goals', 'Create retargeting campaigns for non-converters', 'Plan follow-up content series', 'Gather and publish reviews'] },
];

const ORB_CHANNELS = {
  owned: { label: 'Owned', color: 'bg-blue-100 text-blue-700', items: ['Website/blog', 'Email list', 'In-app messaging', 'Documentation', 'Community'] },
  rented: { label: 'Rented', color: 'bg-amber-100 text-amber-700', items: ['Paid search', 'Paid social', 'Sponsorships', 'Display ads'] },
  borrowed: { label: 'Borrowed', color: 'bg-green-100 text-green-700', items: ['PR/media coverage', 'Guest posts', 'Podcast appearances', 'Partner co-marketing', 'Industry events'] },
};

export default function LaunchPlannerTab() {
  const [launchType, setLaunchType] = useState('new_product');
  const [timeline, setTimeline] = useState('8');
  const [expandedPhase, setExpandedPhase] = useState<string | null>('internal');
  const [showOrb, setShowOrb] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const { content, isGenerating, error, wordCount, generate } = useStreamingGeneration();

  const handleGenerate = () => {
    const type = LAUNCH_TYPES.find(t => t.id === launchType);
    generate('/api/marketing/generate/stream', {
      contentType: 'custom',
      customPrompt: `Create a detailed ${type?.name} plan for Rise Analytics over ${timeline} weeks.

Rise Analytics is a credit union and community bank analytics platform with products: Analytics Platform, Member 360, Lending Analytics, Data Warehouse, Marketing Insights, and Compliance Suite. 150+ customers, 150-200% estimated ROI.

Use the 5-phase launch framework:
1. **Internal Launch** (Week 1-2) — Team alignment, asset creation, benchmarks
2. **Alpha / Soft Launch** (Week 2-4) — 5-10 select customers, feedback loop
3. **Beta / Pre-Launch** (Week 4-6) — Build anticipation, waitlist, teasers
4. **Public Launch** (Launch day + Week 1) — All channels go live
5. **Post-Launch** (Week 2-8) — Sustain momentum, measure, iterate

Use the ORB Channel Framework:
- **Owned**: Website, email, in-app, docs, community
- **Rented**: Paid search, paid social, sponsorships
- **Borrowed**: PR, guest posts, podcasts, partner co-marketing, events

For each phase provide:
- Specific actions (5-7 per phase)
- Channel assignments (which ORB channels to use)
- Key metrics to track
- Go/no-go criteria for moving to next phase
- Timeline with specific week numbers (within ${timeline}-week total)

Add a **Launch Success Metrics** section at the end with KPIs and targets.
Context: Credit union industry. Use "members" not "customers" for CU end users.
Format with clear markdown headers, bullet points, and bold for key items.`,
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
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
        <div className="flex items-start gap-3">
          <Rocket className="w-5 h-5 text-orange-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-800">Launch Planner</h4>
            <p className="text-sm text-gray-600 mt-1">
              Plan product launches using a 5-phase framework and the ORB (Owned/Rented/Borrowed) channel strategy.
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Launch Type</label>
          <select
            value={launchType}
            onChange={(e) => setLaunchType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            {LAUNCH_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">{LAUNCH_TYPES.find(t => t.id === launchType)?.description}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Timeline</label>
          <select
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="2">2 weeks (rapid)</option>
            <option value="4">4 weeks (focused)</option>
            <option value="8">8 weeks (standard)</option>
            <option value="12">12 weeks (comprehensive)</option>
          </select>
        </div>
      </div>

      {/* 5-Phase Framework */}
      <div className="space-y-2">
        <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider">5-Phase Framework</h5>
        {PHASES.map((phase, idx) => (
          <div key={phase.id} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{phase.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">Phase {idx + 1}: {phase.name}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />{phase.duration}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{phase.description}</p>
                </div>
              </div>
              {expandedPhase === phase.id
                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expandedPhase === phase.id && (
              <div className="px-3 pb-3 border-t bg-gray-50">
                <ul className="mt-2 space-y-1.5">
                  {phase.actions.map(action => (
                    <li key={action} className="flex items-start gap-2 text-xs text-gray-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ORB Channel Framework */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setShowOrb(!showOrb)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          ORB Channel Framework (Owned / Rented / Borrowed)
          {showOrb ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showOrb && (
          <div className="p-3 grid grid-cols-3 gap-3">
            {Object.entries(ORB_CHANNELS).map(([key, channel]) => (
              <div key={key}>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${channel.color}`}>{channel.label}</span>
                <ul className="mt-2 space-y-1">
                  {channel.items.map(item => (
                    <li key={item} className="text-xs text-gray-600">• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Generating Launch Plan...</>
        ) : (
          <><Sparkles className="w-4 h-4" />Generate {LAUNCH_TYPES.find(t => t.id === launchType)?.name} Plan</>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>
      )}

      {/* Generated Plan */}
      {content && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              {LAUNCH_TYPES.find(t => t.id === launchType)?.name} Plan ({timeline} weeks)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{wordCount} words</span>
              <button
                onClick={() => copyToClipboard(content)}
                className="px-3 py-1 bg-white border rounded-lg text-sm hover:bg-gray-100 flex items-center gap-1"
              >
                {copiedContent ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                {copiedContent ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans max-h-[500px] overflow-y-auto">{content}</pre>
        </div>
      )}
    </div>
  );
}
