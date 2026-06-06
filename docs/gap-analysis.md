# Gap Analysis — EZDivorce v2

**Date:** 2026-05-31  
**Spec:** EZDivorce v2 Spec (For Claude Code)  
**Scope per spec:** Washington State only · King County first · Uncontested divorce only

---

## Status Legend

| Symbol | Meaning |
|---|---|
| ✅ Implemented | Exists and satisfies spec intent |
| ⚠️ Partially Implemented | Exists but structurally wrong or incomplete per spec |
| ❌ Missing | No implementation exists |

---

## Epic 1 — Repository Audit

**Status:** ⚠️ Partially Implemented

The original audit was produced without the actual spec, so it was based on inferred requirements. The `/docs/repository-audit.md` and `/docs/gap-analysis.md` now exist but were written against the wrong spec (the "CC spec" tab from a different document). The `implementation-plan.md` also needs revision.

**Gap:** Re-audit against the actual spec (this document) and produce corrected deliverables. ✅ Done with this revision.

---

## Epic 2 — Domain Model (`/src/domain`)

**Status:** ❌ Missing

**What the spec requires:**
A pure domain layer at `/src/domain` containing core entities:
`Case`, `Person`, `Child`, `Marriage`, `Asset`, `Debt`, `CountyProcedure`, `FormRequirement`, `CourtForm`

Rules: no UI code, no database code inside the domain layer.

**What exists:**
- `src/lib/types.ts` contains `CaseData`, `FormDefinition`, `ProcedureStep`, `FormRequirementRule` — these are close to domain entities but are mixed with UI concerns and storage concerns, and live in `lib/` not `domain/`
- No separation of domain from infrastructure

**Work required:**
- Create `/src/domain/` directory
- Extract and refine entity types from `types.ts` into proper domain classes/interfaces: `Case`, `Person`, `Child`, `Marriage`, `Asset`, `Debt`, `CountyProcedure`, `FormRequirement`, `CourtForm`
- Ensure zero imports of React, Next.js, or DB clients inside domain layer
- `CaseContext` (the unified input to all systems per Epic 7) should be defined here

**Dependencies:** None — pure TypeScript, no external deps.  
**Complexity:** Low-Medium (1–2 days)

---

## Epic 3 — Rules Engine (`/src/rules`)

**Status:** ⚠️ Partially Implemented

**What the spec requires:**
- `/src/rules/` as a standalone module
- `determineRequiredForms(caseContext: CaseContext): RequiredForm[]`
- No AI, no API calls, pure deterministic logic

**What exists:**
- `src/lib/rules/determineRequiredForms.ts` — correct and deterministic ✅
- `src/lib/rules/determineRequiredForms.test.ts` — 4 tests ⚠️
- Input is a partial `CaseData` pick, not the spec's `CaseContext` type ❌
- Output is `{ formCodes: string[] }`, not `RequiredForm[]` with traceability fields ❌
- Lives in `src/lib/rules/`, not `src/rules/` ❌

**Conflicts:**
The existing logic is sound — it correctly gates on contested, residency, and spouse locatability. The problem is structural (wrong location, wrong types) and coverage (4 tests vs 95%+ required).

**Work required:**
- Move to `/src/rules/`
- Change input type to `CaseContext` (once Epic 2 defines it)
- Change output to `RequiredForm[]` where each item carries `formCode`, `sourceUrl`, `effectiveDate`, `version`
- Expand test suite to 95%+ coverage (est. 15–20 additional test cases)

**Dependencies:** Epic 2 (CaseContext type).  
**Complexity:** Low (1 day — mostly reorganization + test expansion)

---

## Epic 4 — Washington Form Catalog (`/knowledge/forms/wa/`)

**Status:** ❌ Missing (wrong format)

**What the spec requires:**
```
/knowledge/forms/wa/
  state.json
  king/
    forms.json
```
Each form entry must have: `formCode`, `title`, `required`, `effectiveDate`, `sourceUrl`

**What exists:**
- `src/lib/forms/catalog.ts` — 7 WA forms defined as TypeScript objects ✅ (data exists)
- No `effectiveDate` or `sourceUrl` on any form entry ❌
- Format is TypeScript, not JSON ❌
- No `king/forms.json` county-specific file ❌
- No `state.json` top-level ❌

**Conflict:** The existing TypeScript catalog has the right form codes and field mappings — this data is valid and should be migrated, not discarded.

**Work required:**
- Create `/knowledge/forms/wa/` directory structure
- Migrate 7 form definitions from `catalog.ts` into `king/forms.json`
- Research and populate `effectiveDate` and `sourceUrl` for each form from `courts.wa.gov`
- Create `state.json` with WA-level metadata
- Update `catalog.ts` to read from JSON at build/runtime rather than hardcoding

**Dependencies:** None.  
**Complexity:** Low (1 day — data migration + research)

---

## Epic 5 — Form Dependency Engine (95%+ test coverage)

**Status:** ⚠️ Partially Implemented

**What the spec requires:**
Given `{ children: true, contested: false }` → return `["petition", "summons", "parenting-plan", "child-support"]`
With automated tests at 95%+ coverage.

**What exists:**
- `determineRequiredForms()` covers the children/no-children logic correctly ✅
- 4 tests — covers the main paths but not edge cases ⚠️
- No coverage measurement configured ❌
- Form codes returned as bare strings, not named identifiers matching the spec's semantic naming ⚠️

**Work required:**
- Add `@vitest/coverage-v8` to devDependencies
- Add `coverage` script to `package.json`
- Expand test suite: add cases for each property combination (children × contested × livesInState × spouseLocatable)
- Add boundary tests (missing fields, null values)
- Configure coverage threshold at 95% in `vitest.config.ts`

**Dependencies:** Epic 3 (rules module refactor).  
**Complexity:** Low (1 day)

---

## Epic 6 — TurboTax Interview Engine (`/src/interview`)

**Status:** ❌ Missing (wrong architecture)

**What the spec requires:**
- `/src/interview/` module
- Questions defined as JSON: `{ "id": "children", "type": "boolean", "question": "Do you have minor children?" }`
- React components must NOT hardcode questions

**What exists:**
- `src/app/interview/page.tsx` — 7-step interview UI ✅ (UI shell is reusable)
- All questions hardcoded directly in JSX ❌ — 200+ lines of inline question rendering

**Conflict:** The interview UI is solid and should be kept. The architecture is wrong — questions are embedded in the component rather than driven by a JSON schema.

**Work required:**
- Create `/src/interview/questions.json` with all question definitions
- Define question schema types: `id`, `type` (`boolean` | `text` | `date` | `number` | `select`), `question`, `helpText?`, `options?`, `conditions?` (for conditional display)
- Create a generic `QuestionRenderer` component that reads from the JSON schema
- Refactor `interview/page.tsx` to iterate over the JSON question set
- Interview state maps directly to `CaseContext` field keys

**Dependencies:** Epic 2 (CaseContext), Epic 7 (normalized answers).  
**Complexity:** Medium (2–3 days)

---

## Epic 7 — Case Data Layer (`CaseContext`)

**Status:** ⚠️ Partially Implemented

**What the spec requires:**
A single normalized `CaseContext` that is the input to: rules engine, PDF generation, AI assistant, checklist generator.

**What exists:**
- `CaseData` in `types.ts` — reasonably complete shape ✅
- `case-store.tsx` — localStorage-backed React context ✅
- But: rules engine takes a partial pick of `CaseData`, not a canonical `CaseContext` ❌
- PDF generation receives `CaseData` but only uses `formAnswers`, missing structured person/child/asset data ❌
- Checklist generator takes `(county, hasChildren, state)` — not `CaseContext` ❌

**Work required:**
- Define `CaseContext` as the canonical type in `/src/domain/`
- Ensure it contains structured sub-objects: `petitioner: Person`, `respondent: Person`, `children: Child[]`, `marriage: Marriage`, `assets: Asset[]`, `debts: Debt[]`
- Update rules engine, PDF layer, and checklist generator to all accept `CaseContext`
- Update `case-store.tsx` to produce `CaseContext` as its output type

**Dependencies:** Epic 2 (domain entities).  
**Complexity:** Medium (2 days)

---

## Epic 8 — PDF Infrastructure (`/src/pdf`)

**Status:** ⚠️ Partially Implemented (wrong approach)

**What the spec requires:**
```
/src/pdf/
  loadPdf()
  fillPdf()
  flattenPdf()
  mergePacket()
```
Output: single ZIP file.

**What exists:**
- `src/lib/pdf/generatePacket.ts` — has `generatePacket()` and `downloadCombinedPacket()` ✅
- `mergePacket` equivalent works ✅
- `generateFormPdf()` creates synthetic text-layout PDFs ❌ — not real court form overlays
- No `loadPdf()`, `fillPdf()`, `flattenPdf()` as distinct functions ❌
- Output is browser `.pdf` download, not ZIP ❌
- `pdfField` property exists in the type schema but is never called ❌

**Work required:**
- Create `/src/pdf/` with 4 exported functions matching spec signatures
- `loadPdf(formCode)` — fetches official PDF from `/public/forms/wa/{formCode}.pdf`
- `fillPdf(pdfBytes, mappings, caseContext)` — uses pdf-lib AcroForm API to fill fields
- `flattenPdf(pdfBytes)` — flattens form fields so they can't be edited post-download
- `mergePacket(pdfs[])` — merges into single PDF (existing logic can be reused)
- Add `jszip` for ZIP output
- Download all forms as a single ZIP

**Dependencies:** Epic 7 (CaseContext), Epic 9 (PDF mapping registry).  
**Complexity:** Medium-High (3–4 days — AcroForm field inspection is the hard part)

---

## Epic 9 — PDF Mapping Registry (`/knowledge/pdf-mappings`)

**Status:** ❌ Missing

**What the spec requires:**
```json
{ "petitioner_name": "case.petitioner.fullName" }
```
Stored as data files under `/knowledge/pdf-mappings/`, not inside code.

**What exists:**
- `pdfField` property on `FormFieldDefinition` in `types.ts` — the concept is designed in ✅
- But mappings are inline TypeScript strings, never read by the PDF generator ❌
- No `/knowledge/pdf-mappings/` directory ❌

**Work required:**
- Create `/knowledge/pdf-mappings/wa/` directory
- For each of 7 WA forms, create a JSON file mapping AcroForm field names → `CaseContext` paths
- This requires inspecting each official court PDF's actual AcroForm field names (using pdf-lib or pdfinfo)
- `fillPdf()` reads these files rather than having any mapping logic in code

**Dependencies:** Epic 8 (fillPdf needs the mappings), Epic 7 (CaseContext paths must be stable).  
**Complexity:** Medium (2–3 days — field inspection is manual research work per form)

---

## Epic 10 — County Procedure Engine (`/knowledge/procedures`)

**Status:** ❌ Missing (wrong format)

**What the spec requires:**
```
/knowledge/procedures/wa/king/divorce-uncontested.json
```
Contains: filing, service, parenting requirements, waiting periods, finalization.

**What exists:**
- `src/lib/procedures/index.ts` — King County 7-step checklist as TypeScript ✅ (data is good)
- `if county === "pierce"` hardcoded override — violates Principle 3 ❌
- No JSON files ❌
- No version, effective_date, source_url on procedure steps ❌

**Conflict:** The King County data in `procedures/index.ts` is accurate and well-structured — it should be migrated into JSON, not rewritten.

**Work required:**
- Create `/knowledge/procedures/wa/king/divorce-uncontested.json`
- Migrate King County steps from TypeScript into this JSON file
- Add `version`, `effectiveDate`, `sourceUrl` to each step
- Create a `ProcedureLoader` in `/src/` that reads these JSON files
- Delete the `if county === "pierce"` branch — Pierce County gets its own JSON file
- `generateChecklist()` becomes a thin function that loads and filters from JSON

**Dependencies:** None.  
**Complexity:** Low (1 day — data migration + JSON schema design)

---

## Epic 11 — Filing Checklist Generator

**Status:** ⚠️ Partially Implemented

**What the spec requires:**
Input: `CaseContext` → Output: `ChecklistStep[]`
Must include the standard steps shown in the spec.

**What exists:**
- `generateChecklist(county, hasChildren, state)` in `procedures/index.ts` ✅
- Checklist UI in `checklist/page.tsx` ✅
- But: takes 3 loose arguments, not `CaseContext` ❌
- Data is hardcoded TypeScript, not loaded from `/knowledge/procedures/` ❌

**Work required:**
- Refactor signature to `generateChecklist(ctx: CaseContext): ChecklistStep[]`
- Wire to JSON procedure files from Epic 10
- `ChecklistStep` should carry a `completed: boolean` field linked to `progressSteps`

**Dependencies:** Epic 7 (CaseContext), Epic 10 (procedure JSON files).  
**Complexity:** Low (1 day — mostly wiring after Epics 7 and 10)

---

## Epic 12 — AI Knowledge Assistant (`/src/assistant`)

**Status:** ❌ Missing

**What the spec requires:**
- `/src/assistant/` module
- Allowed: explain terms, explain forms, explain procedures
- Forbidden: determine forms, determine eligibility, provide legal advice
- Receives: `CaseContext`, procedure data, form metadata, glossary
- Never receives authority to make legal decisions

**What exists:** Nothing.

**Work required:**
- Create `/src/assistant/` with an assistant client wrapper
- Define a system prompt that enforces the "explain only, never decide" boundary
- Wire `CaseContext` + procedure data + form metadata as context to the model
- Create a chat UI component (floating widget or dedicated `/assistant` route)
- Add a glossary of divorce/legal terms as a knowledge file
- Add guardrails: if user asks "do I need to file X?" → redirect to the rules engine, do not answer from LLM

**Dependencies:** Epic 7 (CaseContext), Epic 4 (form metadata), Epic 10 (procedure data).  
**Complexity:** Medium (2–3 days)

---

## Epic 13 — Admin Console (`/admin`)

**Status:** ⚠️ Partially Implemented

**What the spec requires:**
- Upload form metadata
- Edit county procedures
- Track version, effective_date, source_url

**What exists:**
- `/admin` page — read-only catalog and rules viewer ✅
- No auth guard ❌
- No upload capability ❌
- No edit capability ❌
- No version tracking UI ❌

**Work required:**
- Add auth guard (admin role check)
- Add form metadata upload (JSON file upload → saves to `/knowledge/forms/` or DB)
- Add procedure step editor (CRUD for county procedure steps)
- Add version/effective_date/source_url fields to all editable records
- "Never auto-publish" — add draft/published state with human approval workflow

**Dependencies:** Epic 3 (auth), Epic 4 (form catalog JSON), Epic 10 (procedure JSON).  
**Complexity:** Medium-High (3–4 days)

---

## Epic 14 — Change Monitoring

**Status:** ❌ Missing

**What the spec requires:**
- Scheduled jobs monitoring Washington court form pages and county procedure pages
- When changes detected: create a review item (never auto-publish)
- Human approval required

**What exists:** Nothing.

**Work required:**
- Create scheduled job (GitHub Actions cron or Supabase Edge Function)
- For each tracked URL (courts.wa.gov form pages, kingcounty.gov procedure pages): fetch, hash, compare to stored hash
- On change: create a record in a `change_reviews` table with diff info
- Surface in Admin Console as "Pending Review" items
- Admin approves → triggers update to knowledge layer

**Dependencies:** Epic 13 (admin console), Epic 15 (CI/CD for scheduled jobs).  
**Complexity:** Medium (2–3 days)

---

## Epic 15 — Production Readiness

**Status:** ❌ Missing

**What the spec requires:**
- Row Level Security on all Supabase tables
- Audit logs
- Admin permissions
- Sentry error tracking
- Structured logging
- Unit, integration, E2E tests
- GitHub Actions CI: lint → typecheck → test → build (required before merge)

**What exists:**
- `vitest.config.ts` — unit test runner configured ✅
- 4 passing unit tests ✅
- No RLS policies ❌
- No audit logs ❌
- No Sentry ❌
- No GitHub Actions ❌
- No E2E tests (Playwright/Cypress) ❌

**Work required:**
- Write RLS policies for all 7 Supabase tables
- Create `audit_logs` table and trigger functions
- Add admin role system (e.g., `user_roles` table)
- Install and configure Sentry (`@sentry/nextjs`)
- Add structured logging utility
- Create `.github/workflows/ci.yml` with lint, typecheck, test, build steps
- Add Playwright for E2E tests on critical paths (interview → forms → download)

**Dependencies:** Epics 3 and 4 (auth + DB must exist for RLS).  
**Complexity:** High (4–6 days)

---

## Summary Table

| Epic | Description | Status | Complexity | Priority |
|---|---|---|---|---|
| E1 | Repository Audit | ✅ Done (this doc) | — | — |
| E2 | Domain Model `/src/domain` | ❌ Missing | Low-Med | P0 |
| E3 | Rules Engine `/src/rules` | ⚠️ Partial | Low | P0 |
| E4 | WA Form Catalog `/knowledge/forms/wa/` | ❌ Missing | Low | P0 |
| E5 | Form Dependency Engine 95%+ coverage | ⚠️ Partial | Low | P0 |
| E6 | Interview Engine `/src/interview` (JSON-driven) | ❌ Missing | Med | P1 |
| E7 | Case Data Layer `CaseContext` | ⚠️ Partial | Med | P0 |
| E8 | PDF Infrastructure `/src/pdf` | ⚠️ Partial | Med-High | P1 |
| E9 | PDF Mapping Registry `/knowledge/pdf-mappings` | ❌ Missing | Med | P1 |
| E10 | County Procedure Engine `/knowledge/procedures` | ❌ Missing | Low | P0 |
| E11 | Filing Checklist Generator | ⚠️ Partial | Low | P1 |
| E12 | AI Knowledge Assistant `/src/assistant` | ❌ Missing | Med | P2 |
| E13 | Admin Console `/admin` | ⚠️ Partial | Med-High | P2 |
| E14 | Change Monitoring | ❌ Missing | Med | P2 |
| E15 | Production Readiness | ❌ Missing | High | P1 |

**Fully implemented:** 1 of 15  
**Partially implemented:** 6 of 15  
**Missing:** 8 of 15

---

## Corrections to Prior Gap Analysis

The previous gap analysis (written without the spec) made several incorrect calls:

| Previous finding | Correction |
|---|---|
| REQ-01: 50-state coverage — P0 gap | **Not a gap.** Spec explicitly scopes to WA only. |
| REQ-08: Auth — P0 | Still correct, now Epic 15 dependency |
| REQ-09: Payments — P0 | **Not in spec.** Payments are not mentioned anywhere in the v2 spec. |
| REQ-10: Real PDF overlay — P0, do first | Correct priority, now Epic 8. But spec says build knowledge layer first (see Implementation Plan). |
| REQ-13: Supabase backend — P0 | Still correct, part of Epic 15 |
