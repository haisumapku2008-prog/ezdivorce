# Repository Audit — EZDivorce v2

**Audited:** 2026-05-31  
**Spec:** EZDivorce v2 Spec (For Claude Code)  
**Scope per spec:** Washington State only · King County first · Uncontested divorce only

---

## 1. Existing Routes

| Route | File | Status |
|---|---|---|
| `/` | `src/app/page.tsx` | Marketing home page — works |
| `/interview` | `src/app/interview/page.tsx` | 7-step guided interview — works |
| `/forms` | `src/app/forms/page.tsx` | Form editor + PDF download — works |
| `/checklist` | `src/app/checklist/page.tsx` | County filing guide — works |
| `/dashboard` | `src/app/dashboard/page.tsx` | Progress tracker — works |
| `/admin` | `src/app/admin/page.tsx` | Catalog/rules viewer — works, no auth guard |

No auth routes (`/login`, `/register`) exist. No API routes exist.

---

## 2. Database Schema

**File:** `supabase/schema.sql`  
**Status:** Schema defined; Supabase not connected; `@supabase/supabase-js` not installed.

| Table | Purpose | Notes |
|---|---|---|
| `users` | User accounts | id, email, created_at |
| `cases` | Divorce cases | state, county, status, has_children, is_contested |
| `interview_answers` | Per-question answers | jsonb value, unique(case_id, question_key) |
| `forms` | Form metadata | state, county, form_code, pdf_url, version, active |
| `form_requirements` | Rules as data | rule_json, required_form_codes[] |
| `generated_documents` | Download records | case_id, form_code, pdf_path |
| `county_procedures` | Filing steps | county, step_number, title, description, url |

**Gaps vs spec:**
- No `effective_date` or `source_url` on `forms` (required by Principle 2 — traceability)
- No `version` tracking on `county_procedures`
- No `audit_logs` table
- No Row Level Security policies defined
- No admin permissions model

---

## 3. Auth

**Status:** None implemented.

- No Supabase Auth integration
- No login/register UI
- No session middleware
- All case data stored in anonymous `localStorage` under key `divorce-filing-case`
- `/admin` is publicly accessible with no protection

---

## 4. Forms

**File:** `src/lib/forms/catalog.ts`  
**Format:** TypeScript object literals — not the JSON knowledge layer the spec requires.

| Form Code | Name | Has pdfField mappings? |
|---|---|---|
| FL_ALL_FAMILY_101 | Confidential Information Form | Partial (defined on type, not all fields mapped) |
| FL_ALL_FAMILY_103 | Petition for Dissolution | Partial |
| FL_ALL_FAMILY_119 | Summons | Partial |
| FL_ALL_FAMILY_140 | Declaration Re Minor Children | Partial |
| FL_ALL_FAMILY_131 | Parenting Plan | Partial |
| FL_ALL_FAMILY_165 | Child Support Worksheets | Partial |
| FL_ALL_FAMILY_185 | Final Divorce Order | Partial |

**Critical gaps vs spec:**
- Forms are TypeScript code, not JSON files under `/knowledge/forms/wa/`
- No `effectiveDate` or `sourceUrl` per form (Principle 2)
- No `sourceCourtName` reference
- `pdfField` property exists in the type but is never used in PDF generation
- No King County-specific form overrides in a `king/forms.json`

---

## 5. APIs

**Status:** No API routes exist anywhere in the codebase.

The app is entirely client-side. All data lives in browser `localStorage`. There are no:
- REST endpoints
- Server Actions
- Webhooks
- Change monitoring jobs

---

## 6. What Is Missing (vs. Spec Epics)

| Epic | Description | Present? |
|---|---|---|
| Epic 2 | `/src/domain` — Domain model (Case, Person, Child, Marriage, Asset, Debt, CountyProcedure, FormRequirement, CourtForm) | ❌ No |
| Epic 3 | `/src/rules` — Standalone rules module | ⚠️ Partial — exists in `src/lib/rules/` but not the spec's structure |
| Epic 4 | `/knowledge/forms/wa/` — JSON form catalog with traceability fields | ❌ No |
| Epic 5 | Form dependency engine with 95%+ test coverage | ⚠️ Partial — 4 tests, no coverage target |
| Epic 6 | `/src/interview` — JSON-driven question engine | ❌ No — questions hardcoded in React component |
| Epic 7 | `CaseContext` — normalized single source of truth for all systems | ⚠️ Partial — `CaseData` exists but not consumed by rules/PDF/AI uniformly |
| Epic 8 | `/src/pdf` — `loadPdf()`, `fillPdf()`, `flattenPdf()`, `mergePacket()`, ZIP output | ⚠️ Partial — `generatePacket.ts` exists but generates synthetic PDFs, not overlays; no ZIP |
| Epic 9 | `/knowledge/pdf-mappings` — JSON field mappings | ❌ No — mappings are inline TypeScript |
| Epic 10 | `/knowledge/procedures/wa/king/divorce-uncontested.json` | ❌ No — hardcoded TypeScript in `src/lib/procedures/index.ts` |
| Epic 11 | Filing checklist generator from `CaseContext` | ⚠️ Partial — exists but county procedures hardcoded, not data-driven |
| Epic 12 | `/src/assistant` — AI knowledge assistant (explains, never decides) | ❌ No |
| Epic 13 | `/admin` — Full admin console (upload forms, edit procedures, version tracking) | ⚠️ Partial — read-only catalog viewer exists, no edit capability |
| Epic 14 | Change monitoring — scheduled jobs for court form/procedure changes | ❌ No |
| Epic 15 | Production readiness — RLS, audit logs, Sentry, CI/CD, GitHub Actions | ❌ No |

---

## 7. Rules Engine

**File:** `src/lib/rules/determineRequiredForms.ts`

**What's good:**
- Correctly deterministic — no AI, clearly documented
- Covers: contested → referral, non-resident → referral, unlocatable spouse → referral, non-WA → referral
- WA uncontested with/without children correctly returns distinct form sets
- 4 passing Vitest tests

**Gaps vs spec:**
- Lives in `src/lib/rules/`, spec wants `/src/rules/` as a proper standalone module
- Input is a partial `CaseData` pick — spec wants a formal `CaseContext` type (Epic 7)
- No traceability: form codes are bare strings with no `sourceUrl`, `effectiveDate`, or `version`
- Test coverage is 4 tests — spec requires 95%+
- `if (caseData.state !== "WA")` is hardcoded logic, not data-driven (violates Principle 3)

---

## 8. PDF Generation

**File:** `src/lib/pdf/generatePacket.ts`

**What's good:**
- End-to-end download works (individual + combined)
- `mergePacket` equivalent exists

**Critical gaps vs spec:**
- Generates **synthetic text-layout PDFs**, not overlays on official court AcroForms
- `pdfField` defined on `FormFieldDefinition` but never called
- No `loadPdf()`, `fillPdf()`, `flattenPdf()` as distinct functions (spec Epic 8)
- Output is `.pdf` browser download — spec requires **ZIP output**
- No `/knowledge/pdf-mappings` JSON registry (Epic 9) — mappings would need to live in data

---

## 9. County Procedures

**File:** `src/lib/procedures/index.ts`

**What's good:**
- King County has a solid 7-step checklist with fees, timelines, URLs, required documents
- Children filter logic works correctly

**Critical gaps vs spec:**
- Procedures are **hardcoded TypeScript** — spec requires `/knowledge/procedures/wa/king/divorce-uncontested.json`
- Principle 3 explicitly forbids `if county === "King"` style hardcoding — this file does exactly that
- Pierce County has only 1 partial override; 8 other WA counties listed but no procedure data
- No version, effective_date, or source tracking on any step

---

## 10. Technical Debt Summary

| # | Issue | Severity |
|---|---|---|
| 1 | Interview questions hardcoded in React JSX — not JSON-driven | High |
| 2 | County procedures hardcoded in TypeScript — not data files | High |
| 3 | Form catalog in TypeScript — not `/knowledge/forms/wa/` JSON | High |
| 4 | PDF mappings inline — not `/knowledge/pdf-mappings/` JSON | High |
| 5 | PDF output is synthetic, not official court form overlay | High |
| 6 | No domain layer (`/src/domain`) — entities mixed into lib/ | High |
| 7 | No auth — entire app is anonymous localStorage | High |
| 8 | No traceability fields (sourceUrl, effectiveDate, version) on any legal data | High |
| 9 | Zod/RHF installed but unused — no interview validation | Medium |
| 10 | `@tanstack/react-query` installed but unused | Low |
| 11 | Admin panel publicly accessible | Medium |
| 12 | No CI/CD, no GitHub Actions | Medium |
| 13 | No Sentry or structured logging | Medium |
| 14 | `parenting_class` dashboard step shows even when hasChildren = false | Low |

---

## 11. What to Reuse (Per Spec Instruction)

| Asset | Reuse Decision |
|---|---|
| `src/lib/types.ts` — `CaseStatus`, `USState`, `ProgressStepKey` | ✅ Keep, extend into domain model |
| `src/lib/rules/determineRequiredForms.ts` — core logic | ✅ Keep, refactor into `/src/rules/` |
| `src/lib/rules/determineRequiredForms.test.ts` — 4 tests | ✅ Keep, expand to 95%+ coverage |
| `src/lib/procedures/index.ts` — King County step data | ✅ Extract data into JSON, delete TS logic |
| `src/lib/forms/catalog.ts` — 7 WA form definitions | ✅ Extract into `/knowledge/forms/wa/` JSON |
| `src/lib/pdf/generatePacket.ts` — merge/download logic | ✅ Keep merge logic, replace generation |
| `src/lib/store/case-store.tsx` — CaseData shape | ✅ Keep shape, migrate to CaseContext + DB |
| `src/app/interview/page.tsx` — step flow UI | ✅ Keep UI shell, replace hardcoded questions |
| `src/app/forms/page.tsx` — form editor UI | ✅ Keep, wire to new PDF infrastructure |
| `src/app/checklist/page.tsx` — checklist UI | ✅ Keep, wire to data-driven procedures |
| `src/app/dashboard/page.tsx` — progress tracker | ✅ Keep |
| `src/components/ui/` — Button, Card, Badge | ✅ Keep |
| `supabase/schema.sql` | ✅ Keep, add missing columns + RLS |
