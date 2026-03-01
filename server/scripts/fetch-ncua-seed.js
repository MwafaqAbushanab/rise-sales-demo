#!/usr/bin/env node
// Fetch all credit unions from NCUA Socrata API and save as seed data.
// Run: node server/scripts/fetch-ncua-seed.js

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');
const SEED_FILE = join(DATA_DIR, 'ncua-seed.json');

const NCUA_ENDPOINTS = [
  'https://data.ncua.gov/resource/9k6a-5st2.json',
  'https://data.ncua.gov/resource/kp6f-mwpt.json',
  'https://data.ncua.gov/resource/7kii-a53n.json',
];

async function fetchAllCreditUnions() {
  for (const endpoint of NCUA_ENDPOINTS) {
    console.log(`Trying endpoint: ${endpoint}`);
    try {
      const params = new URLSearchParams({
        '$limit': '10000',
        '$order': 'total_assets DESC',
      });
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        console.log(`  HTTP ${response.status} — skipping`);
        continue;
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        console.log(`  Empty response — skipping`);
        continue;
      }

      console.log(`  Got ${data.length} records from ${endpoint}`);

      mkdirSync(DATA_DIR, { recursive: true });
      const seed = {
        meta: {
          fetchedAt: new Date().toISOString(),
          source: endpoint,
          count: data.length,
        },
        data,
      };

      writeFileSync(SEED_FILE, JSON.stringify(seed, null, 2));
      const sizeMB = (Buffer.byteLength(JSON.stringify(seed)) / 1024 / 1024).toFixed(1);
      console.log(`\nSaved ${data.length} credit unions to ${SEED_FILE} (${sizeMB} MB)`);
      return;
    } catch (err) {
      console.log(`  Error: ${err.message} — skipping`);
    }
  }

  console.error('\nAll NCUA endpoints failed. No seed file created.');
  process.exit(1);
}

fetchAllCreditUnions();
