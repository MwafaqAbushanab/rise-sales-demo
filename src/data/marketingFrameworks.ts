// Frontend framework definitions for the Marketing Agent UI
// Source: marketingskills repo

export interface Framework {
  id: string;
  name: string;
  fullName: string;
  shortDescription: string;
  bestFor: string;
  icon: string;
}

export interface SequenceType {
  id: string;
  name: string;
  description: string;
  emailCount: number;
  duration: string;
}

export interface CROCategory {
  id: string;
  name: string;
  description: string;
}

export interface LaunchType {
  id: string;
  name: string;
  description: string;
}

export interface SocialHookType {
  id: string;
  name: string;
  formula: string;
}

export interface HeadlineFormula {
  id: string;
  name: string;
  pattern: string;
  example: string;
}

// ─── COPYWRITING FRAMEWORKS ─────────────────────────────────────────────────

export const COPY_FRAMEWORKS: Framework[] = [
  { id: 'pas', name: 'PAS', fullName: 'Problem, Agitate, Solution', shortDescription: 'Identify pain, amplify it, present your fix', bestFor: 'Problem-aware prospects', icon: '🎯' },
  { id: 'bab', name: 'BAB', fullName: 'Before, After, Bridge', shortDescription: 'Show the transformation your product enables', bestFor: 'Emotional decision-makers', icon: '🌉' },
  { id: 'aida', name: 'AIDA', fullName: 'Attention, Interest, Desire, Action', shortDescription: 'Hook → engage → prove → convert', bestFor: 'Data-driven, high-ticket pitches', icon: '📊' },
  { id: 'qvc', name: 'QVC', fullName: 'Question, Value, CTA', shortDescription: 'Ask a pain question, show value, direct CTA', bestFor: 'C-suite brevity', icon: '⚡' },
  { id: 'ppp', name: 'PPP', fullName: 'Praise, Picture, Push', shortDescription: 'Compliment, envision, nudge to action', bestFor: 'Relationship-first outreach', icon: '🤝' },
  { id: 'star-story', name: 'Star-Story-Solution', fullName: 'Star-Story-Solution', shortDescription: 'Customer character, challenge narrative, results', bestFor: 'Customer success stories', icon: '⭐' },
  { id: 'scq', name: 'SCQ', fullName: 'Situation, Complication, Question', shortDescription: 'Set context, introduce complication, ask question', bestFor: 'Discovery conversations', icon: '❓' },
  { id: '4ps', name: '4Ps', fullName: 'Promise, Picture, Proof, Push', shortDescription: 'Bold promise, vivid picture, evidence, action', bestFor: 'Landing pages and long-form', icon: '📝' },
];

// ─── EMAIL FRAMEWORKS ───────────────────────────────────────────────────────

export const EMAIL_FRAMEWORKS: Framework[] = [
  { id: 'pas', name: 'PAS', fullName: 'Problem, Agitate, Solution', shortDescription: 'Identify pain, amplify, present solution', bestFor: 'Problem-aware prospects', icon: '🎯' },
  { id: 'bab', name: 'BAB', fullName: 'Before, After, Bridge', shortDescription: 'Paint before/after, your product bridges', bestFor: 'Transformation offers', icon: '🌉' },
  { id: 'qvc', name: 'QVC', fullName: 'Question, Value, CTA', shortDescription: 'Quick pain question, value, next step', bestFor: 'C-suite brevity (under 50 words)', icon: '⚡' },
  { id: 'aida', name: 'AIDA', fullName: 'Attention, Interest, Desire, Action', shortDescription: 'Hook, challenge, proof, CTA', bestFor: 'Data-driven pitches', icon: '📊' },
  { id: 'ppp', name: 'PPP', fullName: 'Praise, Picture, Push', shortDescription: 'Compliment, better picture, gentle push', bestFor: 'Senior relationship prospects', icon: '🤝' },
  { id: 'star-story', name: 'Star-Story-Solution', fullName: 'Star-Story-Solution', shortDescription: 'Customer story with results', bestFor: 'Humanizing the pitch', icon: '⭐' },
  { id: 'scq', name: 'SCQ', fullName: 'Situation, Complication, Question', shortDescription: 'Context, complication, open question', bestFor: 'Discovery-focused, not closing', icon: '❓' },
];

// ─── SEQUENCE TYPES ─────────────────────────────────────────────────────────

export const SEQUENCE_TYPES: SequenceType[] = [
  { id: 'welcome', name: 'Welcome Sequence', description: 'Onboard new subscribers, deliver lead magnet, build trust over 14 days', emailCount: 7, duration: '14 days' },
  { id: 'nurture', name: 'Lead Nurture', description: 'Move leads from awareness to consideration with education and proof', emailCount: 8, duration: '30 days' },
  { id: 're-engagement', name: 'Re-engagement', description: 'Win back inactive leads or churned customers with new value', emailCount: 5, duration: '21 days' },
  { id: 'onboarding', name: 'Customer Onboarding', description: 'Activate new customers and drive them to first value quickly', emailCount: 6, duration: '14 days' },
];

// ─── CRO CATEGORIES ─────────────────────────────────────────────────────────

export const CRO_CATEGORIES: CROCategory[] = [
  { id: 'all', name: 'All Experiments', description: 'View all conversion optimization experiments' },
  { id: 'page', name: 'Page CRO', description: 'Landing page and marketing page optimizations' },
  { id: 'signup', name: 'Signup Flow', description: 'Registration and signup form experiments' },
  { id: 'form', name: 'Form CRO', description: 'Lead capture and contact form improvements' },
];

// ─── LAUNCH TYPES ───────────────────────────────────────────────────────────

export const LAUNCH_TYPES: LaunchType[] = [
  { id: 'new_product', name: 'New Product Launch', description: 'Full go-to-market for a brand new product or major feature' },
  { id: 'feature', name: 'Feature Release', description: 'Announce and drive adoption of a new feature to existing customers' },
  { id: 'beta', name: 'Beta Launch', description: 'Controlled rollout to gather feedback before public launch' },
];

// ─── SOCIAL HOOKS ───────────────────────────────────────────────────────────

export const SOCIAL_HOOK_TYPES: SocialHookType[] = [
  { id: 'curiosity', name: 'Curiosity Hook', formula: 'Open a knowledge gap the reader must close' },
  { id: 'story', name: 'Story Hook', formula: 'Start in the middle of the action' },
  { id: 'value', name: 'Value Hook', formula: 'Promise a specific, useful takeaway' },
  { id: 'contrarian', name: 'Contrarian Hook', formula: 'Challenge a widely held belief' },
  { id: 'data', name: 'Data Hook', formula: 'Lead with a surprising statistic' },
];

// ─── HEADLINE FORMULAS ──────────────────────────────────────────────────────

export const HEADLINE_FORMULAS: HeadlineFormula[] = [
  { id: 'outcome', name: 'Outcome-Focused', pattern: 'How [audience] can [outcome] without [pain]', example: 'How Credit Unions Can Cut Reporting Time by 80% Without Hiring Analysts' },
  { id: 'problem', name: 'Problem-Focused', pattern: '[Number] [problem] killing your [desired outcome]', example: '5 Data Silos Killing Your Member Retention Strategy' },
  { id: 'audience', name: 'Audience-Focused', pattern: "The [audience]'s guide to [specific achievement]", example: "The Credit Union CEO's Guide to Data-Driven Decision Making" },
  { id: 'differentiation', name: 'Differentiation', pattern: 'Why [common approach] fails and what [top performers] do instead', example: 'Why Spreadsheet Analytics Fails and What Top CUs Do Instead' },
  { id: 'proof', name: 'Proof-Focused', pattern: 'How [company] achieved [result] in [timeframe]', example: 'How a $500M Credit Union Increased Cross-Sells 40% in 90 Days' },
];
