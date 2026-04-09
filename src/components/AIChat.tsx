import { useState, useEffect, useRef, useCallback } from 'react';
import type { Lead } from '../types';
import { formatCurrency } from '../types';
import type { ProspectIntelligence } from '../utils/prospectingIntelligence';
import { getTierEmoji } from '../utils/prospectingIntelligence';
import type { CompetitiveIntel } from '../utils/competitiveIntelligence';
import { streamChatMessage, checkAIHealth, getFallbackResponse, type LeadContext } from '../api/aiService';
import { calculateROI, getDefaultInputs } from '../utils/roiCalculator';
import { Bot, Send, Loader2, Wifi, WifiOff, Copy, Check, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  selectedLead: Lead | null;
  intelligence: ProspectIntelligence | null;
  competitiveIntel: CompetitiveIntel | null;
}

export default function AIChat({ selectedLead, intelligence, competitiveIntel }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi! I'm your Rise Analytics AI Sales Agent. ${selectedLead ? `I see you're looking at ${selectedLead.name}. How can I help you engage with this prospect?` : 'Select a credit union from the list to get started. I can help with personalized outreach, qualification analysis, competitive positioning, and more.'}` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiConnected, setAiConnected] = useState<boolean | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingMessageRef = useRef('');

  useEffect(() => {
    checkAIHealth().then(setAiConnected);
    const interval = setInterval(() => {
      checkAIHealth().then(setAiConnected);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedLead && intelligence) {
      const typeLabel = selectedLead.type === 'Credit Union' ? 'credit union' : 'community bank';
      const tierEmoji = getTierEmoji(intelligence.opportunityTier);
      setMessages([{
        role: 'assistant',
        content: `Now looking at **${selectedLead.name}** (${selectedLead.city}, ${selectedLead.state}).\n\n📊 **Quick Facts:**\n• Type: ${selectedLead.type}\n• Assets: ${formatCurrency(selectedLead.assets)}\n${selectedLead.members > 0 ? `• Members: ${selectedLead.members.toLocaleString()}\n` : ''}• Opportunity Score: ${intelligence.opportunityScore}/100 ${tierEmoji} **${intelligence.opportunityTier}**\n• Est. Deal Size: ${intelligence.estimatedDealSize}\n\nWhat would you like to do with this ${typeLabel}? I can:\n\n• **Write a personalized email** - Cold outreach, follow-up, or proposal\n• **Provide sales strategy** - Tactics based on their profile\n• **Handle objections** - Data-backed responses\n• **Prepare for demo** - Custom scripts and talking points\n• **Analyze competition** - Battle cards and positioning`
      }]);
    } else if (selectedLead) {
      setMessages([{
        role: 'assistant',
        content: `Now looking at **${selectedLead.name}** (${selectedLead.city}, ${selectedLead.state}). Loading intelligence...`
      }]);
    }
  }, [selectedLead, intelligence]);

  const buildLeadContext = useCallback((): LeadContext | null => {
    if (!selectedLead) return null;

    const roiInputs = getDefaultInputs({ assets: selectedLead.assets, members: selectedLead.members, type: selectedLead.type });
    const roiProjection = calculateROI(roiInputs);

    return {
      name: selectedLead.name,
      type: selectedLead.type,
      city: selectedLead.city,
      state: selectedLead.state,
      assets: selectedLead.assets,
      members: selectedLead.members,
      score: selectedLead.score,
      status: selectedLead.status,
      recommendedProducts: selectedLead.recommendedProducts,
      intelligence: intelligence ? {
        opportunityTier: intelligence.opportunityTier,
        opportunityScore: intelligence.opportunityScore,
        dealSizeEstimate: intelligence.estimatedDealSize,
        keyTalkingPoints: intelligence.keyTalkingPoints,
        potentialChallenges: intelligence.potentialChallenges,
        recommendedApproach: intelligence.recommendedApproach,
      } : undefined,
      competitiveIntel: competitiveIntel ? {
        currentVendors: competitiveIntel.currentVendors,
        displacementDifficulty: competitiveIntel.displacementDifficulty,
        switchingCost: competitiveIntel.switchingCost,
        winBackStrategy: competitiveIntel.winBackStrategy,
      } : undefined,
      roiProjection: {
        annualROI: roiProjection.annualROI,
        paybackMonths: roiProjection.paybackMonths,
        totalAnnualBenefit: roiProjection.totalAnnualBenefit,
        threeYearValue: roiProjection.threeYearValue,
      },
    };
  }, [selectedLead, intelligence, competitiveIntel]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    if (!aiConnected) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: getFallbackResponse(userMessage, selectedLead?.name)
        }]);
        setIsTyping(false);
      }, 500);
      return;
    }

    setIsStreaming(true);
    streamingMessageRef.current = '';
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    const conversationHistory = messages.slice(-10).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    await streamChatMessage(
      userMessage,
      buildLeadContext(),
      conversationHistory,
      {
        onChunk: (text) => {
          streamingMessageRef.current += text;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: streamingMessageRef.current
            };
            return newMessages;
          });
        },
        onDone: () => {
          setIsStreaming(false);
        },
        onError: (error) => {
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: `⚠️ Error: ${error}\n\nPlease check that the AI server is running on port 3002.`
            };
            return newMessages;
          });
          setIsStreaming(false);
        }
      }
    );
  };

  const copyToClipboard = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const suggestions = [
    { label: '📧 Write cold email', prompt: 'Write a compelling personalized cold email to this prospect highlighting how Rise Analytics can solve their specific challenges' },
    { label: '💰 Calculate ROI', prompt: 'Calculate and explain the ROI this institution would get from Rise Analytics, including specific dollar savings' },
    { label: '⚔️ Beat competition', prompt: 'Create a competitive battle card for this prospect - how do we beat Jack Henry, Fiserv, and Q2?' },
    { label: '🎯 Win strategy', prompt: 'What is the best strategy to win this deal? Include timeline, key stakeholders to target, and potential objections' },
    { label: '📊 Demo script', prompt: 'Prepare a custom demo script tailored to this institution\'s specific needs and pain points' }
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">AI Sales Agent</h3>
            <p className="text-[11px] text-blue-100 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Powered by Claude
              {aiConnected === true && <span className="flex items-center gap-1 text-emerald-300"><Wifi className="w-3 h-3" /> Connected</span>}
              {aiConnected === false && <span className="flex items-center gap-1 text-red-300"><WifiOff className="w-3 h-3" /> Offline</span>}
            </p>
          </div>
        </div>
        {selectedLead && (
          <span className="px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-lg text-xs text-white truncate max-w-[150px] ring-1 ring-white/10">
            {selectedLead.name}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-gray-50/50">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[85%] rounded-2xl px-4 py-3 transition-all',
              msg.role === 'user'
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md shadow-md shadow-blue-600/10'
                : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
            )}>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content.split('**').map((part, j) =>
                  j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                )}
              </div>
              {msg.role === 'assistant' && msg.content.length > 100 && (
                <button
                  onClick={() => copyToClipboard(msg.content, i)}
                  className={cn(
                    'mt-2 flex items-center gap-1 text-xs transition-colors',
                    copiedIndex === i ? 'text-emerald-500' : 'text-gray-400 hover:text-gray-600'
                  )}
                >
                  {copiedIndex === i ? (
                    <><Check className="w-3 h-3" /> Copied!</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy</>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
        {(isTyping || (isStreaming && messages[messages.length - 1]?.content === '')) && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 rounded-bl-md">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(dot => (
                  <div
                    key={dot}
                    className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${dot * 150}ms`, animationDuration: '0.8s' }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        {aiConnected === false && (
          <div className="mb-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            AI backend offline. Start server: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-[10px]">cd server && npm run dev</code>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isStreaming && handleSend()}
            placeholder={aiConnected ? "Ask me anything about this prospect..." : "AI offline - limited responses"}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 bg-gray-50 transition-all text-sm placeholder:text-gray-400"
            disabled={isStreaming}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className={cn(
              'px-4 py-2.5 rounded-xl transition-all flex items-center justify-center',
              input.trim()
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30'
                : 'bg-gray-100 text-gray-400'
            )}
          >
            {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {suggestions.map(s => (
            <button
              key={s.label}
              onClick={() => setInput(s.prompt)}
              disabled={isStreaming}
              className="px-2.5 py-1.5 text-[11px] bg-white text-gray-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 hover:border-indigo-200 transition-all disabled:opacity-50 font-medium shadow-sm hover:shadow"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
