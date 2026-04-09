// Marketing Skills Data Module
// Structured framework knowledge extracted from marketingskills repo
// Source: https://github.com/coreyhaines31/marketingskills

// ─── COPYWRITING FRAMEWORKS ─────────────────────────────────────────────────

export const COPYWRITING_FRAMEWORKS = [
  {
    id: 'pas',
    name: 'PAS',
    fullName: 'Problem, Agitate, Solution',
    structure: ['Identify the pain point', 'Amplify consequences of inaction', 'Present your solution + soft CTA'],
    bestFor: 'Problem-aware but not solution-aware prospects',
    example: 'Credit unions still using spreadsheets for analytics? Every month without real-time insights means missed cross-sell opportunities and members leaving for fintechs. Rise Analytics gives you a complete member view in weeks, not months.',
  },
  {
    id: 'bab',
    name: 'BAB',
    fullName: 'Before, After, Bridge',
    structure: ['Current painful situation', 'Ideal future state', 'Your product as the bridge'],
    bestFor: 'Transformation-driven offers with clear before/after',
    example: 'Before: Your team spends 20+ hours monthly on manual NCUA reports. After: Automated compliance with one-click 5300 reporting. Bridge: Rise Analytics automates the entire process.',
  },
  {
    id: 'aida',
    name: 'AIDA',
    fullName: 'Attention, Interest, Desire, Action',
    structure: ['Hook with a compelling stat or question', 'Address a specific challenge', 'Add social proof or outcome', 'Clear call to action'],
    bestFor: 'Data-driven prospects, high-ticket pitches with strong stats',
    example: 'Credit unions using analytics see 150-200% ROI in year one. Your member data holds insights worth millions — but only if you can access them. 150+ credit unions already trust Rise Analytics. See what your data reveals — book a demo.',
  },
  {
    id: 'qvc',
    name: 'QVC',
    fullName: 'Question, Value, CTA',
    structure: ['Targeted pain question', 'Brief value proposition', 'Direct next step'],
    bestFor: 'C-suite prospects who prefer brevity',
    example: 'How much time does your team spend on manual reporting? Rise Analytics cuts it by 80%. Worth a 15-min call?',
  },
  {
    id: 'ppp',
    name: 'PPP',
    fullName: 'Praise, Picture, Push',
    structure: ['Genuine compliment about their work', 'Paint a picture of how things could be better', 'Gentle push to action'],
    bestFor: 'Senior prospects who respond to relationship-building',
    example: 'Your credit union\'s member growth has been impressive. Imagine pairing that growth with analytics that predict which members are at risk of leaving. Happy to show you how.',
  },
  {
    id: 'star-story',
    name: 'Star-Story-Solution',
    fullName: 'Star-Story-Solution',
    structure: ['Introduce the character (a customer like them)', 'Tell the challenge narrative', 'Reveal the results'],
    bestFor: 'Strong customer success stories that humanize the pitch',
    example: 'A $500M credit union in Ohio was losing members to fintech apps. They implemented Rise Analytics\' Member 360 — within 6 months, retention improved 23% and cross-sell revenue grew $1.2M.',
  },
  {
    id: 'scq',
    name: 'SCQ',
    fullName: 'Situation, Complication, Question',
    structure: ['Describe a situation they relate to', 'Introduce the complication', 'Ask an open question'],
    bestFor: 'Starting conversations, not closing them. Discovery-focused outreach',
    example: 'Most credit unions have more member data than ever. The complication? It\'s trapped in silos across core, lending, and marketing systems. How are you solving that today?',
  },
  {
    id: '4ps',
    name: '4Ps',
    fullName: 'Promise, Picture, Proof, Push',
    structure: ['Bold promise', 'Paint a vivid picture', 'Provide proof/evidence', 'Push to action'],
    bestFor: 'Landing pages and long-form sales content',
    example: 'Promise: Cut reporting time by 80%. Picture: Your team focused on strategy instead of spreadsheets. Proof: 150+ credit unions already made the switch. Push: See it live — book a demo.',
  },
];

// ─── COLD EMAIL FRAMEWORKS ──────────────────────────────────────────────────

export const COLD_EMAIL_FRAMEWORKS = [
  {
    id: 'pas',
    name: 'PAS',
    fullName: 'Problem, Agitate, Solution',
    structure: ['Identify pain', 'Amplify consequences', 'Present solution + soft CTA'],
    bestFor: 'Problem-aware but not solution-aware prospects',
  },
  {
    id: 'bab',
    name: 'BAB',
    fullName: 'Before, After, Bridge',
    structure: ['Current painful situation', 'Ideal future', 'Your product as the bridge'],
    bestFor: 'Transformation-driven offers with emotional decision-makers',
  },
  {
    id: 'qvc',
    name: 'QVC',
    fullName: 'Question, Value, CTA',
    structure: ['Targeted pain question', 'Brief value', 'Direct next step'],
    bestFor: 'C-suite prospects who prefer brevity. Keep under 50 words',
  },
  {
    id: 'aida',
    name: 'AIDA',
    fullName: 'Attention, Interest, Desire, Action',
    structure: ['Hook/stat', 'Address specific challenge', 'Social proof/outcome', 'Clear CTA'],
    bestFor: 'Data-driven prospects, high-ticket pitches with strong stats',
  },
  {
    id: 'ppp',
    name: 'PPP',
    fullName: 'Praise, Picture, Push',
    structure: ['Genuine compliment', 'How things could be better', 'Gentle push to action'],
    bestFor: 'Senior prospects who respond to relationship-building',
  },
  {
    id: 'star-story',
    name: 'Star-Story-Solution',
    fullName: 'Star-Story-Solution',
    structure: ['Introduce character (customer)', 'Tell challenge narrative', 'Reveal results'],
    bestFor: 'Strong customer success stories. Humanizes the pitch',
  },
  {
    id: 'scq',
    name: 'SCQ',
    fullName: 'Situation, Complication, Question',
    structure: ['Relatable situation', 'The complication', 'Open-ended question'],
    bestFor: 'Starting conversations. Discovery-focused, not closing',
  },
];

// ─── SUBJECT LINE RULES ─────────────────────────────────────────────────────

export const SUBJECT_LINE_RULES = {
  bestPractices: [
    '2-4 words maximum for highest open rates',
    'Lowercase only — looks like a colleague, not a marketer',
    'No punctuation, no emojis, no brackets',
    'Internal camouflage — make it look like an internal forward',
    'Reference something specific about the prospect',
  ],
  formulas: [
    { pattern: 'quick question', when: 'Universal opener, high open rate' },
    { pattern: '{mutual connection} suggested', when: 'When you have a referral' },
    { pattern: '{prospect company} + {your company}', when: 'Partnership framing' },
    { pattern: '{specific metric} at {company}', when: 'When you have data about them' },
    { pattern: 're: {previous topic}', when: 'Follow-up (only if genuine prior context)' },
    { pattern: '{competitor} alternative', when: 'Displacement campaigns' },
    { pattern: '{pain point}?', when: 'Question that hits a known challenge' },
  ],
  avoid: [
    'ALL CAPS or Title Case',
    'Numbers/percentages in subject',
    'Spam trigger words: free, guarantee, limited time',
    'Generic: "Reaching out", "Checking in", "Following up"',
  ],
};

// ─── EMAIL SEQUENCE TEMPLATES ───────────────────────────────────────────────

export const EMAIL_SEQUENCE_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Welcome Sequence',
    description: 'Onboard new subscribers and set expectations',
    emailCount: 7,
    duration: '14 days',
    emails: [
      { day: 0, subject: 'Welcome + delivery', purpose: 'Deliver lead magnet, set expectations, quick win', ctaType: 'Use the resource' },
      { day: 1, subject: 'Origin story', purpose: 'Build connection through founder/company story', ctaType: 'Reply with their story' },
      { day: 3, subject: 'Best content', purpose: 'Share top-performing content piece', ctaType: 'Read/watch content' },
      { day: 5, subject: 'Common mistake', purpose: 'Address biggest mistake in their space', ctaType: 'Self-assess' },
      { day: 7, subject: 'Case study', purpose: 'Social proof with specific results', ctaType: 'See full case study' },
      { day: 10, subject: 'Framework/tool', purpose: 'Provide actionable framework they can use today', ctaType: 'Try the framework' },
      { day: 14, subject: 'Soft pitch', purpose: 'Introduce paid offering naturally', ctaType: 'Learn more / Start trial' },
    ],
  },
  {
    id: 'nurture',
    name: 'Lead Nurture Sequence',
    description: 'Move leads from awareness to consideration',
    emailCount: 8,
    duration: '30 days',
    emails: [
      { day: 0, subject: 'Pain point acknowledgment', purpose: 'Show you understand their challenge', ctaType: 'Reply if this resonates' },
      { day: 3, subject: 'Educational content', purpose: 'Teach something valuable without pitching', ctaType: 'Read the guide' },
      { day: 7, subject: 'Industry insight', purpose: 'Share trend or data they care about', ctaType: 'See the data' },
      { day: 10, subject: 'Comparison/alternatives', purpose: 'Help them evaluate options (you included)', ctaType: 'Compare solutions' },
      { day: 14, subject: 'Customer story', purpose: 'Specific results from someone like them', ctaType: 'Read the story' },
      { day: 18, subject: 'Objection handling', purpose: 'Address common reason people don\'t buy', ctaType: 'See why it\'s different' },
      { day: 23, subject: 'ROI calculator', purpose: 'Help them quantify the value', ctaType: 'Calculate your ROI' },
      { day: 30, subject: 'Decision support', purpose: 'Help them make a decision (not just buy)', ctaType: 'Book a call' },
    ],
  },
  {
    id: 're-engagement',
    name: 'Re-engagement Sequence',
    description: 'Win back inactive leads or customers',
    emailCount: 5,
    duration: '21 days',
    emails: [
      { day: 0, subject: 'We noticed you\'ve been quiet', purpose: 'Acknowledge absence without guilt', ctaType: 'Update preferences' },
      { day: 3, subject: 'What\'s new', purpose: 'Share biggest improvement since they left', ctaType: 'See what changed' },
      { day: 7, subject: 'Win-back offer', purpose: 'Provide incentive to return', ctaType: 'Claim the offer' },
      { day: 14, subject: 'Success story', purpose: 'Show what peers have achieved', ctaType: 'See their results' },
      { day: 21, subject: 'Final check-in', purpose: 'Last attempt — ask if they want to stay', ctaType: 'Stay or unsubscribe' },
    ],
  },
  {
    id: 'onboarding',
    name: 'Customer Onboarding',
    description: 'Activate new customers and drive first value',
    emailCount: 6,
    duration: '14 days',
    emails: [
      { day: 0, subject: 'Getting started', purpose: 'Welcome + first 3 steps to get value', ctaType: 'Complete setup' },
      { day: 1, subject: 'Quick win', purpose: 'Show them the fastest path to value', ctaType: 'Try this feature' },
      { day: 3, subject: 'Pro tip', purpose: 'Share power-user technique', ctaType: 'Try advanced feature' },
      { day: 5, subject: 'Integration guide', purpose: 'Connect with their existing tools', ctaType: 'Set up integration' },
      { day: 7, subject: 'Check-in', purpose: 'Ask how it\'s going, offer help', ctaType: 'Reply or book support call' },
      { day: 14, subject: 'Next level', purpose: 'Introduce advanced features or upgrade path', ctaType: 'Explore premium features' },
    ],
  },
];

// ─── CRO EXPERIMENTS ────────────────────────────────────────────────────────

export const CRO_EXPERIMENTS = [
  // Page CRO
  { id: 'hero-specificity', name: 'Hero Headline Specificity', category: 'page', hypothesis: 'Replacing vague headlines with specific outcomes and numbers will increase engagement', expectedLift: '10-30%', effort: 'low', implementation: 'Replace "Better Analytics" with "Cut Reporting Time by 80% — See Member Insights in Real Time". Use specific numbers, outcomes, and timeframes.' },
  { id: 'social-proof-placement', name: 'Social Proof Above Fold', category: 'page', hypothesis: 'Moving logos/testimonials above the fold reduces uncertainty earlier', expectedLift: '5-15%', effort: 'low', implementation: 'Add a logo bar of 5-8 customer logos directly below the hero. Include "Trusted by 150+ credit unions" text.' },
  { id: 'cta-value-prop', name: 'CTA Button Value Copy', category: 'page', hypothesis: 'CTAs that communicate value outperform generic "Submit" or "Sign Up"', expectedLift: '10-25%', effort: 'low', implementation: 'Change "Request Demo" to "See My Analytics Dashboard" or "Get My Custom ROI Report". Focus on what they GET, not what they DO.' },
  { id: 'remove-nav', name: 'Remove Navigation on Landing Pages', category: 'page', hypothesis: 'Removing navigation reduces exit paths and increases conversion', expectedLift: '5-20%', effort: 'low', implementation: 'On dedicated landing pages, remove the main nav. Keep only logo (linking to homepage) and CTA. Reduces choices from 10+ to 1.' },
  { id: 'directional-cues', name: 'Add Directional Cues', category: 'page', hypothesis: 'Visual arrows or eye gaze pointing toward CTA increase clicks', expectedLift: '5-15%', effort: 'low', implementation: 'Use images where people look toward the CTA. Add subtle arrow graphics. Ensure whitespace guides eyes to the conversion point.' },
  { id: 'risk-reversal', name: 'Risk Reversal Near CTA', category: 'page', hypothesis: 'Addressing fear of commitment near the CTA reduces friction', expectedLift: '10-20%', effort: 'low', implementation: 'Add "No credit card required", "Free 14-day trial", "Cancel anytime" directly below or beside the CTA button.' },
  { id: 'video-demo', name: 'Add Product Demo Video', category: 'page', hypothesis: 'Short demo video increases understanding and trust', expectedLift: '10-30%', effort: 'medium', implementation: 'Add a 60-90 second product demo video on the landing page. Show the actual dashboard. Include a play button overlay on a screenshot.' },

  // Signup Flow CRO
  { id: 'progressive-disclosure', name: 'Progressive Form Disclosure', category: 'signup', hypothesis: 'Breaking a long form into steps reduces perceived effort', expectedLift: '15-30%', effort: 'medium', implementation: 'Split the signup form into 2-3 steps. Show progress bar. Start with email only, then add details. Each step should feel quick.' },
  { id: 'social-login', name: 'Add Social Login Options', category: 'signup', hypothesis: 'Social login removes the friction of creating yet another password', expectedLift: '10-25%', effort: 'medium', implementation: 'Add "Continue with Google" and "Continue with Microsoft" buttons above the email form. Keep email signup as fallback.' },
  { id: 'remove-fields', name: 'Remove Non-Essential Fields', category: 'signup', hypothesis: 'Every additional field reduces conversion by 5-10%', expectedLift: '10-25%', effort: 'low', implementation: 'Audit every field. Remove phone, company size, and job title from initial signup. Collect these during onboarding instead.' },
  { id: 'inline-validation', name: 'Real-Time Inline Validation', category: 'signup', hypothesis: 'Immediate feedback reduces errors and form abandonment', expectedLift: '5-15%', effort: 'medium', implementation: 'Validate each field on blur. Show green checkmarks for valid entries. Show specific error messages inline, not in a batch at the top.' },
  { id: 'password-requirements', name: 'Show Password Requirements Upfront', category: 'signup', hypothesis: 'Showing requirements prevents frustrating failed attempts', expectedLift: '5-10%', effort: 'low', implementation: 'Display password requirements below the field. Check them off in real-time as the user types. Use green checkmarks.' },

  // Form CRO
  { id: 'multi-step-form', name: 'Multi-Step Form Layout', category: 'form', hypothesis: 'Multi-step forms feel less overwhelming than single long forms', expectedLift: '15-40%', effort: 'medium', implementation: 'Convert long forms to 3-4 step wizard. Group related fields. Show clear progress indicator. Make first step absurdly easy (just email).' },
  { id: 'smart-defaults', name: 'Smart Default Values', category: 'form', hypothesis: 'Pre-filling known information reduces effort', expectedLift: '5-15%', effort: 'medium', implementation: 'Auto-detect country, timezone, company name from email domain. Pre-fill what you can. Let users correct rather than enter from scratch.' },
  { id: 'mobile-optimized', name: 'Mobile-Optimized Form Fields', category: 'form', hypothesis: 'Using correct input types reduces mobile friction', expectedLift: '10-20%', effort: 'low', implementation: 'Use type="email" for email, type="tel" for phone, inputmode="numeric" for numbers. This triggers the right mobile keyboard.' },
  { id: 'benefit-labels', name: 'Benefit-Oriented Field Labels', category: 'form', hypothesis: 'Labels that explain WHY increase completion', expectedLift: '5-10%', effort: 'low', implementation: 'Change "Company Size" to "Company Size (so we can customize your demo)". Add context to every field explaining its purpose.' },
  { id: 'conditional-fields', name: 'Conditional Field Display', category: 'form', hypothesis: 'Showing only relevant fields reduces overwhelm', expectedLift: '10-20%', effort: 'medium', implementation: 'Show/hide fields based on previous answers. If they select "Credit Union", show CU-specific fields. Hide irrelevant options.' },
];

// ─── LAUNCH STRATEGY FRAMEWORK ──────────────────────────────────────────────

export const LAUNCH_PHASES = [
  {
    id: 'internal',
    name: 'Internal Launch',
    description: 'Align team, build assets, set benchmarks',
    actions: [
      'Define launch goals and success metrics',
      'Create positioning and messaging doc',
      'Brief sales team with battle cards and FAQ',
      'Prepare demo environment and scripts',
      'Set up tracking (UTMs, events, dashboards)',
    ],
    channels: ['Internal comms', 'Sales enablement', 'Documentation'],
    duration: 'Week 1-2',
  },
  {
    id: 'alpha',
    name: 'Alpha / Soft Launch',
    description: 'Test with select customers, gather feedback',
    actions: [
      'Invite 5-10 existing customers for early access',
      'Collect qualitative feedback and testimonials',
      'Fix critical bugs and UX issues',
      'Create initial case study from alpha users',
      'Refine messaging based on real reactions',
    ],
    channels: ['Direct outreach', 'Customer success', 'Slack/community'],
    duration: 'Week 2-4',
  },
  {
    id: 'beta',
    name: 'Beta / Pre-Launch',
    description: 'Build anticipation and waitlist',
    actions: [
      'Publish teaser content (blog, social)',
      'Launch waitlist or early access signup',
      'Send preview to newsletter subscribers',
      'Reach out to industry analysts and press',
      'Prepare launch day assets (email, social, blog)',
    ],
    channels: ['Email', 'Social media', 'Blog', 'PR/analysts'],
    duration: 'Week 4-6',
  },
  {
    id: 'public',
    name: 'Public Launch',
    description: 'Go live across all channels',
    actions: [
      'Publish launch blog post / announcement',
      'Send launch email to full list',
      'Post across all social channels',
      'Activate paid campaigns if budgeted',
      'Enable sales outreach with new messaging',
      'Submit to directories and listings',
    ],
    channels: ['All owned + rented + borrowed channels'],
    duration: 'Launch day + Week 1',
  },
  {
    id: 'post-launch',
    name: 'Post-Launch',
    description: 'Sustain momentum and measure results',
    actions: [
      'Publish customer success stories',
      'Run webinar or live demo event',
      'Analyze launch metrics vs. goals',
      'Create retargeting campaigns for non-converters',
      'Plan follow-up content series',
      'Gather and publish reviews',
    ],
    channels: ['Email nurture', 'Content marketing', 'Retargeting', 'Community'],
    duration: 'Week 2-8 post-launch',
  },
];

export const LAUNCH_CHANNEL_FRAMEWORK = {
  name: 'ORB Framework',
  description: 'Categorize channels by Owned, Rented, and Borrowed to diversify reach',
  channels: {
    owned: ['Website/blog', 'Email list', 'Product (in-app)', 'Documentation', 'Community'],
    rented: ['Paid search', 'Paid social', 'Sponsorships', 'Display ads'],
    borrowed: ['PR/media coverage', 'Guest posts', 'Podcast appearances', 'Partner co-marketing', 'Industry events'],
  },
};

// ─── SOCIAL CONTENT HOOKS ───────────────────────────────────────────────────

export const SOCIAL_HOOKS = [
  { id: 'curiosity', name: 'Curiosity Hook', formula: 'Open a knowledge gap the reader must close', examples: ['Most credit unions are sitting on a goldmine — and don\'t know it.', 'The #1 reason members leave has nothing to do with rates.'] },
  { id: 'story', name: 'Story Hook', formula: 'Start in the middle of the action', examples: ['Last Tuesday, a $400M credit union CEO called us in a panic.', 'Three years ago, we almost shut down our analytics division.'] },
  { id: 'value', name: 'Value Hook', formula: 'Promise a specific, useful takeaway', examples: ['Here are 5 reports every CU CEO should review monthly:', 'The exact dashboard template our top clients use:'] },
  { id: 'contrarian', name: 'Contrarian Hook', formula: 'Challenge a widely held belief', examples: ['Unpopular opinion: Most credit unions don\'t need more data — they need better questions.', 'Stop benchmarking against peers. Here\'s what to do instead.'] },
  { id: 'data', name: 'Data Hook', formula: 'Lead with a surprising statistic', examples: ['73% of credit union members would switch for a better digital experience.', 'The average CU spends 240 hours/year on manual reporting.'] },
];

// ─── HEADLINE FORMULAS ──────────────────────────────────────────────────────

export const HEADLINE_FORMULAS = [
  { id: 'outcome', name: 'Outcome-Focused', formula: 'How [audience] can [achieve outcome] without [pain]', example: 'How Credit Unions Can Cut Reporting Time by 80% Without Hiring Analysts' },
  { id: 'problem', name: 'Problem-Focused', formula: '[Number] [problem] killing your [desired outcome]', example: '5 Data Silos Killing Your Member Retention Strategy' },
  { id: 'audience', name: 'Audience-Focused', formula: 'The [audience]\'s guide to [achieving something specific]', example: 'The Credit Union CEO\'s Guide to Data-Driven Decision Making' },
  { id: 'differentiation', name: 'Differentiation-Focused', formula: 'Why [common approach] fails and what [top performers] do instead', example: 'Why Spreadsheet Analytics Fails and What Top CUs Do Instead' },
  { id: 'proof', name: 'Proof-Focused', formula: 'How [specific company] achieved [specific result] in [timeframe]', example: 'How a $500M Credit Union Increased Cross-Sells 40% in 90 Days' },
];

// ─── MARKETING PSYCHOLOGY PRINCIPLES ────────────────────────────────────────

export const PSYCHOLOGY_PRINCIPLES = [
  { id: 'jtbd', name: 'Jobs to Be Done', principle: 'People buy solutions to problems, not features', application: 'Frame every feature as a job it helps complete. "Automated 5300 reporting" becomes "Never miss an NCUA deadline again."' },
  { id: 'loss-aversion', name: 'Loss Aversion', principle: 'People feel losses 2x more than equivalent gains', application: 'Frame value as what they lose without you. "You\'re losing $50K/year in missed cross-sell opportunities" > "Gain $50K in revenue."' },
  { id: 'social-proof', name: 'Social Proof', principle: 'People follow what others like them are doing', application: 'Use peer institution examples. "150+ credit unions trust Rise Analytics" or "Credit unions your size are switching to real-time analytics."' },
  { id: 'anchoring', name: 'Anchoring', principle: 'The first number sets the reference point', application: 'Lead with the big number. "Companies spend $200K+ on analytics consultants. Rise Analytics delivers the same insights for a fraction."' },
  { id: 'scarcity', name: 'Scarcity & Urgency', principle: 'Limited availability increases perceived value', application: 'Use real constraints: "Implementation slots for Q3 are filling up" or "Early adopter pricing ends this month."' },
  { id: 'reciprocity', name: 'Reciprocity', principle: 'People feel obligated to return value they receive', application: 'Give value first — free ROI calculator, benchmarking report, or industry whitepaper — before asking for the meeting.' },
  { id: 'authority', name: 'Authority', principle: 'People trust credentialed experts and recognized brands', application: 'Cite industry awards, partnerships, certifications. Mention NCUA/CUNA compliance. Reference thought leadership.' },
  { id: 'paradox-of-choice', name: 'Paradox of Choice', principle: 'Too many options paralyze decision-making', application: 'Limit plan options to 3. Highlight one as "Most Popular." Reduce form fields. One CTA per page section.' },
  { id: 'endowment', name: 'Endowment Effect', principle: 'People overvalue what they already have', application: 'Free trials work because once they use it, they don\'t want to give it up. Offer personalized demos with their own data.' },
  { id: 'commitment', name: 'Commitment & Consistency', principle: 'Small commitments lead to larger ones', application: 'Start with micro-commitments: newsletter signup → free tool → webinar → demo → trial → purchase. Each step builds on the last.' },
];

// ─── EMAIL COPY GUIDELINES ──────────────────────────────────────────────────

export const EMAIL_COPY_GUIDELINES = {
  rules: [
    'Write at an 8th grade reading level — use Hemingway Editor to check',
    'One idea per email. One CTA per email. One ask per email.',
    'Subject line and first line must work together — the preview text is your second hook',
    'Front-load value — the first sentence determines if they keep reading',
    'Use "you" more than "we" — ratio should be at least 2:1',
    'Short paragraphs (1-3 sentences max). White space is your friend.',
    'Every email should be scannable in 5 seconds',
  ],
  ctaRules: [
    'One primary CTA per email — never compete with yourself',
    'Button CTAs outperform text links in marketing emails',
    'Use first-person on buttons: "Get My Report" not "Get Your Report"',
    'Place CTA after establishing value, never at the very top',
    'Repeat CTA at the end if email is long (300+ words)',
  ],
};

// ─── PROMPT BUILDER ─────────────────────────────────────────────────────────

/**
 * Build an enhanced system prompt incorporating framework knowledge
 */
export function buildFrameworkPrompt(framework, contentType) {
  const fw = [...COPYWRITING_FRAMEWORKS, ...COLD_EMAIL_FRAMEWORKS].find(f => f.id === framework);
  if (!fw) return '';

  return `
IMPORTANT: Use the "${fw.name}" (${fw.fullName}) framework to structure this content.

Framework structure:
${fw.structure.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Best for: ${fw.bestFor}
${fw.example ? `\nExample:\n${fw.example}` : ''}

Follow this structure precisely. Each section of the ${fw.name} framework should be clearly identifiable in your output.`;
}

/**
 * Build a social hook instruction
 */
export function buildSocialHookPrompt(hookType) {
  const hook = SOCIAL_HOOKS.find(h => h.id === hookType);
  if (!hook) return '';

  return `
Use a "${hook.name}" to open the post.
Formula: ${hook.formula}

Examples of this hook style:
${hook.examples.map(e => `- "${e}"`).join('\n')}

Start with a hook that follows this pattern, then deliver the main content.`;
}

/**
 * Build a headline formula instruction
 */
export function buildHeadlinePrompt(formulaId) {
  const formula = HEADLINE_FORMULAS.find(f => f.id === formulaId);
  if (!formula) return '';

  return `
Use this headline formula: ${formula.name}
Pattern: ${formula.formula}
Example: "${formula.example}"

Create a headline following this exact pattern, adapted to the topic.`;
}
