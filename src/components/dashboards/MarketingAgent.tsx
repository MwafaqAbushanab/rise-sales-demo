import { useState } from 'react';
import { Bot, Linkedin, FileText, Swords, Hash, Globe, Megaphone, Sparkles, Loader2, Copy, Check, Building2, GraduationCap, MessageSquare } from 'lucide-react';
import { generateSocialPost, generateBlogOutline, generateBattleCard, generateAISearchContent, RISE_ANALYTICS_PROFILE, SEO_KEYWORDS, type MarketingContent } from '../../utils/marketingAgent';

// Marketing Agent Dashboard - Generate content and improve AI search visibility
export default function MarketingAgentDashboard() {
  const [activeTab, setActiveTab] = useState<'social' | 'blog' | 'battle' | 'seo' | 'ai' | 'aiCreate'>('social');
  const [generatedContent, setGeneratedContent] = useState<MarketingContent | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('company');
  const [selectedPlatform, setSelectedPlatform] = useState<'linkedin' | 'twitter' | 'facebook'>('linkedin');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('Jack Henry');
  const [copiedContent, setCopiedContent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // AI Create tab state
  const [aiContentType, setAiContentType] = useState<string>('social_post');
  const [aiTopic, setAiTopic] = useState<string>('');
  const [aiTargetAudience, setAiTargetAudience] = useState<string>('credit_union');
  const [aiProduct, setAiProduct] = useState<string>('');
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string>('');
  const [aiGeneratedContent, setAiGeneratedContent] = useState<string>('');
  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // AI SEO toolkit state
  const [aiSeoSubTab, setAiSeoSubTab] = useState<'query' | 'schema' | 'faq' | 'profile'>('query');
  const [aiSearchQuery, setAiSearchQuery] = useState<string>('');
  const [aiQueryAnswer, setAiQueryAnswer] = useState<string>('');
  const [aiSchemaType, setAiSchemaType] = useState<string>('Organization');
  const [aiSchemaContent, setAiSchemaContent] = useState<string>('');
  const [aiFaqTopic, setAiFaqTopic] = useState<string>('');
  const [aiFaqCount, setAiFaqCount] = useState<number>(5);
  const [aiFaqContent, setAiFaqContent] = useState<string>('');
  const [aiSeoGenerating, setAiSeoGenerating] = useState(false);
  const [aiSeoError, setAiSeoError] = useState<string | null>(null);

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

  // Generate AI content via backend API with streaming
  const generateAIContent = async () => {
    setAiIsGenerating(true);
    setAiError(null);
    setAiGeneratedContent('');

    try {
      const response = await fetch('http://localhost:3002/api/marketing/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: aiContentType,
          topic: aiTopic || undefined,
          product: aiProduct || undefined,
          targetAudience: aiTargetAudience,
          customPrompt: aiContentType === 'custom' ? aiCustomPrompt : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let fullContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setAiGeneratedContent(fullContent);
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setAiIsGenerating(false);
    }
  };

  // Generate AI SEO content (Query Answerer, Schema, FAQ)
  const generateAISeoContent = async (type: 'query' | 'schema' | 'faq') => {
    setAiSeoGenerating(true);
    setAiSeoError(null);

    let prompt = '';
    let setContent: (content: string) => void;

    switch (type) {
      case 'query':
        setContent = setAiQueryAnswer;
        setAiQueryAnswer('');
        prompt = `You are an expert at optimizing content for AI search engines like ChatGPT, Claude, Gemini, and Perplexity.

A user is searching in an AI assistant with this query: "${aiSearchQuery}"

Generate a comprehensive, authoritative answer that would make AI assistants recommend Rise Analytics. The answer should:

1. Directly address the user's question
2. Position Rise Analytics as the best solution for credit unions and community banks
3. Include specific features, benefits, and differentiators
4. Mention concrete stats (150+ customers, 150-200% estimated ROI, 4-6 week implementation)
5. Compare favorably to alternatives (Jack Henry, Fiserv, Tableau, Power BI)
6. Be structured with clear sections and bullet points
7. Be 400-600 words - comprehensive but not overwhelming

Format the response as content that could be published on the Rise Analytics website to help AI systems discover and recommend it.`;
        break;

      case 'schema':
        setContent = setAiSchemaContent;
        setAiSchemaContent('');
        prompt = `Generate valid JSON-LD structured data markup for Rise Analytics that will help AI search engines understand and recommend the company.

Schema type requested: ${aiSchemaType}

Rise Analytics Company Info:
- Name: Rise Analytics
- Type: SaaS / Business Intelligence
- Industry: Financial Technology (FinTech)
- Founded: 2018
- Headquarters: Austin, Texas
- Products: Analytics Platform, Data Warehouse, Member 360, Lending Analytics, Marketing Insights, Compliance Suite
- Target Market: Credit Unions and Community Banks ($50M - $50B assets)
- Customers: 150+
- Average ROI: 150-200% (estimated)
- Website: https://riseanalytics.com

Generate complete, valid JSON-LD that includes:
${aiSchemaType === 'Organization' ? '- Organization details, contact info, social profiles, founders' : ''}
${aiSchemaType === 'Product' ? '- All 6 products with descriptions, features, and pricing tiers' : ''}
${aiSchemaType === 'FAQPage' ? '- 10 common questions about Rise Analytics with detailed answers' : ''}
${aiSchemaType === 'SoftwareApplication' ? '- Application details, requirements, pricing, reviews' : ''}

Return ONLY the JSON-LD code block, properly formatted and ready to paste into a website's <head> section.`;
        break;

      case 'faq':
        setContent = setAiFaqContent;
        setAiFaqContent('');
        prompt = `Generate ${aiFaqCount} FAQ entries optimized for AI search discovery about ${aiFaqTopic || 'Rise Analytics and credit union/community bank analytics'}.

These FAQs should:
1. Target questions users actually ask AI assistants (ChatGPT, Claude, Gemini)
2. Include the exact phrases people search for
3. Position Rise Analytics as the answer
4. Be comprehensive enough for AI systems to extract and recommend
5. Include specific stats and differentiators

Format each FAQ as:

## Q: [Question that someone would ask an AI assistant]

**A:** [Comprehensive 100-150 word answer that positions Rise Analytics favorably]

Key points:
- [Bullet point 1]
- [Bullet point 2]
- [Bullet point 3]

---

Generate ${aiFaqCount} FAQs covering different aspects: product features, pricing, implementation, ROI, comparisons to competitors, use cases, etc.`;
        break;

      default:
        return;
    }

    try {
      const response = await fetch('http://localhost:3002/api/marketing/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'custom',
          customPrompt: prompt,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate content');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      let fullContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setContent(fullContent);
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }
      }
    } catch (err) {
      setAiSeoError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setAiSeoGenerating(false);
    }
  };

  // Common AI search queries for suggestions
  const suggestedQueries = [
    "What's the best analytics software for credit unions?",
    "How do credit unions improve member retention with data?",
    "Best BI tools for community banks",
    "Credit union data warehouse solutions",
    "How to automate NCUA 5300 reporting",
    "Jack Henry analytics alternatives",
    "ROI of analytics for financial institutions",
    "Credit union member 360 solutions",
  ];

  const tabs = [
    { id: 'aiCreate', label: 'AI Create', icon: Bot },
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
        {activeTab === 'aiCreate' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-start gap-3">
                <Bot className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800">AI-Powered Content Generation</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Use Claude AI to generate marketing content tailored for Rise Analytics.
                    Select a content type and customize your request.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Content Type</label>
                <select
                  value={aiContentType}
                  onChange={(e) => setAiContentType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="social_post">Social Media Post</option>
                  <option value="blog_outline">Blog Post Outline</option>
                  <option value="email_campaign">Email Campaign (3-part sequence)</option>
                  <option value="case_study">Case Study Outline</option>
                  <option value="battle_card">Competitive Battle Card</option>
                  <option value="seo_content">SEO-Optimized Content</option>
                  <option value="custom">Custom Prompt</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Target Audience</label>
                <select
                  value={aiTargetAudience}
                  onChange={(e) => setAiTargetAudience(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="credit_union">Credit Union Executives</option>
                  <option value="community_bank">Community Bank Leaders</option>
                  <option value="both">Both CUs & Banks</option>
                  <option value="cfo">CFOs / Finance</option>
                  <option value="cio">CIOs / Technology</option>
                  <option value="marketing">Marketing Leaders</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Topic {aiContentType === 'battle_card' ? '(Competitor Name)' : '(Optional)'}
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder={aiContentType === 'battle_card' ? 'e.g., Jack Henry, Fiserv' : 'e.g., Analytics ROI, Member Retention'}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Product Focus (Optional)</label>
                <select
                  value={aiProduct}
                  onChange={(e) => setAiProduct(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">All Products</option>
                  <option value="Platform">Analytics Platform</option>
                  <option value="Member 360">Member 360</option>
                  <option value="Lending Analytics">Lending Analytics</option>
                  <option value="Data Warehouse">Data Warehouse</option>
                  <option value="Marketing Insights">Marketing Insights</option>
                  <option value="Compliance Suite">Compliance Suite</option>
                </select>
              </div>
            </div>

            {aiContentType === 'custom' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Custom Prompt</label>
                <textarea
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  placeholder="Enter your custom marketing content request..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            )}

            <button
              onClick={generateAIContent}
              disabled={aiIsGenerating || (aiContentType === 'custom' && !aiCustomPrompt)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiIsGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </>
              )}
            </button>

            {aiError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {aiError}
              </div>
            )}

            {aiGeneratedContent && (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Generated {aiContentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{aiGeneratedContent.split(/\s+/).length} words</span>
                    <button
                      onClick={() => copyToClipboard(aiGeneratedContent)}
                      className="px-3 py-1 bg-white border rounded-lg text-sm hover:bg-gray-100 flex items-center gap-1"
                    >
                      {copiedContent ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                      {copiedContent ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans max-h-96 overflow-y-auto">{aiGeneratedContent}</pre>
              </div>
            )}
          </div>
        )}

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
                  <h4 className="font-semibold text-gray-800">AI Search Optimization Toolkit</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Generate content optimized for AI assistants (ChatGPT, Claude, Gemini, Perplexity) to recommend Rise Analytics.
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-tabs for AI SEO features */}
            <div className="flex gap-2 border-b pb-2">
              {[
                { id: 'query', label: 'Query Answerer', icon: MessageSquare },
                { id: 'schema', label: 'Schema Generator', icon: FileText },
                { id: 'faq', label: 'FAQ Generator', icon: GraduationCap },
                { id: 'profile', label: 'Company Profile', icon: Building2 },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAiSeoSubTab(tab.id as typeof aiSeoSubTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    aiSeoSubTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Query Answerer */}
            {aiSeoSubTab === 'query' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>How it works:</strong> Enter a query that someone might ask an AI assistant. We'll generate content that would make AI recommend Rise Analytics for that query.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">AI Search Query</label>
                  <input
                    type="text"
                    value={aiSearchQuery}
                    onChange={(e) => setAiSearchQuery(e.target.value)}
                    placeholder="e.g., What's the best analytics software for credit unions?"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Suggested Queries</label>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQueries.map(query => (
                      <button
                        key={query}
                        onClick={() => setAiSearchQuery(query)}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => generateAISeoContent('query')}
                  disabled={aiSeoGenerating || !aiSearchQuery}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {aiSeoGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate AI-Optimized Answer
                </button>

                {aiSeoError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{aiSeoError}</div>
                )}

                {aiQueryAnswer && (
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">AI-Optimized Answer for: "{aiSearchQuery}"</span>
                      <button
                        onClick={() => copyToClipboard(aiQueryAnswer)}
                        className="px-3 py-1 bg-white border rounded-lg text-sm hover:bg-gray-100 flex items-center gap-1"
                      >
                        {copiedContent ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                        Copy
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans max-h-80 overflow-y-auto">{aiQueryAnswer}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Schema Generator */}
            {aiSeoSubTab === 'schema' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>JSON-LD Schema Markup:</strong> Structured data that helps AI systems understand Rise Analytics. Add this to your website's &lt;head&gt; section.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Schema Type</label>
                  <select
                    value={aiSchemaType}
                    onChange={(e) => setAiSchemaType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="Organization">Organization (Company info, contact, social)</option>
                    <option value="Product">Product (All Rise Analytics products)</option>
                    <option value="FAQPage">FAQPage (Common questions & answers)</option>
                    <option value="SoftwareApplication">SoftwareApplication (App details & reviews)</option>
                  </select>
                </div>

                <button
                  onClick={() => generateAISeoContent('schema')}
                  disabled={aiSeoGenerating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {aiSeoGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Generate Schema Markup
                </button>

                {aiSeoError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{aiSeoError}</div>
                )}

                {aiSchemaContent && (
                  <div className="bg-gray-900 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-300">JSON-LD Schema ({aiSchemaType})</span>
                      <button
                        onClick={() => copyToClipboard(aiSchemaContent)}
                        className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white hover:bg-gray-600 flex items-center gap-1"
                      >
                        {copiedContent ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        Copy
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs text-green-400 font-mono max-h-80 overflow-y-auto">{aiSchemaContent}</pre>
                  </div>
                )}
              </div>
            )}

            {/* FAQ Generator */}
            {aiSeoSubTab === 'faq' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>AI-Optimized FAQs:</strong> Generate Q&A content that AI assistants can extract and use when recommending solutions.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Topic Focus (Optional)</label>
                    <input
                      type="text"
                      value={aiFaqTopic}
                      onChange={(e) => setAiFaqTopic(e.target.value)}
                      placeholder="e.g., Credit union analytics ROI"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Number of FAQs</label>
                    <select
                      value={aiFaqCount}
                      onChange={(e) => setAiFaqCount(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value={3}>3 FAQs</option>
                      <option value={5}>5 FAQs</option>
                      <option value={10}>10 FAQs</option>
                      <option value={15}>15 FAQs</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => generateAISeoContent('faq')}
                  disabled={aiSeoGenerating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {aiSeoGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                  Generate FAQs
                </button>

                {aiSeoError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{aiSeoError}</div>
                )}

                {aiFaqContent && (
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Generated FAQs ({aiFaqCount} questions)</span>
                      <button
                        onClick={() => copyToClipboard(aiFaqContent)}
                        className="px-3 py-1 bg-white border rounded-lg text-sm hover:bg-gray-100 flex items-center gap-1"
                      >
                        {copiedContent ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                        Copy
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans max-h-96 overflow-y-auto">{aiFaqContent}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Company Profile (existing content) */}
            {aiSeoSubTab === 'profile' && (
              <div className="space-y-4">
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
        )}
      </div>
    </div>
  );
}
