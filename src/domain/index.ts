/**
 * /src/domain — Pure domain layer.
 *
 * Rules:
 *   - No UI code (no React, no Next.js)
 *   - No database code (no Supabase, no fetch)
 *   - No side effects
 */

export type { Person } from "./Person";
export type { Child } from "./Child";
export type { Marriage } from "./Marriage";
export type { Asset, Debt } from "./AssetDebt";
export type { FormRequirement } from "./FormRequirement";
export type { CourtForm, CourtFormField } from "./CourtForm";
export type { CountyProcedure, CountyProcedureStep, ProcedureCategory } from "./CountyProcedure";
export type { CaseContext, CaseStatus, ProgressSteps } from "./CaseContext";
export { hasChildren, filingState, filingCounty } from "./CaseContext";
