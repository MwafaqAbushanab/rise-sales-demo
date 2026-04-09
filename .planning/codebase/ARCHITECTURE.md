# Architecture

**Analysis Date:** 2026-03-17

## Pattern Overview

**Overall:** Distributed multi-tier architecture with **React Router-based frontend** (7 tabs, URL-driven navigation) + **Express backend** (data persistence, API proxies, AI integrations) + **dual external data sources** (FDIC real-time API, NCUA Socrata + cached 5300 Call Reports).

**Key Characteristics:**
- Lead-centric UI with drill-down from list → detail → intelligence analysis
- Server acts as smart cache/proxy layer for government APIs (NCUA, FDIC)
- Snapshot-based alert engine (compare current vs historical institutional data)
- Composable utility layer (analysis functions orchestrate into higher-level features)
- Graceful degradation: server unavailable → localStorage fallback; API unavailable → cached/seed data fallback
- Error boundaries wrap each major feature section

## Layers

**Frontend (React + TypeScript):**
- Purpose: Interactive SPA for sales reps to discover leads, analyze prospects, generate pre-call briefs, track alerts
- Location: `src/`
- Contains: Components, hooks, utilities, types, API client services
- Depends on: Express backend API (`http://localhost:3002`), external government APIs (FDIC, NCUA)
- Used by: Web browsers (Vite dev server on port 5173, Vercel in production)

**Backend (Express + Node.js):**
- Purpose: Data persistence, API caching, file I/O, AI model invocation (Groq), NCUA 5300 integration
- Location: `server/`
- Contains: Route handlers, file-based JSON store, service modules (NCUA, Call Reports, Apollo contacts), data scripts
- Depends on: NCUA API (Socrata), FDIC API (accessed client-side), Groq API (for AI chat), Apollo API (for contact enrichment)
- Used by: React frontend via `fetch()` calls

**External Data Layers:**
- **NCUA (Credit Unions):** Socrata API (real-time) → server-side cache (24h TTL) → seed data fallback
- **FDIC (Community Banks):** REST API (client-side only, no caching)
- **NCUA 5300 Call Reports:** Quarterly ZIP downloads from NCUA → parsed CSV → JSON cache in `server/data/call-report-cache.json` + seed data
- **Apollo.io:** Contact enrichment (People Search free, Email enrichment paid) for decision-maker discovery

## Data Flow

**Lead Discovery Flow (Prospect Finder Tab):**

1. **Frontend mounts** → `useLeads()` hook fetches data
2. **useLeads logic:**
   - Fetch banks from FDIC API (client-side)
   - Fetch CUs from NCUA (hits server cache proxy first: `GET /api/ncua/credit-unions`)
   - Fetch saved sales data from server (`GET /api/leads`)
3. **Data merging:**
   - Transform bank/CU data to `Lead` objects via `bankToLead()`, `creditUnionToLead()`
   - Apply saved overrides (pipeline status, contact info, notes)
4. **Frontend filtering:**
   - In-memory `useMemo` filters by search, type, state, asset size, status
   - ICP Builder criteria applied client-side via `matchLeadsToICP()`
5. **UI updates** → table/board view with selected lead highlighted

**Intelligence Analysis Flow (when lead is selected):**

1. **Lead selection triggers memos in App.tsx:**
   - `analyzeProspect()` - ranks vs peer group, scores opportunity tier
   - `analyzeCompetitiveLandscape()` - identifies likely competitors
   - Call Report fetch via `useCallReport()` hook (lazy loads NCUA 5300 data)
2. **IntelligencePanel renders** 8 cards from orchestrated utilities
3. **Financial Deep Dive** lazy-loads via `useCallReport()`:
   - Fetches `GET /api/call-report/:charterNumber` from server
   - Server returns parsed 5300 data or seed fallback
   - Computes health score via `computeFinancialHealth()`

**Pre-Call Brief Flow:**

1. User navigates to `/precall`
2. `PreCallPrepDashboard` calls `generatePreCallBrief(selectedLead, allLeads)`
3. Brief orchestrator combines:
   - `analyzeProspect()` → opportunity tier, talking points
   - `analyzeCompetitiveLandscape()` → win probability, displacement strategy
   - `calculateROI()` → deal sizing, payback period
   - `analyzeProductFit()` → top 3 products + fit scores
   - `OBJECTION_LIBRARY` + picTopObjections() → situational responses
4. Returns structured `PreCallBrief` object (8 cards in UI)
5. User can copy to clipboard, print, or navigate to /

**Trigger Alerts Flow:**

1. **First visit:** `generateSampleAlerts()` creates synthetic historical baseline for top 20 CUs
2. **Snapshot creation:** `createSnapshot()` captures current lead assets, ROA, deposits, call report metrics
3. **Diff detection:** For each lead, run trigger detectors:
   - Growth: Asset/member/deposit changes >10%, branch expansion
   - Distress: ROA decline >0.2%, asset loss >5%, member loss >3%, deposit outflow >5%
   - 5300-based: Rising delinquency >50bp, capital erosion below 7%/5%, charge-off spike >25bp, efficiency ratio >85%
   - Scale: Crossing $100M, $500M, $1B, $5B, $10B thresholds
   - Opportunity: High ROA (>1.5%) untouched, greenfield territory (no existing clients in state)
4. **Priority scoring:** Weighted by type, magnitude, institution size, pipeline status
5. **UI filters/actions:** User can dismiss, mark reviewed, view brief, simulate changes (demo mode)
6. **Persistence:** Alert state (dismissed, reviewed) saved to `server/data/alerts-state.json`

**AI Chat & Email Generation:**

1. User initiates chat or email compose
2. Frontend sends prompt + lead context to `POST /api/chat` or `POST /api/generate/email`
3. Server invokes Groq API (`llama-3.3-70b-versatile`)
4. Groq returns generated response (streaming SSE for chat)
5. Frontend displays in modal/panel

**State Management:**

- **Local state:** React `useState` in components for UI toggles, modals, selections
- **URL state:** React Router path determines active tab; `localStorage` persists view preference (table/board)
- **Application state:** `useLeads()` hook manages leads array, filters, updates; refetch available via header button
- **Persistent storage:**
  - `server/data/sales-data.json` → lead pipeline updates (status, contact, notes)
  - `server/data/activities.json` → activity timeline per lead
  - `server/data/alerts-state.json` → dismissed/reviewed alert IDs
  - `localStorage` → ICP templates, saved filters, app preferences, fallback lead data

## Key Abstractions

**Lead:**
- Purpose: Unified representation of credit union or community bank with financial + pipeline data
- Location: `src/types/index.ts`
- Pattern: Extends basic financial data with sales pipeline fields (status, notes, contact, recommended products)
- Computed fields: `score` (0-100 asset/member/ROA-based), `callReport` (lazy), `decisionMakers` (lazy), `financialHealth` (lazy)

**ProspectIntelligence:**
- Purpose: Contextual analysis of a lead vs peer group
- Location: `src/utils/prospectingIntelligence.ts`
- Pattern: Pure function that ranks lead opportunity tier (Hot/Warm/Cold), scores 0-100, generates talking points
- Example: Navy Federal has $165B assets → "Hot" tier at enterprise scale

**PreCallBrief:**
- Purpose: Orchestrate all available intelligence into 8-card briefing document
- Location: `src/utils/preCallBrief.ts`
- Pattern: Aggregates outputs from 5+ utility functions (prospect analysis, competitive intel, ROI, product fit, objections)
- Used by: Pre-Call Prep dashboard, copied to clipboard for use in call

**TriggerAlert:**
- Purpose: Structured detection of buying signals from financial data deltas
- Location: `src/utils/triggerAlerts.ts`
- Pattern: Snapshot engine — capture baseline, diff current vs baseline, score by type + magnitude
- 4 detector functions: `detectGrowthTriggers()`, `detectDistressTriggers()`, `detect5300Triggers()`, `detectScaleTriggers()`, `detectOpportunityTriggers()`

**ICPMatch:**
- Purpose: Match lead against Ideal Customer Profile with scoring
- Location: `src/utils/prospectFinder.ts`
- Pattern: Range-based scoring (center of range = 100, edges degrade to 60). 4 built-in templates (Enterprise CU, Mid-Market CU, High-Growth, Community Banks)
- Saved to localStorage: `riseICPTemplates` (max 10 custom profiles)

**FinancialHealthScore:**
- Purpose: Composite 0-100 weighted score from NCUA 5300 call report data
- Location: `src/utils/financialHealth.ts`
- Pattern: 5 components weighted (Capital 25%, Asset Quality 25%, Earnings 20%, Liquidity 15%, Growth 15%)
- Risk levels: low/moderate/elevated/high

**CallReportData:**
- Purpose: NCUA 5300 quarterly regulatory filing with deep financial metrics
- Location: `src/types/callReport.ts`
- Pattern: Lazy-loaded from server; includes delinquency, charge-offs, net worth, efficiency, loan composition, CECL reserves
- Source: `server/callReportService.js` parses NCUA ZIP downloads

## Entry Points

**Frontend Entry:**
- Location: `src/main.tsx`
- Triggers: Browser loads app URL
- Responsibilities: Mount React app with Router + ErrorBoundary

**App Root:**
- Location: `src/App.tsx`
- Triggers: Router matches any path
- Responsibilities: Fetch all leads via `useLeads()`, manage selected lead state, orchestrate tabs via Routes, render top-level error boundaries

**Backend Entry:**
- Location: `server/index.js`
- Triggers: `npm run dev` (node --watch)
- Responsibilities: Start Express on port 3002, initialize data stores, set up routes, cache warming

**Data Refresh:**
- Location: `src/components/layout/AppHeader.tsx` (refresh button)
- Triggers: User click or app mount
- Responsibilities: Call `useLeads().fetchData()` to re-pull FDIC/NCUA data and saved state

## Error Handling

**Strategy:** Layered error boundaries + fallback chains at each data layer.

**Patterns:**

**Frontend Error Boundaries:**
- Top-level: `src/components/ErrorBoundary.tsx` wraps entire app
- Tab-level: Each major feature (table, intelligence, board, AI chat) wrapped individually
- Fallback: Shows error message + "try again" button; does not block sibling sections

**API Fallback Chains:**

1. **NCUA Data:** Server cache → Direct NCUA Socrata → Seed data (`server/data/ncua-seed.json`)
2. **FDIC Data:** Direct FDIC API → Empty array (client-side graceful degradation)
3. **Call Reports:** Server cache (`call-report-cache.json`) → Seed data (`call-report-seed.json`) → Null (no data, financial deep dive unavailable)
4. **Lead Updates:** Server POST → LocalStorage fallback (when server unavailable)
5. **Apollo Contacts:** API available → Graceful null (no decision makers shown, but no error)

**User-Facing Error Messages:**
- "Failed to fetch data. Please try again." (top banner with retry button)
- Component-level: "Failed to load" placeholders with retry actions
- AI Chat: Timeout + retry messaging (Groq API timeout handling)

## Cross-Cutting Concerns

**Logging:** `console.log()` and `console.error()` for debugging; tracked data source fallback (e.g., "NCUA: 5000 credit unions from server (live cache)")

**Validation:**
- Lead data: Required fields checked in mappers (`bankToLead`, `creditUnionToLead`)
- API responses: Shape validated implicitly (TS types) + defensive null checks
- Form inputs: ICP criteria, email compose — basic required field checks

**Authentication:** None — app is public SPA. Sales rep authentication deferred to Salesforce/Rise admin layer.

**Authorization:** None — all leads visible to all users (intended for sales team access control later)

**Performance Optimizations:**
- Data fetching: Parallel fetch for banks + CUs + saved data via `Promise.all()`
- Filtering: Client-side in-memory via `useMemo()` (re-calculates only when leads/filters change)
- Lazy loading: Call reports, contacts, financial health computed on demand
- Server caching: NCUA data cached 24h; Call Report cache refreshed via scheduled scripts
- Component rendering: Table pagination via `usePagination()` hook (virtual scrolling not yet implemented)

---

*Architecture analysis: 2026-03-17*
