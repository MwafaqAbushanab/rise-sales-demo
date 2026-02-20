import { useState, useEffect, useRef, useCallback } from 'react';
import type { Lead } from '../types';
import { formatCurrency } from '../types';
import type { ProspectIntelligence } from '../utils/prospectingIntelligence';
import { getTierEmoji } from '../utils/prospectingIntelligence';
import type { CompetitiveIntel } from '../utils/competitiveIntelligence';
import { streamChatMessage, checkAIHealth, getFallbackResponse, type LeadContext } from '../api/aiService';
import { calculateROI, getDefaultInputs } from '../utils/roiCalculator';
import { Bot, Send, Loader2, Wifi, WifiOff, Copy, Check } from 'lucide-react';

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
    { role: 'assistant', content: `Hi! I'm your Rise Analytics AI Sales Agent powered by Claude. ${selectedLead ? `I see you're looking at ${selectedLead.name}. How can I help you engage with this prospect?` : 'Select a credit union or bank from the list to get started. I can help with personalized outreach, qualification analysis, competitive positioning, and more.'}` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiConnected, setAiConnected] = useState<boolean | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingMessageRef = useRef('');

  // Check AI backend health on mount
  useEffect(() => {
    checkAIHealth().then(setAiConnected);
    const interval = setInterval(() => {
      checkAIHealth().then(setAiConnected);
    }, 30000); // Check every 30 seconds
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

  // Build lead context for AI
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

    // Check if AI is connected
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

    // Stream response from AI
    setIsStreaming(true);
    streamingMessageRef.current = '';

    // Add empty assistant message that we'll fill with streaming content
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

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Sales Agent</h3>
            <p className="text-xs text-blue-100 flex items-center gap-1">
              Powered by Claude
              {aiConnected === true && <Wifi className="w-3 h-3 text-green-300" />}
              {aiConnected === false && <WifiOff className="w-3 h-3 text-red-300" />}
            </p>
          </div>
        </div>
        {selectedLead && (
          <span className="px-2 py-1 bg-white/20 rounded text-xs text-white truncate max-w-[150px]">
            {selectedLead.name}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-md'
                : 'bg-white text-gray-800 shadow-sm border rounded-bl-md'
            }`}>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content.split('**').map((part, j) =>
                  j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                )}
              </div>
              {msg.role === 'assistant' && msg.content.length > 100 && (
                <button
                  onClick={() => copyToClipboard(msg.content, i)}
                  className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {copiedIndex === i ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
        {(isTyping || (isStreaming && messages[messages.length - 1]?.content === '')) && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border rounded-bl-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white rounded-b-xl">
        {aiConnected === false && (
          <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            AI backend offline. Start server: <code className="bg-amber-100 px-1 rounded">cd server && npm run dev</code>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isStreaming && handleSend()}
            placeholder={aiConnected ? "Ask me anything about this prospect..." : "AI offline - limited responses"}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isStreaming}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {[
            { label: '📧 Write cold email', prompt: 'Write a compelling personalized cold email to this prospect highlighting how Rise Analytics can solve their specific challenges' },
            { label: '💰 Calculate ROI', prompt: 'Calculate and explain the ROI this institution would get from Rise Analytics, including specific dollar savings' },
            { label: '⚔️ Beat competition', prompt: 'Create a competitive battle card for this prospect - how do we beat Jack Henry, Fiserv, and Q2?' },
            { label: '🎯 Win strategy', prompt: 'What is the best strategy to win this deal? Include timeline, key stakeholders to target, and potential objections' },
            { label: '📊 Demo script', prompt: 'Prepare a custom demo script tailored to this institution\'s specific needs and pain points' }
          ].map(suggestion => (
            <button
              key={suggestion.label}
              onClick={() => { setInput(suggestion.prompt); }}
              disabled={isStreaming}
              className="px-3 py-1.5 text-xs bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-full hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 border border-gray-200 hover:border-blue-200 transition-all disabled:opacity-50 font-medium"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
