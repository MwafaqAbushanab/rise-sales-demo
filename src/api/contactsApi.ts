// Apollo.io contact enrichment API client

import type { InstitutionContacts } from '../types/contacts';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export interface ContactsResponse {
  data: InstitutionContacts | null;
  configured: boolean;
  status?: 'searching' | 'found' | 'not_found';
  message?: string;
}

export async function fetchContactsForLead(institutionId: string): Promise<ContactsResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/contacts/${encodeURIComponent(institutionId)}`);
    if (!res.ok) return { data: null, configured: false };
    return await res.json();
  } catch {
    return { data: null, configured: false };
  }
}

export async function triggerContactSearch(
  institutionId: string,
  companyName: string
): Promise<ContactsResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/contacts/search/${encodeURIComponent(institutionId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName }),
    });
    if (!res.ok) return { data: null, configured: false };
    return await res.json();
  } catch {
    return { data: null, configured: false };
  }
}

export async function triggerEnrichment(institutionId: string): Promise<{ queued: boolean; count: number }> {
  try {
    const res = await fetch(`${API_BASE}/api/contacts/enrich/${encodeURIComponent(institutionId)}`, {
      method: 'POST',
    });
    if (!res.ok) return { queued: false, count: 0 };
    return await res.json();
  } catch {
    return { queued: false, count: 0 };
  }
}
