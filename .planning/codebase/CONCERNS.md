# Codebase Concerns

**Analysis Date:** 2026-03-17

## Tech Debt

**JSON File Storage (No Database):**
- Issue: All persistent data uses JSON files (`.json`) instead of a database: `sales-data.json`, `activities.json`, `contacts-cache.json`, `call-report-cache.json`, `alerts-snapshot.json`, `alerts-state.json`
- Files: `server/index.js`, `server/apolloContactService.js`, `server/callReportService.js`, `server/data/`
- Impact:
  - No concurrent write protection; simultaneous updates may corrupt files
  - 11MB call report cache loaded entirely into memory on startup
  - No backup/recovery mechanism
  - Scaling becomes problematic with 100K+ leads and activity history
  - Transaction support impossible (partial failures leave inconsistent state)
- Fix approach: Migrate to SQLite (lightweight, no infrastructure) or PostgreSQL (scalable). Phase 1: SQLite for MVP. Add data migrations and rollback scripts.

**Large Component Files (Cognitive Overload):**
- Issue: Multiple components exceed 600+ lines, making testing and maintenance difficult
- Files:
  - `src/components/dashboards/MarketingAgent.tsx` (921 lines)
  - `src/utils/dealCoaching.ts` (892 lines)
  - `src/utils/marketingAgent.ts` (854 lines)
  - `src/utils/competitiveIntelligence.ts` (755 lines)
  - `src/utils/salesAcceleration.ts` (676 lines)
  - `src/components/IntelligencePanel.tsx` (642 lines)
  - `src/utils/triggerAlerts.ts` (636 lines)
- Impact: Hard to understand intent, high defect rates, slow refactoring, testing bottleneck
- Fix approach: Extract sub-utilities from utils (e.g., score calculators, rule engines). Extract UI sub-components from dashboard panels. Aim for 300-400 line max per file.

**NCUA 5300 Data Format Fragility:**
- Issue: Code handles both "long" format (CU_NUMBER, CYCLE_DATE, ACCT_CODE, ACCT_VALUE) and "wide" format (CU_NUMBER, CYCLE_DATE, ..., ACCT_010, ACCT_013, ...). Comment at line 217 in `server/callReportService.js` notes "Detect format: wide format has ACCT_XXX columns in the header" — indicates NCUA changed CSV structure without deprecation notice. Code in `server/scripts/refresh-data.js` also duplicates this format-detection logic.
- Files: `server/callReportService.js` (lines 208-268), `server/scripts/refresh-data.js` (lines 52-129)
- Impact:
  - If NCUA changes format again (e.g., column names, account codes), data parsing silently fails — no error, just returns null
  - Two copies of parsing logic create maintenance burden and inconsistency risk
  - Missing account codes (703 "1st Mortgage RE", 997 "Net Worth", 998 "NW Ratio" noted as "empty in 2025 data" at line 30 of refresh-data.js) cause accuracy gaps in loan composition and net worth calculations
- Fix approach: Unify parsing logic in `callReportService.js`. Add strict format validation with detailed error messages. Create schema version file (`call-report-schema.json`) documenting expected columns per format. Add telemetry to alert on unexpected account codes.

**Missing Error Boundaries & Type Safety:**
- Issue: Multiple `any` type annotations in API transformers — no type validation on external data
- Files: `src/api/fdicApi.ts` (lines 92, 126), `src/api/ncuaApi.ts` (line 113)
- Impact: Silent failures if FDIC/NCUA API schema changes. No validation that required fields exist.
- Fix approach: Create strict Zod schemas for FDIC/NCUA responses. Validate at API boundary before transforming. Log schema mismatches.

**Performance Bottleneck: Call Report Data Loading:**
- Issue: `callReportStore` loads entire 11MB JSON file into memory at startup in `server/callReportService.js:54-68`. No pagination, no lazy loading.
- Files: `server/callReportService.js` (lines 29, 54-69)
- Impact:
  - Server startup time increases with data size
  - Scales poorly: 10K+ CU call reports will consume hundreds of MB
  - All API requests block until data is loaded
  - Memory usage constant regardless of active users
- Fix approach: Use SQLite with indices on charterNumber. Load call report metadata on startup, lazy-load quarters on demand. Cache frequently accessed CUs in LRU cache.

**Apollo.io Rate Limiting Without Backoff:**
- Issue: Enrichment queue has fixed 6-second delay between requests (`server/apolloContactService.js:187`) but no exponential backoff on 429 (rate limit) errors
- Files: `server/apolloContactService.js` (lines 174-192)
- Impact: If Apollo returns 429, request fails silently. No retry mechanism. Contact enrichment stops until server restart.
- Fix approach: Add retry logic with exponential backoff. Track rate limit headers and pause queue if needed. Add alerting for persistent failures.

**No Input Validation on API Endpoints:**
- Issue: Server accepts updates to lead status, activity logs, etc. with no validation
- Files: `server/index.js` (PUT `/api/leads/:id`, POST `/api/leads/:id/activities`)
- Impact: Malformed data can corrupt JSON files. No audit trail of who changed what. No rejection of invalid status values.
- Fix approach: Add Zod validation for all request bodies. Whitelist allowed status values. Log all mutations (who, when, what changed).

---

## Known Bugs

**NCUA Data Accuracy Issue (Recently Discovered):**
- Symptoms: Financial Deep Dive card shows calculated real estate loans even though account code 703 ("1st Mortgage RE") returns 0 in 2025 data
- Files: `server/callReportService.js` (lines 312-315), `server/scripts/refresh-data.js` (lines 152-154)
- Trigger: NCUA removed or renamed account code 703 without announcement. Code derives RE loans as remainder (`totalLoans - autoLoans - cardLoans - consumerLoans`), causing overstatement.
- Current behavior:
  ```javascript
  // RE loans: derive from total minus known categories (703 is empty in 2025+ data)
  const reLoans = Math.max(0, totalLoans - knownLoans);
  ```
  If total loans = $100M, auto = $20M, card = $10M, consumer = $15M, then RE = $55M (includes commercial + HELOC + anything else).
- Workaround: None. Loan composition breakdown is inaccurate for all CUs. Pre-Call Prep and Alert detection use this data.
- Fix approach: Request NCUA account mapping documentation. Fallback: mark these metrics as "Estimated" in UI with disclaimer. Contact NCUA to clarify 5300 structure changes.

**Multiplier Mismatch Risk:**
- Symptoms: Call report values may be off by 1000x if format detection fails silently
- Files: `server/callReportService.js` (lines 401, 403)
- Trigger: If wide format detection fails, code defaults to multiplier=1 (line 401: `const latestMultiplier = latestResult.format === 'wide' ? 1 : 1000;`). If data is actually long format, all values are underestimated by 1000x.
- Example: $1B CU appears as $1M.
- Workaround: Manually validate sample CU data against known sources (e.g., Navy Federal).
- Fix approach: Add sanity check — if total assets < $1M, warn. Require manual validation before cache write.

---

## Security Considerations

**API Key Exposure in Logs:**
- Risk: Apollo API key passed in headers (`server/apolloContactService.js:57`) may be logged by middleware or error handlers
- Files: `server/apolloContactService.js` (lines 49-69)
- Current mitigation: None visible. Dependencies (express, fetch) may log request details.
- Recommendations:
  - Mask API key in error messages (replace key with `***`)
  - Never log request headers in production
  - Use Helmet.js to suppress sensitive headers from logs
  - Rotate Apollo API key annually

**GROQ API Key in Frontend (via Server):**
- Risk: Risk of exposing `GROQ_API_KEY` if server endpoint logs or returns full request/response
- Files: `server/index.js` (POST `/api/chat`, `/api/chat/stream`) — backend proxies to Groq
- Current mitigation: Key stored in `server/.env` (not in code)
- Recommendations:
  - Validate that server never echoes request body in responses
  - Add rate limiting per IP on `/api/chat` endpoints (prevent brute-force)
  - Log only request metadata (timestamp, user, token length), never content

**File Path Traversal in Data Directory:**
- Risk: If any endpoint allows user-controlled filenames, could read outside `server/data/`
- Files: `server/data/` directory structure
- Current mitigation: No file uploads or user-controlled paths visible
- Recommendations:
  - Continue using fixed filenames for persistence
  - Add linting rule to prevent `fs.readFile()` with untrusted paths

**No Authentication on API Endpoints:**
- Risk: Anyone with network access can modify lead data, dismiss alerts, trigger contact enrichment (costing Apollo credits)
- Files: `server/index.js` (all endpoints)
- Current mitigation: None
- Recommendations:
  - Add API key validation (use env var, check header)
  - For demo: single shared key. For production: per-user tokens + request logging
  - Rate limit by IP to prevent abuse

---

## Performance Bottlenecks

**Large Prospect Intelligence Calculations:**
- Problem: `analyzeProspect()` in `src/utils/prospectingIntelligence.ts` runs O(n) calculations for every lead when a single lead is selected. Computes peer percentiles, relative metrics against all leads.
- Files: `src/App.tsx` (lines 98-112), `src/utils/prospectingIntelligence.ts` (entire file, 645 lines)
- Impact:
  - With 5K+ leads, selecting a lead causes 1-2 second delay in rendering Intelligence Panel
  - Peer group recalculated on every lead selection (no memoization across selections)
  - Mobile browsers may stutter
- Improvement path:
  - Memoize peer percentile calculations on full lead set
  - Move heavy calculations to worker thread for large datasets (1K+ leads)
  - Cache peer group stats (update once per data fetch, not per selection)

**CSV Export with Large Datasets:**
- Problem: Entire filtered lead list exported to CSV synchronously. No streaming.
- Files: `src/components/InstitutionsTable.tsx` (CSV export logic)
- Impact: Exporting 5K leads may hang UI for 3-5 seconds
- Improvement path: Stream CSV generation via server endpoint. Trigger download via data URI with chunking.

**Alert Detection on Every Data Fetch:**
- Problem: `generateAlerts()` runs O(n) scoring for all leads on data fetch
- Files: `src/utils/triggerAlerts.ts` (lines 200-300+)
- Impact: 10K leads × alert generation logic = 5-10 second load time
- Improvement path: Snapshot baseline on first visit, only detect deltas on refresh. Cache baseline in localStorage.

---

## Fragile Areas

**IntelligencePanel Component (Complex State & Data Dependencies):**
- Files: `src/components/IntelligencePanel.tsx` (642 lines)
- Why fragile:
  - 8 collapsible sections, each with independent state
  - Loads call report data asynchronously via hook (`useCallReport`)
  - Renders financial cards, contacts, competitive intel, ROI preview
  - If any sub-component fails (e.g., Apollo API down), entire panel breaks
  - No error boundaries per section — one error crashes whole panel
- Safe modification:
  - Always wrap new sections in `<ErrorBoundary>`
  - Load data in separate hooks, not in component body
  - Test each collapsed/expanded state combination
- Test coverage: Likely missing tests for error states (API failures, missing call report data)

**Call Report Data Pipeline (Multi-Format Parsing):**
- Files:
  - `server/callReportService.js` (lines 208-268)
  - `server/scripts/refresh-data.js` (lines 52-129)
- Why fragile:
  - Dual format detection relies on string matching (`/^ACCT_(.+)$/`)
  - If NCUA changes header naming (e.g., "ACCT CODE" instead of "ACCT_010"), silently fails
  - Two copies of logic create skew risk
  - No logging of parsing decisions
- Safe modification:
  - Add debug flag to dump parsed headers and detected format
  - Validate that row count matches expected (if long format, expect rows = CUs × account codes)
  - Test against real NCUA ZIPs before deploying refresh
- Test coverage: No unit tests for format detection or CSV parsing visible

**Trigger Alert Scoring Algorithm:**
- Files: `src/utils/triggerAlerts.ts` (lines 106-123)
- Why fragile:
  - Hard-coded weights (TYPE_WEIGHTS, size bonuses) — if sales team complains about rankings, weights must be tweaked
  - Scoring depends on call report data (delinquency, net worth) — if call report is inaccurate, alert ranking is wrong
  - Snapshot-based comparison: if baseline is stale, detects false alerts
- Safe modification:
  - Parameterize weights — move to config file or database
  - Add comment explaining each weight (why 30 for distress?)
  - Test with synthetic lead data covering edge cases (zero loans, negative equity)
- Test coverage: Likely untested

**Loan Composition Breakdown (Account Code Dependencies):**
- Files: `server/callReportService.js` (lines 308-332)
- Why fragile:
  - Hardcoded account codes (370, 385, 396, 397, 703) — if NCUA retires an account, parsing breaks
  - Derives RE loans from remainder — if new loan types added, remainder logic breaks
  - No checksum validation (loan total = sum of components)
- Safe modification:
  - Add unit test: `totalLoans === autoLoans + cardLoans + consumerLoans + realEstateLoans + commercialLoans`
  - Log discrepancies if totals don't match
  - Add comment with NCUA documentation link
- Test coverage: Not visible

---

## Scaling Limits

**Call Report Cache Size:**
- Current capacity: 11MB in-memory for ~4,700 CU call reports
- Limit: With 8GB Node.js heap, can support ~3,000 CUs at 2.5MB per quarter (latest + previous)
- Scaling path:
  1. Add SQLite with quarterly partitioning (one table per quarter)
  2. Index on charterNumber and cycleDate
  3. Load only 1 quarter at a time (lazy-load on demand)
  4. Implement LRU cache for frequently accessed CUs

**Activity Log Storage:**
- Current capacity: `activities.json` is 815 bytes for minimal test data. At scale: 1 activity per lead per 30 days × 10K leads = 300K records/year
- Limit: JSON file becomes 50MB+, memory load time degrades
- Scaling path: Archive old activities to separate files (`activities-2026-01.json`, `activities-2026-02.json`). Paginate API response.

**Contact Enrichment Queue:**
- Current capacity: `enrichmentQueue` in memory, 1 request per 6 seconds
- Limit: Can process ~600 per hour. With 10K CUs × 3 decision makers each, takes 3+ weeks to enrich all
- Scaling path: Distribute enrichment across multiple workers. Use job queue (Bull + Redis).

**Lead Search & Filter Performance:**
- Current capacity: `filteredLeads` computed via `.filter()` on every filter change
- Limit: 100K+ leads makes filtering sluggish (300ms+ per change)
- Scaling path: Implement server-side filtering with database indices. Add ElasticSearch for full-text search.

---

## Dependencies at Risk

**adm-zip (Call Report ZIP Extraction):**
- Risk: `adm-zip` package has minimal maintenance. If NCUA changes ZIP structure (e.g., nested folders), extraction may fail.
- Impact: Call report refresh breaks silently (returns null, uses stale cache)
- Migration plan: Replace with Node.js built-in `unzipper` or `yauzl` library (more actively maintained). Test against multiple NCUA ZIP formats.

**Groq API Changes:**
- Risk: `GROQ_MODEL` env var set to `llama-3.3-70b-versatile`. If Groq deprecates this model, all AI endpoints break.
- Impact: Chat, email generation, marketing content all fail. No fallback to older model.
- Current mitigation: Code at `server/index.js` handles model via env var.
- Migration plan: Support multiple model options. Add fallback to smaller model if primary fails. Monitor Groq API deprecation notices.

**FDIC & NCUA API Endpoints:**
- Risk: Both APIs are government systems with no SLA. Endpoints could move (e.g., `data.ncua.gov` → new domain).
- Impact: If primary NCUA endpoint fails, code tries 3 endpoints, then falls back to sample data. Okay for short outages, bad for permanent migrations.
- Current mitigation: Fallback chain in `src/api/ncuaApi.ts:34-101`
- Migration plan: Monitor FDIC/NCUA docs for deprecation notices. Implement health check endpoint (`GET /health/data-sources`) that alerts on API failures.

---

## Missing Critical Features

**No Data Audit Trail:**
- Problem: No log of who changed what lead status, what alert was dismissed, etc. User is anonymous.
- Files: `server/index.js`, `server/apolloContactService.js`
- Blocks: Compliance audits, debugging user actions, fraud detection

**No Backup & Restore:**
- Problem: If `sales-data.json` or `activities.json` corrupts, data is lost. No undo.
- Files: `server/data/`
- Blocks: Disaster recovery, data integrity guarantees

**No Data Export/Import UI:**
- Problem: No way to bulk import leads from CSV or Salesforce. Manual entry only.
- Files: (Feature doesn't exist)
- Blocks: Sales teams can't use this tool until they manually seed lead data

**No Role-Based Access Control:**
- Problem: All users see all leads, can edit any lead. No manager/rep distinction.
- Files: (No auth system)
- Blocks: Multi-team deployments, data privacy

---

## Test Coverage Gaps

**Call Report Format Detection Untested:**
- What's not tested: CSV parsing for both long and wide formats. No unit tests visible for `parseFS220CSV()`.
- Files: `server/callReportService.js` (lines 208-268)
- Risk: Format changes go unnoticed. Silent failures.
- Priority: **High** — this is a data pipeline critical path

**API Response Schema Validation:**
- What's not tested: FDIC/NCUA API responses matched against expected schema. If API adds/removes fields, code silently ignores or crashes.
- Files: `src/api/fdicApi.ts`, `src/api/ncuaApi.ts`
- Risk: Data corruption, missing fields in lead records
- Priority: **High** — impacts data integrity

**Trigger Alert Scoring Edge Cases:**
- What's not tested: Zero assets, negative equity, missing call report data. Edge case behavior of alert scoring.
- Files: `src/utils/triggerAlerts.ts` (lines 106-123)
- Risk: Nonsensical alert priorities (negative scores, division by zero)
- Priority: **Medium** — affects ranking, not functionality

**Error Boundary Coverage:**
- What's not tested: What happens when IntelligencePanel fails to load call report? When Apollo API is down? Are errors gracefully caught or does UI crash?
- Files: `src/components/IntelligencePanel.tsx`, `src/components/dashboards/PreCallPrep.tsx`, etc.
- Risk: User sees blank screen instead of helpful message
- Priority: **Medium** — affects user experience

**LeadDetailPanel Contact Form Validation:**
- What's not tested: Invalid email format, phone number format, etc. No client-side validation visible.
- Files: `src/components/LeadDetailPanel.tsx`
- Risk: Corrupted contact data in JSON files
- Priority: **Low** — minor data quality issue

---

*Concerns audit: 2026-03-17*
