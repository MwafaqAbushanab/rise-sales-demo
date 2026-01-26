import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Sales Agent System Prompt
const SALES_AGENT_SYSTEM_PROMPT = `You are an elite AI Sales Agent for Rise Analytics, a leading provider of data analytics and business intelligence solutions for credit unions and community banks.

## Your Role
You are the ultimate sales support system, helping sales representatives close deals with financial institutions. You combine deep industry knowledge with persuasive communication skills.

## Rise Analytics Products
1. **Rise Analytics Platform** - Core BI and reporting platform
2. **Rise Data Warehouse** - Cloud data warehouse optimized for financial institutions
3. **Rise Member/Customer 360** - Complete view of members/customers across all touchpoints
4. **Rise Lending Analytics** - Loan portfolio analysis and risk management
5. **Rise Marketing Insights** - Campaign performance and member targeting
6. **Rise Compliance Suite** - Regulatory reporting and audit trails

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
- Use industry terminology appropriately (Credit Union: "members", Bank: "customers")

## Key Differentiators vs Competitors
- **vs Jack Henry/Fiserv**: Modern cloud-native architecture, faster implementation, better UX
- **vs Tableau/Power BI**: Purpose-built for FIs, pre-built compliance reports, no data modeling required
- **vs Q2/Alkami**: Analytics-first vs digital banking, complementary not competitive
- **vs Spreadsheets**: Real-time data, single source of truth, audit trails

## Response Guidelines
1. Always acknowledge the specific prospect/lead context provided
2. Tailor all recommendations to their institution type (CU vs Bank) and size
3. Include specific metrics and stats when possible
4. End with clear, actionable next steps
5. If asked to write an email, make it ready to send (not a template)
6. Use markdown formatting for readability

Remember: You're not just answering questions - you're actively helping close deals. Be proactive, insightful, and always focused on moving the sale forward.`;

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, leadContext, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build context message with lead data
    let contextMessage = '';
    if (leadContext) {
      contextMessage = `
## Current Prospect Context
- **Institution**: ${leadContext.name}
- **Type**: ${leadContext.type}
- **Location**: ${leadContext.city}, ${leadContext.state}
- **Assets**: $${(leadContext.assets / 1000000000).toFixed(2)}B
- **${leadContext.type === 'Credit Union' ? 'Members' : 'Customers'}**: ${leadContext.members?.toLocaleString() || 'Unknown'}
- **Lead Score**: ${leadContext.score}/100
- **Status**: ${leadContext.status}
- **Recommended Products**: ${leadContext.recommendedProducts?.join(', ') || 'Not determined'}

${leadContext.intelligence ? `
## Prospect Intelligence
- **Opportunity Tier**: ${leadContext.intelligence.opportunityTier} (${leadContext.intelligence.opportunityScore}/100)
- **Deal Size Estimate**: ${leadContext.intelligence.dealSizeEstimate}
- **Key Talking Points**: ${leadContext.intelligence.keyTalkingPoints?.slice(0, 3).join('; ') || 'None'}
- **Potential Challenges**: ${leadContext.intelligence.potentialChallenges?.slice(0, 2).join('; ') || 'None'}
- **Recommended Approach**: ${leadContext.intelligence.recommendedApproach || 'Standard'}
` : ''}

${leadContext.competitiveIntel ? `
## Competitive Landscape
- **Likely Current Vendors**: ${leadContext.competitiveIntel.currentVendors?.slice(0, 3).map(v => v.competitor?.name).join(', ') || 'Unknown'}
- **Displacement Difficulty**: ${leadContext.competitiveIntel.displacementDifficulty}/10
- **Switching Cost**: ${leadContext.competitiveIntel.switchingCost}
- **Win-Back Strategy**: ${leadContext.competitiveIntel.winBackStrategy || 'Standard approach'}
` : ''}

${leadContext.roiProjection ? `
## ROI Projection
- **Annual ROI**: ${leadContext.roiProjection.annualROI}%
- **Payback Period**: ${leadContext.roiProjection.paybackMonths} months
- **Total Annual Benefit**: $${(leadContext.roiProjection.totalAnnualBenefit / 1000).toFixed(0)}K
- **3-Year Value**: $${(leadContext.roiProjection.threeYearValue / 1000000).toFixed(2)}M
` : ''}
`;
    }

    // Build messages array
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: contextMessage ? `${contextMessage}\n\n---\n\n**User Request**: ${message}` : message
      }
    ];

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SALES_AGENT_SYSTEM_PROMPT,
      messages: messages
    });

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : 'I apologize, but I encountered an issue generating a response.';

    res.json({
      message: assistantMessage,
      usage: response.usage
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

    // Build context message with lead data
    let contextMessage = '';
    if (leadContext) {
      contextMessage = `
## Current Prospect Context
- **Institution**: ${leadContext.name}
- **Type**: ${leadContext.type}
- **Location**: ${leadContext.city}, ${leadContext.state}
- **Assets**: $${(leadContext.assets / 1000000000).toFixed(2)}B
- **${leadContext.type === 'Credit Union' ? 'Members' : 'Customers'}**: ${leadContext.members?.toLocaleString() || 'Unknown'}
- **Lead Score**: ${leadContext.score}/100
- **Status**: ${leadContext.status}
- **Recommended Products**: ${leadContext.recommendedProducts?.join(', ') || 'Not determined'}

${leadContext.intelligence ? `
## Prospect Intelligence
- **Opportunity Tier**: ${leadContext.intelligence.opportunityTier} (${leadContext.intelligence.opportunityScore}/100)
- **Deal Size Estimate**: ${leadContext.intelligence.dealSizeEstimate}
- **Key Talking Points**: ${leadContext.intelligence.keyTalkingPoints?.slice(0, 3).join('; ') || 'None'}
- **Potential Challenges**: ${leadContext.intelligence.potentialChallenges?.slice(0, 2).join('; ') || 'None'}
` : ''}

${leadContext.competitiveIntel ? `
## Competitive Landscape
- **Likely Current Vendors**: ${leadContext.competitiveIntel.currentVendors?.slice(0, 3).map(v => v.competitor?.name).join(', ') || 'Unknown'}
- **Displacement Difficulty**: ${leadContext.competitiveIntel.displacementDifficulty}/10
` : ''}

${leadContext.roiProjection ? `
## ROI Projection
- **Annual ROI**: ${leadContext.roiProjection.annualROI}%
- **Payback Period**: ${leadContext.roiProjection.paybackMonths} months
- **Total Annual Benefit**: $${(leadContext.roiProjection.totalAnnualBenefit / 1000).toFixed(0)}K
` : ''}
`;
    }

    // Build messages array
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: contextMessage ? `${contextMessage}\n\n---\n\n**User Request**: ${message}` : message
      }
    ];

    // Call Claude API with streaming
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SALES_AGENT_SYSTEM_PROMPT,
      messages: messages
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SALES_AGENT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: emailPrompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    res.json({
      email: content,
      usage: response.usage
    });

  } catch (error) {
    console.error('Email generation error:', error);
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

// =====================================================
// MARKETING AGENT ENDPOINTS
// =====================================================

const MARKETING_AGENT_SYSTEM_PROMPT = `You are an expert marketing content creator for Rise Analytics, a leading provider of data analytics and business intelligence solutions for credit unions and community banks.

## Your Role
You create compelling, SEO-optimized marketing content that helps Rise Analytics:
1. Appear in AI search results when users ask about credit union/bank analytics
2. Generate leads through valuable content marketing
3. Position Rise Analytics against competitors
4. Build thought leadership in the financial institution analytics space

## Rise Analytics Key Facts
- Founded: 2018, Austin Texas
- Customers: 150+ credit unions and community banks
- Products: Analytics Platform, Data Warehouse, Member 360, Lending Analytics, Marketing Insights, Compliance Suite
- Average ROI: 211%
- Average payback: 4.2 months
- Go-live time: 4-6 weeks (vs 6-12 months for competitors)

## Target Keywords
Primary: credit union analytics, community bank business intelligence, credit union data analytics, financial institution reporting software
Secondary: credit union dashboard, member analytics, loan portfolio analytics, CECL compliance software

## Competitive Positioning
- vs Jack Henry/Fiserv: Modern cloud-native, faster implementation, better UX
- vs Tableau/Power BI: Purpose-built for FIs, pre-built compliance reports, no data modeling
- vs Q2/Alkami: Analytics-first vs digital banking, complementary

## Content Guidelines
1. Always use specific data and metrics
2. Speak to pain points: manual reporting, data silos, slow decisions
3. Use proper terminology: "members" for CUs, "customers" for banks
4. Include clear calls to action
5. Optimize for SEO with natural keyword integration
6. Make content shareable and engaging`;

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
        prompt = `Generate a ${targetAudience || 'credit union and community bank'} focused LinkedIn post about ${topic || 'Rise Analytics'}.

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
        prompt = customPrompt || `Generate marketing content about Rise Analytics for credit unions and community banks.`;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: MARKETING_AGENT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    res.json({
      content,
      contentType,
      metadata: {
        wordCount: content.split(/\s+/).length,
        generatedAt: new Date().toISOString(),
      },
      usage: response.usage
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

    const prompt = customPrompt || `Generate ${contentType || 'marketing'} content about ${topic || 'Rise Analytics'} for ${targetAudience || 'credit unions and community banks'}${product ? `, focusing on ${product}` : ''}.`;

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: MARKETING_AGENT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
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
      tagline: 'Data Intelligence for Credit Unions & Community Banks',
      founded: 2018,
      headquarters: 'Austin, Texas',
      website: 'https://riseanalytics.com',
      customers: '150+ credit unions and community banks',
      averageROI: '211%',
      averagePayback: '4.2 months',
    },
    products: [
      { name: 'Rise Analytics Platform', category: 'Business Intelligence', price: '$2,500-$75,000/mo' },
      { name: 'Rise Data Warehouse', category: 'Data Infrastructure', price: '$5,000-$25,000/mo' },
      { name: 'Rise Member/Customer 360', category: 'Customer Intelligence', price: '$3,000-$20,000/mo' },
      { name: 'Rise Lending Analytics', category: 'Risk Management', price: '$4,000-$30,000/mo' },
      { name: 'Rise Marketing Insights', category: 'Marketing Analytics', price: '$2,000-$12,000/mo' },
      { name: 'Rise Compliance Suite', category: 'Regulatory Compliance', price: '$3,000-$18,000/mo' },
    ],
    targetMarket: {
      primary: ['Credit Unions', 'Community Banks'],
      assetRange: '$50M - $50B',
      geography: 'United States',
    },
    differentiators: [
      'Purpose-built for financial institutions',
      'Go-live in 4-6 weeks',
      'No data engineering required',
      'Pre-built compliance reports',
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

const DEAL_COACHING_SYSTEM_PROMPT = `You are an expert B2B sales coach specializing in selling analytics software to credit unions and community banks.

Your role is to provide real-time coaching advice to sales representatives based on specific deal situations.

## Your Expertise
- Enterprise and SMB sales cycles for financial institutions
- BANT qualification methodology
- Objection handling with data-driven responses
- Competitive positioning against Jack Henry, Fiserv, Tableau, Power BI
- Building ROI business cases for CFOs and boards
- Multi-stakeholder sales processes

## Rise Analytics Context
- Products: Analytics Platform, Data Warehouse, Member 360, Lending Analytics, Marketing Insights, Compliance Suite
- Pricing: $2,500-$75,000/month depending on size
- Implementation: 4-6 weeks (vs 6-12 months for competitors)
- Average ROI: 211%, payback in 4.2 months

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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: DEAL_COACHING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    res.json({
      advice: content,
      dealStage,
      generatedAt: new Date().toISOString(),
      usage: response.usage
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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: DEAL_COACHING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    res.json({
      sequence: content,
      leadName: leadContext.name,
      sequenceLength,
      generatedAt: new Date().toISOString(),
      usage: response.usage
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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: DEAL_COACHING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    res.json({
      response: content,
      objection,
      generatedAt: new Date().toISOString(),
      usage: response.usage
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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: DEAL_COACHING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    res.json({
      analysis: content,
      leadName: leadContext.name,
      generatedAt: new Date().toISOString(),
      usage: response.usage
    });

  } catch (error) {
    console.error('Deal analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze deal' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Rise AI Sales Agent server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📣 Marketing API: http://localhost:${PORT}/api/marketing/generate`);
});
