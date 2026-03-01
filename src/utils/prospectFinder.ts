// Prospect Finder - ICP matching and discovery from FDIC/NCUA data

import type { Lead } from '../types';
import { formatCurrency } from '../types';

export interface ICPCriteria {
  id: string;
  name: string;
  types: ('Credit Union' | 'Community Bank')[];
  states: string[];
  minAssets: number;
  maxAssets: number;
  minMembers: number;
  maxMembers: number;
  minROA: number;
  maxROA: number;
  minScore: number;
}

export interface ICPMatch {
  lead: Lead;
  matchScore: number;
  matchReasons: string[];
}

export const DEFAULT_ICP_TEMPLATES: ICPCriteria[] = [
  {
    id: 'enterprise-cu',
    name: 'Enterprise CU ($1B+)',
    types: ['Credit Union'],
    states: [],
    minAssets: 1e9,
    maxAssets: Infinity,
    minMembers: 50000,
    maxMembers: Infinity,
    minROA: 0,
    maxROA: Infinity,
    minScore: 0,
  },
  {
    id: 'mid-market-cu',
    name: 'Mid-Market CU ($100M-$1B)',
    types: ['Credit Union'],
    states: [],
    minAssets: 1e8,
    maxAssets: 1e9,
    minMembers: 10000,
    maxMembers: Infinity,
    minROA: 0,
    maxROA: Infinity,
    minScore: 0,
  },
  {
    id: 'high-growth',
    name: 'High-Growth CUs',
    types: ['Credit Union'],
    states: ['TX', 'FL', 'AZ', 'NC', 'GA', 'TN', 'CO', 'UT'],
    minAssets: 1e8,
    maxAssets: Infinity,
    minMembers: 0,
    maxMembers: Infinity,
    minROA: 0.8,
    maxROA: Infinity,
    minScore: 70,
  },
  {
    id: 'community-banks',
    name: 'Community Banks ($500M+)',
    types: ['Community Bank'],
    states: [],
    minAssets: 5e8,
    maxAssets: Infinity,
    minMembers: 0,
    maxMembers: Infinity,
    minROA: 0,
    maxROA: Infinity,
    minScore: 0,
  },
];

function rangeScore(value: number, min: number, max: number): number {
  if (max === Infinity && min > 0) {
    // Open-ended range — score by distance above min
    if (value < min) return 0;
    const bonus = Math.min((value - min) / min, 1); // 0-1 scale
    return 70 + bonus * 30;
  }
  if (min === 0 && max === Infinity) return 80; // no constraint
  const range = max - min;
  if (range <= 0) return value >= min ? 100 : 0;
  const center = min + range / 2;
  const distFromCenter = Math.abs(value - center);
  const normalized = 1 - Math.min(distFromCenter / (range / 2), 1);
  return Math.round(60 + normalized * 40);
}

export function matchLeadsToICP(leads: Lead[], criteria: ICPCriteria): ICPMatch[] {
  return leads
    .filter(lead => {
      if (criteria.types.length > 0 && !criteria.types.includes(lead.type)) return false;
      if (criteria.states.length > 0 && !criteria.states.includes(lead.state)) return false;
      if (lead.assets < criteria.minAssets || lead.assets > criteria.maxAssets) return false;
      if (criteria.minMembers > 0 && lead.members < criteria.minMembers) return false;
      if (criteria.maxMembers < Infinity && lead.members > criteria.maxMembers) return false;
      if (criteria.minROA > 0 && lead.roa < criteria.minROA) return false;
      if (criteria.maxROA < Infinity && lead.roa > criteria.maxROA) return false;
      if (criteria.minScore > 0 && lead.score < criteria.minScore) return false;
      return true;
    })
    .map(lead => {
      const reasons: string[] = [];
      let totalScore = 0;
      let factors = 0;

      // Asset fit
      const assetScore = rangeScore(lead.assets, criteria.minAssets, criteria.maxAssets);
      totalScore += assetScore;
      factors++;
      if (assetScore >= 80) reasons.push(`Assets of ${formatCurrency(lead.assets)} are in the ideal range`);

      // Member fit
      if (criteria.minMembers > 0 || criteria.maxMembers < Infinity) {
        const memberScore = rangeScore(lead.members, criteria.minMembers, criteria.maxMembers);
        totalScore += memberScore;
        factors++;
        if (memberScore >= 80 && lead.members > 0) reasons.push(`${lead.members.toLocaleString()} members matches target`);
      }

      // ROA fit
      if (criteria.minROA > 0) {
        const roaScore = rangeScore(lead.roa, criteria.minROA, criteria.maxROA);
        totalScore += roaScore;
        factors++;
        if (roaScore >= 80) reasons.push(`ROA of ${lead.roa.toFixed(2)}% indicates strong performance`);
      }

      // Score fit
      if (criteria.minScore > 0) {
        const scoreScore = rangeScore(lead.score, criteria.minScore, 100);
        totalScore += scoreScore;
        factors++;
        if (scoreScore >= 80) reasons.push(`Lead score of ${lead.score} exceeds threshold`);
      }

      // State bonus
      if (criteria.states.length > 0 && criteria.states.includes(lead.state)) {
        reasons.push(`Located in target state: ${lead.state}`);
        totalScore += 90;
        factors++;
      }

      // Type match
      if (criteria.types.length === 1) {
        reasons.push(`Matches target type: ${lead.type}`);
      }

      const matchScore = factors > 0 ? Math.round(totalScore / factors) : 50;

      return { lead, matchScore, matchReasons: reasons.slice(0, 4) };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function exportICPMatchesToCSV(matches: ICPMatch[]): void {
  const headers = ['Name', 'Type', 'City', 'State', 'Assets', 'Members', 'ROA', 'Lead Score', 'Match Score', 'Match Reasons', 'Status', 'Recommended Products'];
  const rows = matches.map(m => [
    m.lead.name,
    m.lead.type,
    m.lead.city,
    m.lead.state,
    m.lead.assets.toString(),
    m.lead.members.toString(),
    m.lead.roa.toFixed(2),
    m.lead.score.toString(),
    m.matchScore.toString(),
    m.matchReasons.join('; '),
    m.lead.status,
    m.lead.recommendedProducts.join('; '),
  ]);

  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prospect-finder-matches-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
