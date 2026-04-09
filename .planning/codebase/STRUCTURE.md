# Codebase Structure

**Analysis Date:** 2026-03-17

## Directory Layout

```
rise-sales-demo/
├── src/                        # Frontend React app (Vite + TypeScript)
│   ├── main.tsx               # Entry point: render App in #root
│   ├── App.tsx                # Root component: Router setup, lead fetching, tab orchestration
│   ├── index.css              # Global Tailwind + custom styles
│   ├── api/                   # API client services
│   │   ├── fdicApi.ts         # FDIC bank data fetching (client-side)
│   │   ├── ncuaApi.ts         # NCUA CU data + server proxy; fallback chain to seed data
│   │   ├── callReportApi.ts   # Call Report (5300) data client
│   │   ├── contactsApi.ts     # Apollo contact enrichment
│   │   └── aiService.ts       # AI chat/generation (Groq backend)
│   ├── components/            # Reusable UI components
│   │   ├── layout/
│   │   │   ├── AppHeader.tsx  # Top banner with logo, refresh button, loading state
│   │   │   └── TabNavigation.tsx  # 7-tab nav bar (Prospect Finder, Pre-Call, Alerts, etc.)
│   │   ├── ErrorBoundary.tsx  # Error boundary with fallback UI
│   │   ├── InstitutionsTable.tsx  # Lead list table with filters, ICP scoring, pipeline status
│   │   ├── PipelineBoard.tsx  # Kanban board view (new → contacted → won/lost)
│   │   ├── LeadDetailPanel.tsx    # Slide-out detail panel: editable contact, notes, activities
│   │   ├── IntelligencePanel.tsx  # 8-card intelligence: overview, opportunity, competitive, ROI, talking points, etc.
│   │   ├── AIChat.tsx         # Sales coaching chat window (streaming from Groq)
│   │   ├── ICPBuilder.tsx     # ICP criteria panel: 4 templates + custom; "Find Matches" button
│   │   ├── EmailComposer.tsx  # AI email generation modal
│   │   ├── ROICalculatorModal.tsx  # Deal sizing calculator
│   │   ├── ActivityTimeline.tsx    # Per-lead activity log (calls, emails, meetings, notes)
│   │   ├── ContactsCard.tsx   # Decision maker cards (Apollo enriched)
│   │   ├── ExecutiveSummary.tsx    # KPI overview + hot leads section
│   │   ├── SavedFilters.tsx   # Reusable filter chip bar
│   │   ├── FinancialHealthCard.tsx # Health score visualization + ratio cards
│   │   ├── GettingStarted.tsx      # Onboarding modal with demo scenarios
│   │   └── dashboards/        # Feature-specific dashboards (one per tab)
│   │       ├── PreCallPrep.tsx     # /precall — 8-card pre-call brief generator
│   │       ├── TriggerAlerts.tsx   # /alerts — Alert monitor with snapshot + simulation
│   │       ├── SalesAcceleration.tsx  # /acceleration — Hot lead ID, product recs, deal sizing
│   │       ├── TerritoryIntelligence.tsx  # /territory — Geographic market analysis
│   │       ├── DealCoaching.tsx    # /coaching — Follow-up sequences, objection handling
│   │       └── MarketingAgent.tsx  # /marketing — Content generation (social, blog, email, battle cards)
│   ├── hooks/                 # Custom React hooks
│   │   ├── useLeads.ts        # Data fetching (banks, CUs, sales data); filtering; updates
│   │   ├── useCallReport.ts   # Lazy load call report data for selected lead
│   │   ├── useContacts.ts     # Apollo contact enrichment for lead
│   │   ├── useAIHealth.ts     # Monitor AI backend health
│   │   └── usePagination.ts   # Table pagination (offset/limit)
│   ├── utils/                 # Pure utility functions for analysis
│   │   ├── prospectFinder.ts  # ICP matching + scoring; CSV export
│   │   ├── prospectingIntelligence.ts  # Lead ranking vs peers (Hot/Warm/Cold)
│   │   ├── triggerAlerts.ts   # Financial trigger detection (growth, distress, scale, opportunity, 5300-based)
│   │   ├── preCallBrief.ts    # Orchestrate all intelligence into 8-card brief
│   │   ├── competitiveIntelligence.ts  # Competitor identification + win strategies
│   │   ├── salesAcceleration.ts  # Hot lead identification + product fit scoring
│   │   ├── roiCalculator.ts   # Deal sizing + ROI projections + Rise pricing
│   │   ├── dealCoaching.ts    # Objection library + follow-up sequences
│   │   ├── marketingAgent.ts  # Content generation templates (social, blog, email, battle cards)
│   │   ├── financialHealth.ts # Health score computation from call report data
│   │   ├── territoryIntelligence.ts  # Geographic penetration analysis
│   │   └── [other utilities]  # Additional analysis functions
│   ├── types/                 # TypeScript type definitions
│   │   ├── index.ts           # Lead, Activity, PIPELINE_STAGES, utility functions (calculateLeadScore, formatCurrency, bankToLead, creditUnionToLead)
│   │   ├── callReport.ts      # CallReportData, FinancialHealthScore, quarterly metrics types
│   │   └── contacts.ts        # DecisionMaker, ContactsCache types
│   └── vite-env.d.ts          # Vite environment variable definitions
├── server/                    # Express backend (Node.js, port 3002)
│   ├── index.js               # Main server: Express routes, JSON file store init, middleware
│   ├── package.json           # Dependencies: express, cors, groq-sdk, csv-parse, adm-zip
│   ├── callReportService.js   # NCUA 5300 parsing: download ZIP, parse FS220 CSV, cache 18 account codes per CU
│   ├── apolloContactService.js # Apollo API integration: background CU discovery, email enrichment cache
│   ├── data/                  # JSON file-based persistence (no database)
│   │   ├── sales-data.json    # Lead pipeline overrides: status, contact, email, phone, notes
│   │   ├── activities.json    # Activity timeline: calls, emails, meetings, notes per lead
│   │   ├── alerts-state.json  # Alert management: dismissed + reviewed IDs
│   │   ├── alerts-snapshot.json  # Baseline financial snapshot (for trigger detection)
│   │   ├── contacts-cache.json    # Apollo-enriched decision makers (background cache)
│   │   ├── call-report-cache.json # NCUA 5300 parsed data (24h TTL)
│   │   ├── call-report-seed.json  # 30 sample CUs for fallback
│   │   └── ncua-seed.json     # ~4700 real CUs seed data
│   └── scripts/               # Utility scripts
│       ├── fetch-ncua-seed.js # One-time: fetch all ~4700 CUs from NCUA → save to ncua-seed.json
│       └── refresh-data.js    # Periodic: re-download call report ZIP, parse, update cache
├── public/                    # Static assets (favicon, manifest)
├── dist/                      # Built frontend (Vite output)
├── .planning/codebase/        # GSD planning documents (this file)
├── index.html                 # HTML shell: mounts React to <div id="root">
├── vite.config.ts             # Vite build config
├── tsconfig.json              # TypeScript compiler options
├── tailwind.config.js         # Tailwind CSS configuration (v4)
├── postcss.config.js          # PostCSS plugins (autoprefixer, tailwind)
├── package.json               # Frontend deps: react, react-router, vite, typescript, tailwind
└── .env (not committed)       # VITE_API_URL (default: http://localhost:3002)
server/.env (not committed)    # GROQ_API_KEY, APOLLO_API_KEY, GROQ_MODEL (default: llama-3.3-70b-versatile)
```

## Directory Purposes

**src/api/:**
- Purpose: API client services abstracting external integrations
- Contains: Fetch wrappers for FDIC, NCUA, Call Reports, Apollo, Groq
- Key pattern: Fallback chains (primary → backup → seed data)

**src/components/:**
- Purpose: Reusable UI building blocks + feature-specific dashboards
- Key files:
  - `InstitutionsTable.tsx` — Lead list with inline status editing, filter chips, export
  - `IntelligencePanel.tsx` — Lazy-loads all analysis for selected lead
  - `dashboards/` — 7 tab-specific feature views

**src/hooks/:**
- Purpose: Custom React hooks encapsulating data fetching, filtering, lazy loading
- Key: `useLeads()` is the main data orchestrator

**src/utils/:**
- Purpose: Pure analysis functions (no React dependencies)
- Key: Composable utilities that feed into higher-level features (PreCallBrief orchestrates 5 utilities)

**src/types/:**
- Purpose: Single source of truth for type definitions
- Key: `Lead` is the central data model

**server/data/:**
- Purpose: File-based JSON persistence (no database)
- Key: Server survives restarts; schema simple (JSON files)

**server/scripts/:**
- Purpose: One-off or periodic data maintenance (NCUA seed fetch, call report refresh)

## Key File Locations

**Entry Points:**
- Frontend: `src/main.tsx` (mounts React)
- App root: `src/App.tsx` (setup Router, fetch leads, orchestrate tabs)
- Backend: `server/index.js` (Express, routes, initialization)

**Configuration:**
- Frontend env: `.env` (VITE_API_URL)
- Backend env: `server/.env` (GROQ_API_KEY, APOLLO_API_KEY)
- Build: `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`

**Core Logic:**
- Data model: `src/types/index.ts` (Lead definition, conversion functions)
- Data fetching: `src/hooks/useLeads.ts` (parallel fetch, filtering, updates)
- Analysis engines: `src/utils/` (prospecting, triggers, ROI, competitive, coaching, marketing)

**Testing:**
- No automated tests yet (none in codebase)

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `InstitutionsTable.tsx`, `LeadDetailPanel.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useLeads.ts`, `useCallReport.ts`)
- Utilities: camelCase (e.g., `prospectFinder.ts`, `triggerAlerts.ts`)
- Types: PascalCase (e.g., `callReport.ts`, `contacts.ts`)
- API services: camelCase (e.g., `fdicApi.ts`, `ncuaApi.ts`)

**Directories:**
- Feature folders: lowercase plural (e.g., `components/`, `utils/`, `hooks/`, `api/`, `types/`)
- Sub-folders: lowercase (e.g., `components/dashboards/`, `components/layout/`)

**Functions:**
- Utilities: camelCase, verb-first (e.g., `calculateLeadScore()`, `generateTriggerAlerts()`, `matchLeadsToICP()`)
- Components: PascalCase, noun-first (e.g., `InstitutionsTable`, `PreCallPrepDashboard`)
- Hooks: camelCase, `use` prefix (e.g., `useLeads()`, `useCallReport()`)

**Types:**
- Interfaces: PascalCase (e.g., `Lead`, `TriggerAlert`, `PreCallBrief`)
- Enums: PascalCase (e.g., `AlertType`, `PriorityTier`)
- Type aliases: PascalCase (e.g., `RiskLevel`, `TabId`)

**Variables:**
- Constants: UPPER_SNAKE_CASE (e.g., `PIPELINE_STAGES`, `API_BASE_URL`, `ASSET_THRESHOLDS`)
- State: camelCase (e.g., `selectedLead`, `searchTerm`, `icpCriteria`)

## Where to Add New Code

**New Feature (e.g., "Win Probability Predictor"):**
- Utility function: `src/utils/winProbability.ts` (pure analysis)
- Component: `src/components/WinProbabilityCard.tsx` (displays analysis)
- Hook (if data fetching): `src/hooks/useWinProbability.ts`
- Integration point: Likely `src/components/IntelligencePanel.tsx` (add as 9th card)

**New Tab (e.g., "Compliance Alerts"):**
- Dashboard: `src/components/dashboards/ComplianceAlerts.tsx`
- Route: Add to `TAB_PATHS` in `src/components/layout/TabNavigation.tsx`
- Route handler: Add `<Route path="/compliance" element={...} />` in `src/App.tsx`
- Styling: Use Tailwind classes (v4, no CSS modules)

**New Component:**
- Location: `src/components/` if reusable, or `src/components/dashboards/` if tab-specific
- Props: Define interface above component (e.g., `interface MyComponentProps { ... }`)
- Error boundary: Wrap in `<ErrorBoundary>` in parent if it's a major section

**New Utility/Analysis Function:**
- Location: `src/utils/[feature].ts`
- Pattern: Pure function, typed inputs/outputs, no React dependencies
- Export: Type definitions + main function(s)
- Example: `src/utils/prospectFinder.ts` exports `ICPCriteria`, `ICPMatch`, `matchLeadsToICP()`, `exportICPMatchesToCSV()`

**New API Integration:**
- Client service: `src/api/[service]Api.ts` with fallback chain
- Hook wrapper (if needed): `src/hooks/use[Service].ts`
- Backend route: `server/index.js` (add GET/POST handler)
- Backend service module (if complex): `server/[service]Service.js`

**New Data Type:**
- Definition: Add to `src/types/index.ts` (if core) or `src/types/[feature].ts` (if isolated)
- Conversion functions: If converting from external API, add to `src/types/index.ts` (e.g., `bankToLead()`)

**New Backend Route:**
- Location: `server/index.js` (add handler, middleware, error handling)
- Pattern: `app.get('/api/route/:param', async (req, res) => { ... })`
- Data file: Persist to `server/data/[feature].json` if needed
- Fallback: Return seed/cached data if primary source unavailable

## Special Directories

**server/data/:**
- Purpose: JSON file-based persistence (no database)
- Generated: Yes (runtime creates `sales-data.json`, `activities.json`, etc.)
- Committed: `call-report-seed.json` and `ncua-seed.json` only (for fallback). Runtime files NOT committed.
- Schema: Simple JSON objects, keyed by lead ID

**src/types/:**
- Purpose: Single source of truth for TypeScript definitions
- Generated: No
- Committed: Yes (core to build)
- Pattern: Minimal logic; mostly interface definitions + small utility functions (e.g., `calculateLeadScore()`)

**dist/:**
- Purpose: Vite build output (minified frontend)
- Generated: Yes (`npm run build`)
- Committed: No (in `.gitignore`)

**.env and server/.env:**
- Purpose: Environment variables (API keys, URLs)
- Generated: Manual creation by developer
- Committed: No (in `.gitignore` for security)
- Required: `server/.env` must contain `GROQ_API_KEY` for AI features

---

*Structure analysis: 2026-03-17*
