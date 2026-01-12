import { useState, useEffect, useRef } from 'react';
import { Search, Send, Calendar, Building2, Users, DollarSign, Bot, Sparkles, BarChart3, Target, Zap } from 'lucide-react';

const mockLeads = [
  { id: 1, name: 'Space Coast Credit Union', contact: 'David Bonheur', title: 'CEO', email: 'dbonheur@sccu.com', phone: '(321) 752-2222', assets: 8200000000, members: 520000, status: 'qualified', score: 92, state: 'FL', source: 'NCUA', lastContact: '2 hours ago', recommendedProducts: ['Performance Management', 'Member Insights'] },
  { id: 2, name: 'VyStar Credit Union', contact: 'Brian Wolfburg', title: 'CEO', email: 'bwolfburg@vystarcu.org', phone: '(904) 777-6000', assets: 13500000000, members: 890000, status: 'demo_scheduled', score: 95, state: 'FL', source: 'Referral', lastContact: '1 day ago', recommendedProducts: ['Loan Analytics', 'Regulatory Analytics'] },
  { id: 3, name: 'Suncoast Credit Union', contact: 'Kevin Johnson', title: 'CFO', email: 'kjohnson@suncoastcreditunion.com', phone: '(813) 621-7511', assets: 17000000000, members: 1000000, status: 'proposal_sent', score: 88, state: 'FL', source: 'Website', lastContact: '3 days ago', recommendedProducts: ['Performance Management', 'Marketing Solutions'] },
  { id: 4, name: 'Gulf Coast Community Bank', contact: 'Lisa Martinez', title: 'VP Operations', email: 'lmartinez@gccb.com', phone: '(941) 555-0789', assets: 1200000000, members: 0, status: 'new', score: 72, state: 'FL', source: 'FDIC', lastContact: 'Never', recommendedProducts: ['Essential Analytics', 'Loan Analytics'] },
  { id: 5, name: 'Citrus Heights FCU', contact: 'Jennifer Adams', title: 'CIO', email: 'jadams@chfcu.org', phone: '(352) 555-0321', assets: 280000000, members: 25000, status: 'contacted', score: 68, state: 'FL', source: 'LinkedIn', lastContact: '5 days ago', recommendedProducts: ['Essential Analytics'] },
];

interface Lead {
  id: number;
  name: string;
  contact: string;
  title: string;
  email: string;
  phone: string;
  assets: number;
  members: number;
  status: string;
  score: number;
  state: string;
  source: string;
  lastContact: string;
  recommendedProducts: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
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
  return `$${num.toLocaleString()}`;
};

const formatStatus = (status: string): string => status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const AIChat = ({ selectedLead }: { selectedLead: Lead | null }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi! I'm your Rise Analytics AI Sales Agent. ${selectedLead ? `I see you're looking at ${selectedLead.name}. How can I help you engage with this prospect?` : 'How can I help you find and qualify credit union prospects today?'}` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedLead) {
      setMessages([{ role: 'assistant', content: `Now looking at **${selectedLead.name}**. Their lead score is ${selectedLead.score}/100. What would you like to do?\n\n• Generate outreach email\n• See qualification analysis\n• Get product recommendations\n• Draft follow-up strategy` }]);
    }
  }, [selectedLead]);

  const generateResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();

    if (msg.includes('email') || msg.includes('outreach') || msg.includes('write')) {
      return selectedLead
        ? `Here's a personalized outreach email for ${selectedLead.contact} at ${selectedLead.name}:\n\n---\n\n**Subject:** Helping ${selectedLead.name} Turn Data into Growth\n\nHi ${selectedLead.contact.split(' ')[0]},\n\nI noticed ${selectedLead.name} has grown to ${formatCurrency(selectedLead.assets)} in assets — impressive work serving your ${selectedLead.members?.toLocaleString() || 'community'} members.\n\nMany ${selectedLead.members > 500000 ? 'large' : 'growing'} credit unions struggle with:\n• Getting actionable insights from member data\n• Manual reporting taking too much time\n• Identifying at-risk members before they leave\n\nRise Analytics has helped 124+ credit unions solve these exact challenges. Our **${selectedLead.recommendedProducts[0]}** solution might be a great fit.\n\nWould you have 15 minutes this week for a quick call?\n\nBest regards`
        : "I'd be happy to draft an outreach email. Select a lead from the list first, or tell me about the prospect.";
    }

    if (msg.includes('qualif') || msg.includes('score') || msg.includes('analysis')) {
      return selectedLead
        ? `**Qualification Analysis for ${selectedLead.name}:**\n\n📊 **Lead Score: ${selectedLead.score}/100** ${selectedLead.score >= 85 ? '🔥 Hot Lead!' : selectedLead.score >= 70 ? '⚡ Warm Lead' : '❄️ Needs Nurturing'}\n\n**BANT Assessment:**\n• **Budget:** ${selectedLead.assets > 5000000000 ? 'High capacity' : selectedLead.assets > 1000000000 ? 'Good capacity' : 'May need ROI focus'} (${formatCurrency(selectedLead.assets)} assets)\n• **Authority:** ${selectedLead.title.includes('CEO') || selectedLead.title.includes('CFO') ? '✅ Decision maker' : '⚠️ May need exec sponsor'} (${selectedLead.title})\n• **Need:** ${selectedLead.members > 100000 ? 'Complex data needs likely' : 'Growing pains typical'}\n• **Timeline:** ${selectedLead.status === 'demo_scheduled' ? 'Active evaluation' : 'TBD - needs discovery'}\n\n**Recommended Products:**\n${selectedLead.recommendedProducts.map(p => `• ${p}`).join('\n')}\n\n**Next Steps:**\n1. ${selectedLead.status === 'new' ? 'Send initial outreach' : selectedLead.status === 'contacted' ? 'Schedule discovery call' : 'Prepare custom demo'}\n2. Research their current tech stack\n3. Find mutual connections on LinkedIn`
        : "Select a lead to see their qualification analysis.";
    }

    if (msg.includes('product') || msg.includes('recommend') || msg.includes('solution') || msg.includes('sell')) {
      return selectedLead
        ? `**Product Recommendations for ${selectedLead.name}:**\n\n🎯 **Primary:** ${selectedLead.recommendedProducts[0]}\n${selectedLead.assets > 5000000000
          ? "Large CUs like this need enterprise-grade analytics. Performance Management gives exec dashboards and KPI tracking they'll love."
          : selectedLead.assets > 1000000000
          ? "Mid-size CUs benefit most from Member Insights - helps them compete with larger institutions through better member understanding."
          : "Essential Analytics is perfect for growing CUs - zero implementation fees, quick wins they can show their board."}\n\n📦 **Cross-sell Opportunity:** ${selectedLead.recommendedProducts[1] || 'Professional Services'}\n\n💡 **Pitch Angle:** Focus on the 6% average revenue increase our clients see within 3 months. For ${formatCurrency(selectedLead.assets)} in assets, that's significant ROI.\n\n**Objection Handlers:**\n• "Too expensive" → ROI typically <12 months\n• "We have a solution" → What's your biggest gap today?\n• "Not ready" → What would need to change?`
        : "Select a lead to get product recommendations.";
    }

    if (msg.includes('demo') || msg.includes('schedule') || msg.includes('meeting')) {
      return selectedLead
        ? `**Demo Strategy for ${selectedLead.name}:**\n\n📅 **Suggested Demo Type:** ${selectedLead.assets > 5000000000 ? 'Executive Overview (45 min)' : 'Product Deep-Dive (30 min)'}\n\n**Focus Areas:**\n${selectedLead.recommendedProducts.map(p => `• ${p} capabilities`).join('\n')}\n\n**Prep Checklist:**\n✅ Research their annual report\n✅ Find 2-3 similar CU case studies\n✅ Prepare ROI calculator with their numbers\n✅ Have pricing ready for ${selectedLead.recommendedProducts[0]}\n\n**Demo Script Opener:**\n"${selectedLead.contact.split(' ')[0]}, before I show you anything, I'd love to understand - what's the #1 challenge keeping you up at night when it comes to member data?"\n\nWant me to draft the calendar invite?`
        : "Select a lead to plan their demo.";
    }

    return selectedLead
      ? `I can help you with ${selectedLead.name}! Try asking me to:\n\n• **"Write an outreach email"** - I'll personalize it for ${selectedLead.contact}\n• **"Show qualification analysis"** - BANT scoring and insights\n• **"Recommend products"** - Based on their ${formatCurrency(selectedLead.assets)} in assets\n• **"Plan the demo"** - Strategy and prep checklist`
      : "Select a lead from the table, then I can help you:\n\n• Generate personalized emails\n• Analyze lead qualification\n• Recommend the right products\n• Plan demo strategy\n\nOr ask me anything about Rise Analytics' solutions!";
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: generateResponse(userMessage) }]);
      setIsTyping(false);
    }, 800);
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
            <p className="text-xs text-blue-100">Powered by Claude</p>
          </div>
        </div>
        {selectedLead && (
          <span className="px-2 py-1 bg-white/20 rounded text-xs text-white">
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
            </div>
          </div>
        ))}
        {isTyping && (
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
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about this lead..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {['Write email', 'Qualify lead', 'Recommend products', 'Plan demo'].map(suggestion => (
            <button
              key={suggestion}
              onClick={() => { setInput(suggestion); }}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredLeads = mockLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: 'Total Pipeline', value: '$2.4M', icon: DollarSign, change: '+12%', color: 'text-green-600' },
    { label: 'Active Leads', value: '47', icon: Users, change: '+8', color: 'text-blue-600' },
    { label: 'Demos This Week', value: '6', icon: Calendar, change: '+2', color: 'text-purple-600' },
    { label: 'Avg Lead Score', value: '78', icon: Target, change: '+5', color: 'text-amber-600' },
  ];

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
                <p className="text-xs text-gray-500">AI-Powered CU/Bank Prospecting</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> AI Active
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <span className="text-xs text-green-600 font-medium">{stat.change}</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Lead Table */}
          <div className="col-span-2 bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Leads Pipeline</h2>
                <span className="text-sm text-gray-500">{filteredLeads.length} leads</span>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assets</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`cursor-pointer transition-colors ${
                        selectedLead?.id === lead.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{lead.name}</div>
                            <div className="text-xs text-gray-500">{lead.source} • {lead.state}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{lead.contact}</div>
                        <div className="text-xs text-gray-500">{lead.title}</div>
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
            </div>
          </div>

          {/* AI Chat */}
          <div className="col-span-1 h-[600px]">
            <AIChat selectedLead={selectedLead} />
          </div>
        </div>
      </main>
    </div>
  );
}
