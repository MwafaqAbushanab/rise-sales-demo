// Apollo.io Contact Enrichment Service
// People Search is FREE (no credits). People Enrichment costs 1 credit per email.
// Rate limit: 600 enrichments/hour

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const CONTACTS_CACHE_FILE = join(DATA_DIR, 'contacts-cache.json');
const APOLLO_API_BASE = 'https://api.apollo.io/api/v1';

// Target seniorities for search (FREE — no credits consumed)
const TARGET_SENIORITIES = ['c_suite', 'vp', 'director'];
const TARGET_DEPARTMENTS = ['finance', 'information_technology', 'executive'];

// Only enrich C-suite by default (1 credit per email)
const ENRICHMENT_SENIORITIES = ['c_suite', 'vp'];

// In-memory contact store
let contactsStore = {};
let enrichmentQueue = [];
let enrichmentInProgress = false;
let totalCreditsUsed = 0;

// ─── Cache I/O ───────────────────────────────────────────

function readContactsCache() {
  if (!existsSync(CONTACTS_CACHE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONTACTS_CACHE_FILE, 'utf-8'));
  } catch { return {}; }
}

function writeContactsCache() {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(CONTACTS_CACHE_FILE, JSON.stringify(contactsStore, null, 2));
}

// ─── Apollo API Helpers ──────────────────────────────────

function getApiKey() {
  return process.env.APOLLO_API_KEY || null;
}

async function apolloFetch(path, body) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('APOLLO_API_KEY not configured');

  const res = await fetch(`${APOLLO_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Apollo API ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json();
}

// ─── People Search (FREE — no credits) ──────────────────

export async function searchContacts(companyName, institutionId) {
  console.log(`[Apollo] Searching contacts for "${companyName}" (${institutionId})`);

  const result = await apolloFetch('/mixed_people/api_search', {
    q_organization_name: companyName,
    person_seniorities: TARGET_SENIORITIES,
    person_departments: TARGET_DEPARTMENTS,
    page: 1,
    per_page: 10,
  });

  const people = result.people || [];
  const decisionMakers = people.map(p => ({
    id: p.id,
    firstName: p.first_name || '',
    lastName: p.last_name || '',
    fullName: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
    title: p.title || '',
    seniority: p.seniority || 'unknown',
    departments: p.departments || [],
    linkedinUrl: p.linkedin_url || undefined,
    photoUrl: p.photo_url || undefined,
    email: p.email || undefined,
    emailStatus: p.email_status || undefined,
    source: 'apollo',
    enrichedAt: undefined,
    creditCost: 0,
  }));

  const entry = {
    institutionId,
    institutionName: companyName,
    decisionMakers,
    searchedAt: new Date().toISOString(),
    searchStatus: decisionMakers.length > 0 ? 'found' : 'not_found',
    totalCreditsCost: 0,
  };

  contactsStore[institutionId] = entry;
  writeContactsCache();
  console.log(`[Apollo] Found ${decisionMakers.length} contacts for "${companyName}"`);

  return entry;
}

// ─── People Enrichment (1 credit per email) ──────────────

export async function enrichContact(apolloId, institutionId) {
  const entry = contactsStore[institutionId];
  if (!entry) throw new Error(`No contacts found for ${institutionId}`);

  const dm = entry.decisionMakers.find(d => d.id === apolloId);
  if (!dm) throw new Error(`Contact ${apolloId} not found`);
  if (dm.enrichedAt) return dm; // Already enriched

  console.log(`[Apollo] Enriching ${dm.fullName} (${dm.title}) — 1 credit`);

  const result = await apolloFetch('/people/match', {
    id: apolloId,
    reveal_personal_emails: false,
    reveal_phone_number: false,
  });

  const person = result.person || {};
  if (person.email) {
    dm.email = person.email;
    dm.emailStatus = person.email_status || 'unknown';
  }
  dm.enrichedAt = new Date().toISOString();
  dm.creditCost = 1;

  entry.totalCreditsCost = entry.decisionMakers.reduce((sum, d) => sum + d.creditCost, 0);
  entry.enrichedAt = new Date().toISOString();
  totalCreditsUsed++;

  writeContactsCache();
  return dm;
}

// ─── Enrichment Queue (rate-limited) ─────────────────────

export async function enrichInstitutionContacts(institutionId) {
  const entry = contactsStore[institutionId];
  if (!entry || entry.decisionMakers.length === 0) return { queued: false, count: 0 };

  // Queue only unenriched contacts at target seniorities
  const toEnrich = entry.decisionMakers.filter(
    dm => !dm.enrichedAt && ENRICHMENT_SENIORITIES.includes(dm.seniority)
  );

  for (const dm of toEnrich) {
    enrichmentQueue.push({ institutionId, apolloId: dm.id });
  }

  if (!enrichmentInProgress) {
    processEnrichmentQueue();
  }

  return { queued: true, count: toEnrich.length };
}

async function processEnrichmentQueue() {
  if (enrichmentInProgress || enrichmentQueue.length === 0) return;
  enrichmentInProgress = true;

  while (enrichmentQueue.length > 0) {
    const { institutionId, apolloId } = enrichmentQueue.shift();
    try {
      await enrichContact(apolloId, institutionId);
    } catch (err) {
      console.warn(`[Apollo] Enrichment failed for ${apolloId}:`, err.message);
    }
    // Rate limit: 600/hr = 1 per 6 seconds
    if (enrichmentQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 6000));
    }
  }

  enrichmentInProgress = false;
}

// ─── Public API ──────────────────────────────────────────

export function getContactsForInstitution(institutionId) {
  return contactsStore[institutionId] || null;
}

export function getContactsStats() {
  const entries = Object.values(contactsStore);
  const allDMs = entries.flatMap(e => e.decisionMakers);
  return {
    configured: !!getApiKey(),
    totalInstitutions: entries.length,
    totalContacts: allDMs.length,
    enrichedContacts: allDMs.filter(dm => dm.enrichedAt).length,
    totalCreditsUsed,
    queueLength: enrichmentQueue.length,
  };
}

// ─── Startup ─────────────────────────────────────────────

export async function initContactService(topInstitutions) {
  // Load cached contacts
  contactsStore = readContactsCache();
  const cachedCount = Object.keys(contactsStore).length;
  if (cachedCount > 0) {
    console.log(`[Apollo] Loaded ${cachedCount} institutions from contacts cache`);
    totalCreditsUsed = Object.values(contactsStore)
      .reduce((sum, e) => sum + (e.totalCreditsCost || 0), 0);
  }

  if (!getApiKey()) {
    console.log('[Apollo] API key not set — contact enrichment disabled');
    return;
  }

  console.log('[Apollo] API key configured — starting background contact search');

  // Background search for top institutions (FREE — no credits)
  if (topInstitutions && topInstitutions.length > 0) {
    const toSearch = topInstitutions
      .slice(0, 50) // Top 50 by assets
      .filter(inst => {
        const id = inst.id || `cu_${inst.cu_number || inst.cunumber || inst.CU_NUMBER || ''}`;
        const existing = contactsStore[id];
        // Skip if searched within last 7 days
        if (existing && existing.searchedAt) {
          const age = Date.now() - new Date(existing.searchedAt).getTime();
          if (age < 7 * 24 * 60 * 60 * 1000) return false;
        }
        return true;
      });

    console.log(`[Apollo] Will search ${toSearch.length} institutions in background`);

    // Run searches with pacing (1 per second — search is free but be polite)
    for (const inst of toSearch) {
      const name = inst.name || inst.cu_name || inst.cuname || inst.CU_NAME || '';
      const id = inst.id || `cu_${inst.cu_number || inst.cunumber || inst.CU_NUMBER || ''}`;
      if (!name) continue;

      try {
        await searchContacts(name, id);
      } catch (err) {
        console.warn(`[Apollo] Search failed for "${name}":`, err.message);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // After search, queue enrichment for C-suite contacts
    for (const inst of toSearch) {
      const id = inst.id || `cu_${inst.cu_number || inst.cunumber || inst.CU_NUMBER || ''}`;
      enrichInstitutionContacts(id).catch(() => {});
    }
  }
}
