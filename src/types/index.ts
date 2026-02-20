import type { Bank } from '../api/fdicApi';
import type { CreditUnion } from '../api/ncuaApi';

export interface Lead {
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

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function calculateLeadScore(assets: number, members: number, roa: number): number {
  let score = 50;
  if (assets >= 10000000000) score += 30;
  else if (assets >= 5000000000) score += 25;
  else if (assets >= 1000000000) score += 20;
  else if (assets >= 500000000) score += 15;
  else if (assets >= 100000000) score += 10;
  else score += 5;

  if (members > 0) {
    if (members >= 500000) score += 10;
    else if (members >= 100000) score += 7;
    else if (members >= 50000) score += 5;
    else score += 2;
  }

  if (roa >= 1.5) score += 10;
  else if (roa >= 1.0) score += 7;
  else if (roa >= 0.5) score += 4;

  return Math.min(score, 100);
}

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

export function bankToLead(bank: Bank): Lead {
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

export function creditUnionToLead(cu: CreditUnion): Lead {
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

export const statusColors: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-purple-100 text-purple-700',
  demo_scheduled: 'bg-amber-100 text-amber-700',
  proposal_sent: 'bg-cyan-100 text-cyan-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700'
};

export const formatCurrency = (num: number): string => {
  if (num >= 1000000000) return `$${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(0)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
};

export const formatStatus = (status: string): string =>
  status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
