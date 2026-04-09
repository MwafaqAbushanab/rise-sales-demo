// NCUA 5300 Call Report Service
// Downloads, parses, and caches quarterly call report data
// Data source: https://ncua.gov/analysis/credit-union-corporate-call-report-data/quarterly-data

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const CACHE_FILE = join(DATA_DIR, 'call-report-cache.json');
const SEED_FILE = join(DATA_DIR, 'call-report-seed.json');

// Account codes from NCUA 5300 Call Reports:
// FS220: 010 (Total Assets), 013 (Total Shares), 025B (Total Loans), 041B (Delinquent),
//        083 (Current Members), 084 (Potential Members), 550 (Charge-offs), 551 (Recoveries),
//        719 (Allowance), 860C (Total Borrowings)
// FS220A: 115 (Total Interest Income), 370 (Used Vehicle), 385 (New Vehicle),
//         396 (CC Loans), 397 (Other Unsecured)
const NEEDED_ACCOUNTS = new Set([
  '010', '013', '025B', '041B', '083', '084',
  '115', '370', '385', '396', '397', '550', '551',
  '719', '860C'
]);

// In-memory call report data store
let callReportStore = null; // { meta, data: { [charterNumber]: CallReportData } }

// ── Load / Save ──────────────────────────────────────────────────────────

function readCache() {
  if (!existsSync(CACHE_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
  } catch { return null; }
}

function writeCache(store) {
  writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2));
}

function readSeed() {
  if (!existsSync(SEED_FILE)) return null;
  try {
    return JSON.parse(readFileSync(SEED_FILE, 'utf-8'));
  } catch { return null; }
}

// ── Initialize ───────────────────────────────────────────────────────────

export function initCallReportData() {
  // Try cache first, then seed
  callReportStore = readCache();
  if (callReportStore && callReportStore.data && Object.keys(callReportStore.data).length > 0) {
    console.log(`Call Report: loaded ${Object.keys(callReportStore.data).length} CUs from cache`);
    return;
  }

  callReportStore = readSeed();
  if (callReportStore && callReportStore.data && Object.keys(callReportStore.data).length > 0) {
    console.log(`Call Report: loaded ${Object.keys(callReportStore.data).length} CUs from seed data`);
    return;
  }

  console.log('Call Report: no data available (no cache or seed file)');
  callReportStore = null;
}

// ── Lookup ───────────────────────────────────────────────────────────────

export function getCallReportForCU(charterNumber) {
  if (!callReportStore || !callReportStore.data) return null;
  const cn = String(charterNumber);
  return callReportStore.data[cn] || null;
}

export function getAllCallReportData() {
  if (!callReportStore || !callReportStore.data) return {};
  return callReportStore.data;
}

export function getCallReportMeta() {
  if (!callReportStore || !callReportStore.meta) return null;
  return {
    ...callReportStore.meta,
    cuCount: callReportStore.data ? Object.keys(callReportStore.data).length : 0,
  };
}

// ── Quarter Date Helpers ─────────────────────────────────────────────────

function getLatestQuarterDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let latestYear, latestMonth, prevYear, prevMonth;

  if (month >= 12) {
    latestYear = year; latestMonth = 9;
    prevYear = year; prevMonth = 6;
  } else if (month >= 9) {
    latestYear = year; latestMonth = 6;
    prevYear = year; prevMonth = 3;
  } else if (month >= 6) {
    latestYear = year; latestMonth = 3;
    prevYear = year - 1; prevMonth = 12;
  } else {
    latestYear = year - 1; latestMonth = 12;
    prevYear = year - 1; prevMonth = 9;
  }

  return {
    latest: `${latestYear}${String(latestMonth).padStart(2, '0')}`,
    previous: `${prevYear}${String(prevMonth).padStart(2, '0')}`,
    latestDate: `${latestYear}-${String(latestMonth).padStart(2, '0')}-${getQuarterEndDay(latestMonth)}`,
    previousDate: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${getQuarterEndDay(prevMonth)}`,
  };
}

function getQuarterEndDay(month) {
  if (month === 3) return '31';
  if (month === 6) return '30';
  if (month === 9) return '30';
  if (month === 12) return '31';
  return '30';
}

// ── CSV Download & Parse ─────────────────────────────────────────────────

async function downloadAndParseCallReport(yearMonth) {
  // Try both URL formats: YYYYMM and YYYY-MM
  const urls = [
    `https://ncua.gov/files/publications/analysis/call-report-data-${yearMonth}.zip`,
    `https://ncua.gov/files/publications/analysis/call-report-data-${yearMonth.slice(0,4)}-${yearMonth.slice(4)}.zip`,
  ];

  for (const url of urls) {
    console.log(`Call Report: trying ${url}...`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!response.ok) {
        console.log(`Call Report: HTTP ${response.status} — trying next`);
        continue;
      }

      const buffer = await response.arrayBuffer();
      const { default: AdmZip } = await import('adm-zip');
      const zip = new AdmZip(Buffer.from(buffer));
      const entries = zip.getEntries();

      // Find FS220 main file (not FS220A etc.)
      const fs220Entry = entries.find(e =>
        e.entryName.toUpperCase() === 'FS220.TXT'
      );

      if (!fs220Entry) {
        console.log('Call Report: FS220.txt not found in ZIP');
        continue;
      }

      // Parse FS220.txt and FS220A.txt, merge accounts
      const filesToParse = [
        { entry: fs220Entry, label: 'FS220.txt' },
        { entry: entries.find(e => e.entryName.toUpperCase() === 'FS220A.TXT'), label: 'FS220A.txt' },
      ].filter(f => f.entry);

      let mergedRecords = null;
      let format = 'long';

      for (const { entry, label } of filesToParse) {
        console.log(`Call Report: parsing ${label}...`);
        const csvContent = entry.getData().toString('utf-8');
        const parsed = parseFS220CSV(csvContent);
        if (!parsed) continue;

        format = parsed.format;
        if (!mergedRecords) {
          mergedRecords = parsed.records;
        } else {
          for (const [cuNum, accts] of parsed.records.entries()) {
            if (mergedRecords.has(cuNum)) {
              Object.assign(mergedRecords.get(cuNum), accts);
            } else {
              mergedRecords.set(cuNum, accts);
            }
          }
        }
      }

      if (mergedRecords && mergedRecords.size > 0) {
        console.log(`Call Report: parsed ${mergedRecords.size} CUs (format: ${format})`);
        return { records: mergedRecords, format };
      }
    } catch (err) {
      console.log(`Call Report: error: ${err.message}`);
    }
  }

  return null;
}

// Handles BOTH formats:
//   Old (long): CU_NUMBER, CYCLE_DATE, ACCT_CODE, ACCT_VALUE (one row per account)
//   New (wide): CU_NUMBER, CYCLE_DATE, ..., ACCT_010, ACCT_013, ... (one row per CU)
function parseFS220CSV(csvContent) {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return null;

  const header = parseCSVLine(lines[0]);
  const cuNumIdx = header.findIndex(h => h.toUpperCase() === 'CU_NUMBER');

  if (cuNumIdx === -1) return null;

  // Detect format: wide format has ACCT_XXX columns in the header
  const acctColumns = new Map();
  for (let i = 0; i < header.length; i++) {
    const match = header[i].toUpperCase().match(/^ACCT_(.+)$/);
    if (match && NEEDED_ACCOUNTS.has(match[1])) {
      acctColumns.set(i, match[1]);
    }
  }

  if (acctColumns.size > 0) {
    // Wide format
    const records = new Map();
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
        records.set(cuNumber, accts);
      }
    }
    return { records, format: 'wide' };
  }

  // Old long format
  const acctIdx = header.findIndex(h => h.toUpperCase().includes('ACCT') && !h.toUpperCase().includes('VALUE'));
  const valueIdx = header.findIndex(h => h.toUpperCase().includes('VALUE') || h.toUpperCase().includes('ACCT_VALUE'));

  if (acctIdx === -1 || valueIdx === -1) return null;

  const records = new Map();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = parseCSVLine(line);
    const acctCode = (fields[acctIdx] || '').replace(/^Acct_/i, '').trim();
    if (!NEEDED_ACCOUNTS.has(acctCode)) continue;
    const cuNumber = parseInt(fields[cuNumIdx]);
    const value = parseFloat(fields[valueIdx]) || 0;
    if (isNaN(cuNumber)) continue;
    if (!records.has(cuNumber)) records.set(cuNumber, {});
    records.get(cuNumber)[acctCode] = value;
  }
  return { records, format: 'long' };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ── Build CallReportData from raw account values ─────────────────────────
// multiplier: 1000 for old long format (values in thousands), 1 for wide format (full dollars)

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
  const autoLoans = ((accts['370'] || 0) + (accts['385'] || 0)) * multiplier; // Used + New Vehicle
  const cardLoans = (accts['396'] || 0) * multiplier;     // Unsecured Credit Card
  const consumerLoans = (accts['397'] || 0) * multiplier; // Other Unsecured
  // RE loans: derive from total minus known categories (703 is empty in 2025+ data)
  const knownLoans = autoLoans + cardLoans + consumerLoans;
  const reLoans = Math.max(0, totalLoans - knownLoans);
  const commercialLoans = 0;
  const revenue = (accts['115'] || 0) * multiplier;       // Total Interest Income
  const opex = 0; // Not available as a single account in 5300 data

  const delinquencyRatio = totalLoans > 0 ? totalDelinquent / totalLoans : 0;
  const netChargeOffRatio = totalLoans > 0 ? netChargeOffs / totalLoans : 0;
  const coverageRatio = totalDelinquent > 0 ? allowance / totalDelinquent : 0;
  const memberPenetration = potentialMembers > 0 ? currentMembers / potentialMembers : 0;
  const efficiencyRatio = revenue > 0 ? (opex / revenue) * 100 : 0;

  const loanTotal = reLoans + autoLoans + cardLoans + consumerLoans + commercialLoans;
  const loanComposition = {
    realEstate: loanTotal > 0 ? Math.round((reLoans / loanTotal) * 1000) / 10 : 0,
    auto: loanTotal > 0 ? Math.round((autoLoans / loanTotal) * 1000) / 10 : 0,
    creditCard: loanTotal > 0 ? Math.round((cardLoans / loanTotal) * 1000) / 10 : 0,
    otherConsumer: loanTotal > 0 ? Math.round((consumerLoans / loanTotal) * 1000) / 10 : 0,
    commercial: loanTotal > 0 ? Math.round((commercialLoans / loanTotal) * 1000) / 10 : 0,
  };

  return {
    cycleDate,
    cuNumber,
    totalAssets,
    totalShares,
    totalLoans,
    totalDelinquentLoans: totalDelinquent,
    delinquencyRatio: Math.round(delinquencyRatio * 10000) / 10000,
    totalChargeOffs: chargeOffs,
    totalRecoveries: recoveries,
    netChargeOffs,
    netChargeOffRatio: Math.round(netChargeOffRatio * 10000) / 10000,
    allowanceForLoanLosses: allowance,
    coverageRatio: Math.round(coverageRatio * 100) / 100,
    netWorthRatio: Math.round(netWorthRatio * 100) / 100,
    currentMembers,
    potentialMembers,
    memberPenetration: Math.round(memberPenetration * 1000) / 1000,
    realEstateLoans: reLoans,
    autoLoans,
    creditCardLoans: cardLoans,
    otherConsumerLoans: consumerLoans,
    commercialLoans,
    loanComposition,
    operatingExpenses: opex,
    totalRevenue: revenue,
    efficiencyRatio: Math.round(efficiencyRatio * 10) / 10,
  };
}

function computeTrends(latest, previous) {
  if (!previous) return null;

  const bpChange = (currentRatio, prevRatio) =>
    Math.round((currentRatio - prevRatio) * 10000);

  const pctChange = (current, prev) =>
    prev > 0 ? Math.round(((current - prev) / prev) * 1000) / 10 : 0;

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

// ── Refresh from NCUA (full download) ────────────────────────────────────

export async function refreshCallReportData() {
  const dates = getLatestQuarterDates();
  console.log(`Call Report: refreshing data for quarters ${dates.latest} and ${dates.previous}`);

  const [latestResult, previousResult] = await Promise.all([
    downloadAndParseCallReport(dates.latest),
    downloadAndParseCallReport(dates.previous),
  ]);

  if (!latestResult) {
    throw new Error(`Failed to download call report data for ${dates.latest}`);
  }

  const latestData = latestResult.records;
  const latestMultiplier = latestResult.format === 'wide' ? 1 : 1000;
  const previousData = previousResult ? previousResult.records : null;
  const prevMultiplier = previousResult ? (previousResult.format === 'wide' ? 1 : 1000) : 1000;

  const store = { meta: {}, data: {} };
  store.meta = {
    latestCycleDate: dates.latestDate,
    previousCycleDate: dates.previousDate,
    cuCount: latestData.size,
    fetchedAt: new Date().toISOString(),
    source: 'bulk-csv',
  };

  for (const [cuNumber, latestAccts] of latestData.entries()) {
    const latestQ = buildCallReportQuarter(cuNumber, latestAccts, dates.latestDate, latestMultiplier);
    const prevAccts = previousData ? previousData.get(cuNumber) : null;
    const prevQ = prevAccts ? buildCallReportQuarter(cuNumber, prevAccts, dates.previousDate, prevMultiplier) : null;
    const trends = prevQ ? computeTrends(latestQ, prevQ) : null;

    store.data[String(cuNumber)] = {
      cuNumber,
      cuName: '',
      latestQuarter: latestQ,
      previousQuarter: prevQ,
      trends,
    };
  }

  callReportStore = store;
  writeCache(store);
  console.log(`Call Report: cached data for ${Object.keys(store.data).length} credit unions`);
}

// Export for use in server routes
export { getLatestQuarterDates };
