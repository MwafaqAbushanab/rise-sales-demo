# Testing Patterns

**Analysis Date:** 2026-03-17

## Test Framework

**Runner:**
- Not detected — No test framework configured or in use
- No jest.config.js, vitest.config.ts, or test runner package present
- No .test.ts, .test.tsx, .spec.ts, or .spec.tsx files in `src/` directory

**Assertion Library:**
- Not applicable — Testing infrastructure not present

**Run Commands:**
```bash
# No test scripts defined in package.json
# Application: npm run dev        # Frontend dev server (Vite)
# Server: npm run dev            # Backend with --watch flag
```

## Test File Organization

**Status:** Tests not implemented

Current structure has no test files in the codebase:
- `src/` directory contains no .test or .spec files
- `/server/` directory contains no test files
- No tests directory (e.g., `src/__tests__/`, `src/tests/`)
- Test framework dependencies missing from both `package.json` and `server/package.json`

## Test Structure

**Not applicable** — Framework not configured

The codebase relies on manual testing and error boundaries for runtime safety.

## Mocking

**Not applicable** — No testing framework means no mocking infrastructure

Error handling approach used instead:
- Try/catch blocks in async operations capture errors
- Error Boundaries catch React component errors
- Fallback APIs: Server fails → fall back to localStorage
- Fallback data: Live NCUA API fails → seed data used
- No unit test mocks; integration testing via live APIs

## Fixtures and Factories

**Test Data:**
- Not created via factories; seed data embedded in source files
- Sample data location: `src/api/ncuaApi.ts` function `getSampleCreditUnions()` returns 30 mock credit unions
- Call report seed data: `server/data/call-report-seed.json` pre-seeded with 30 sample CUs' 5300 data
- No test fixtures directory or test-specific data generators

**Location:**
- Sample CU data: `src/api/ncuaApi.ts` lines 162-196
- FDIC sample banks: `src/api/fdicApi.ts` (if sample function exists)
- Call report seed: `server/data/call-report-seed.json` (committed to repo for fallback)

## Coverage

**Requirements:** Not enforced — No coverage tooling configured

Testing is manual; QA covered via:
- Error boundaries prevent silent failures
- Visual regression testing (manual)
- Real API integration testing (developers test against live NCUA/FDIC APIs)
- Fallback chain validation (verify seed data displays when APIs unavailable)

**View Coverage:**
- No coverage reporting available
- Code is untested; assume 0% coverage

## Test Types

**Unit Tests:**
- Not implemented
- Candidates for testing (if implemented):
  - Utility functions: `calculateLeadScore()`, `matchLeadsToICP()`, `computeFinancialHealth()`
  - Data transformations: `bankToLead()`, `creditUnionToLead()`, NCUA field mapping in `transformNCUAData()`
  - Range scoring: `rangeScore()` in prospectFinder
  - Formatting: `formatCurrency()`, `formatStatus()`, `timeAgo()`

**Integration Tests:**
- Not implemented
- Candidates for testing (if implemented):
  - `useLeads()` hook: fetch from server → fallback to localStorage → fallback to empty
  - `fetchCreditUnions()`: try server cache → try direct NCUA API → use seed data
  - `getCallReportForCU()`: try cache → use seed → return null
  - Trigger alert engine: baseline snapshot → current data → diff → scoring
  - Activity logging: POST /api/leads/:id/activities → persists to file → retrieves on GET

**E2E Tests:**
- Not implemented
- Would test user workflows: Select lead → View intelligence → Compose email → Update status

## Manual Testing Approach

**Error Scenarios Tested:**
- Network failure: App works offline with localStorage fallback
- API degradation: Multi-tier fallback (server → live API → seed data)
- Component crashes: Error boundaries catch and display user-friendly error message with retry button
- Missing data: Graceful nil checks (e.g., `lead?.callReport || undefined`)

**Data Flow Testing:**
- Lead creation: Bank/CU data → Lead transformation → Added to state
- Lead update: Status change → Optimistic UI update → API call → localStorage fallback if fails
- ICP filtering: Apply criteria → Filter leads → Score matches → Display results
- Trigger alerts: Snapshot baseline → Monitor new data → Calculate diffs → Score alerts

**Edge Cases Considered:**
- Empty datasets: Filtered leads can be empty, zero stats computed correctly
- Missing optional fields: `callReport`, `decisionMakers`, `intelligence` marked optional
- Null API responses: Fallback to sample data when all sources fail
- Large datasets: Credit unions ~4,700 real CUs, pagination/filtering handles efficiently
- Concurrent state updates: Optimistic updates in `useLeads()` work safely

## Common Patterns (If Tests Were Implemented)

**Async Testing:**
```typescript
// Pattern (hypothetical for useLeads hook)
test('useLeads fetches data and filters', async () => {
  // Would render hook within TestWrapper with mocked fetch
  // Check initial state: loading=true
  // Await for data fetch to complete
  // Verify leads populated and filtered leads computed
  // Example: expect(result.current.leads.length).toBeGreaterThan(0)
});
```

**Error Testing:**
```typescript
// Pattern (hypothetical for error boundary)
test('ErrorBoundary catches and displays component errors', () => {
  // Render component that throws in render
  // Verify fallback UI displays with custom message
  // Click retry button
  // Verify component re-mounts and works or still shows error
});

// Pattern (hypothetical for async error)
test('useLeads handles fetch failure gracefully', async () => {
  // Mock fetch to reject
  // Verify error state set
  // Verify fallback to localStorage
  // Verify UI shows error banner with retry
});
```

**API Mocking (Hypothetical):**
```typescript
// Pattern (would use fetch-mock or MSW)
// Mock NCUA endpoints to return sample data
// Mock server /api/ncua/credit-unions endpoint
// Verify correct fallback order:
// 1. Server cache hits
// 2. Direct NCUA API called if cache miss
// 3. Seed data used if all sources fail
```

## Testing Gaps & Recommendations

**Untested Areas:**

| Area | Risk | Priority |
|------|------|----------|
| Prospect scoring (`rangeScore()`, ICP matching) | Wrong scores influence sales decisions | High |
| Financial health calculation (`computeFinancialHealth()`) | Complex formula, used in intelligence panel | High |
| Trigger alert engine (`detectTriggers()`, alert scoring) | Real-time business logic, guides sales activity | High |
| Activity logging and persistence | Lead activity history unreliable | Medium |
| Email generation prompts | AI system prompts untested for content quality | Medium |
| Data transformation (NCUA → Lead) | Mapping bugs cause incorrect display | Medium |
| Error boundary behavior | May not catch all error types | Low |
| Offline fallback chains | Complex multi-tier fallbacks need validation | Low |

**Recommended Testing Strategy (Priority Order):**

1. **Add Jest + React Testing Library** for unit/integration testing
2. **Test utility functions first** (pure functions, no mocks needed):
   - `calculateLeadScore()` with edge cases (assets=0, negative ROA)
   - `matchLeadsToICP()` with various criteria
   - `computeFinancialHealth()` with boundary values
   - Formatters: `formatCurrency()`, `timeAgo()`

3. **Test hooks** with mock API responses:
   - `useLeads()`: happy path, network error, localStorage fallback
   - `useCallReport()`: data found, data not found, error
   - `useContacts()`: Apollo API success/failure

4. **Test components with error scenarios:**
   - `ErrorBoundary` catches child component errors
   - `InstitutionsTable` handles empty data, sorts correctly
   - `ICPBuilder` applies/clears criteria, exports CSV

5. **Integration tests** for critical workflows:
   - Lead selection → intelligence analysis → email generation
   - ICP template application → filtered list → export
   - Trigger alert baseline → review/dismiss flow

6. **E2E tests** (if Playwright/Cypress added):
   - Full user flows across tabs
   - API failure scenarios
   - Offline mode validation

---

*Testing analysis: 2026-03-17*
