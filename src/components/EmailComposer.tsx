import { useState } from 'react';
import { X, Mail, Send, Copy, Check, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import type { Lead } from '../types';
import { formatCurrency } from '../types';
import { generateEmail, checkAIHealth, type LeadContext } from '../api/aiService';
import { cn } from '../lib/utils';

interface EmailComposerProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

type EmailType = 'cold_outreach' | 'follow_up' | 'demo_request' | 'proposal';

const EMAIL_TYPES: { value: EmailType; label: string; icon: string }[] = [
  { value: 'cold_outreach', label: 'Cold Outreach', icon: '🎯' },
  { value: 'follow_up', label: 'Follow-Up', icon: '🔄' },
  { value: 'demo_request', label: 'Demo Request', icon: '📊' },
  { value: 'proposal', label: 'Proposal', icon: '📝' },
];

function parseEmailParts(email: string): { subject: string; body: string } {
  const subjectMatch = email.match(/Subject:\s*(.+?)(?:\n|$)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : '';
  const body = email
    .replace(/Subject:\s*.+?\n/i, '')
    .replace(/^---+\n?/m, '')
    .trim();
  return { subject, body };
}

export default function EmailComposer({ lead, isOpen, onClose }: EmailComposerProps) {
  const [emailType, setEmailType] = useState<EmailType>('cold_outreach');
  const primaryEmail = lead.decisionMakers?.find(dm => dm.email)?.email || lead.email || '';
  const [toEmail, setToEmail] = useState(primaryEmail);
  const [customInstructions, setCustomInstructions] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const leadContext: LeadContext = {
    name: lead.name,
    type: lead.type,
    city: lead.city,
    state: lead.state,
    assets: lead.assets,
    members: lead.members,
    score: lead.score,
    status: lead.status,
    recommendedProducts: lead.recommendedProducts,
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setGeneratedEmail('');

    const isOnline = await checkAIHealth();
    if (!isOnline) {
      setError('AI backend is offline. Start the server with: cd server && npm run dev');
      setLoading(false);
      return;
    }

    try {
      const result = await generateEmail(
        leadContext,
        emailType,
        customInstructions || undefined
      );
      setGeneratedEmail(result.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate email');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInClient = () => {
    const { subject, body } = parseEmailParts(generatedEmail);
    const mailto = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-black/5">
        {/* Header */}
        <div className="p-5 border-b bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/20">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Email Composer</h3>
              <p className="text-xs text-blue-100">{lead.name} — {lead.city}, {lead.state}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* To Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">To</label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 text-sm bg-gray-50 transition-all"
            />
          </div>

          {/* Email Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EMAIL_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setEmailType(type.value)}
                  className={cn(
                    'px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    emailType === type.value
                      ? 'bg-blue-50 border-blue-300 text-blue-700 ring-1 ring-blue-200 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lead Context Summary */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl p-3.5 text-xs text-gray-600 border border-gray-100">
            <span className="font-semibold text-gray-700">Context: </span>
            {lead.type} | {formatCurrency(lead.assets)} assets | Score: {lead.score}/100
            {lead.recommendedProducts.length > 0 && ` | Products: ${lead.recommendedProducts.join(', ')}`}
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Custom Instructions <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g., Mention their recent merger, focus on compliance needs..."
              rows={2}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 text-sm resize-none bg-gray-50 transition-all"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={cn(
              'w-full py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-semibold',
              loading
                ? 'bg-gray-100 text-gray-400'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30'
            )}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating with AI...</>
            ) : generatedEmail ? (
              <><RefreshCw className="w-4 h-4" /> Regenerate</>
            ) : (
              <><Send className="w-4 h-4" /> Generate Email</>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Generated Email Preview */}
          {generatedEmail && (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-gray-50 to-gray-50/50 px-4 py-2.5 border-b flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Generated Email</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white border rounded-lg transition-all shadow-sm',
                      copied ? 'text-emerald-600 border-emerald-200' : 'text-gray-600 border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={handleOpenInClient}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:shadow-md transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in Email Client
                  </button>
                </div>
              </div>
              <div className="p-4 whitespace-pre-wrap text-sm text-gray-800 bg-white max-h-[300px] overflow-y-auto leading-relaxed">
                {generatedEmail}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
