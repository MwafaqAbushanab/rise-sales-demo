#!/usr/bin/env node
// Refresh both NCUA 5300 Call Report data and CU directory seed
// Downloads Q4 2025 + Q3 2025 call reports from ncua.gov
// Also attempts to fetch CU directory from NCUA API

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');

mkdirSync(DATA_DIR, { recursive: true });

// ── Account codes we need from FS220 ──────────────────────────────────
// Account codes from NCUA 5300 Call Reports:
// FS220: 010 (Total Assets), 013 (Total Shares), 025B (Total Loans), 041B (Delinquent),
//        083 (Current Members), 084 (Potential Members), 550 (Charge-offs), 551 (Recoveries),
//        703 (1st Mortgage RE Loans), 719 (Allowance for Loan Losses)
// FS220A: 115 (Total Interest Income), 370 (Used Vehicle Loans), 385 (New Vehicle Loans),
//         396 (Unsecured Credit Card Loans), 397 (Other Unsecured Loans),
//         997 (Total Net Worth), 998 (Net Worth Ratio)
// Account codes from NCUA 5300 Call Reports:
// FS220: 010 (Total Assets), 013 (Total Shares), 025B (Total Loans), 041B (Delinquent),
//        083 (Current Members), 084 (Potential Members), 550 (Charge-offs), 551 (Recoveries),
//        719 (Allowance), 860C (Total Borrowings)
// FS220A: 115 (Total Interest Income), 370 (Used Vehicle), 385 (New Vehicle),
//         396 (CC Loans), 397 (Other Unsecured)
// Note: 703 (1st Mortgage RE), 997 (Net Worth), 998 (NW Ratio) are empty in 2025 data
const NEEDED_ACCOUNTS = new Set([
  '010', '013', '025B', '041B', '083', '084',
  '115', '370', '385', '396', '397', '550', '551',
  '719', '860C'
]);

// ── CSV Parser ────────────────────────────────────────────────────────
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

// ── Parse FS220 CSV ───────────────────────────────────────────────────
// Handles BOTH formats:
//   Old (long): CU_NUMBER, CYCLE_DATE, ACCT_CODE, ACCT_VALUE (one row per account)
//   New (wide): CU_NUMBER, CYCLE_DATE, ..., ACCT_010, ACCT_013, ... (one row per CU)
function parseFS220CSV(csvContent) {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return null;

  const header = parseCSVLine(lines[0]);
  const cuNumIdx = header.findIndex(h => h.toUpperCase() === 'CU_NUMBER');

  if (cuNumIdx === -1) {
    console.log('  Could not find CU_NUMBER column. Headers:', header.slice(0, 10));
    return null;
  }

  // Detect format: wide format has ACCT_XXX columns in the header
  const acctColumns = new Map(); // Map<columnIndex, accountCode>
  for (let i = 0; i < header.length; i++) {
    const h = header[i].toUpperCase();
    const match = h.match(/^ACCT_(.+)$/);
    if (match) {
      const code = match[1];
      if (NEEDED_ACCOUNTS.has(code)) {
        acctColumns.set(i, code);
      }
    }
  }

  const isWideFormat = acctColumns.size > 0;

  if (isWideFormat) {
    console.log(`  Wide format detected — ${acctColumns.size} matching account columns`);
    const result = new Map();
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const fields = parseCSVLine(line);
      const cuNumber = parseInt(fields[cuNumIdx]);
      if (isNaN(cuNumber)) continue;

      const accts = {};
      for (const [colIdx, code] of acctColumns) {
        const value = parseFloat(fields[colIdx]) || 0;
        if (value !== 0) accts[code] = value;
      }
      if (Object.keys(accts).length > 0) {
        result.set(cuNumber, accts);
      }
    }
    return { records: result, format: 'wide' };
  }

  // Old long format fallback
  const acctIdx = header.findIndex(h => h.toUpperCase().includes('ACCT') && !h.toUpperCase().includes('VALUE'));
  const valueIdx = header.findIndex(h => h.toUpperCase().includes('VALUE') || h.toUpperCase().includes('ACCT_VALUE'));

  if (acctIdx === -1 || valueIdx === -1) {
    console.log('  Could not find ACCT_CODE/ACCT_VALUE columns. Headers:', header.slice(0, 10));
    return null;
  }

  console.log('  Long format detected');
  const result = new Map();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = parseCSVLine(line);
    const acctCode = (fields[acctIdx] || '').replace(/^Acct_/i, '').trim();
    if (!NEEDED_ACCOUNTS.has(acctCode)) continue;
    const cuNumber = parseInt(fields[cuNumIdx]);
    const value = parseFloat(fields[valueIdx]) || 0;
    if (isNaN(cuNumber)) continue;
    if (!result.has(cuNumber)) result.set(cuNumber, {});
    result.get(cuNumber)[acctCode] = value;
  }
  return { records: result, format: 'long' };
}

// ── Build quarter data ────────────────────────────────────────────────
// multiplier: 1000 for old long format (values in thousands), 1 for wide format (values in dollars)
function buildCallReportQuarter(cuNumber, accts, cycleDate, multiplier = 1) {
  const totalAssets = (accts['010'] || 0) * multiplier;
  const totalShares = (accts['013'] || 0) * multiplier;
  const totalLoans = (accts['025B'] || 0) * multiplier;
  const totalDelinquent = (accts['041B'] || 0) * multiplier;
  const chargeOffs = (accts['550'] || 0) * multiplier;
  const recoveries = (accts['551'] || 0) * multiplier;
  const netChargeOffs = chargeOffs - recoveries;
  const allowance = (accts['719'] || 0) * multiplier;
  // Net worth: derive from balance sheet (Assets - Shares - Borrowings)
  const totalBorrowings = (accts['860C'] || 0) * multiplier;
  const estimatedNetWorth = totalAssets - totalShares - totalBorrowings;
  const netWorthRatio = totalAssets > 0 ? (estimatedNetWorth / totalAssets) * 100 : 0;
  const currentMembers = accts['083'] || 0;
  const potentialMembers = accts['084'] || 0;
  // Loan breakdown per NCUA AcctDesc:
  const autoLoans = ((accts['370'] || 0) + (accts['385'] || 0)) * multiplier; // 370=Used + 385=New Vehicle
  const cardLoans = (accts['396'] || 0) * multiplier;     // 396 = Unsecured Credit Card Loans
  const consumerLoans = (accts['397'] || 0) * multiplier; // 397 = Other Unsecured Loans
  // RE loans: derive from total minus known categories (703 is empty in recent data)
  const knownLoans = autoLoans + cardLoans + consumerLoans;
  const reLoans = Math.max(0, totalLoans - knownLoans);   // Remainder = RE + commercial + other
  const commercialLoans = 0;
  const revenue = (accts['115'] || 0) * multiplier;       // 115 = Total Interest Income
  const opex = 0; // Not available as a single account

  const delinquencyRatio = totalLoans > 0 ? totalDelinquent / totalLoans : 0;
  const netChargeOffRatio = totalLoans > 0 ? netChargeOffs / totalLoans : 0;
  const coverageRatio = totalDelinquent > 0 ? allowance / totalDelinquent : 0;
  const memberPenetration = potentialMembers > 0 ? currentMembers / potentialMembers : 0;
  const efficiencyRatio = revenue > 0 ? (opex / revenue) * 100 : 0;

  const loanTotal = reLoans + autoLoans + cardLoans + consumerLoans + commercialLoans;

  return {
    cycleDate, cuNumber, totalAssets, totalShares, totalLoans,
    totalDelinquentLoans: totalDelinquent,
    delinquencyRatio: Math.round(delinquencyRatio * 10000) / 10000,
    totalChargeOffs: chargeOffs, totalRecoveries: recoveries, netChargeOffs,
    netChargeOffRatio: Math.round(netChargeOffRatio * 10000) / 10000,
    allowanceForLoanLosses: allowance,
    coverageRatio: Math.round(coverageRatio * 100) / 100,
    netWorthRatio: Math.round(netWorthRatio * 100) / 100,
    currentMembers, potentialMembers,
    memberPenetration: Math.round(memberPenetration * 1000) / 1000,
    realEstateLoans: reLoans, autoLoans, creditCardLoans: cardLoans,
    otherConsumerLoans: consumerLoans, commercialLoans,
    loanComposition: {
      realEstate: loanTotal > 0 ? Math.round((reLoans / loanTotal) * 1000) / 10 : 0,
      auto: loanTotal > 0 ? Math.round((autoLoans / loanTotal) * 1000) / 10 : 0,
      creditCard: loanTotal > 0 ? Math.round((cardLoans / loanTotal) * 1000) / 10 : 0,
      otherConsumer: loanTotal > 0 ? Math.round((consumerLoans / loanTotal) * 1000) / 10 : 0,
      commercial: loanTotal > 0 ? Math.round((commercialLoans / loanTotal) * 1000) / 10 : 0,
    },
    operatingExpenses: opex, totalRevenue: revenue,
    efficiencyRatio: Math.round(efficiencyRatio * 10) / 10,
  };
}

function computeTrends(latest, previous) {
  if (!previous) return null;
  const bpChange = (cur, prev) => Math.round((cur - prev) * 10000);
  const pctChange = (cur, prev) => prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : 0;
  return {
    delinquencyChange: bpChange(latest.delinquencyRatio, previous.delinquencyRatio),
    netChargeOffChange: bpChange(latest.netChargeOffRatio, previous.netChargeOffRatio),
    netWorthRatioChange: Math.round((latest.netWorthRatio - previous.netWorthRatio) * 100),
    efficiencyChange: Math.round((latest.efficiencyRatio - previous.efficiencyRatio) * 10),
    memberGrowthRate: pctChange(latest.currentMembers, previous.currentMembers),
    assetGrowthRate: pctChange(latest.totalAssets, previous.totalAssets),
    loanGrowthRate: pctChange(latest.totalLoans, previous.totalLoans),
    coverageRatioChange: Math.round((latest.coverageRatio - previous.coverageRatio) * 100) / 100,
  };
}

// ── Download and parse a quarter ──────────────────────────────────────
async function downloadQuarter(yearMonth, label) {
  // Try both URL formats: YYYYMM and YYYY-MM
  const urls = [
    `https://ncua.gov/files/publications/analysis/call-report-data-${yearMonth}.zip`,
    `https://ncua.gov/files/publications/analysis/call-report-data-${yearMonth.slice(0,4)}-${yearMonth.slice(4)}.zip`,
  ];

  for (const url of urls) {
    console.log(`  Trying: ${url}`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!response.ok) {
        console.log(`  HTTP ${response.status} — trying next`);
        continue;
      }

      const buffer = await response.arrayBuffer();
      const sizeMB = (buffer.byteLength / 1024 / 1024).toFixed(1);
      console.log(`  Downloaded ${sizeMB} MB`);

      const { default: AdmZip } = await import('adm-zip');
      const zip = new AdmZip(Buffer.from(buffer));
      const entries = zip.getEntries();
      console.log(`  ZIP entries: ${entries.map(e => e.entryName).join(', ')}`);

      // Find FS220 (not FS220A)
      const fs220Entry = entries.find(e =>
        e.entryName.toLowerCase().includes('fs220') &&
        !e.entryName.toLowerCase().includes('fs220a') &&
        (e.entryName.toLowerCase().endsWith('.txt') || e.entryName.toLowerCase().endsWith('.csv'))
      );

      if (!fs220Entry) {
        console.log(`  FS220 not found in ZIP`);
        continue;
      }

      // Parse FS220.txt (main), FS220A.txt (loan breakdown, revenue), FS220B.txt (opex)
      // and merge all account data by CU_NUMBER
      const filesToParse = [
        { entry: fs220Entry, label: fs220Entry.entryName },
        { entry: entries.find(e => e.entryName.toUpperCase() === 'FS220A.TXT'), label: 'FS220A.txt' },
      ].filter(f => f.entry);

      let mergedData = null;

      for (const { entry: fileEntry, label: fileLabel } of filesToParse) {
        console.log(`  Parsing ${fileLabel}...`);
        const csvContent = fileEntry.getData().toString('utf-8');
        const parsed = parseFS220CSV(csvContent);
        if (!parsed || parsed.records.size === 0) continue;

        if (!mergedData) {
          mergedData = parsed;
        } else {
          // Merge: add accounts from this file to existing CU records
          for (const [cuNum, accts] of parsed.records.entries()) {
            if (mergedData.records.has(cuNum)) {
              Object.assign(mergedData.records.get(cuNum), accts);
            } else {
              mergedData.records.set(cuNum, accts);
            }
          }
        }
      }

      const data = mergedData;

      // Also extract CU names from FOICU.txt
      const foicuEntry = entries.find(e => e.entryName.toUpperCase() === 'FOICU.TXT');
      let cuNames = new Map();
      if (foicuEntry) {
        const foicuContent = foicuEntry.getData().toString('utf-8');
        const foicuLines = foicuContent.split('\n');
        const foicuHeader = parseCSVLine(foicuLines[0]);
        const fnCuNum = foicuHeader.findIndex(h => h.toUpperCase() === 'CU_NUMBER');
        const fnCuName = foicuHeader.findIndex(h => h.toUpperCase() === 'CU_NAME');
        const fnCity = foicuHeader.findIndex(h => h.toUpperCase().includes('CITY') || h.toUpperCase().includes('PHYS_CITY'));
        const fnState = foicuHeader.findIndex(h => h.toUpperCase().includes('STATE') || h.toUpperCase().includes('PHYS_STATE'));
        if (fnCuNum !== -1 && fnCuName !== -1) {
          for (let i = 1; i < foicuLines.length; i++) {
            const fields = parseCSVLine(foicuLines[i]);
            const cn = parseInt(fields[fnCuNum]);
            if (!isNaN(cn)) {
              cuNames.set(cn, {
                name: fields[fnCuName] || '',
                city: fnCity !== -1 ? (fields[fnCity] || '') : '',
                state: fnState !== -1 ? (fields[fnState] || '') : '',
              });
            }
          }
          console.log(`  ✓ Extracted names for ${cuNames.size} CUs from FOICU.txt`);
        }
      }

      if (data && data.records && data.records.size > 0) {
        console.log(`  ✓ ${label}: parsed ${data.records.size} credit unions (format: ${data.format})`);
        return { financials: data.records, format: data.format, names: cuNames };
      }
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log('=== NCUA 5300 Call Report Data Refresh ===\n');

  // Based on current date (March 2026), latest available should be Dec 2025
  const quarters = [
    { yearMonth: '202512', date: '2025-12-31', label: 'Q4 2025' },
    { yearMonth: '202509', date: '2025-09-30', label: 'Q3 2025' },
    { yearMonth: '202506', date: '2025-06-30', label: 'Q2 2025' },
  ];

  console.log('Downloading latest two quarters...\n');

  let latestResult = null, latestQ = null;
  let previousResult = null, previousQ = null;

  // Try quarters in order — use first two that work
  for (const q of quarters) {
    console.log(`\n[${q.label}] (${q.yearMonth})`);
    const result = await downloadQuarter(q.yearMonth, q.label);
    if (result) {
      if (!latestResult) {
        latestResult = result;
        latestQ = q;
      } else if (!previousResult) {
        previousResult = result;
        previousQ = q;
        break;
      }
    }
  }

  if (!latestResult) {
    console.error('\n✗ Could not download any call report data.');
    process.exit(1);
  }

  const latestData = latestResult.financials;
  const latestMultiplier = latestResult.format === 'wide' ? 1 : 1000;
  const previousData = previousResult ? previousResult.financials : null;
  const prevMultiplier = previousResult ? (previousResult.format === 'wide' ? 1 : 1000) : 1000;
  const cuNames = latestResult.names; // CU names from FOICU.txt

  console.log(`\nBuilding call report store...`);
  console.log(`  Latest: ${latestQ.label} (${latestQ.date})`);
  if (previousQ) console.log(`  Previous: ${previousQ.label} (${previousQ.date})`);

  const store = {
    meta: {
      latestCycleDate: latestQ.date,
      previousCycleDate: previousQ ? previousQ.date : null,
      cuCount: latestData.size,
      fetchedAt: new Date().toISOString(),
      source: 'bulk-csv',
    },
    data: {},
  };

  for (const [cuNumber, latestAccts] of latestData.entries()) {
    const latestQuarter = buildCallReportQuarter(cuNumber, latestAccts, latestQ.date, latestMultiplier);
    const prevAccts = previousData ? previousData.get(cuNumber) : null;
    const prevQuarter = prevAccts ? buildCallReportQuarter(cuNumber, prevAccts, previousQ.date, prevMultiplier) : null;
    const trends = prevQuarter ? computeTrends(latestQuarter, prevQuarter) : null;

    const nameInfo = cuNames.get(cuNumber) || {};
    store.data[String(cuNumber)] = {
      cuNumber,
      cuName: nameInfo.name || '',
      city: nameInfo.city || '',
      state: nameInfo.state || '',
      latestQuarter,
      previousQuarter: prevQuarter,
      trends,
    };
  }

  // Save as both seed and cache
  const seedFile = join(DATA_DIR, 'call-report-seed.json');
  const cacheFile = join(DATA_DIR, 'call-report-cache.json');

  writeFileSync(seedFile, JSON.stringify(store, null, 2));
  writeFileSync(cacheFile, JSON.stringify(store, null, 2));

  const sizeMB = (Buffer.byteLength(JSON.stringify(store)) / 1024 / 1024).toFixed(1);
  console.log(`\n✓ Saved ${Object.keys(store.data).length} CUs to call-report-seed.json and call-report-cache.json (${sizeMB} MB)`);
  console.log(`  Latest quarter: ${store.meta.latestCycleDate}`);
  console.log(`  Previous quarter: ${store.meta.previousCycleDate || 'N/A'}`);

  // ── Build NCUA seed from FOICU.txt ───────────────────────────────────
  console.log('\n=== NCUA Credit Union Directory Seed ===\n');

  if (cuNames.size > 0) {
    const seedData = [];
    for (const [cuNumber, info] of cuNames.entries()) {
      const financial = store.data[String(cuNumber)];
      seedData.push({
        cu_number: String(cuNumber),
        cu_name: info.name,
        city: info.city,
        state: info.state,
        total_assets: financial ? financial.latestQuarter.totalAssets : 0,
        members: financial ? financial.latestQuarter.currentMembers : 0,
        total_loans: financial ? financial.latestQuarter.totalLoans : 0,
        total_shares: financial ? financial.latestQuarter.totalShares : 0,
      });
    }
    seedData.sort((a, b) => (b.total_assets || 0) - (a.total_assets || 0));

    const ncuaSeed = {
      meta: {
        fetchedAt: new Date().toISOString(),
        source: 'FOICU.txt from NCUA call report ZIP (Q4 2025)',
        count: seedData.length,
      },
      data: seedData,
    };

    const seedFile2 = join(DATA_DIR, 'ncua-seed.json');
    writeFileSync(seedFile2, JSON.stringify(ncuaSeed, null, 2));
    const sizeMB2 = (Buffer.byteLength(JSON.stringify(ncuaSeed)) / 1024 / 1024).toFixed(1);
    console.log(`✓ Saved ${seedData.length} CUs to ncua-seed.json (${sizeMB2} MB)`);
    console.log('  Top 5 by assets:');
    seedData.slice(0, 5).forEach((cu, i) => {
      console.log(`    ${i+1}. ${cu.cu_name} (${cu.state}) — $${(cu.total_assets / 1e9).toFixed(1)}B`);
    });
  } else {
    console.log('No CU directory data available from FOICU.txt');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
