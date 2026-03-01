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

// Account codes we extract from the 5300 CSV
const NEEDED_ACCOUNTS = new Set([
  '010', '013', '025B', '041B', '083', '084',
  '115', '370', '385', '396', '397', '550', '551',
  '657A', '703', '719', '998'
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
  // NCUA publishes quarterly: March, June, September, December
  // Data typically available ~2 months after quarter end
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  // Determine latest available quarter (with ~2 month lag)
  let latestYear, latestMonth, prevYear, prevMonth;

  if (month >= 12) {
    // Dec+: September data available
    latestYear = year; latestMonth = 9;
    prevYear = year; prevMonth = 6;
  } else if (month >= 9) {
    // Sep-Nov: June data available
    latestYear = year; latestMonth = 6;
    prevYear = year; prevMonth = 3;
  } else if (month >= 6) {
    // Jun-Aug: March data available
    latestYear = year; latestMonth = 3;
    prevYear = year - 1; prevMonth = 12;
  } else {
    // Jan-May: December data available
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
  // Quarter end dates
  if (month === 3) return '31';
  if (month === 6) return '30';
  if (month === 9) return '30';
  if (month === 12) return '31';
  return '30';
}

// ── CSV Download & Parse ─────────────────────────────────────────────────

async function downloadAndParseCallReport(yearMonth) {
  // yearMonth format: "202409"
  const url = `https://ncua.gov/files/publications/analysis/call-report-data-${yearMonth}.zip`;
  console.log(`Call Report: downloading ${url}...`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`Call Report: download failed (${response.status}) for ${yearMonth}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const { default: AdmZip } = await import('adm-zip');
    const zip = new AdmZip(Buffer.from(buffer));
    const entries = zip.getEntries();

    // Find the FS220 main financial data file
    const fs220Entry = entries.find(e =>
      e.entryName.toLowerCase().includes('fs220') &&
      !e.entryName.toLowerCase().includes('fs220a') &&
      e.entryName.toLowerCase().endsWith('.txt')
    ) || entries.find(e =>
      e.entryName.toLowerCase().includes('fs220') &&
      (e.entryName.toLowerCase().endsWith('.txt') || e.entryName.toLowerCase().endsWith('.csv'))
    );

    if (!fs220Entry) {
      console.log('Call Report: FS220 file not found in ZIP. Entries:', entries.map(e => e.entryName));
      return null;
    }

    console.log(`Call Report: parsing ${fs220Entry.entryName}...`);
    const csvContent = fs220Entry.getData().toString('utf-8');

    return parseFS220CSV(csvContent);
  } catch (err) {
    console.log(`Call Report: error downloading/parsing: ${err.message}`);
    return null;
  }
}

function parseFS220CSV(csvContent) {
  // FS220 CSV: CU_NUMBER, CYCLE_DATE, ACCT_CODE, ACCT_VALUE (and other fields)
  // We only need rows where ACCT_CODE is in our needed set
  const lines = csvContent.split('\n');
  if (lines.length < 2) return null;

  // Parse header to find column indices
  const header = parseCSVLine(lines[0]);
  const cuNumIdx = header.findIndex(h => h.toUpperCase().includes('CU_NUMBER') || h.toUpperCase() === 'CU_NUMBER');
  const acctIdx = header.findIndex(h => h.toUpperCase().includes('ACCT') && !h.toUpperCase().includes('VALUE'));
  const valueIdx = header.findIndex(h => h.toUpperCase().includes('VALUE') || h.toUpperCase().includes('ACCT_VALUE'));

  if (cuNumIdx === -1 || valueIdx === -1) {
    console.log('Call Report: could not find required columns. Headers:', header);
    return null;
  }

  // Parse rows into a map: cuNumber -> { acctCode -> value }
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

    if (!result.has(cuNumber)) {
      result.set(cuNumber, {});
    }
    result.get(cuNumber)[acctCode] = value;
  }

  console.log(`Call Report: parsed data for ${result.size} credit unions`);
  return result;
}

function parseCSVLine(line) {
  // Simple CSV parser that handles quoted fields
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

function buildCallReportQuarter(cuNumber, accts, cycleDate) {
  const totalAssets = (accts['010'] || 0) * 1000;  // Data in thousands
  const totalShares = (accts['013'] || 0) * 1000;
  const totalLoans = (accts['025B'] || 0) * 1000;
  const totalDelinquent = (accts['041B'] || 0) * 1000;
  const chargeOffs = (accts['550'] || 0) * 1000;
  const recoveries = (accts['551'] || 0) * 1000;
  const netChargeOffs = chargeOffs - recoveries;
  const allowance = (accts['719'] || 0) * 1000;
  const netWorthRatio = accts['998'] || 0;
  const currentMembers = accts['083'] || 0;
  const potentialMembers = accts['084'] || 0;
  const reLoans = (accts['385'] || 0) * 1000;
  const autoLoans = (accts['370'] || 0) * 1000;
  const cardLoans = (accts['703'] || 0) * 1000;
  const consumerLoans = (accts['396'] || 0) * 1000;
  const commercialLoans = (accts['397'] || 0) * 1000;
  const opex = (accts['657A'] || 0) * 1000;
  const revenue = (accts['115'] || 0) * 1000;

  const delinquencyRatio = totalLoans > 0 ? totalDelinquent / totalLoans : 0;
  const netChargeOffRatio = totalLoans > 0 ? netChargeOffs / totalLoans : 0;
  const coverageRatio = totalDelinquent > 0 ? allowance / totalDelinquent : 0;
  const memberPenetration = potentialMembers > 0 ? currentMembers / potentialMembers : 0;
  const efficiencyRatio = revenue > 0 ? (opex / revenue) * 100 : 0;

  // Loan composition percentages
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
    Math.round((currentRatio - prevRatio) * 10000); // basis points

  const pctChange = (current, prev) =>
    prev > 0 ? Math.round(((current - prev) / prev) * 1000) / 10 : 0;

  return {
    delinquencyChange: bpChange(latest.delinquencyRatio, previous.delinquencyRatio),
    netChargeOffChange: bpChange(latest.netChargeOffRatio, previous.netChargeOffRatio),
    netWorthRatioChange: Math.round((latest.netWorthRatio - previous.netWorthRatio) * 100), // in basis points of %
    efficiencyChange: Math.round((latest.efficiencyRatio - previous.efficiencyRatio) * 10), // in basis points (tenths of %)
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

  const [latestData, previousData] = await Promise.all([
    downloadAndParseCallReport(dates.latest),
    downloadAndParseCallReport(dates.previous),
  ]);

  if (!latestData) {
    throw new Error(`Failed to download call report data for ${dates.latest}`);
  }

  // Build CallReportData for each CU that has data
  const store = { meta: {}, data: {} };
  store.meta = {
    latestCycleDate: dates.latestDate,
    previousCycleDate: dates.previousDate,
    cuCount: latestData.size,
    fetchedAt: new Date().toISOString(),
    source: 'bulk-csv',
  };

  for (const [cuNumber, latestAccts] of latestData.entries()) {
    const latestQ = buildCallReportQuarter(cuNumber, latestAccts, dates.latestDate);
    const prevAccts = previousData ? previousData.get(cuNumber) : null;
    const prevQ = prevAccts ? buildCallReportQuarter(cuNumber, prevAccts, dates.previousDate) : null;
    const trends = prevQ ? computeTrends(latestQ, prevQ) : null;

    store.data[String(cuNumber)] = {
      cuNumber,
      cuName: '', // Name not in FS220, will be enriched from NCUA main data
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
