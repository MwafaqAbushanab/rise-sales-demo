import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initCallReportData, getCallReportForCU, getAllCallReportData, getCallReportMeta, refreshCallReportData } from './callReportService.js';
import { initContactService, getContactsForInstitution, searchContacts, enrichInstitutionContacts, getContactsStats } from './apolloContactService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// JSON file store for lead pipeline data
const DATA_DIR = join(__dirname, 'data');
const SALES_DATA_FILE = join(DATA_DIR, 'sales-data.json');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

function readSalesData() {
  if (!existsSync(SALES_DATA_FILE)) return {};
  try {
    return JSON.parse(readFileSync(SALES_DATA_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeSalesData(data) {
  writeFileSync(SALES_DATA_FILE, JSON.stringify(data, null, 2));
}

// JSON file store for activities
const ACTIVITIES_FILE = join(DATA_DIR, 'activities.json');

function readActivities() {
  if (!existsSync(ACTIVITIES_FILE)) return {};
  try {
    return JSON.parse(readFileSync(ACTIVITIES_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeActivities(data) {
  writeFileSync(ACTIVITIES_FILE, JSON.stringify(data, null, 2));
}

function addActivity(leadId, activity) {
  const all = readActivities();
  if (!all[leadId]) all[leadId] = [];
  all[leadId].unshift(activity);
  writeActivities(all);
  return activity;
}

// =====================================================
// NCUA DATA CACHE
// =====================================================
const NCUA_CACHE_FILE = join(DATA_DIR, 'ncua-cache.json');
const NCUA_SEED_FILE = join(DATA_DIR, 'ncua-seed.json');
const NCUA_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const NCUA_ENDPOINTS = [
  'https://data.ncua.gov/resource/9k6a-5st2.json',
  'https://data.ncua.gov/resource/kp6f-mwpt.json',
  'https://data.ncua.gov/resource/7kii-a53n.json',
];

function readNcuaCache() {
  if (!existsSync(NCUA_CACHE_FILE)) return null;
  try {
    const cache = JSON.parse(readFileSync(NCUA_CACHE_FILE, 'utf-8'));
    if (Date.now() - cache.timestamp < NCUA_CACHE_TTL_MS) {
      return cache.data;
    }
  } catch { /* cache corrupted */ }
  return null;
}

function writeNcuaCache(data) {
  writeFileSync(NCUA_CACHE_FILE, JSON.stringify({ timestamp: Date.now(), data }, null, 2));
}

function readNcuaSeed() {
  if (!existsSync(NCUA_SEED_FILE)) return null;
  try {
    const seed = JSON.parse(readFileSync(NCUA_SEED_FILE, 'utf-8'));
    return seed.data || null;
  } catch { return null; }
}

async function fetchNcuaFromSource() {
  for (const endpoint of NCUA_ENDPOINTS) {
    try {
      const params = new URLSearchParams({
        '$limit': '10000',
        '$order': 'total_assets DESC',
      });
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) continue;
      const data = await response.json();
      if (data && data.length > 0) {
        console.log(`NCUA: fetched ${data.length} records from ${endpoint}`);
        return data;
      }
    } catch {
      continue;
    }
  }
  return null;
}

// =====================================================
// GROQ AI BACKEND (Llama 3.3 70B — free, fast)
// =====================================================
import Groq from 'groq-sdk';

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function aiGenerate(systemPrompt, userMessage, options = {}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...(options.history || []),
    { role: 'user', content: userMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    max_tokens: options.maxTokens || 2048,
    temperature: options.temperature || 0.7,
  });

  return completion.choices[0]?.message?.content || '';
}

async function aiStream(systemPrompt, userMessage, res, options = {}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...(options.history || []),
    { role: 'user', content: userMessage },
  ];

  const stream = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    max_tokens: options.maxTokens || 2048,
    temperature: options.temperature || 0.7,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
    }
    if (chunk.choices[0]?.finish_reason === 'stop') {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    }
  }
}

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Sales Agent System Prompt
const SALES_AGENT_SYSTEM_PROMPT = `You are an elite AI Sales Agent for Rise Analytics, a leading provider of data analytics and business intelligence solutions purpose-built for credit unions. We also serve community banks.

## Your Role
You are the ultimate sales support system, helping sales representatives close deals with credit unions (primary market) and community banks. You combine deep credit union industry knowledge with persuasive communication skills. Always lead with credit union expertise — use "members" (not "customers") as the default terminology unless the prospect is specifically a community bank.

## Rise Analytics Products
1. **Rise Analytics Platform** - Core BI and reporting platform built for credit unions
2. **Rise Data Warehouse** - Cloud data warehouse optimized for credit union core systems
3. **Rise Member 360** - Complete view of members across all touchpoints (accounts, loans, digital banking)
4. **Rise Lending Analytics** - Loan portfolio analysis and risk management
5. **Rise Marketing Insights** - Campaign performance and member targeting
6. **Rise Compliance Suite** - NCUA regulatory reporting and audit trails

## Pricing Tiers
- **Essential** ($2,500-$15,000/month): Core dashboards, basic reports, email support
- **Professional** ($5,000-$35,000/month): Advanced analytics, custom dashboards, API access, priority support
- **Enterprise** ($10,000-$75,000/month): Full platform, dedicated success manager, custom integrations, SLA

## Your Capabilities
1. **Personalized Email Generation**: Write compelling, personalized outreach emails using the prospect's specific data
2. **Sales Strategy**: Provide tactical advice based on the prospect's profile, competitive landscape, and buying signals
3. **Objection Handling**: Help overcome common objections with data-backed responses
4. **ROI Articulation**: Explain value propositions tailored to the institution's size and needs
5. **Competitive Positioning**: Provide battle cards and differentiation strategies against competitors
6. **Demo Preparation**: Create customized demo scripts and talking points
7. **Follow-up Strategy**: Recommend optimal timing and messaging for follow-ups
8. **Qualification Analysis**: Assess lead quality using BANT (Budget, Authority, Need, Timeline) framework

## Communication Style
- Be confident but not arrogant
- Use data and specifics whenever possible
- Personalize everything based on the prospect's information
- Be concise and action-oriented
- Provide specific next steps
- Default to credit union terminology ("members", "share accounts", "NCUA") unless the prospect is explicitly a community bank
- When discussing the market, lead with credit union examples and data

## Key Differentiators vs Competitors
- **vs Jack Henry/Fiserv**: Modern cloud-native architecture, faster implementation, better UX
- **vs Tableau/Power BI**: Purpose-built for FIs, pre-built compliance reports, no data modeling required
- **vs Q2/Alkami**: Analytics-first vs digital banking, complementary not competitive
- **vs Spreadsheets**: Real-time data, single source of truth, audit trails

## Response Guidelines
1. Always acknowledge the specific prospect/lead context provided
2. Tailor all recommendations to their institution type and size — credit union context is the default
3. Include specific metrics and stats when possible
4. End with clear, actionable next steps
5. If asked to write an email, make it ready to send (not a template)
6. Use markdown formatting for readability
7. Reference credit union-specific challenges: member growth, digital transformation, competing with big banks, NCUA compliance, merging/consolidation trends

Remember: You're not just answering questions - you're actively helping close deals with credit unions. Be proactive, insightful, and always focused on moving the sale forward. Rise Analytics is the credit union intelligence platform.`;

// Build context string from lead data (shared helper)
function buildLeadContext(leadContext) {
  if (!leadContext) return '';
  let ctx = `
## Current Prospect Context
- **Institution**: ${leadContext.name}
- **Type**: ${leadContext.type}
- **Location**: ${leadContext.city}, ${leadContext.state}
- **Assets**: $${(leadContext.assets / 1000000000).toFixed(2)}B
- **${leadContext.type === 'Credit Union' ? 'Members' : 'Customers'}**: ${leadContext.members?.toLocaleString() || 'Unknown'}
- **Lead Score**: ${leadContext.score}/100
- **Status**: ${leadContext.status}
- **Recommended Products**: ${leadContext.recommendedProducts?.join(', ') || 'Not determined'}
`;

  if (leadContext.intelligence) {
    ctx += `
## Prospect Intelligence
- **Opportunity Tier**: ${leadContext.intelligence.opportunityTier} (${leadContext.intelligence.opportunityScore}/100)
- **Deal Size Estimate**: ${leadContext.intelligence.dealSizeEstimate}
- **Key Talking Points**: ${leadContext.intelligence.keyTalkingPoints?.slice(0, 3).join('; ') || 'None'}
- **Potential Challenges**: ${leadContext.intelligence.potentialChallenges?.slice(0, 2).join('; ') || 'None'}
- **Recommended Approach**: ${leadContext.intelligence.recommendedApproach || 'Standard'}
`;
  }

  if (leadContext.competitiveIntel) {
    ctx += `
## Competitive Landscape
- **Likely Current Vendors**: ${leadContext.competitiveIntel.currentVendors?.slice(0, 3).map(v => v.competitor?.name).join(', ') || 'Unknown'}
- **Displacement Difficulty**: ${leadContext.competitiveIntel.displacementDifficulty}/10
- **Switching Cost**: ${leadContext.competitiveIntel.switchingCost}
- **Win-Back Strategy**: ${leadContext.competitiveIntel.winBackStrategy || 'Standard approach'}
`;
  }

  if (leadContext.roiProjection) {
    ctx += `
## ROI Projection
- **Annual ROI**: ${leadContext.roiProjection.annualROI}%
- **Payback Period**: ${leadContext.roiProjection.paybackMonths} months
- **Total Annual Benefit**: $${(leadContext.roiProjection.totalAnnualBenefit / 1000).toFixed(0)}K
- **3-Year Value**: $${(leadContext.roiProjection.threeYearValue / 1000000).toFixed(2)}M
`;
  }

  // Enrich with NCUA 5300 Call Report data if available
  if (leadContext.type === 'Credit Union' && leadContext.certNumber) {
    const crData = getCallReportForCU(leadContext.certNumber);
    if (crData && crData.latestQuarter) {
      const q = crData.latestQuarter;
      ctx += `
## Real Financial Metrics (NCUA 5300 Call Report, ${q.cycleDate})
- **Delinquency Ratio**: ${(q.delinquencyRatio * 100).toFixed(2)}%
- **Net Charge-Off Ratio**: ${(q.netChargeOffRatio * 100).toFixed(2)}%
- **Net Worth Ratio**: ${q.netWorthRatio.toFixed(2)}% ${q.netWorthRatio >= 7 ? '(well-capitalized)' : q.netWorthRatio >= 5 ? '(adequately capitalized)' : '(UNDERCAPITALIZED)'}
- **CECL Reserves**: $${(q.allowanceForLoanLosses / 1000000).toFixed(1)}M (Coverage: ${q.coverageRatio.toFixed(1)}x)
- **Efficiency Ratio**: ${q.efficiencyRatio.toFixed(1)}%
- **Members**: ${q.currentMembers.toLocaleString()} (Potential: ${q.potentialMembers.toLocaleString()})
- **Loan Mix**: RE ${q.loanComposition.realEstate}% | Auto ${q.loanComposition.auto}% | Cards ${q.loanComposition.creditCard}% | Commercial ${q.loanComposition.commercial}%
`;
      if (crData.trends) {
        const t = crData.trends;
        ctx += `
## Quarter-over-Quarter Trends (from 5300 data)
- Delinquency: ${t.delinquencyChange > 0 ? '+' : ''}${t.delinquencyChange}bp
- Net Worth: ${t.netWorthRatioChange > 0 ? '+' : ''}${t.netWorthRatioChange}bp
- Member Growth: ${t.memberGrowthRate > 0 ? '+' : ''}${t.memberGrowthRate}%
- Asset Growth: ${t.assetGrowthRate > 0 ? '+' : ''}${t.assetGrowthRate}%
- Loan Growth: ${t.loanGrowthRate > 0 ? '+' : ''}${t.loanGrowthRate}%
`;
      }
    }
  }

  // Add decision maker contacts if available
  if (leadContext.id) {
    const contactData = getContactsForInstitution(leadContext.id);
    if (contactData && contactData.decisionMakers.length > 0) {
      const enriched = contactData.decisionMakers.filter(dm => dm.email);
      ctx += `
## Decision Makers (${contactData.decisionMakers.length} found, ${enriched.length} with verified email)
`;
      contactData.decisionMakers.slice(0, 5).forEach(dm => {
        ctx += `- **${dm.fullName}** — ${dm.title} (${dm.seniority})${dm.email ? ` | ${dm.email}` : ''}${dm.linkedinUrl ? ` | LinkedIn` : ''}\n`;
      });
    }
  }

  return ctx;
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, leadContext, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const contextMessage = buildLeadContext(leadContext);
    const userMessage = contextMessage ? `${contextMessage}\n\n---\n\n**User Request**: ${message}` : message;

    const history = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const assistantMessage = await aiGenerate(SALES_AGENT_SYSTEM_PROMPT, userMessage, { history });

    res.json({
      message: assistantMessage,
      usage: { input_tokens: 0, output_tokens: 0 }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      details: error.message
    });
  }
});

// Streaming chat endpoint for better UX
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { message, leadContext, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const contextMessage = buildLeadContext(leadContext);
    const userMessage = contextMessage ? `${contextMessage}\n\n---\n\n**User Request**: ${message}` : message;

    const history = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    await aiStream(SALES_AGENT_SYSTEM_PROMPT, userMessage, res, { history });
    res.end();

  } catch (error) {
    console.error('Stream API error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Generate specific content types
app.post('/api/generate/email', async (req, res) => {
  try {
    const { leadContext, emailType, customInstructions } = req.body;

    if (!leadContext) {
      return res.status(400).json({ error: 'Lead context is required' });
    }

    const emailPrompt = `Generate a ${emailType || 'cold outreach'} email for this prospect.

## Prospect Details
- **Institution**: ${leadContext.name}
- **Type**: ${leadContext.type}
- **Location**: ${leadContext.city}, ${leadContext.state}
- **Assets**: $${(leadContext.assets / 1000000000).toFixed(2)}B
- **${leadContext.type === 'Credit Union' ? 'Members' : 'Customers'}**: ${leadContext.members?.toLocaleString() || 'Unknown'}

${customInstructions ? `\n## Additional Instructions\n${customInstructions}` : ''}

Write a compelling, personalized email that:
1. Has a specific, intriguing subject line
2. Opens with something relevant to THEM (not about Rise)
3. Clearly articulates value specific to their institution size
4. Includes a soft but clear call-to-action
5. Is concise (under 150 words for body)

Format as:
**Subject:** [subject line]

[email body]

**CTA:** [what you want them to do next]`;

    const content = await aiGenerate(SALES_AGENT_SYSTEM_PROMPT, emailPrompt, { maxTokens: 1024 });

    res.json({
      email: content,
      usage: { input_tokens: 0, output_tokens: 0 }
    });

  } catch (error) {
    console.error('Email generation error:', error);
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

// =====================================================
// MARKETING AGENT ENDPOINTS
// =====================================================

const MARKETING_AGENT_SYSTEM_PROMPT = `You are an expert marketing content creator for Rise Analytics, the leading data analytics and business intelligence platform built for credit unions. We also serve community banks.

## Your Role
You create compelling, SEO-optimized marketing content that helps Rise Analytics:
1. Appear in AI search results when credit union leaders search for analytics solutions
2. Generate leads through valuable credit union-focused content marketing
3. Position Rise Analytics as THE credit union analytics platform
4. Build thought leadership in credit union data intelligence

## Rise Analytics Key Facts
- Founded: 2018, Austin Texas
- Customers: 150+ credit unions and community banks (predominantly credit unions)
- Products: Analytics Platform, Data Warehouse, Member 360, Lending Analytics, Marketing Insights, Compliance Suite
- Average ROI: 150-200% (estimated based on customer averages)
- Average payback: 4-6 months (estimated)
- Go-live time: 4-6 weeks (vs 6-12 months for competitors)

## Target Keywords
Primary: credit union analytics, credit union data analytics, credit union business intelligence, credit union reporting software
Secondary: credit union dashboard, member analytics, loan portfolio analytics, CECL compliance software, NCUA reporting

## Competitive Positioning
- vs Jack Henry/Fiserv: Modern cloud-native, faster implementation, better UX
- vs Tableau/Power BI: Purpose-built for FIs, pre-built compliance reports, no data modeling
- vs Q2/Alkami: Analytics-first vs digital banking, complementary

## Content Guidelines
1. Always use specific data and metrics
2. Speak to credit union pain points: manual reporting, data silos, member attrition, NCUA compliance, competing with big banks
3. Default to "members" terminology — only use "customers" when specifically writing for community banks
4. Include clear calls to action
5. Optimize for SEO with natural keyword integration around credit union analytics
6. Make content shareable and engaging
7. Reference credit union-specific trends: consolidation, digital transformation, Gen Z member acquisition, embedded analytics`;

// Generate marketing content with AI
app.post('/api/marketing/generate', async (req, res) => {
  try {
    const { contentType, topic, product, targetAudience, tone, customPrompt } = req.body;

    if (!contentType) {
      return res.status(400).json({ error: 'Content type is required' });
    }

    let prompt = '';

    switch (contentType) {
      case 'social_post':
        prompt = `Generate a ${targetAudience || 'credit union'} focused LinkedIn post about ${topic || 'Rise Analytics'}.

Requirements:
- 150-200 words
- Include 3-5 relevant hashtags
- Use specific stats and data points
- Include a soft call-to-action
- Make it engaging and shareable
${product ? `- Focus on Rise ${product} product` : ''}
${tone ? `- Tone should be ${tone}` : ''}

Format: Return just the post content ready to copy/paste.`;
        break;

      case 'blog_outline':
        prompt = `Create a detailed blog post outline about "${topic || 'Analytics ROI for Credit Unions'}".

Requirements:
- Target audience: ${targetAudience || 'credit union executives'}
- Include SEO-optimized title
- 5-7 main sections with subsections
- Word count target: 2000 words
- Include suggested internal links to Rise Analytics products
- Add meta description (150 chars)
- Include 3 suggested images/graphics

Format: Structured markdown outline with all elements.`;
        break;

      case 'email_campaign':
        prompt = `Write a ${topic || 'cold outreach'} email sequence for ${targetAudience || 'credit union CFOs'}.

Requirements:
- 3-email sequence (initial, follow-up, breakup)
- Each email under 150 words
- Personalization tokens indicated with [brackets]
- Clear value proposition
- Soft calls-to-action
- Subject lines included

Format: All 3 emails with subject lines, clearly separated.`;
        break;

      case 'case_study':
        prompt = `Write a case study outline for a ${targetAudience || 'mid-sized credit union'} implementing ${product || 'Rise Analytics Platform'}.

Requirements:
- Follow challenge/solution/results format
- Include specific (hypothetical but realistic) metrics
- Add customer quote placeholders
- ROI calculation section
- Implementation timeline
- Key takeaways section

Format: Full case study outline ready for content team to fill in.`;
        break;

      case 'battle_card':
        prompt = `Create a competitive battle card for Rise Analytics vs ${topic || 'Jack Henry'}.

Requirements:
- Competitor overview (2-3 sentences)
- Their top 5 weaknesses
- Our top 5 advantages against them
- 3 common objections and responses
- 5 discovery questions to ask prospects
- Proof points and stats

Format: Structured battle card ready for sales team.`;
        break;

      case 'seo_content':
        prompt = `Generate SEO-optimized content about "${topic || 'credit union analytics'}".

Requirements:
- Target keyword: ${topic || 'credit union analytics'}
- Include H1, H2, H3 structure
- Natural keyword density (1-2%)
- Include internal link suggestions
- Meta title and description
- FAQ section with 5 questions
- 1000-1500 words

Format: Full SEO content piece with all elements marked.`;
        break;

      default:
        prompt = customPrompt || `Generate marketing content about Rise Analytics for credit unions.`;
    }

    const content = await aiGenerate(MARKETING_AGENT_SYSTEM_PROMPT, prompt, { maxTokens: 4096 });

    res.json({
      content,
      contentType,
      metadata: {
        wordCount: content.split(/\s+/).length,
        generatedAt: new Date().toISOString(),
      },
      usage: { input_tokens: 0, output_tokens: 0 }
    });

  } catch (error) {
    console.error('Marketing content generation error:', error);
    res.status(500).json({ error: 'Failed to generate marketing content' });
  }
});

// Stream marketing content generation
app.post('/api/marketing/generate/stream', async (req, res) => {
  try {
    const { contentType, topic, product, targetAudience, customPrompt } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const prompt = customPrompt || `Generate ${contentType || 'marketing'} content about ${topic || 'Rise Analytics'} for ${targetAudience || 'credit unions'}${product ? `, focusing on ${product}` : ''}.`;

    await aiStream(MARKETING_AGENT_SYSTEM_PROMPT, prompt, res, { maxTokens: 4096 });
    res.end();

  } catch (error) {
    console.error('Marketing stream error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Get Rise Analytics company profile (for AI discovery)
app.get('/api/marketing/company-profile', (req, res) => {
  res.json({
    company: {
      name: 'Rise Analytics',
      tagline: 'The Credit Union Intelligence Platform',
      founded: 2018,
      headquarters: 'Austin, Texas',
      website: 'https://riseanalytics.com',
      customers: '150+ credit unions and community banks (primarily credit unions)',
      averageROI: '150-200% (estimated)',
      averagePayback: '4-6 months (estimated)',
    },
    products: [
      { name: 'Rise Analytics Platform', category: 'Business Intelligence', price: '$2,500-$75,000/mo' },
      { name: 'Rise Data Warehouse', category: 'Data Infrastructure', price: '$5,000-$25,000/mo' },
      { name: 'Rise Member 360', category: 'Member Intelligence', price: '$3,000-$20,000/mo' },
      { name: 'Rise Lending Analytics', category: 'Risk Management', price: '$4,000-$30,000/mo' },
      { name: 'Rise Marketing Insights', category: 'Marketing Analytics', price: '$2,000-$12,000/mo' },
      { name: 'Rise Compliance Suite', category: 'Regulatory Compliance', price: '$3,000-$18,000/mo' },
    ],
    targetMarket: {
      primary: 'Credit Unions',
      secondary: 'Community Banks',
      assetRange: '$50M - $50B',
      geography: 'United States',
    },
    differentiators: [
      'Purpose-built for credit unions',
      'Go-live in 4-6 weeks',
      'No data engineering required',
      'Pre-built NCUA compliance reports',
      'Integrates with all major CU core systems',
    ],
  });
});

// Get SEO keywords
app.get('/api/marketing/seo-keywords', (req, res) => {
  res.json({
    primary: [
      'credit union analytics',
      'community bank business intelligence',
      'credit union data analytics',
      'financial institution reporting software',
    ],
    secondary: [
      'credit union dashboard software',
      'bank loan portfolio analytics',
      'member attrition prediction',
      'CECL compliance software',
    ],
    longTail: [
      'best analytics software for credit unions',
      'how to reduce credit union member attrition',
      'credit union digital transformation tools',
      'ROI of business intelligence for credit unions',
    ],
  });
});

// =====================================================
// DEAL COACHING ENDPOINTS
// =====================================================

const DEAL_COACHING_SYSTEM_PROMPT = `You are an expert B2B sales coach specializing in selling analytics software to credit unions (primary market) and community banks.

Your role is to provide real-time coaching advice to sales representatives based on specific deal situations. Default to credit union context and terminology ("members", "board of directors", "NCUA") unless the deal is specifically with a community bank.

## Your Expertise
- Enterprise and SMB sales cycles for credit unions and financial institutions
- BANT qualification methodology for credit union procurement
- Objection handling with data-driven responses specific to CU budgets and governance
- Competitive positioning against Jack Henry, Fiserv, Tableau, Power BI
- Building ROI business cases for CU CFOs and volunteer boards
- Multi-stakeholder CU sales processes (CEO, CFO, VP of IT, Board)

## Rise Analytics Context
- Products: Analytics Platform, Data Warehouse, Member 360, Lending Analytics, Marketing Insights, Compliance Suite
- Primary market: Credit unions ($100M-$50B in assets)
- Pricing: $2,500-$75,000/month depending on asset size
- Implementation: 4-6 weeks (vs 6-12 months for competitors)
- Average ROI: 150-200% (estimated), payback in 4-6 months

## Coaching Style
- Be direct and actionable
- Provide specific talk tracks and email templates
- Reference data and proof points
- Focus on moving the deal forward
- Identify risks early and suggest mitigation
- Always tie recommendations to revenue impact`;

// Generate AI-powered deal coaching
app.post('/api/coaching/advice', async (req, res) => {
  try {
    const { situation, leadContext, dealStage, specificQuestion } = req.body;

    if (!situation && !specificQuestion) {
      return res.status(400).json({ error: 'Situation or question is required' });
    }

    let prompt = '';

    if (leadContext) {
      prompt += `## Current Deal Context
- Institution: ${leadContext.name}
- Type: ${leadContext.type}
- Assets: $${(leadContext.assets / 1000000000).toFixed(2)}B
- Deal Stage: ${dealStage || leadContext.status || 'Unknown'}
${leadContext.intelligence ? `- Opportunity Score: ${leadContext.intelligence.opportunityScore}/100` : ''}
${leadContext.roiProjection ? `- Potential Annual Value: $${(leadContext.roiProjection.totalAnnualBenefit / 1000).toFixed(0)}K` : ''}

`;
    }

    if (situation) {
      prompt += `## Situation
${situation}

`;
    }

    if (specificQuestion) {
      prompt += `## Sales Rep's Question
${specificQuestion}

`;
    }

    prompt += `Please provide:
1. Your assessment of the situation
2. Recommended next action (specific and actionable)
3. Talk track or email template if applicable
4. Potential risks to watch for
5. Impact on deal probability if executed well`;

    const content = await aiGenerate(DEAL_COACHING_SYSTEM_PROMPT, prompt);

    res.json({
      advice: content,
      dealStage,
      generatedAt: new Date().toISOString(),
      usage: { input_tokens: 0, output_tokens: 0 }
    });

  } catch (error) {
    console.error('Deal coaching error:', error);
    res.status(500).json({ error: 'Failed to generate coaching advice' });
  }
});

// Generate follow-up email sequence with AI
app.post('/api/coaching/follow-up-sequence', async (req, res) => {
  try {
    const { leadContext, dealStage, sequenceLength = 5, customContext } = req.body;

    if (!leadContext) {
      return res.status(400).json({ error: 'Lead context is required' });
    }

    const prompt = `Generate a ${sequenceLength}-email follow-up sequence for this prospect:

## Prospect Details
- Institution: ${leadContext.name}
- Type: ${leadContext.type}
- Assets: $${(leadContext.assets / 1000000000).toFixed(2)}B
- Current Stage: ${dealStage || 'New Lead'}
${customContext ? `- Additional Context: ${customContext}` : ''}

Create a multi-touch sequence with:
1. Varying subject lines optimized for open rates
2. Mix of value-add content, direct asks, and social proof
3. Specific timing recommendations (days between emails)
4. Clear CTA in each email
5. Personalization tokens marked with [BRACKETS]

Format each email as:
**Email X - Day Y: [PURPOSE]**
Subject: [subject line]

[email body]

---`;

    const content = await aiGenerate(DEAL_COACHING_SYSTEM_PROMPT, prompt, { maxTokens: 4096 });

    res.json({
      sequence: content,
      leadName: leadContext.name,
      sequenceLength,
      generatedAt: new Date().toISOString(),
      usage: { input_tokens: 0, output_tokens: 0 }
    });

  } catch (error) {
    console.error('Follow-up sequence error:', error);
    res.status(500).json({ error: 'Failed to generate follow-up sequence' });
  }
});

// Handle objection with AI
app.post('/api/coaching/handle-objection', async (req, res) => {
  try {
    const { objection, leadContext, additionalContext } = req.body;

    if (!objection) {
      return res.status(400).json({ error: 'Objection text is required' });
    }

    const prompt = `A prospect raised this objection:

"${objection}"

${leadContext ? `
## Prospect Context
- Institution: ${leadContext.name}
- Type: ${leadContext.type}
- Assets: $${(leadContext.assets / 1000000000).toFixed(2)}B
` : ''}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Provide:
1. **Category**: What type of objection is this? (price, timing, competition, need, authority, trust)
2. **Assessment**: What's really behind this objection?
3. **Response Framework**: How to acknowledge and respond
4. **Word-for-Word Response**: Exactly what to say
5. **Proof Points**: 2-3 data points to reinforce
6. **Follow-Up Question**: To keep the conversation going
7. **If They Push Back**: What to say if they're not convinced`;

    const content = await aiGenerate(DEAL_COACHING_SYSTEM_PROMPT, prompt);

    res.json({
      response: content,
      objection,
      generatedAt: new Date().toISOString(),
      usage: { input_tokens: 0, output_tokens: 0 }
    });

  } catch (error) {
    console.error('Objection handling error:', error);
    res.status(500).json({ error: 'Failed to generate objection response' });
  }
});

// Analyze deal health and provide recommendations
app.post('/api/coaching/deal-analysis', async (req, res) => {
  try {
    const { leadContext, dealHistory, currentChallenges } = req.body;

    if (!leadContext) {
      return res.status(400).json({ error: 'Lead context is required' });
    }

    const prompt = `Analyze this deal and provide strategic recommendations:

## Deal Overview
- Institution: ${leadContext.name}
- Type: ${leadContext.type}
- Assets: $${(leadContext.assets / 1000000000).toFixed(2)}B
- Current Stage: ${leadContext.status}
${leadContext.intelligence ? `- Opportunity Score: ${leadContext.intelligence.opportunityScore}/100
- Deal Size Estimate: ${leadContext.intelligence.dealSizeEstimate}` : ''}
${leadContext.roiProjection ? `- Potential ROI: ${leadContext.roiProjection.annualROI}%
- Annual Value: $${(leadContext.roiProjection.totalAnnualBenefit / 1000).toFixed(0)}K` : ''}

${dealHistory ? `## Deal History
${dealHistory}` : ''}

${currentChallenges ? `## Current Challenges
${currentChallenges}` : ''}

Provide a comprehensive deal analysis:

1. **Deal Health Score** (1-100) with justification
2. **Win Probability** (percentage) with factors
3. **Top 3 Risks** and mitigation strategies
4. **Top 3 Opportunities** to accelerate
5. **Recommended Next Actions** (prioritized list)
6. **Key Messages** to emphasize with this prospect
7. **Decision Timeline** prediction
8. **Resource Needs** (executive involvement, technical support, etc.)`;

    const content = await aiGenerate(DEAL_COACHING_SYSTEM_PROMPT, prompt, { maxTokens: 3000 });

    res.json({
      analysis: content,
      leadName: leadContext.name,
      generatedAt: new Date().toISOString(),
      usage: { input_tokens: 0, output_tokens: 0 }
    });

  } catch (error) {
    console.error('Deal analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze deal' });
  }
});

// =====================================================
// LEAD PERSISTENCE ENDPOINTS
// =====================================================

// Get all saved lead overrides
app.get('/api/leads', (req, res) => {
  const data = readSalesData();
  res.json(data);
});

// Save/update a single lead's sales data
app.put('/api/leads/:id', (req, res) => {
  const data = readSalesData();
  const oldData = data[req.params.id] || {};
  data[req.params.id] = { ...oldData, ...req.body, updatedAt: new Date().toISOString() };
  writeSalesData(data);

  // Auto-log status change as activity
  if (req.body.status && req.body.status !== oldData.status) {
    addActivity(req.params.id, {
      id: Date.now().toString(),
      leadId: req.params.id,
      type: 'status_change',
      description: `Status changed from ${oldData.status || 'new'} to ${req.body.status}`,
      timestamp: new Date().toISOString(),
      metadata: { from: oldData.status || 'new', to: req.body.status },
    });
  }

  res.json(data[req.params.id]);
});

// Bulk save lead overrides (for migration from localStorage)
app.post('/api/leads/bulk', (req, res) => {
  const existing = readSalesData();
  const updates = req.body;
  if (typeof updates !== 'object' || updates === null) {
    return res.status(400).json({ error: 'Body must be an object keyed by lead ID' });
  }
  for (const [id, fields] of Object.entries(updates)) {
    existing[id] = { ...existing[id], ...fields, updatedAt: new Date().toISOString() };
  }
  writeSalesData(existing);
  res.json({ saved: Object.keys(updates).length });
});

// Delete a lead's saved data
app.delete('/api/leads/:id', (req, res) => {
  const data = readSalesData();
  delete data[req.params.id];
  writeSalesData(data);
  res.json({ deleted: req.params.id });
});

// =====================================================
// ACTIVITY ENDPOINTS
// =====================================================

// Get activities for a lead
app.get('/api/leads/:id/activities', (req, res) => {
  const all = readActivities();
  res.json(all[req.params.id] || []);
});

// Add an activity for a lead
app.post('/api/leads/:id/activities', (req, res) => {
  const { type, description, metadata } = req.body;
  if (!type || !description) {
    return res.status(400).json({ error: 'type and description are required' });
  }
  const activity = {
    id: Date.now().toString(),
    leadId: req.params.id,
    type,
    description,
    timestamp: new Date().toISOString(),
    metadata: metadata || {},
  };
  addActivity(req.params.id, activity);

  // Update lastContact on the lead
  const data = readSalesData();
  data[req.params.id] = { ...data[req.params.id], lastContact: new Date().toISOString(), updatedAt: new Date().toISOString() };
  writeSalesData(data);

  res.json(activity);
});

// =====================================================
// NCUA CACHING PROXY
// =====================================================

// Helper: enrich NCUA data with 5300 Call Report data
function enrichWithCallReport(ncuaData) {
  return ncuaData.map(cu => {
    const cn = cu.cu_number || cu.cunumber || cu.charter_number || cu.CU_NUMBER;
    if (!cn) return cu;
    const cr = getCallReportForCU(cn);
    return cr ? { ...cu, callReport: cr } : cu;
  });
}

// Get cached NCUA data (returns cached if fresh, fetches if stale)
// Optional query: ?include=callReport to attach 5300 data to each CU
app.get('/api/ncua/credit-unions', async (req, res) => {
  const includeCallReport = req.query.include === 'callReport';

  // Try cache first
  const cached = readNcuaCache();
  if (cached) {
    const data = includeCallReport ? enrichWithCallReport(cached) : cached;
    return res.json({ data, source: 'cache' });
  }

  // Fetch fresh data
  const freshData = await fetchNcuaFromSource();
  if (freshData) {
    writeNcuaCache(freshData);
    const data = includeCallReport ? enrichWithCallReport(freshData) : freshData;
    return res.json({ data, source: 'live' });
  }

  // All sources failed — return stale cache if any exists
  if (existsSync(NCUA_CACHE_FILE)) {
    try {
      const stale = JSON.parse(readFileSync(NCUA_CACHE_FILE, 'utf-8'));
      const data = includeCallReport ? enrichWithCallReport(stale.data) : stale.data;
      return res.json({ data, source: 'stale-cache' });
    } catch { /* fall through */ }
  }

  // Try seed file as final fallback (generated by server/scripts/fetch-ncua-seed.js)
  const seedData = readNcuaSeed();
  if (seedData) {
    const data = includeCallReport ? enrichWithCallReport(seedData) : seedData;
    return res.json({ data, source: 'seed' });
  }

  res.status(503).json({ error: 'NCUA data unavailable' });
});

// Force refresh the NCUA cache
app.post('/api/ncua/refresh', async (req, res) => {
  const freshData = await fetchNcuaFromSource();
  if (freshData) {
    writeNcuaCache(freshData);
    return res.json({ refreshed: true, count: freshData.length });
  }
  res.status(503).json({ error: 'Failed to refresh NCUA data from all endpoints' });
});

// =====================================================
// FINANCIAL TRIGGER ALERTS
// =====================================================
const ALERTS_SNAPSHOT_FILE = join(DATA_DIR, 'alerts-snapshot.json');
const ALERTS_STATE_FILE = join(DATA_DIR, 'alerts-state.json');

function readAlertsSnapshot() {
  if (!existsSync(ALERTS_SNAPSHOT_FILE)) return null;
  try { return JSON.parse(readFileSync(ALERTS_SNAPSHOT_FILE, 'utf-8')); }
  catch { return null; }
}

function readAlertsState() {
  if (!existsSync(ALERTS_STATE_FILE)) return { dismissed: [], reviewed: [] };
  try { return JSON.parse(readFileSync(ALERTS_STATE_FILE, 'utf-8')); }
  catch { return { dismissed: [], reviewed: [] }; }
}

app.get('/api/alerts/snapshot', (req, res) => {
  const snapshot = readAlertsSnapshot();
  if (!snapshot) return res.status(404).json({ error: 'No snapshot found' });
  res.json(snapshot);
});

app.post('/api/alerts/snapshot', (req, res) => {
  const snapshot = req.body;
  if (!snapshot || !snapshot.timestamp || !snapshot.institutions) {
    return res.status(400).json({ error: 'Invalid snapshot format' });
  }
  writeFileSync(ALERTS_SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
  res.json({ saved: true, institutionCount: Object.keys(snapshot.institutions).length });
});

app.get('/api/alerts/state', (req, res) => {
  res.json(readAlertsState());
});

app.post('/api/alerts/:id/dismiss', (req, res) => {
  const state = readAlertsState();
  if (!state.dismissed.includes(req.params.id)) {
    state.dismissed.push(req.params.id);
  }
  writeFileSync(ALERTS_STATE_FILE, JSON.stringify(state, null, 2));
  res.json({ dismissed: req.params.id });
});

app.post('/api/alerts/:id/review', (req, res) => {
  const state = readAlertsState();
  if (!state.reviewed.includes(req.params.id)) {
    state.reviewed.push(req.params.id);
  }
  writeFileSync(ALERTS_STATE_FILE, JSON.stringify(state, null, 2));
  res.json({ reviewed: req.params.id });
});

// =====================================================
// NCUA 5300 CALL REPORT DATA
// =====================================================

app.get('/api/call-report/summary', (req, res) => {
  const meta = getCallReportMeta();
  if (!meta) return res.status(404).json({ error: 'No call report data available' });
  res.json(meta);
});

app.get('/api/call-report/:charterNumber', (req, res) => {
  const data = getCallReportForCU(req.params.charterNumber);
  if (!data) return res.status(404).json({ error: 'No call report data for this institution' });
  res.json(data);
});

app.post('/api/call-report/batch', (req, res) => {
  const { charterNumbers } = req.body || {};
  if (!Array.isArray(charterNumbers)) {
    return res.status(400).json({ error: 'charterNumbers must be an array' });
  }
  const results = {};
  for (const cn of charterNumbers) {
    const data = getCallReportForCU(cn);
    if (data) results[cn] = data;
  }
  res.json({ data: results, count: Object.keys(results).length });
});

app.post('/api/call-report/refresh', async (req, res) => {
  try {
    await refreshCallReportData();
    const meta = getCallReportMeta();
    res.json({ refreshed: true, meta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// APOLLO CONTACT ENRICHMENT ENDPOINTS
// =====================================================

// Get contact enrichment stats
app.get('/api/contacts/stats', (req, res) => {
  res.json(getContactsStats());
});

// Get contacts for a specific institution
app.get('/api/contacts/:institutionId', async (req, res) => {
  const { institutionId } = req.params;
  const configured = !!process.env.APOLLO_API_KEY;

  const data = getContactsForInstitution(institutionId);
  if (data) {
    return res.json({ data, configured, status: 'found' });
  }

  if (!configured) {
    return res.json({ data: null, configured: false, message: 'Contact enrichment not configured. Add APOLLO_API_KEY to server/.env' });
  }

  // Not found in cache — return null (client can trigger search)
  res.json({ data: null, configured: true, status: 'not_found' });
});

// Search for contacts at an institution (triggers Apollo People Search — FREE)
app.post('/api/contacts/search/:institutionId', async (req, res) => {
  const { institutionId } = req.params;
  const { companyName } = req.body;

  if (!process.env.APOLLO_API_KEY) {
    return res.status(400).json({ error: 'APOLLO_API_KEY not configured' });
  }
  if (!companyName) {
    return res.status(400).json({ error: 'companyName is required' });
  }

  try {
    const data = await searchContacts(companyName, institutionId);
    res.json({ data, configured: true, status: data.searchStatus });
  } catch (err) {
    console.error('[Apollo] Search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Enrich contacts for an institution (queues email enrichment — costs credits)
app.post('/api/contacts/enrich/:institutionId', async (req, res) => {
  if (!process.env.APOLLO_API_KEY) {
    return res.status(400).json({ error: 'APOLLO_API_KEY not configured' });
  }

  try {
    const result = await enrichInstitutionContacts(req.params.institutionId);
    res.json(result);
  } catch (err) {
    console.error('[Apollo] Enrichment error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), ai: 'groq', model: GROQ_MODEL });
});

app.listen(PORT, () => {
  console.log(`🚀 Rise AI Sales Agent server running on port ${PORT}`);
  console.log(`🤖 AI Backend: Groq (${GROQ_MODEL})`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📣 Marketing API: http://localhost:${PORT}/api/marketing/generate`);
  // Pre-warm the NCUA cache on startup
  const cached = readNcuaCache();
  if (!cached) {
    console.log('📥 Pre-warming NCUA cache...');
    fetchNcuaFromSource().then(data => {
      if (data) {
        writeNcuaCache(data);
        console.log(`✅ NCUA cache warmed: ${data.length} credit unions`);
      } else {
        console.log('⚠️ NCUA cache warm failed — will use sample data');
      }
    });
  } else {
    console.log(`✅ NCUA cache fresh (${cached.length} credit unions)`);
  }
  // Initialize NCUA 5300 Call Report data (seed or cached)
  initCallReportData();

  // Initialize Apollo contact enrichment (if API key is configured)
  // Pass top CUs by assets for background search
  const ncuaData = readNcuaCache() || readNcuaSeed();
  initContactService(ncuaData ? ncuaData.slice(0, 50) : []).catch(err => {
    console.warn('Apollo init warning:', err.message);
  });
});
