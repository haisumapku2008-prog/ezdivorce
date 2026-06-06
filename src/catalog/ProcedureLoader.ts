/**
 * /src/catalog/ProcedureLoader.ts
 *
 * Loads county filing procedures from /knowledge/procedures JSON files.
 *
 * Principle 3: county procedures are data — never hardcode county names
 * as conditionals in TypeScript. Each county gets its own JSON file.
 */

import type { CountyProcedure, CountyProcedureStep } from "../domain/CountyProcedure";

// Static imports — one per supported county file.
// When a new county is supported, add its import here and register it below.
import kingProcedures from "../../knowledge/procedures/wa/king/divorce-uncontested.json";
import pierceProcedures from "../../knowledge/procedures/wa/pierce/divorce-uncontested.json";

// ── Registry ──────────────────────────────────────────────────────────────
// key format: "{state}/{county}/{caseType}"

const PROCEDURE_REGISTRY: Record<string, CountyProcedure> = {
  "wa/king/divorce-uncontested":   kingProcedures   as CountyProcedure,
  "wa/pierce/divorce-uncontested": pierceProcedures as CountyProcedure,
};

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Load the procedure definition for a given state, county, and case type.
 * Returns undefined when no procedure file exists for that combination.
 */
export function loadProcedure(
  state: string,
  county: string,
  caseType = "divorce-uncontested"
): CountyProcedure | undefined {
  const key = `${state.toLowerCase()}/${county.toLowerCase()}/${caseType}`;
  return PROCEDURE_REGISTRY[key];
}

/**
 * Generate the ordered checklist steps for a case.
 *
 * Filters out steps that require children when none are present.
 * Re-numbers steps sequentially after filtering.
 *
 * Falls back to King County procedure when the county is unsupported
 * (with a warning — not a silent fallback).
 */
export function generateChecklist(
  state: string,
  county: string,
  hasChildren: boolean,
  caseType = "divorce-uncontested"
): CountyProcedureStep[] {
  const procedure = loadProcedure(state, county, caseType);

  if (!procedure) {
    console.warn(
      `[ProcedureLoader] No procedure data for ${state}/${county}/${caseType}. ` +
      "Returning empty checklist — add a JSON file to /knowledge/procedures/ to resolve this."
    );
    return [];
  }

  let steps = [...procedure.steps];

  if (!hasChildren) {
    steps = steps.filter((s) => !s.requiresChildren);
  }

  // Re-number sequentially after any filtered steps
  return steps.map((step, i) => ({ ...step, stepNumber: i + 1 }));
}

/**
 * List which state/county combinations have procedure data.
 */
export function listSupportedProcedures(): string[] {
  return Object.keys(PROCEDURE_REGISTRY);
}
