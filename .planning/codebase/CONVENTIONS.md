# Coding Conventions

**Analysis Date:** 2026-03-17

## Naming Patterns

**Files:**
- Component files: PascalCase with `.tsx` extension (e.g., `AIChat.tsx`, `ErrorBoundary.tsx`, `InstitutionsTable.tsx`)
- Utility/service files: camelCase with `.ts` extension (e.g., `prospectFinder.ts`, `financialHealth.ts`, `aiService.ts`)
- Hook files: `use` prefix in camelCase (e.g., `useLeads.ts`, `useCallReport.ts`, `useAIHealth.ts`)
- Types/constants: camelCase in dedicated files (`index.ts` in `types/` and `constants/`)
- API services: `<resource>Api.ts` pattern (e.g., `ncuaApi.ts`, `fdicApi.ts`, `callReportApi.ts`)
- Layout components: Located in `src/components/layout/` subdirectory (e.g., `AppHeader.tsx`, `TabNavigation.tsx`)
- Dashboard components: Located in `src/components/dashboards/` subdirectory (e.g., `PreCallPrep.tsx`, `TriggerAlerts.tsx`)

**Functions:**
- React components: PascalCase, exported as default (e.g., `export default function AIChat(...)`)
- Utility functions: camelCase (e.g., `calculateLeadScore()`, `matchLeadsToICP()`, `computeFinancialHealth()`)
- Hook functions: `use` prefix, camelCase (e.g., `useLeads()`, `usePagination()`)
- Async functions: camelCase with verb prefix (e.g., `fetchBanks()`, `generateEmail()`, `aiGenerate()`)
- Helper functions: camelCase, often prefixed with preposition or verb (e.g., `buildLeadContext()`, `rangeScore()`, `getTierEmoji()`)

**Variables:**
- React state: camelCase (e.g., `const [selectedLead, setSelectedLead]`, `const [loading, setLoading]`)
- Constants/exports: UPPER_SNAKE_CASE for global constants (e.g., `PIPELINE_STAGES`, `API_BASE_URL`, `NCUA_CACHE_TTL_MS`)
- Interfaces/types: PascalCase (e.g., `ICPCriteria`, `ICPMatch`, `Lead`, `CreditUnion`)
- Object keys: camelCase (e.g., `charter_number` from API response gets transformed to `charterNumber`)

**Types:**
- Interface names: PascalCase with descriptive names (e.g., `Lead`, `CreditUnion`, `CallReportData`, `FinancialHealthScore`)
- Type aliases: PascalCase (e.g., `RiskLevel`, `TabId`)
- Type files organized by domain: `src/types/index.ts` (Lead, Message, Activity), `src/types/callReport.ts` (CallReportData), `src/types/contacts.ts` (DecisionMaker)
- Optional/nullable fields clearly marked with `?` (e.g., `callReport?: CallReportData`)

## Code Style

**Formatting:**
- No explicit formatter configured (.prettierrc absent)
- Consistent indentation: 2 spaces (inferred from codebase)
- Line length: No visible length restriction, pragmatic style
- Semicolons: Always included at statement ends
- Trailing commas: Used in multi-line structures for git diffs
- String quotes: Single quotes for most strings, backticks for template literals

**Linting:**
- No .eslintrc configuration file present
- TypeScript strict mode enabled in `tsconfig.json`: `"strict": true`
- Unused variables/parameters flagged: `"noUnusedLocals": true`, `"noUnusedParameters": true`
- Switch cases validated: `"noFallthroughCasesInSwitch": true`

**Import Organization:**
- Group 1: React and external library imports (`import React from 'react'`, `import { useState } from 'react'`)
- Group 2: Internal type imports (`import type { Lead } from '../types'`)
- Group 3: Internal service/utility imports (`import { fetchBanks } from '../api/fdicApi'`)
- Group 4: Internal component/hook imports (`import { useLeads } from './hooks/useLeads'`)
- Group 5: Asset imports (CSS, etc.) at end

Path aliases: Not configured; uses relative imports (`../`, `./`) throughout

## Error Handling

**Patterns:**
- Error Boundaries: Class component (`ErrorBoundary.tsx`) wraps critical sections in JSX tree
  - Granular per-section usage: table, intelligence panel, AI chat, each dashboard tab, top-level app
  - Implements `getDerivedStateFromError()` for state update and `componentDidCatch()` for logging
  - Provides user-friendly fallback UI with refresh button
  - Each boundary accepts optional `fallbackTitle` prop

- Try/Catch blocks: Used in async operations for API calls
  - Example: `useLeads()` catches network errors, logs to console, sets error state
  - Fallback chain pattern: Try server → fall back to localStorage (e.g., `useLeads()`, `fetchSavedSalesData()`)
  - No error throwing; graceful degradation preferred

- API error responses: Checked with `response.ok` before parsing JSON
  - Failed responses return error object with `error` field
  - Client-side validation before API calls (e.g., message required in chat endpoint)

- State management for errors: `error` state in hooks with setter for display in UI (e.g., red banner in `App.tsx`)

## Logging

**Framework:** `console.error()`, `console.log()` — no external logging library

**Patterns:**
- Error logging: `console.error('Error context:', error)` in catch blocks
- Info logging: `console.log('Operation: result')` in async operations (e.g., "NCUA: fetched X records")
- Data flow logging: Verbose in data fetching paths (call reports, NCUA APIs, contacts)
- No structured logging; context provided via string prefix (e.g., "NCUA:", "Call Report:", "ErrorBoundary caught:")

## Comments

**When to Comment:**
- Data transformations: Explain mapping logic (e.g., in `ncuaApi.ts` field transformations with comments for each account code)
- Complex algorithms: Comment the scoring logic (e.g., `rangeScore()` in prospectFinder.ts)
- Non-obvious constraints: Document API limits, data assumptions (e.g., NCUA data in thousands multiplier)
- Inline comments sparse; code is self-documenting through function/variable names

**JSDoc/TSDoc:**
- Not heavily used; TypeScript interfaces provide type documentation
- Function parameters and return types declared via TypeScript signatures
- Comments above functions explain purpose (e.g., "// Prospect Finder - ICP matching and discovery")
- API documentation: System prompts in server code serve as detailed behavior documentation

## Function Design

**Size:** Functions are focused, typically 10-50 lines
- Hooks: 30-70 lines (e.g., `useLeads()` with setup, fetch, filtering)
- Components: 50-200+ lines (large pages like `IntelligencePanel.tsx` ~900 lines justified by complexity)
- Utilities: 5-30 lines for pure functions; 20-100 lines for complex scoring

**Parameters:**
- React components: Single `Props` interface parameter (destructured in function signature)
- Utility functions: Specific named parameters (e.g., `matchLeadsToICP(leads: Lead[], criteria: ICPCriteria)`)
- Options objects used for optional parameters (e.g., `aiGenerate(systemPrompt, userMessage, options = {})`)
- No positional rest parameters; prefer explicit object shape

**Return Values:**
- Components: JSX element (implicit React.ReactElement)
- Hooks: Destructured return object with related state/functions (e.g., `{ leads, filteredLeads, loading, error, fetchData, ... }`)
- Utilities: Specific typed return (e.g., `ICPMatch[]`, `FinancialHealthScore`, `ProspectIntelligence`)
- Async functions: Typed promises (e.g., `Promise<CreditUnion[]>`, `Promise<ChatResponse>`)

## Module Design

**Exports:**
- Components: Default export (`export default function ComponentName(...)`)
- Utilities/services: Named exports for functions, especially in API files (e.g., `export async function fetchCreditUnions()`)
- Types: Named exports from `types/` directory (e.g., `export interface Lead`)
- Constants: Named exports (e.g., `export const PIPELINE_STAGES`)

**Barrel Files:**
- Limited use; each domain (types, hooks, api, utils) has own files
- `src/constants/index.ts` exports Rise Analytics facts/claims as single source of truth
- No re-export barrels for components; imports point directly to component files
- Advantage: Clear dependency graph, easier to tree-shake

## React Patterns

**Hooks:**
- `useState` for component-level state
- `useEffect` for side effects with cleanup functions
- `useCallback` for memoized callbacks passed to children (optimization)
- `useMemo` for expensive computations (filtering, sorting, ICP matching)
- `useRef` for DOM access and streaming state (e.g., messages ref in AIChat)

**State Management:**
- useState at component level; no global state library (Redux, Zustand)
- Props drilling for passing data down; callback props for events up
- Custom hooks (`useLeads`, `useCallReport`) encapsulate business logic
- localStorage for persistence (e.g., pipeline view preference, saved filters, ICP templates)

**Component Structure:**
- Functional components with hooks throughout
- One component per file (except for small UI helpers)
- Props interfaces at top of component file
- Conditional rendering with ternary/logical && operators
- Map for list rendering with explicit `key` prop

**Performance:**
- `useMemo` prevents recalculation of filtered leads, statistics, intelligence analysis
- `useCallback` prevents child re-renders in controlled tables/lists
- Error boundaries prevent full app crash on component errors
- Lazy loading of financial deep-dive in Intelligence Panel via `useCallReport` hook

---

*Convention analysis: 2026-03-17*
