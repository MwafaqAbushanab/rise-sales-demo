import { useState } from 'react';
import { X, Mail, Send, Copy, Check, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import type { Lead } from '../types';
import { formatCurrency } from '../types';
import { generateEmail, checkAIHealth, type LeadContext } from '../api/aiService';

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-semibold text-white">Email Composer</h3>
              <p className="text-xs text-blue-100">{lead.name} - {lead.city}, {lead.state}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* To Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    emailType === type.value
                      ? 'bg-blue-50 border-blue-300 text-blue-700 ring-1 ring-blue-300'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {type.icon} {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lead Context Summary */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <span className="font-medium text-gray-700">Context: </span>
            {lead.type} | {formatCurrency(lead.assets)} assets | Score: {lead.score}/100
            {lead.recommendedProducts.length > 0 && ` | Products: ${lead.recommendedProducts.join(', ')}`}
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Instructions <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g., Mention their recent merger, focus on compliance needs..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating with AI...
              </>
            ) : generatedEmail ? (
              <>
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Generate Email
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Generated Email Preview */}
          {generatedEmail && (
            <div className="border rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Generated Email</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 bg-white border rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={handleOpenInClient}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
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
