import { useState } from 'react';
import { Mail, Sparkles, Loader2, Copy, Check, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { SEQUENCE_TYPES, EMAIL_FRAMEWORKS } from '../../data/marketingFrameworks';
import { useStreamingGeneration } from '../../hooks/useStreamingGeneration';
import FrameworkSelector from './FrameworkSelector';

export default function EmailSequencesTab() {
  const [sequenceType, setSequenceType] = useState('welcome');
  const [framework, setFramework] = useState<string | null>(null);
  const [audience, setAudience] = useState('credit_union');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [copiedContent, setCopiedContent] = useState(false);
  const { content, isGenerating, error, wordCount, generate } = useStreamingGeneration();

  const handleGenerate = () => {
    generate('/api/marketing/generate/stream', {
      contentType: 'email_sequence',
      customPrompt: buildSequencePrompt(),
    });
  };

  const buildSequencePrompt = () => {
    const seq = SEQUENCE_TYPES.find(s => s.id === sequenceType);
    const fw = framework ? EMAIL_FRAMEWORKS.find(f => f.id === framework) : null;
    const audienceLabel = audience === 'credit_union' ? 'credit union executives' : audience === 'community_bank' ? 'community bank leaders' : 'credit union and community bank leaders';

    return `Create a complete ${seq?.name} email sequence for Rise Analytics targeting ${audienceLabel}.

This sequence should have ${seq?.emailCount} emails over ${seq?.duration}.
Purpose: ${seq?.description}

${fw ? `IMPORTANT: Write each email using the ${fw.name} (${fw.fullName}) framework.
Structure each email as: ${fw.shortDescription}` : ''}

For each email, provide:
1. **Email #X** (Day X)
2. **Subject Line**: Follow cold email best practices — 2-4 words, lowercase, no punctuation
3. **Preview Text**: The first line that shows in inbox
4. **Purpose**: What this email accomplishes
5. **Body**: Full email copy (150-250 words each)
6. **CTA**: The single call to action

Context: Rise Analytics provides analytics solutions for credit unions and community banks. Products include Analytics Platform, Member 360, Lending Analytics, Data Warehouse, Marketing Insights, and Compliance Suite. 150+ customers, 150-200% estimated ROI, 4-6 week implementation.

Use "members" not "customers" when referring to credit union end users.
Write in a professional but approachable tone. Each email should stand alone but build on previous ones.`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-800">Email Sequence Builder</h4>
            <p className="text-sm text-gray-600 mt-1">
              Generate complete multi-email sequences using proven frameworks. Each sequence is tailored for Rise Analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Sequence Type Cards */}
      <div className="grid grid-cols-2 gap-3">
        {SEQUENCE_TYPES.map(seq => (
          <button
            key={seq.id}
            onClick={() => setSequenceType(seq.id)}
            className={`text-left p-3 rounded-lg border-2 transition-all ${
              sequenceType === seq.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-gray-800">{seq.name}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {seq.emailCount} emails
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{seq.description}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {seq.duration}
            </div>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <FrameworkSelector
          frameworks={EMAIL_FRAMEWORKS}
          selected={framework}
          onSelect={setFramework}
          label="Email Framework"
        />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Target Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="credit_union">Credit Union Executives</option>
            <option value="community_bank">Community Bank Leaders</option>
            <option value="both">Both CUs & Banks</option>
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Generating Sequence...</>
        ) : (
          <><Sparkles className="w-4 h-4" />Generate {SEQUENCE_TYPES.find(s => s.id === sequenceType)?.name}</>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>
      )}

      {/* Generated Sequence */}
      {content && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Generated {SEQUENCE_TYPES.find(s => s.id === sequenceType)?.name}
              {framework && ` (${EMAIL_FRAMEWORKS.find(f => f.id === framework)?.name} framework)`}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{wordCount} words</span>
              <button
                onClick={() => copyToClipboard(content)}
                className="px-3 py-1 bg-white border rounded-lg text-sm hover:bg-gray-100 flex items-center gap-1"
              >
                {copiedContent ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                {copiedContent ? 'Copied!' : 'Copy All'}
              </button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans max-h-[500px] overflow-y-auto">{content}</pre>
        </div>
      )}

      {/* Quick Reference */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedCard(expandedCard === 'tips' ? null : 'tips')}
          className="w-full flex items-center justify-between p-3 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Email Copy Best Practices
          {expandedCard === 'tips' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedCard === 'tips' && (
          <div className="p-3 text-xs text-gray-600 space-y-1">
            <p>• Write at 8th grade reading level — use short sentences</p>
            <p>• One idea per email. One CTA per email. One ask per email.</p>
            <p>• Subject line: 2-4 words, lowercase, no punctuation</p>
            <p>• Use "you" more than "we" (2:1 ratio minimum)</p>
            <p>• Short paragraphs (1-3 sentences). White space is your friend.</p>
            <p>• Button CTAs outperform text links in marketing emails</p>
            <p>• First-person buttons: "Get My Report" not "Get Your Report"</p>
          </div>
        )}
      </div>
    </div>
  );
}
