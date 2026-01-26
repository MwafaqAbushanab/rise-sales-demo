import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Send, Building2, Users, DollarSign, Bot, Sparkles, BarChart3, Target, Zap, Loader2, RefreshCw, Filter, Landmark, TrendingUp, Brain, ShoppingCart, Award, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Lightbulb, Shield, Swords, Trophy, Eye, Calculator, X, PieChart, Clock, Percent, Wifi, WifiOff, Copy, Check, Flame, Mail, MapPin, Star, Rocket, Megaphone, FileText, Globe, Hash, Linkedin, GraduationCap, MessageSquare, TrendingDown, Play, ArrowRight, ThumbsUp, ThumbsDown, Activity, Gauge } from 'lucide-react';
import { fetchBanks, ASSET_SIZE_FILTERS, type Bank } from './api/fdicApi';
import { fetchCreditUnions, type CreditUnion } from './api/ncuaApi';
import { analyzeProspect, getTierColor, getTierEmoji, type ProspectIntelligence } from './utils/prospectingIntelligence';
import { analyzeCompetitiveLandscape, calculateWinProbability as calculateCompetitiveWinProbability, type CompetitiveIntel } from './utils/competitiveIntelligence';
import { calculateROI, getDefaultInputs, calculateRisePricing, generateROISummary, formatCurrencyShort, type ROIInputs, type ROIProjection } from './utils/roiCalculator';
import { streamChatMessage, checkAIHealth, getFallbackResponse, type LeadContext } from './api/aiService';
import { identifyHotLeads, calculateDashboardMetrics, getTopCreditUnions, getTopCommunityBanks, generateColdEmailTemplate, type HotLead } from './utils/salesAcceleration';
import { generateSocialPost, generateBlogOutline, generateBattleCard, generateAISearchContent, RISE_ANALYTICS_PROFILE, SEO_KEYWORDS, type MarketingContent } from './utils/marketingAgent';
import { generateCoachingTips, assessDealRisks, calculateWinProbability as calculateDealWinProbability, generateFollowUpSequence, findObjectionResponse, DEAL_STAGES, type CoachingTip, type DealRisk, type WinProbability as WinProbabilityType, type FollowUpSequence } from './utils/dealCoaching';
import { calculateTerritoryMetrics, formatTerritoryValue, STATE_NAMES, type TerritoryMetrics, type GrowthOpportunity, type CompetitiveRegion } from './utils/territoryIntelligence';

// Unified Lead interface that combines CU and Bank data
interface Lead {
  id: string;
  name: string;
  type: 'Credit Union' | 'Community Bank';
  city: string;
  state: string;
  assets: number;
  members: number;
  deposits: number;
  certNumber: string;
  roa: number;
  branches: number;
  website: string;
  // Sales-specific fields (stored in localStorage)
  contact: string;
  title: string;
  email: string;
  phone: string;
  status: string;
  score: number;
  source: string;
  lastContact: string;
  recommendedProducts: string[];
  notes: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Convert Bank to Lead
function bankToLead(bank: Bank): Lead {
  return {
    id: bank.id,
    name: bank.name,
    type: 'Community Bank',
    city: bank.city,
    state: bank.state,
    assets: bank.assets,
    members: 0,
    deposits: bank.deposits,
    certNumber: bank.certNumber,
    roa: bank.roa,
    branches: bank.branches,
    website: bank.website,
    // Default sales fields
    contact: '',
    title: '',
    email: '',
    phone: '',
    status: 'new',
    score: calculateLeadScore(bank.assets, 0, bank.roa),
    source: 'FDIC',
    lastContact: 'Never',
    recommendedProducts: getRecommendedProducts(bank.assets, 'bank'),
    notes: '',
  };
}

// Convert CreditUnion to Lead
function creditUnionToLead(cu: CreditUnion): Lead {
  return {
    id: cu.id,
    name: cu.name,
    type: 'Credit Union',
    city: cu.city,
    state: cu.state,
    assets: cu.assets,
    members: cu.members,
    deposits: cu.shares,
    certNumber: cu.charterNumber,
    roa: cu.roa,
    branches: 0,
    website: '',
    // Default sales fields
    contact: '',
    title: '',
    email: '',
    phone: '',
    status: 'new',
    score: calculateLeadScore(cu.assets, cu.members, cu.roa),
    source: 'NCUA',
    lastContact: 'Never',
    recommendedProducts: getRecommendedProducts(cu.assets, 'cu'),
    notes: '',
  };
}

// Calculate lead score based on assets, members, and ROA
function calculateLeadScore(assets: number, members: number, roa: number): number {
  let score = 50; // Base score

  // Asset-based scoring (up to 30 points)
  if (assets >= 10000000000) score += 30; // $10B+
  else if (assets >= 5000000000) score += 25; // $5B+
  else if (assets >= 1000000000) score += 20; // $1B+
  else if (assets >= 500000000) score += 15; // $500M+
  else if (assets >= 100000000) score += 10; // $100M+
  else score += 5;

  // Member-based scoring for CUs (up to 10 points)
  if (members > 0) {
    if (members >= 500000) score += 10;
    else if (members >= 100000) score += 7;
    else if (members >= 50000) score += 5;
    else score += 2;
  }

  // ROA-based scoring (up to 10 points)
  if (roa >= 1.5) score += 10;
  else if (roa >= 1.0) score += 7;
  else if (roa >= 0.5) score += 4;

  return Math.min(score, 100);
}

// Get recommended products based on asset size and type
function getRecommendedProducts(assets: number, type: 'bank' | 'cu'): string[] {
  const products: string[] = [];

  if (assets >= 5000000000) {
    products.push('Performance Management', 'Regulatory Analytics');
  } else if (assets >= 1000000000) {
    products.push('Loan Analytics', 'Marketing Solutions');
  } else {
    products.push('Essential Analytics');
  }

  if (type === 'cu') {
    products.push('Member Insights');
  }

  return products.slice(0, 3);
}

const statusColors: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-purple-100 text-purple-700',
  demo_scheduled: 'bg-amber-100 text-amber-700',
  proposal_sent: 'bg-cyan-100 text-cyan-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700'
};

const formatCurrency = (num: number): string => {
  if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(0)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
};

const formatStatus = (status: string): string => status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

// Getting Started / Onboarding Component
const GettingStarted = ({
  aiConnected,
  leadsLoaded,
  onDismiss,
  onSelectDemo
}: {
  aiConnected: boolean | null;
  leadsLoaded: boolean;
  onDismiss: () => void;
  onSelectDemo: (scenario: string) => void;
}) => {
  const steps = [
    {
      id: 'ai-status',
      title: 'AI Backend',
      description: aiConnected ? 'Claude AI is connected and ready' : 'AI backend starting up...',
      complete: aiConnected === true,
      icon: aiConnected ? Sparkles : Loader2,
      color: aiConnected ? 'text-green-500' : 'text-amber-500'
    },
    {
      id: 'data-loaded',
      title: 'Institution Data',
      description: leadsLoaded ? 'Real data from NCUA & FDIC loaded' : 'Loading institutions...',
      complete: leadsLoaded,
      icon: leadsLoaded ? CheckCircle : Loader2,
      color: leadsLoaded ? 'text-green-500' : 'text-blue-500'
    },
    {
      id: 'select-lead',
      title: 'Select a Prospect',
      description: 'Click any institution to view AI insights',
      complete: false,
      icon: Target,
      color: 'text-purple-500'
    },
    {
      id: 'engage',
      title: 'Engage with AI',
      description: 'Get personalized emails, coaching & strategies',
      complete: false,
      icon: Bot,
      color: 'text-indigo-500'
    }
  ];

  const demoScenarios = [
    {
      id: 'enterprise',
      title: 'Enterprise Deal',
      description: '$10B+ credit union with complex needs',
      icon: Landmark,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'competitive',
      title: 'Competitive Win',
      description: 'Jack Henry replacement opportunity',
      icon: Swords,
      color: 'bg-purple-100 text-purple-700'
    },
    {
      id: 'expansion',
      title: 'Market Expansion',
      description: 'Community bank in new territory',
      icon: Globe,
      color: 'bg-green-100 text-green-700'
    }
  ];

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-6 text-white relative overflow-hidden">
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
        title="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Rocket className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Welcome to Rise Sales Agent</h2>
          <p className="text-blue-100 text-sm">AI-powered sales acceleration for Credit Unions & Banks</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Status Steps */}
        <div className="space-y-3">
          <h3 className="font-semibold text-blue-100 text-sm uppercase tracking-wider">System Status</h3>
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
              <step.icon className={`w-5 h-5 ${step.color} ${!step.complete && step.id !== 'select-lead' && step.id !== 'engage' ? 'animate-spin' : ''}`} />
              <div className="flex-1">
                <div className="font-medium text-sm">{step.title}</div>
                <div className="text-xs text-blue-200">{step.description}</div>
              </div>
              {step.complete && <CheckCircle className="w-5 h-5 text-green-400" />}
            </div>
          ))}
        </div>

        {/* Demo Scenarios */}
        <div className="space-y-3">
          <h3 className="font-semibold text-blue-100 text-sm uppercase tracking-wider">Quick Demo Scenarios</h3>
          {demoScenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => onSelectDemo(scenario.id)}
              className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-colors text-left"
            >
              <div className={`w-10 h-10 ${scenario.color} rounded-lg flex items-center justify-center`}>
                <scenario.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{scenario.title}</div>
                <div className="text-xs text-blue-200">{scenario.description}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-200" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Executive Summary Dashboard for CEO View
const ExecutiveSummary = ({ leads, hotLeads }: { leads: Lead[]; hotLeads: HotLead[] }) => {
  const totalPipelineValue = hotLeads.reduce((sum, lead) => {
    return sum + (lead.estimatedDealValue || 0);
  }, 0);

  const avgDealSize = hotLeads.length > 0 ? totalPipelineValue / hotLeads.length : 0;
  const cuCount = leads.filter(l => l.type === 'Credit Union').length;
  const bankCount = leads.filter(l => l.type === 'Community Bank').length;
  const qualifiedCount = leads.filter(l => l.status === 'qualified' || l.status === 'demo_scheduled' || l.status === 'proposal_sent').length;

  // Calculate market opportunity
  const totalMarketAssets = leads.reduce((sum, l) => sum + l.assets, 0);
  const avgLeadScore = leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length) : 0;

  const kpis = [
    {
      label: 'Pipeline Value',
      value: `$${(totalPipelineValue / 1000000).toFixed(1)}M`,
      subtext: `${hotLeads.length} active opportunities`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Avg Deal Size',
      value: `$${(avgDealSize / 1000).toFixed(0)}K`,
      subtext: 'Per qualified lead',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Market Coverage',
      value: leads.length.toLocaleString(),
      subtext: `${cuCount} CUs / ${bankCount} Banks`,
      icon: Globe,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      label: 'Total Addressable',
      value: formatCurrency(totalMarketAssets),
      subtext: 'Combined assets',
      icon: Landmark,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Executive Summary</h2>
            <p className="text-sm text-gray-500">Real-time pipeline & market intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-gray-500">Live Data</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 ${kpi.bgColor} rounded-lg flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase">{kpi.label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
            <div className="text-xs text-gray-500">{kpi.subtext}</div>
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-700">Hot Leads</div>
              <div className="text-3xl font-bold text-green-600">{hotLeads.length}</div>
            </div>
            <Flame className="w-10 h-10 text-green-500 opacity-50" />
          </div>
          <div className="text-xs text-green-600 mt-1">Ready for immediate follow-up</div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-700">Avg Lead Score</div>
              <div className="text-3xl font-bold text-blue-600">{avgLeadScore}/100</div>
            </div>
            <Target className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
          <div className="text-xs text-blue-600 mt-1">AI-calculated opportunity score</div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-purple-700">In Pipeline</div>
              <div className="text-3xl font-bold text-purple-600">{qualifiedCount}</div>
            </div>
            <Activity className="w-10 h-10 text-purple-500 opacity-50" />
          </div>
          <div className="text-xs text-purple-600 mt-1">Qualified / Demo / Proposal stages</div>
        </div>
      </div>
    </div>
  );
};

const AIChat = ({ selectedLead, intelligence, competitiveIntel }: {
  selectedLead: Lead | null;
  intelligence: ProspectIntelligence | null;
  competitiveIntel: CompetitiveIntel | null;
}) => {
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
              content: `⚠️ Error: ${error}\n\nPlease check that the AI server is running on port 3001.`
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
};

// Intelligence Panel Component
const IntelligencePanel = ({ intelligence, lead, competitiveIntel, onOpenROICalculator }: {
  intelligence: ProspectIntelligence | null;
  lead: Lead | null;
  competitiveIntel: CompetitiveIntel | null;
  onOpenROICalculator: () => void;
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    growth: false,
    tech: false,
    buying: true,
    approach: true,
    competitive: true,
    roi: true
  });
  const [selectedBattleCard, setSelectedBattleCard] = useState<string | null>(null);

  // Quick ROI preview
  const quickROI = useMemo(() => {
    if (!lead) return null;
    const inputs = getDefaultInputs({ assets: lead.assets, members: lead.members, type: lead.type });
    return calculateROI(inputs);
  }, [lead]);

  const risePricing = useMemo(() => {
    if (!lead) return null;
    return calculateRisePricing(lead.assets, lead.members);
  }, [lead]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!intelligence || !lead) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full flex flex-col items-center justify-center text-center">
        <Brain className="w-12 h-12 text-gray-300 mb-3" />
        <h3 className="font-semibold text-gray-700 mb-1">Prospecting Intelligence</h3>
        <p className="text-sm text-gray-500">Select an institution to see AI-powered sales insights</p>
      </div>
    );
  }

  const tierColorClass = getTierColor(intelligence.opportunityTier);
  const tierEmoji = getTierEmoji(intelligence.opportunityTier);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Prospecting Intelligence</h3>
              <p className="text-xs text-purple-100">AI-Powered Analysis</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Opportunity Score Card */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">Opportunity Score</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${tierColorClass}`}>
              {tierEmoji} {intelligence.opportunityTier}
            </span>
          </div>
          <div className="relative">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-900">{intelligence.opportunityScore}</span>
              <span className="text-gray-500 mb-1">/100</span>
            </div>
            <div className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  intelligence.opportunityScore >= 80 ? 'bg-red-500' :
                  intelligence.opportunityScore >= 65 ? 'bg-orange-500' :
                  intelligence.opportunityScore >= 50 ? 'bg-blue-500' : 'bg-gray-400'
                }`}
                style={{ width: `${intelligence.opportunityScore}%` }}
              />
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            <strong>Deal Size:</strong> {intelligence.estimatedDealSize}
          </div>
        </div>

        {/* Peer Comparison */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-800">Peer Comparison</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Asset Percentile</span>
              <span className="font-semibold text-gray-900">Top {100 - intelligence.peerComparison.assetPercentile}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Peer Group Size</span>
              <span className="font-semibold text-gray-900">{intelligence.peerComparison.peerGroupSize.toLocaleString()} similar institutions</span>
            </div>
            {intelligence.peerComparison.aboveAverageMetrics.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Strengths:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {intelligence.peerComparison.aboveAverageMetrics.map((metric, i) => (
                    <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      ✓ {metric}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {intelligence.peerComparison.belowAverageMetrics.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Opportunities:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {intelligence.peerComparison.belowAverageMetrics.map((metric, i) => (
                    <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                      ↑ {metric}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Growth Signals */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <button
            onClick={() => toggleSection('growth')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-800">Growth Signals</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {intelligence.growthSignals.score}/100
              </span>
            </div>
            {expandedSections.growth ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSections.growth && (
            <div className="px-4 pb-4 space-y-2">
              {intelligence.growthSignals.indicators.map((indicator, i) => (
                <div key={i} className={`p-3 rounded-lg ${
                  indicator.type === 'positive' ? 'bg-green-50 border border-green-200' :
                  indicator.type === 'negative' ? 'bg-red-50 border border-red-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-sm ${
                      indicator.type === 'positive' ? 'text-green-800' :
                      indicator.type === 'negative' ? 'text-red-800' : 'text-gray-800'
                    }`}>
                      {indicator.type === 'positive' ? '↑' : indicator.type === 'negative' ? '↓' : '•'} {indicator.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      indicator.impact === 'high' ? 'bg-purple-100 text-purple-700' :
                      indicator.impact === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {indicator.impact} impact
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{indicator.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tech Signals */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <button
            onClick={() => toggleSection('tech')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-gray-800">Tech Signals</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                {intelligence.techSignals.score}/100
              </span>
            </div>
            {expandedSections.tech ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSections.tech && (
            <div className="px-4 pb-4 space-y-2">
              {intelligence.techSignals.indicators.map((indicator, i) => (
                <div key={i} className={`p-3 rounded-lg ${
                  indicator.type === 'opportunity' ? 'bg-amber-50 border border-amber-200' :
                  indicator.type === 'risk' ? 'bg-red-50 border border-red-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-sm ${
                      indicator.type === 'opportunity' ? 'text-amber-800' :
                      indicator.type === 'risk' ? 'text-red-800' : 'text-gray-800'
                    }`}>
                      {indicator.type === 'opportunity' ? '🎯' : indicator.type === 'risk' ? '⚠️' : '•'} {indicator.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      indicator.impact === 'high' ? 'bg-purple-100 text-purple-700' :
                      indicator.impact === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {indicator.impact} impact
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{indicator.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buying Signals */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <button
            onClick={() => toggleSection('buying')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-800">Buying Signals</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {intelligence.buyingSignals.score}/100
              </span>
            </div>
            {expandedSections.buying ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSections.buying && (
            <div className="px-4 pb-4 space-y-2">
              {intelligence.buyingSignals.indicators.map((indicator, i) => (
                <div key={i} className={`p-3 rounded-lg flex items-start gap-2 ${
                  indicator.type === 'strong' ? 'bg-green-50 border border-green-200' :
                  indicator.type === 'moderate' ? 'bg-blue-50 border border-blue-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <span className="text-lg">
                    {indicator.type === 'strong' ? '✅' : indicator.type === 'moderate' ? '📊' : '📝'}
                  </span>
                  <div>
                    <span className={`font-medium text-sm ${
                      indicator.type === 'strong' ? 'text-green-800' :
                      indicator.type === 'moderate' ? 'text-blue-800' : 'text-gray-800'
                    }`}>
                      {indicator.label}
                    </span>
                    <p className="text-xs text-gray-600 mt-0.5">{indicator.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Competitive Intelligence */}
        {competitiveIntel && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <button
              onClick={() => toggleSection('competitive')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-gray-800">Competitive Landscape</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  calculateCompetitiveWinProbability(competitiveIntel.currentVendors) >= 70 ? 'bg-green-100 text-green-700' :
                  calculateCompetitiveWinProbability(competitiveIntel.currentVendors) >= 50 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {calculateCompetitiveWinProbability(competitiveIntel.currentVendors)}% Win Rate
                </span>
              </div>
              {expandedSections.competitive ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expandedSections.competitive && (
              <div className="px-4 pb-4 space-y-3">
                {/* Displacement Difficulty */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Displacement Difficulty</span>
                    <p className="text-xs text-gray-500">Switching cost: {competitiveIntel.switchingCost}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-4 rounded-sm ${
                          i < competitiveIntel.displacementDifficulty
                            ? competitiveIntel.displacementDifficulty >= 7 ? 'bg-red-500' :
                              competitiveIntel.displacementDifficulty >= 4 ? 'bg-amber-500' : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm font-bold text-gray-700">{competitiveIntel.displacementDifficulty}/10</span>
                  </div>
                </div>

                {/* Current Vendors */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Likely Current Vendors</h4>
                  <div className="space-y-2">
                    {competitiveIntel.currentVendors.map((cp, i) => (
                      <div key={i} className="p-3 bg-white border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className={`w-4 h-4 ${
                              cp.competitor.strength === 'Strong' ? 'text-red-500' :
                              cp.competitor.strength === 'Moderate' ? 'text-amber-500' : 'text-green-500'
                            }`} />
                            <span className="font-medium text-sm text-gray-800">{cp.competitor.name}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            cp.satisfaction === 'Low' ? 'bg-green-100 text-green-700' :
                            cp.satisfaction === 'High' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {cp.satisfaction === 'Low' ? '🎯 Opportunity' : cp.satisfaction === 'High' ? '🔒 Locked' : 'Unknown'}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="font-medium">{cp.competitor.category}</span> • {cp.products.join(', ')}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-500">Est. spend: {cp.estimatedSpend}</span>
                          <button
                            onClick={() => setSelectedBattleCard(selectedBattleCard === cp.competitor.id ? null : cp.competitor.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Battle Card
                          </button>
                        </div>

                        {/* Battle Card Expansion */}
                        {selectedBattleCard === cp.competitor.id && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            <div className="p-2 bg-blue-50 rounded border border-blue-200">
                              <p className="text-xs font-medium text-blue-800">Positioning:</p>
                              <p className="text-xs text-blue-700 mt-1">{cp.competitor.battleCard.positioning}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1">Key Differentiators:</p>
                              <ul className="space-y-1">
                                {cp.competitor.battleCard.keyDifferentiators.slice(0, 3).map((diff, j) => (
                                  <li key={j} className="text-xs text-gray-600 flex items-start gap-1">
                                    <Trophy className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                    {diff}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1">Winning Tactics:</p>
                              <ul className="space-y-1">
                                {cp.competitor.battleCard.winningTactics.slice(0, 2).map((tactic, j) => (
                                  <li key={j} className="text-xs text-gray-600 flex items-start gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                    {tactic}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="p-2 bg-amber-50 rounded border border-amber-200">
                              <p className="text-xs font-medium text-amber-800">Rise Win Rate vs {cp.competitor.name}:</p>
                              <p className="text-lg font-bold text-amber-700">{cp.competitor.winRate}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Win-Back Strategy */}
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Win-Back Strategy</span>
                  </div>
                  <p className="text-xs text-green-700">{competitiveIntel.winBackStrategy}</p>
                </div>

                {/* Competitive Threats */}
                {competitiveIntel.competitiveThreats.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Watch Out For</h4>
                    <ul className="space-y-1">
                      {competitiveIntel.competitiveThreats.map((threat, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          {threat}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recommended Approach */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <button
            onClick={() => toggleSection('approach')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-gray-800">Sales Approach</span>
            </div>
            {expandedSections.approach ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSections.approach && (
            <div className="px-4 pb-4 space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">{intelligence.recommendedApproach}</p>
              </div>

              {intelligence.keyTalkingPoints.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Key Talking Points</h4>
                  <ul className="space-y-1">
                    {intelligence.keyTalkingPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {intelligence.potentialChallenges.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Potential Challenges</h4>
                  <ul className="space-y-1">
                    {intelligence.potentialChallenges.map((challenge, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ROI Preview */}
        {quickROI && risePricing && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <button
              onClick={() => toggleSection('roi')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-gray-800">ROI Calculator</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  {quickROI.annualROI}% ROI
                </span>
              </div>
              {expandedSections.roi ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expandedSections.roi && (
              <div className="px-4 pb-4 space-y-3">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                    <div className="flex items-center gap-1 mb-1">
                      <Percent className="w-3 h-3 text-emerald-600" />
                      <span className="text-xs text-emerald-600 font-medium">Annual ROI</span>
                    </div>
                    <span className="text-2xl font-bold text-emerald-700">{quickROI.annualROI}%</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">Payback</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-700">{quickROI.paybackMonths} mo</span>
                  </div>
                </div>

                {/* Investment & Returns */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rise Investment</span>
                    <span className="font-semibold text-gray-900">{formatCurrencyShort(risePricing.annualPrice)}/yr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Annual Benefit</span>
                    <span className="font-semibold text-emerald-600">+{formatCurrencyShort(quickROI.totalAnnualBenefit)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">3-Year Value</span>
                      <span className="font-bold text-gray-900">{formatCurrencyShort(quickROI.threeYearValue)}</span>
                    </div>
                  </div>
                </div>

                {/* Benefit Breakdown Mini */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Value Drivers</h4>
                  {quickROI.breakdown.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{item.category}</span>
                      <span className={`font-medium ${item.annualImpact > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                        +{formatCurrencyShort(item.annualImpact)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Open Full Calculator Button */}
                <button
                  onClick={onOpenROICalculator}
                  className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Calculator className="w-4 h-4" />
                  Open Full ROI Calculator
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ROI Calculator Modal Component
const ROICalculatorModal = ({ lead, isOpen, onClose }: {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
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
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
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
      </div>
    </div>
  );
};

// Sales Acceleration Dashboard - Shows hot leads with product recommendations
const SalesAccelerationDashboard = ({ leads, onSelectLead }: {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'cu' | 'bank'>('all');
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Calculate hot leads
  const hotLeads = useMemo(() => {
    return identifyHotLeads(leads, 30);
  }, [leads]);

  const metrics = useMemo(() => {
    return calculateDashboardMetrics(leads, hotLeads);
  }, [leads, hotLeads]);

  const topCUs = useMemo(() => getTopCreditUnions(hotLeads, 15), [hotLeads]);
  const topBanks = useMemo(() => getTopCommunityBanks(hotLeads, 15), [hotLeads]);

  const displayLeads = activeTab === 'cu' ? topCUs : activeTab === 'bank' ? topBanks : hotLeads;

  // Find the full Lead object from the original leads array
  const selectFullLead = (hotLead: HotLead) => {
    const fullLead = leads.find(l => l.id === hotLead.id);
    if (fullLead) {
      onSelectLead(fullLead);
    }
  };

  const copyEmailTemplate = (lead: HotLead) => {
    const email = generateColdEmailTemplate(lead);
    navigator.clipboard.writeText(email);
    setCopiedEmail(lead.id);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const urgencyColors = {
    Critical: 'bg-red-100 text-red-700 border-red-200',
    High: 'bg-orange-100 text-orange-700 border-orange-200',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Standard: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  if (hotLeads.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
        <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Loading hot leads...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Hot Leads - Who Needs Rise Analytics</h2>
              <p className="text-orange-100 text-sm">Ranked by product-market fit & buying signals</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{formatCurrencyShort(metrics.totalPipelineValue)}</div>
            <div className="text-orange-100 text-xs">Pipeline Value</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50 border-b">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{hotLeads.filter(l => l.urgencyLevel === 'Critical').length}</div>
          <div className="text-xs text-red-600 font-medium">Critical Priority</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{hotLeads.filter(l => l.urgencyLevel === 'High').length}</div>
          <div className="text-xs text-orange-600 font-medium">High Priority</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{formatCurrencyShort(metrics.averageDealSize)}</div>
          <div className="text-xs text-gray-500">Avg Deal Size</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{metrics.weeklyTargets.emailsToSend}</div>
          <div className="text-xs text-blue-600 font-medium">Emails This Week</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'all' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          All Hot Leads ({hotLeads.length})
        </button>
        <button
          onClick={() => setActiveTab('cu')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'cu' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4 inline mr-1" />
          Credit Unions ({topCUs.length})
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'bank' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Landmark className="w-4 h-4 inline mr-1" />
          Banks ({topBanks.length})
        </button>
      </div>

      {/* Lead List */}
      <div className="max-h-[500px] overflow-y-auto">
        {displayLeads.map((lead, index) => (
          <div key={lead.id} className="border-b last:border-b-0">
            {/* Lead Header - Always visible */}
            <div
              className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
            >
              <div className="flex items-start gap-3">
                {/* Rank Badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index < 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                  index < 10 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {lead.priorityRank}
                </div>

                {/* Lead Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 truncate">{lead.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${urgencyColors[lead.urgencyLevel]}`}>
                      {lead.urgencyLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {lead.city}, {lead.state}
                    </span>
                    <span>{formatCurrency(lead.assets)}</span>
                    {lead.members > 0 && <span>{lead.members.toLocaleString()} members</span>}
                  </div>
                </div>

                {/* Product & Value */}
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <span className="text-lg">{lead.topProduct.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{lead.topProduct.shortName}</span>
                  </div>
                  <div className="text-xs text-emerald-600 font-medium">
                    {formatCurrencyShort(lead.estimatedDealValue)}/yr
                  </div>
                </div>

                {/* Expand Arrow */}
                <div className="self-center">
                  {expandedLead === lead.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedLead === lead.id && (
              <div className="px-4 pb-4 bg-gray-50 border-t">
                {/* Why They Need Rise */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Star className="w-3 h-3" /> Why They Need Rise Analytics
                  </h4>
                  <div className="space-y-2">
                    {lead.whyTheyNeedRise.map((reason, i) => (
                      <div key={i} className="text-sm text-gray-700 bg-white p-2 rounded border">
                        {reason.split('**').map((part, j) =>
                          j % 2 === 1 ? <strong key={j} className="text-gray-900">{part}</strong> : part
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Recommendations */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Recommended Products
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {lead.productRecommendations.slice(0, 4).map((product) => (
                      <div key={product.productId} className="bg-white p-2 rounded border">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{product.icon}</span>
                          <span className="text-sm font-medium text-gray-800">{product.shortName}</span>
                          <span className={`ml-auto px-1.5 py-0.5 rounded text-xs ${
                            product.urgency === 'Critical' ? 'bg-red-100 text-red-700' :
                            product.urgency === 'High' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {product.fitScore}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{product.whyTheyNeedIt}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buying Signals */}
                {lead.buyingSignals.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Buying Signals
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {lead.buyingSignals.map((signal, i) => (
                        <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ROI Preview */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-emerald-50 p-2 rounded border border-emerald-200 text-center">
                    <div className="text-lg font-bold text-emerald-700">{lead.roi.annualROI}%</div>
                    <div className="text-xs text-emerald-600">ROI</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded border border-blue-200 text-center">
                    <div className="text-lg font-bold text-blue-700">{lead.roi.paybackMonths} mo</div>
                    <div className="text-xs text-blue-600">Payback</div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded border border-purple-200 text-center">
                    <div className="text-lg font-bold text-purple-700">{formatCurrencyShort(lead.roi.totalAnnualBenefit)}</div>
                    <div className="text-xs text-purple-600">Annual Value</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => selectFullLead(lead)}
                    className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View Full Profile
                  </button>
                  <button
                    onClick={() => copyEmailTemplate(lead)}
                    className="flex-1 py-2 px-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {copiedEmail === lead.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Copy Email Template
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Top Products Summary */}
      <div className="p-4 bg-gray-50 border-t">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Top Product Opportunities</h4>
        <div className="flex flex-wrap gap-2">
          {metrics.topProducts.map(({ product, count, value }) => (
            <div key={product} className="px-3 py-1.5 bg-white rounded-lg border text-sm">
              <span className="font-medium text-gray-800">{product}</span>
              <span className="text-gray-500 ml-2">{count} leads</span>
              <span className="text-emerald-600 ml-2">{formatCurrencyShort(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Territory Intelligence Dashboard - Market penetration and geographic analysis
const TerritoryIntelligenceDashboard = ({ leads }: { leads: Lead[] }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'states' | 'segments' | 'opportunities' | 'competitive'>('overview');
  const [metrics, setMetrics] = useState<TerritoryMetrics | null>(null);

  // Calculate metrics when leads change
  useEffect(() => {
    if (leads.length > 0) {
      const territoryMetrics = calculateTerritoryMetrics(
        leads.map(l => ({
          state: l.state,
          type: l.type,
          assets: l.assets,
          status: l.status,
          score: l.score
        }))
      );
      setMetrics(territoryMetrics);
    }
  }, [leads]);

  const tabs = [
    { id: 'overview', label: 'Market Overview', icon: PieChart },
    { id: 'states', label: 'State Analysis', icon: MapPin },
    { id: 'segments', label: 'Segments', icon: Target },
    { id: 'opportunities', label: 'Growth Opportunities', icon: TrendingUp },
    { id: 'competitive', label: 'Competitive Map', icon: Shield },
  ];

  const getOpportunityColor = (diff: GrowthOpportunity['difficulty']) => {
    switch (diff) {
      case 'easy': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'hard': return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getCompetitiveColor = (opp: CompetitiveRegion['opportunity']) => {
    switch (opp) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-red-500';
    }
  };

  if (!metrics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
        <p className="text-gray-600">Analyzing territory data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header with Key Metrics */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6" />
            <div>
              <h3 className="font-semibold text-lg">Territory Intelligence</h3>
              <p className="text-blue-200 text-sm">Market penetration & geographic analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="font-bold text-2xl">{formatTerritoryValue(metrics.totalAddressableMarket)}</div>
              <div className="text-blue-200 text-xs">Total Market</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl">{formatTerritoryValue(metrics.pipelineValue)}</div>
              <div className="text-blue-200 text-xs">Pipeline Value</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl">{metrics.topStates.length}</div>
              <div className="text-blue-200 text-xs">Active States</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl">{metrics.growthOpportunities.length}</div>
              <div className="text-blue-200 text-xs">Opportunities</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">Institutions</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{leads.length.toLocaleString()}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {leads.filter(l => l.type === 'Credit Union').length} CUs / {leads.filter(l => l.type === 'Community Bank').length} Banks
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Avg Deal Size</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatTerritoryValue(metrics.avgDealSize)}</div>
                <div className="text-xs text-gray-600 mt-1">Annual contract value</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span className="text-xs text-purple-600 font-medium">Segments</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{metrics.marketSegments.length}</div>
                <div className="text-xs text-gray-600 mt-1">Active market segments</div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <Flame className="w-5 h-5 text-amber-600" />
                  <span className="text-xs text-amber-600 font-medium">Hot Leads</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {metrics.topStates.reduce((sum, s) => sum + (s.hotLeadsCount || 0), 0)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Score &gt; 70</div>
              </div>
            </div>

            {/* Top States Mini */}
            <div className="bg-gray-50 rounded-xl p-4 border">
              <h4 className="font-semibold text-gray-800 mb-3">Top 5 States by Assets</h4>
              <div className="space-y-2">
                {metrics.topStates.slice(0, 5).map((state, idx) => (
                  <div key={state.state} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-800 w-8">{state.state}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(state.totalAssets / metrics.topStates[0].totalAssets) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-24 text-right">{formatTerritoryValue(state.totalAssets)}</span>
                    <span className="text-xs text-gray-500 w-16 text-right">{state.totalInstitutions} inst.</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'states' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Geographic breakdown of your total addressable market.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold text-gray-700">State</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Institutions</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Credit Unions</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Banks</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Total Assets</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Avg Assets</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Hot Leads</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topStates.map(state => (
                    <tr key={state.state} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{state.state}</span>
                          <span className="text-xs text-gray-500">{STATE_NAMES[state.state]}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium">{state.totalInstitutions}</td>
                      <td className="p-3 text-right text-blue-600">{state.creditUnions}</td>
                      <td className="p-3 text-right text-green-600">{state.communityBanks}</td>
                      <td className="p-3 text-right font-semibold">{formatTerritoryValue(state.totalAssets)}</td>
                      <td className="p-3 text-right">{formatTerritoryValue(state.averageAssets)}</td>
                      <td className="p-3 text-right">
                        {state.hotLeadsCount && state.hotLeadsCount > 0 ? (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">
                            {state.hotLeadsCount}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'segments' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Market segments with historical win rates and characteristics.</p>
            <div className="grid gap-4">
              {metrics.marketSegments.map(segment => (
                <div key={segment.name} className="bg-white rounded-xl border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800">{segment.name}</h4>
                      <p className="text-sm text-gray-500">{segment.count} institutions • {formatTerritoryValue(segment.totalAssets)} total assets</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center px-3 py-1 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-lg font-bold text-green-700">{segment.winRate}%</div>
                        <div className="text-xs text-green-600">Win Rate</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Avg Deal Size:</span>
                      <span className="ml-2 font-medium text-gray-800">{segment.avgDealSize}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Sales Cycle:</span>
                      <span className="ml-2 font-medium text-gray-800">{segment.avgSalesCycle}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Key Products:</span>
                      <span className="ml-2 font-medium text-gray-800">{segment.keyProducts.join(', ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">AI-identified growth opportunities based on market analysis.</p>
            <div className="space-y-3">
              {metrics.growthOpportunities.map((opp, idx) => (
                <div key={idx} className={`rounded-xl border p-4 ${getOpportunityColor(opp.difficulty)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {opp.type === 'geographic' && <MapPin className="w-5 h-5" />}
                      {opp.type === 'segment' && <Target className="w-5 h-5" />}
                      {opp.type === 'product' && <ShoppingCart className="w-5 h-5" />}
                      {opp.type === 'competitive' && <Swords className="w-5 h-5" />}
                      <span className="font-semibold">{opp.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        opp.difficulty === 'easy' ? 'bg-green-200' :
                        opp.difficulty === 'medium' ? 'bg-amber-200' : 'bg-red-200'
                      }`}>
                        {opp.difficulty}
                      </span>
                      <span className="font-bold">{formatTerritoryValue(opp.potentialValue)}</span>
                    </div>
                  </div>
                  <p className="text-sm mb-3">{opp.description}</p>
                  <div className="bg-white/50 rounded-lg p-2">
                    <span className="text-xs font-semibold">Recommended Action: </span>
                    <span className="text-sm">{opp.recommendedAction}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'competitive' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Competitive landscape by state showing dominant vendors and opportunity levels.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold text-gray-700">State</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Dominant Competitor</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Their Share</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Our Share</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Opportunity</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.competitiveHeatmap.map(region => (
                    <tr key={region.state} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{region.state}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-medium">
                          {region.dominantCompetitor}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-medium text-red-600">{region.competitorShare}%</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-medium text-green-600">{region.ourShare}%</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${getCompetitiveColor(region.opportunity)}`}>
                          {region.opportunity.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-gray-600 max-w-xs">{region.strategy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Deal Coaching Dashboard - AI-powered real-time sales coaching
const DealCoachingDashboard = ({ selectedLead, intelligence: _intelligence }: {
  selectedLead: Lead | null;
  intelligence: ProspectIntelligence | null;
}) => {
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
      const response = await fetch('http://localhost:3001/api/coaching/handle-objection', {
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
};

// Marketing Agent Dashboard - Generate content and improve AI search visibility
const MarketingAgentDashboard = () => {
  const [activeTab, setActiveTab] = useState<'social' | 'blog' | 'battle' | 'seo' | 'ai'>('social');
  const [generatedContent, setGeneratedContent] = useState<MarketingContent | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('company');
  const [selectedPlatform, setSelectedPlatform] = useState<'linkedin' | 'twitter' | 'facebook'>('linkedin');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('Jack Henry');
  const [copiedContent, setCopiedContent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateContent = () => {
    setIsGenerating(true);
    setTimeout(() => {
      switch (activeTab) {
        case 'social':
          setGeneratedContent(generateSocialPost(selectedProduct as 'company' | 'platform' | 'member360' | 'lending' | 'dataWarehouse', selectedPlatform));
          break;
        case 'blog':
          setGeneratedContent(generateBlogOutline('analytics roi', 'credit_union'));
          break;
        case 'battle':
          setGeneratedContent(generateBattleCard(selectedCompetitor));
          break;
        default:
          setGeneratedContent(null);
      }
      setIsGenerating(false);
    }, 500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  const tabs = [
    { id: 'social', label: 'Social Posts', icon: Linkedin },
    { id: 'blog', label: 'Blog Content', icon: FileText },
    { id: 'battle', label: 'Battle Cards', icon: Swords },
    { id: 'seo', label: 'SEO Keywords', icon: Hash },
    { id: 'ai', label: 'AI Search', icon: Globe },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header with metrics */}
      <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Megaphone className="w-6 h-6" />
            <div>
              <h3 className="font-semibold text-lg">Marketing Agent</h3>
              <p className="text-purple-200 text-sm">Generate content & improve AI search visibility</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-lg">{SEO_KEYWORDS.primary.length + SEO_KEYWORDS.secondary.length}</div>
              <div className="text-purple-200">Target Keywords</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">6</div>
              <div className="text-purple-200">Products</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">4</div>
              <div className="text-purple-200">Battle Cards</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as typeof activeTab); setGeneratedContent(null); }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600 bg-purple-50'
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
        {activeTab === 'social' && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Product Focus</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="company">Rise Analytics (Company)</option>
                  <option value="platform">Analytics Platform</option>
                  <option value="member360">Member 360</option>
                  <option value="lending">Lending Analytics</option>
                  <option value="dataWarehouse">Data Warehouse</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Platform</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value as typeof selectedPlatform)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>
              <button
                onClick={generateContent}
                disabled={isGenerating}
                className="self-end px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Post
              </button>
            </div>

            {generatedContent && (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">{generatedContent.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{generatedContent.metadata?.wordCount} words</span>
                    <button
                      onClick={() => copyToClipboard(generatedContent.content)}
                      className="px-3 py-1 bg-white border rounded-lg text-sm hover:bg-gray-100 flex items-center gap-1"
                    >
                      {copiedContent ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                      {copiedContent ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">{generatedContent.content}</pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  {generatedContent.keywords.map(kw => (
                    <span key={kw} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">{kw}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'blog' && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={generateContent}
                disabled={isGenerating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate Blog Outline
              </button>
              <span className="text-sm text-gray-500 self-center">Topic: Analytics ROI for Credit Unions</span>
            </div>

            {generatedContent && generatedContent.type === 'blog_outline' && (
              <div className="bg-gray-50 rounded-lg p-4 border max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">{generatedContent.title}</span>
                  <button
                    onClick={() => copyToClipboard(generatedContent.content)}
                    className="px-3 py-1 bg-white border rounded-lg text-sm hover:bg-gray-100 flex items-center gap-1"
                  >
                    {copiedContent ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    {copiedContent ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono text-xs">{generatedContent.content}</pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'battle' && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Competitor</label>
                <select
                  value={selectedCompetitor}
                  onChange={(e) => setSelectedCompetitor(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="Jack Henry">Jack Henry</option>
                  <option value="Fiserv">Fiserv</option>
                  <option value="Tableau">Tableau</option>
                  <option value="Power BI">Power BI</option>
                </select>
              </div>
              <button
                onClick={generateContent}
                disabled={isGenerating}
                className="self-end px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
                Generate Battle Card
              </button>
            </div>

            {generatedContent && generatedContent.type === 'battle_card' && (
              <div className="bg-gray-50 rounded-lg p-4 border max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">{generatedContent.title}</span>
                  <button
                    onClick={() => copyToClipboard(generatedContent.content)}
                    className="px-3 py-1 bg-white border rounded-lg text-sm hover:bg-gray-100 flex items-center gap-1"
                  >
                    {copiedContent ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    {copiedContent ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono text-xs">{generatedContent.content}</pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Target these keywords to improve organic search visibility and help AI systems recommend Rise Analytics.</p>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Primary Keywords (High Priority)</h4>
              <div className="flex flex-wrap gap-2">
                {SEO_KEYWORDS.primary.map(kw => (
                  <span key={kw} className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded-lg border border-purple-200">{kw}</span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Secondary Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {SEO_KEYWORDS.secondary.map(kw => (
                  <span key={kw} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-200">{kw}</span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Long-Tail Keywords (Content Ideas)</h4>
              <div className="flex flex-wrap gap-2">
                {SEO_KEYWORDS.longTail.map(kw => (
                  <span key={kw} className="px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">{kw}</span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Competitor Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {SEO_KEYWORDS.competitors.map(kw => (
                  <span key={kw} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-sm rounded-lg border border-amber-200">{kw}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800">AI Search Optimization</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    This structured content helps AI assistants (Claude, ChatGPT, Copilot) recommend Rise Analytics
                    when users ask about credit union analytics, community bank BI, or financial institution reporting.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">Rise Analytics AI-Optimized Profile</span>
                <button
                  onClick={() => copyToClipboard(generateAISearchContent())}
                  className="px-3 py-1 bg-white border rounded-lg text-sm hover:bg-gray-100 flex items-center gap-1"
                >
                  {copiedContent ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  Copy for Website
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-xs text-gray-700 font-mono max-h-64 overflow-y-auto">{generateAISearchContent()}</pre>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <h5 className="font-medium text-gray-800 mb-2">Company Facts</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Name:</strong> {RISE_ANALYTICS_PROFILE.company.name}</li>
                  <li>• <strong>Founded:</strong> {RISE_ANALYTICS_PROFILE.company.founded}</li>
                  <li>• <strong>HQ:</strong> {RISE_ANALYTICS_PROFILE.company.headquarters}</li>
                  <li>• <strong>Customers:</strong> {RISE_ANALYTICS_PROFILE.customerSuccess.clientCount}</li>
                  <li>• <strong>Avg ROI:</strong> {RISE_ANALYTICS_PROFILE.customerSuccess.averageROI}</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <h5 className="font-medium text-gray-800 mb-2">Target Market</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Primary:</strong> {RISE_ANALYTICS_PROFILE.targetMarket.primary.join(', ')}</li>
                  <li>• <strong>Asset Range:</strong> {RISE_ANALYTICS_PROFILE.targetMarket.assetRange}</li>
                  <li>• <strong>Ideal Size:</strong> {RISE_ANALYTICS_PROFILE.targetMarket.idealCustomerProfile.assetSize}</li>
                  <li>• <strong>Geography:</strong> {RISE_ANALYTICS_PROFILE.targetMarket.geography}</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [assetFilter, setAssetFilter] = useState('all');
  const [showROICalculator, setShowROICalculator] = useState(false);
  const [showHotLeads, setShowHotLeads] = useState(true);
  const [showMarketingAgent, setShowMarketingAgent] = useState(false);
  const [showDealCoaching, setShowDealCoaching] = useState(true);
  const [showTerritoryIntel, setShowTerritoryIntel] = useState(false);
  const [showGettingStarted, setShowGettingStarted] = useState(() => {
    // Only show getting started if user hasn't dismissed it
    return localStorage.getItem('hideGettingStarted') !== 'true';
  });
  const [aiConnected, setAiConnected] = useState<boolean | null>(null);

  // Check AI health on mount
  useEffect(() => {
    checkAIHealth().then(setAiConnected);
    const interval = setInterval(() => {
      checkAIHealth().then(setAiConnected);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Dismiss getting started guide
  const handleDismissGettingStarted = useCallback(() => {
    localStorage.setItem('hideGettingStarted', 'true');
    setShowGettingStarted(false);
  }, []);

  // Demo scenario handlers
  const handleSelectDemo = useCallback((scenario: string) => {
    // Filter and select leads based on demo scenario
    setShowGettingStarted(false);
    localStorage.setItem('hideGettingStarted', 'true');

    // Wait for leads to load then select appropriate demo lead
    if (leads.length > 0) {
      let targetLead: Lead | undefined;

      switch(scenario) {
        case 'enterprise':
          // Find largest credit union
          targetLead = [...leads]
            .filter(l => l.type === 'Credit Union')
            .sort((a, b) => b.assets - a.assets)[0];
          break;
        case 'competitive':
          // Find mid-size institution in TX (competitive market)
          targetLead = leads.find(l => l.state === 'TX' && l.assets >= 500000000 && l.assets <= 5000000000);
          break;
        case 'expansion':
          // Find community bank in growing market
          targetLead = leads.find(l => l.type === 'Community Bank' && l.assets >= 100000000);
          break;
      }

      if (targetLead) {
        setSelectedLead(targetLead);
      }
    }
  }, [leads]);

  // Fetch data from APIs
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch both banks and credit unions in parallel
      const [banksData, creditUnionsData] = await Promise.all([
        fetchBanks({ activeOnly: true }),
        fetchCreditUnions({})
      ]);

      // Convert to unified Lead format
      const bankLeads = banksData.map(bankToLead);
      const cuLeads = creditUnionsData.map(creditUnionToLead);

      // Combine and sort by assets (largest first)
      const allLeads = [...bankLeads, ...cuLeads].sort((a, b) => b.assets - a.assets);

      // Load any saved sales data from localStorage
      const savedSalesData = localStorage.getItem('riseSalesData');
      if (savedSalesData) {
        const salesDataMap = JSON.parse(savedSalesData);
        allLeads.forEach(lead => {
          if (salesDataMap[lead.id]) {
            Object.assign(lead, salesDataMap[lead.id]);
          }
        });
      }

      setLeads(allLeads);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesType = typeFilter === 'all' || lead.type === typeFilter;
    const matchesState = stateFilter === 'all' || lead.state === stateFilter;

    // Asset filter
    let matchesAsset = true;
    if (assetFilter !== 'all') {
      const filter = ASSET_SIZE_FILTERS.find(f => f.value === assetFilter);
      if (filter) {
        matchesAsset = lead.assets >= filter.min && lead.assets < filter.max;
      }
    }

    return matchesSearch && matchesStatus && matchesType && matchesState && matchesAsset;
  });

  // Calculate stats from real data
  const stats = [
    {
      label: 'Total Institutions',
      value: leads.length.toLocaleString(),
      icon: Building2,
      change: `${leads.filter(l => l.type === 'Credit Union').length} CUs / ${leads.filter(l => l.type === 'Community Bank').length} Banks`,
      color: 'text-blue-600'
    },
    {
      label: 'Total Assets',
      value: formatCurrency(leads.reduce((sum, l) => sum + l.assets, 0)),
      icon: DollarSign,
      change: 'Combined',
      color: 'text-green-600'
    },
    {
      label: 'Filtered Results',
      value: filteredLeads.length.toLocaleString(),
      icon: Filter,
      change: `of ${leads.length}`,
      color: 'text-purple-600'
    },
    {
      label: 'Avg Lead Score',
      value: leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length).toString() : '0',
      icon: Target,
      change: '/100',
      color: 'text-amber-600'
    },
  ];

  // Get unique states from loaded data
  const availableStates = [...new Set(leads.map(l => l.state))].sort();

  // Compute intelligence for selected lead
  const selectedLeadIntelligence = useMemo(() => {
    if (!selectedLead || leads.length === 0) return null;
    // Convert Lead back to the format expected by analyzeProspect
    const leadForAnalysis = {
      id: selectedLead.id,
      name: selectedLead.name,
      type: selectedLead.type,
      city: selectedLead.city,
      state: selectedLead.state,
      assets: selectedLead.assets,
      members: selectedLead.members,
      deposits: selectedLead.deposits,
      roa: selectedLead.roa,
      branches: selectedLead.branches,
    };
    const allLeadsForAnalysis = leads.map(l => ({
      id: l.id,
      name: l.name,
      type: l.type,
      city: l.city,
      state: l.state,
      assets: l.assets,
      members: l.members,
      deposits: l.deposits,
      roa: l.roa,
      branches: l.branches,
    }));
    return analyzeProspect(leadForAnalysis, allLeadsForAnalysis);
  }, [selectedLead, leads]);

  // Compute competitive intelligence for selected lead
  const selectedLeadCompetitiveIntel = useMemo(() => {
    if (!selectedLead) return null;
    return analyzeCompetitiveLandscape({
      type: selectedLead.type,
      assets: selectedLead.assets,
      state: selectedLead.state,
      name: selectedLead.name,
    });
  }, [selectedLead]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Rise Sales Agent</h1>
                <p className="text-xs text-gray-500">Real CU/Bank Data from NCUA & FDIC</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> AI Active
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Getting Started Onboarding */}
        {showGettingStarted && (
          <GettingStarted
            aiConnected={aiConnected}
            leadsLoaded={!loading && leads.length > 0}
            onDismiss={handleDismissGettingStarted}
            onSelectDemo={handleSelectDemo}
          />
        )}

        {/* Executive Summary - CEO Dashboard */}
        {!loading && leads.length > 0 && (
          <ExecutiveSummary leads={leads} hotLeads={identifyHotLeads(leads)} />
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <span className="text-xs text-gray-500 font-medium">{stat.change}</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchData} className="text-sm underline">Try Again</button>
          </div>
        )}

        {/* Sales Acceleration Dashboard - Hot Leads */}
        {!loading && leads.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowHotLeads(!showHotLeads)}
                className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                <Rocket className="w-5 h-5 text-orange-500" />
                Sales Acceleration Dashboard
                <ChevronDown className={`w-4 h-4 transition-transform ${showHotLeads ? 'rotate-180' : ''}`} />
              </button>
              <span className="text-sm text-gray-500 bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                {identifyHotLeads(leads).length} Hot Leads Ready
              </span>
            </div>
            {showHotLeads && (
              <SalesAccelerationDashboard leads={leads} onSelectLead={setSelectedLead} />
            )}
          </div>
        )}

        {/* Territory Intelligence Dashboard */}
        {!loading && leads.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowTerritoryIntel(!showTerritoryIntel)}
                className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                <Globe className="w-5 h-5 text-blue-500" />
                Territory Intelligence
                <ChevronDown className={`w-4 h-4 transition-transform ${showTerritoryIntel ? 'rotate-180' : ''}`} />
              </button>
              <span className="text-sm text-gray-500 bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                Market Penetration & Geographic Analysis
              </span>
            </div>
            {showTerritoryIntel && <TerritoryIntelligenceDashboard leads={leads} />}
          </div>
        )}

        {/* Deal Coaching Dashboard */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowDealCoaching(!showDealCoaching)}
              className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-emerald-600 transition-colors"
            >
              <GraduationCap className="w-5 h-5 text-emerald-500" />
              AI Deal Coach
              <ChevronDown className={`w-4 h-4 transition-transform ${showDealCoaching ? 'rotate-180' : ''}`} />
            </button>
            <span className="text-sm text-gray-500 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
              Real-Time Coaching & Deal Intelligence
            </span>
          </div>
          {showDealCoaching && (
            <DealCoachingDashboard
              selectedLead={selectedLead}
              intelligence={selectedLeadIntelligence}
            />
          )}
        </div>

        {/* Marketing Agent Dashboard */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowMarketingAgent(!showMarketingAgent)}
              className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors"
            >
              <Megaphone className="w-5 h-5 text-purple-500" />
              Marketing Agent
              <ChevronDown className={`w-4 h-4 transition-transform ${showMarketingAgent ? 'rotate-180' : ''}`} />
            </button>
            <span className="text-sm text-gray-500 bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
              Content & AI Search Optimization
            </span>
          </div>
          {showMarketingAgent && <MarketingAgentDashboard />}
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Lead Table */}
          <div className="col-span-2 bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Institutions Pipeline</h2>
                <span className="text-sm text-gray-500">{filteredLeads.length.toLocaleString()} results</span>
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, city, or state..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="Credit Union">Credit Unions</option>
                  <option value="Community Bank">Community Banks</option>
                </select>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All States</option>
                  {availableStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <select
                  value={assetFilter}
                  onChange={(e) => setAssetFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {ASSET_SIZE_FILTERS.map(filter => (
                    <option key={filter.value} value={filter.value}>{filter.label}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="demo_scheduled">Demo Scheduled</option>
                  <option value="proposal_sent">Proposal Sent</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="ml-3 text-gray-600">Loading institutions from NCUA & FDIC...</span>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No institutions match your filters</p>
                  <p className="text-sm mt-1">Try adjusting your search criteria</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Institution</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assets</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredLeads.slice(0, 500).map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`cursor-pointer transition-colors ${
                          selectedLead?.id === lead.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              lead.type === 'Credit Union'
                                ? 'bg-gradient-to-br from-blue-100 to-blue-200'
                                : 'bg-gradient-to-br from-green-100 to-green-200'
                            }`}>
                              {lead.type === 'Credit Union'
                                ? <Users className="w-5 h-5 text-blue-600" />
                                : <Landmark className="w-5 h-5 text-green-600" />
                              }
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{lead.name}</div>
                              <div className="text-xs text-gray-500">{lead.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{lead.city}</div>
                          <div className="text-xs text-gray-500">{lead.state}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(lead.assets)}</div>
                          {lead.members > 0 && (
                            <div className="text-xs text-gray-500">{lead.members.toLocaleString()} members</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`text-lg font-bold ${
                              lead.score >= 85 ? 'text-green-600' : lead.score >= 70 ? 'text-amber-600' : 'text-gray-600'
                            }`}>
                              {lead.score}
                            </div>
                            {lead.score >= 85 && <Zap className="w-4 h-4 text-amber-500" />}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                            {formatStatus(lead.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {filteredLeads.length > 500 && (
                <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 border-t">
                  Showing first 500 of {filteredLeads.length.toLocaleString()} results. Use filters to narrow down.
                </div>
              )}
            </div>
          </div>

          {/* Intelligence Panel */}
          <div className="col-span-1 h-[600px] overflow-hidden">
            <IntelligencePanel intelligence={selectedLeadIntelligence} lead={selectedLead} competitiveIntel={selectedLeadCompetitiveIntel} onOpenROICalculator={() => setShowROICalculator(true)} />
          </div>

          {/* AI Chat */}
          <div className="col-span-1 h-[600px]">
            <AIChat selectedLead={selectedLead} intelligence={selectedLeadIntelligence} competitiveIntel={selectedLeadCompetitiveIntel} />
          </div>
        </div>
      </main>

      {/* ROI Calculator Modal */}
      <ROICalculatorModal
        lead={selectedLead}
        isOpen={showROICalculator}
        onClose={() => setShowROICalculator(false)}
      />
    </div>
  );
}
