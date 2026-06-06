# Implementation Plan — EZDivorce v2

**Date:** 2026-05-31  
**Spec:** EZDivorce v2 Spec (For Claude Code)  
**Status:** Awaiting approval before any production code changes.

---

## Recommended First Epic

### Epic 2 — Domain Model

**Implement this first, per the spec's own ordering.**

The spec's final note says explicitly:

> *"Before investing heavily in PDF automation, build the knowledge layer and rules engine first. For a divorce-filing company, the valuable asset isn't the React app — it's the structured database of Washington forms, county procedures, and filing rules."*

Epic 2 (Domain Model) is the foundation every other epic builds on. `CaseContext` is the input to the rules engine, the PDF filler, the AI assistant, and the checklist generator. Without a stable domain model, every other epic will be refactored the moment it's written. It is also:

1. **Zero risk** — pure TypeScript types, no UI or DB changes, nothing can break
2. **Fast** — 1–2 days
3. **Unlocks everything** — Epics 3, 5, 6, 7, 8, 9, 11, 12 all depend on `CaseContext`

---

## Epic Execution Order (Per Spec)

The spec explicitly says: *"Implement one Epic at a time. After each Epic: run tests, fix failures, commit. Do not proceed until current Epic passes. Create pull requests for every Epic."*

---

### Epic 2 — Domain Model
**Location:** `/src/domain/`  
**Complexity:** Low-Med · Est. 1–2 days

**Tasks:**
1. Create `/src/domain/index.ts` as barrel export
2. Define interfaces (no classes, no DB imports, no React imports):
   - `Person` — fullName, dateOfBirth?, ssn?, address?, email?, phone?
   - `Child` — fullName, dateOfBirth, livesWithPrimary?
   - `Marriage` — dateMarried, dateSeparated, county, state
   - `Asset` — type (house|vehicle|retirement|other), description, estimatedValue?
   - `Debt` — type, description, amount?
   - `FormRequirement` — formCode, title, sourceUrl, effectiveDate, version, required
   - `CourtForm` — formCode, name, state, county?, pdfUrl, fields, effectiveDate, sourceUrl
   - `CountyProcedure` — county, stepNumber, title, description, category, url?, fees?, timeline?, requiredDocuments?, effectiveDate, sourceUrl
   - `CaseContext` — the unified type: `petitioner: Person`, `respondent: Person`, `children: Child[]`, `marriage: Marriage`, `assets: Asset[]`, `debts: Debt[]`, `state`, `county`, `isContested`, `livesInState`, `spouseLocatable`, `status`
3. Extend/replace relevant types in `src/lib/types.ts` to import from domain
4. No migration of existing code yet — just define the types

**Acceptance criteria:**
- `npm run typecheck` passes
- No React/DB imports inside `/src/domain/`
- PR created

---

### Epic 3 — Rules Engine Refactor
**Location:** `/src/rules/`  
**Complexity:** Low · Est. 1 day

**Tasks:**
1. Create `/src/rules/determineRequiredForms.ts`
2. Change input signature: `determineRequiredForms(ctx: CaseContext): RequiredForm[]`
3. `RequiredForm` = `{ formCode: string; sourceUrl: string; effectiveDate: string; version: string }`
4. Port existing logic (contested, residency, spouse locatability, children branches) — reuse, don't rewrite
5. Move test file to `/src/rules/determineRequiredForms.test.ts`
6. Add `@vitest/coverage-v8` — configure 95% threshold in `vitest.config.ts`
7. Expand tests to 95%+ coverage (add ~15 new test cases covering all branches and edge cases)
8. Delete `src/lib/rules/` once tests pass

**Acceptance criteria:**
- `npm test` passes all tests
- Coverage ≥ 95%
- No existing UI behavior broken
- PR created

---

### Epic 4 — WA Form Catalog (Knowledge Layer)
**Location:** `/knowledge/forms/wa/`  
**Complexity:** Low · Est. 1 day

**Tasks:**
1. Create directory structure:
   ```
   /knowledge/forms/wa/
     state.json
     king/
       forms.json
   ```
2. `state.json` — WA state metadata (name, code, supportedCounties)
3. `king/forms.json` — migrate 7 forms from `catalog.ts` into JSON with added fields:
   ```json
   {
     "formCode": "FL_ALL_FAMILY_103",
     "title": "Petition for Dissolution (Divorce)",
     "required": true,
     "effectiveDate": "2022-01-01",
     "sourceUrl": "https://www.courts.wa.gov/forms/documents/FL_All_Family_103.pdf",
     "sourceCourtName": "Washington State Courts"
   }
   ```
4. Research actual `effectiveDate` values from `courts.wa.gov` for all 7 forms
5. Update `src/lib/forms/catalog.ts` to load from JSON rather than hardcoding
6. Add a `FormCatalogLoader` utility in `/src/` that reads and validates these JSON files

**Acceptance criteria:**
- `/knowledge/forms/wa/king/forms.json` has all 7 forms with effectiveDate + sourceUrl
- `catalog.ts` reads from JSON (no hardcoded form data remaining)
- `npm run typecheck` + `npm test` pass
- PR created

---

### Epic 10 — County Procedure Engine (Knowledge Layer)
**Location:** `/knowledge/procedures/`  
**Complexity:** Low · Est. 1 day

**Tasks:**
1. Create:
   ```
   /knowledge/procedures/wa/king/divorce-uncontested.json
   ```
2. Migrate King County 7-step checklist from `procedures/index.ts` into JSON:
   ```json
   {
     "county": "king",
     "state": "wa",
     "caseType": "divorce-uncontested",
     "effectiveDate": "2024-01-01",
     "sourceUrl": "https://kingcounty.gov/en/dept/dja/courts/superior-court/family-law",
     "steps": [
       {
         "stepNumber": 1,
         "title": "Confirm required forms",
         "category": "preparation",
         "description": "...",
         "url": "...",
         "timeline": "30–60 minutes",
         "fees": null,
         "requiredDocuments": []
       }
     ]
   }
   ```
3. Create `ProcedureLoader` in `/src/` that reads from JSON files
4. Refactor `generateChecklist()` to call `ProcedureLoader` — remove all hardcoded TypeScript logic and `if county === "pierce"` branches
5. Pierce County gets its own stub JSON (even if minimal for now)
6. Delete hardcoded procedure data from `src/lib/procedures/index.ts`

**Acceptance criteria:**
- Checklist page still renders King County steps correctly
- No county-name conditionals in TypeScript code
- PR created

---

### Epic 5 — Form Dependency Engine (95%+ coverage)
**Location:** `/src/rules/`  
**Complexity:** Low · Est. 1 day

**Tasks:**
1. Add `@vitest/coverage-v8` to devDependencies (if not done in Epic 3)
2. Write comprehensive test matrix for all `CaseContext` input combinations:
   - children: true/false × isContested: true/false × livesInState: true/false × spouseLocatable: true/false
   - Each branch of `determineRequiredForms()` covered
   - Edge cases: missing fields, empty strings
3. Add `vitest.config.ts` coverage threshold:
   ```ts
   coverage: { thresholds: { lines: 95, functions: 95, branches: 95 } }
   ```
4. Add `"test:coverage": "vitest run --coverage"` to `package.json`

**Acceptance criteria:**
- `npm run test:coverage` reports ≥ 95% on all metrics
- PR created

---

### Epic 7 — Case Data Layer (`CaseContext`)
**Location:** `src/lib/store/case-store.tsx` + domain types  
**Complexity:** Med · Est. 2 days

**Tasks:**
1. Update `case-store.tsx` to produce `CaseContext` (from Epic 2) as its output type
2. Map existing flat `CaseData` fields into structured sub-objects (`petitioner`, `respondent`, `children`, `marriage`, `assets`, `debts`)
3. Update `completeInterview()` to pre-populate all `CaseContext` fields from interview answers
4. Update rules engine call in store to pass `CaseContext`
5. Update checklist generator call to accept `CaseContext`
6. localStorage serialization/deserialization updated for new shape
7. Verify all pages still compile and render

**Acceptance criteria:**
- All pages render correctly
- Rules engine, checklist generator, and (stub) PDF layer all receive `CaseContext`
- `npm run typecheck` + `npm test` pass
- PR created

---

### Epic 6 — TurboTax Interview Engine (JSON-driven)
**Location:** `/src/interview/`  
**Complexity:** Med · Est. 2–3 days

**Tasks:**
1. Create `/src/interview/questions.json`:
   ```json
   [
     { "id": "livesInState", "type": "boolean", "question": "Do you currently live in Washington State?", "step": "Residency" },
     { "id": "hasChildren", "type": "boolean", "question": "Do you have minor children together?", "step": "Children" }
   ]
   ```
2. Define `QuestionDefinition` type in domain
3. Create `QuestionRenderer` component that renders any question type (boolean, text, date, number, select) from a definition object
4. Refactor `interview/page.tsx` to iterate over `questions.json` rather than hardcoding JSX per question
5. Each question's `id` maps directly to a `CaseContext` field key
6. Conditional questions supported via `"showIf": { "field": "hasChildren", "value": true }`

**Acceptance criteria:**
- Interview renders identically to current behavior
- No question text hardcoded in React components
- Adding a new question requires only a JSON change
- PR created

---

### Epic 8 — PDF Infrastructure
**Location:** `/src/pdf/`  
**Complexity:** Med-High · Est. 3–4 days

**Tasks:**
1. Download official WA court PDFs and store in `/public/forms/wa/`
2. Inspect each PDF's AcroForm field names (using pdf-lib `getForm().getFields()`)
3. Create `/src/pdf/index.ts` with 4 named exports:
   - `loadPdf(formCode: string): Promise<Uint8Array>` — fetches from `/public/forms/wa/`
   - `fillPdf(pdfBytes: Uint8Array, fieldMap: Record<string, string>): Promise<Uint8Array>` — uses pdf-lib AcroForm API
   - `flattenPdf(pdfBytes: Uint8Array): Promise<Uint8Array>` — flattens so fields are read-only post-fill
   - `mergePacket(pdfs: Uint8Array[]): Promise<Uint8Array>` — port existing merge logic
4. Install `jszip` — create `downloadAsZip(packet: {filename, data}[])` helper
5. Update `forms/page.tsx` download buttons to use new PDF infrastructure
6. Remove `src/lib/pdf/generatePacket.ts` synthetic generation code

**Dependencies:** Epic 9 (PDF mappings must exist before fillPdf can be called with real field names).  
**Complexity note:** AcroForm field inspection is the slowest step — some WA court forms use scanned PDFs with no AcroForm layer, which would require a different approach (pdf-lib text overlay on coordinates).

**Acceptance criteria:**
- Download produces a ZIP of real filled court forms (or overlaid text if forms lack AcroForm fields)
- `loadPdf`, `fillPdf`, `flattenPdf`, `mergePacket` are each independently unit-testable
- PR created

---

### Epic 9 — PDF Mapping Registry
**Location:** `/knowledge/pdf-mappings/`  
**Complexity:** Med · Est. 2–3 days

**Tasks:**
1. For each of 7 WA forms, inspect actual AcroForm field names
2. Create one JSON mapping file per form:
   ```
   /knowledge/pdf-mappings/wa/FL_ALL_FAMILY_103.json
   ```
   ```json
   {
     "petitioner_name": "petitioner.fullName",
     "respondent_name": "respondent.fullName",
     "date_married": "marriage.dateMarried",
     "county_of_filing": "marriage.county"
   }
   ```
3. `fillPdf()` reads the appropriate mapping file and resolves `CaseContext` paths
4. No mapping logic in TypeScript — purely data-driven

**Dependencies:** Epic 7 (stable CaseContext field paths), Epic 8 (fillPdf signature).  
**Acceptance criteria:**
- All 7 forms have a mapping file
- `fillPdf()` contains no hardcoded field names
- PR created

---

### Epic 11 — Filing Checklist Generator
**Location:** `src/lib/procedures/` + `src/app/checklist/page.tsx`  
**Complexity:** Low · Est. 1 day

**Tasks:**
1. Refactor `generateChecklist(ctx: CaseContext): ChecklistStep[]`
2. Wire to `ProcedureLoader` from Epic 10
3. Filter steps by `ctx.children.length > 0` (parenting seminar step)
4. `ChecklistStep` carries `id` that links to `progressSteps` keys in `CaseContext`
5. Fix: hide `parenting_class` progress step on dashboard when no children

**Dependencies:** Epic 7 (CaseContext), Epic 10 (procedure JSON).  
**Acceptance criteria:**
- Checklist renders correctly for with/without-children cases
- PR created

---

### Epic 12 — AI Knowledge Assistant
**Location:** `/src/assistant/`  
**Complexity:** Med · Est. 2–3 days

**Tasks:**
1. Create `/src/assistant/systemPrompt.ts` — defines the strict boundary: explain, never decide
2. Create `/src/assistant/glossary.json` — divorce/legal term definitions
3. Create `/src/assistant/AssistantChat.tsx` — floating chat widget
4. Wire `CaseContext` + current procedure steps + relevant form metadata as context
5. Guardrail: if the user's question matches patterns like "do I need to file X" or "am I eligible" → respond with "That's determined by our rules engine, not me. [Link to interview]"
6. Add to layout as an opt-in floating button

**Dependencies:** Epic 7 (CaseContext), Epic 4 (form metadata), Epic 10 (procedure data).  
**Acceptance criteria:**
- Assistant can explain any form or procedure step in plain English
- Assistant refuses to determine form eligibility
- PR created

---

### Epic 13 — Admin Console
**Location:** `/admin/`  
**Complexity:** Med-High · Est. 3–4 days

**Tasks:**
1. Add auth guard — admin role check (requires auth system)
2. Add form metadata editor: view/edit effectiveDate, sourceUrl, version per form
3. Add procedure step editor: CRUD for steps in each county JSON
4. Draft/Published workflow: edits go to "pending" state until admin approves
5. Pending review queue for change monitoring items (Epic 14)

**Dependencies:** Auth (Supabase), Epic 4 (form catalog), Epic 10 (procedure files).  
**Acceptance criteria:**
- Admin-only access enforced
- Form and procedure data editable without code changes
- PR created

---

### Epic 14 — Change Monitoring
**Location:** `.github/workflows/` + Supabase Edge Functions  
**Complexity:** Med · Est. 2–3 days

**Tasks:**
1. Create `change_reviews` table in Supabase schema
2. GitHub Actions cron job (weekly) that fetches tracked URLs and hashes content
3. On hash change: insert row into `change_reviews` with URL, old hash, new hash, detected_at
4. Admin Console shows "Pending Reviews" badge when rows exist
5. Admin approves → marks reviewed, triggers knowledge layer update (manual)

**Dependencies:** Epic 13 (admin console), Epic 15 (CI/CD for scheduled jobs).  
**Acceptance criteria:**
- Cron runs on schedule
- Change detection creates review items
- No auto-publishing ever occurs
- PR created

---

### Epic 15 — Production Readiness
**Complexity:** High · Est. 4–6 days

**Tasks:**
1. **RLS** — Write Row Level Security policies for all Supabase tables (`users`, `cases`, `interview_answers`, `forms`, `form_requirements`, `generated_documents`, `county_procedures`)
2. **Audit logs** — `audit_logs` table + Postgres trigger functions on all write operations
3. **Admin permissions** — `user_roles` table; admin check in middleware
4. **Sentry** — `npm install @sentry/nextjs`; instrument `layout.tsx` and API routes
5. **Structured logging** — `pino` or similar; replace `console.log` calls
6. **GitHub Actions CI** — `.github/workflows/ci.yml`:
   ```yaml
   jobs:
     ci:
       steps:
         - lint
         - typecheck
         - test
         - build
   ```
   Required to pass before merge.
7. **E2E tests** — Playwright: critical paths = interview → forms → download

**Dependencies:** Auth system (Supabase), all prior epics.  
**Acceptance criteria:**
- CI passes on every PR
- RLS prevents cross-user data access (verified by test)
- Sentry captures errors in staging
- PR created

---

## Sprint Order

| Sprint | Epics | Rationale |
|---|---|---|
| Sprint 1 | E2, E3, E4, E10 | Foundation: domain model + knowledge layer. Zero UI changes. Purely additive. |
| Sprint 2 | E5, E7, E11 | Rules coverage + CaseContext wiring + checklist generator |
| Sprint 3 | E6 | JSON-driven interview (refactor, high-value UX improvement) |
| Sprint 4 | E9, E8 | PDF mappings then PDF infrastructure (spec: knowledge before PDF automation) |
| Sprint 5 | E12, E13 | AI assistant + admin console |
| Sprint 6 | E14, E15 | Change monitoring + production readiness |

---

## Conflicts Between Repo and Spec

| # | Conflict | Resolution |
|---|---|---|
| C1 | `if county === "pierce"` in `procedures/index.ts` — violates Principle 3 ("county procedures are data, never hardcode") | Epic 10 resolves — migrate to JSON, delete TS branch |
| C2 | Interview questions hardcoded in React JSX — violates Epic 6 requirement | Epic 6 resolves — extract to `questions.json` |
| C3 | Form catalog in TypeScript — should be `/knowledge/forms/wa/` JSON | Epic 4 resolves |
| C4 | PDF generates synthetic documents — spec requires real court form overlay | Epic 8 resolves |
| C5 | `determineRequiredForms()` input is a partial pick of `CaseData`, not `CaseContext` | Epic 3 resolves after Epic 2 defines CaseContext |
| C6 | Payments mentioned nowhere in spec — previous implementation plan incorrectly flagged this as P0 | Not in scope — remove from plan |
| C7 | 50-state coverage flagged as P0 in previous plan — spec explicitly scopes to WA only | Not in scope for v2 |

---

## Awaiting Approval

No production code has been modified. All documents reflect analysis only.

**Recommended action:** Approve Sprint 1 (Epics 2, 3, 4, 10) to begin.
