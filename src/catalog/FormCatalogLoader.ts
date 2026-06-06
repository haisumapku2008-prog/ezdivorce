/**
 * /src/catalog/FormCatalogLoader.ts
 *
 * Loads court form metadata from /knowledge/forms JSON files.
 * This is the single source of truth for form definitions.
 *
 * No hardcoded form data here — all data lives in /knowledge/.
 */

import type { CourtForm } from "../domain/CourtForm";

// Next.js / Node: import JSON directly (supported in both environments)
import kingForms from "../../knowledge/forms/wa/king/forms.json";

// ── Raw JSON shape (matches the JSON files exactly) ───────────────────────

type RawFormJson = {
  formCode: string;
  title: string;
  state: string;
  county: string | null;
  description: string;
  required: boolean;
  effectiveDate: string;
  version: string;
  sourceUrl: string;
  sourceCourtName: string;
  fields: CourtForm["fields"];
};

// ── Loader ────────────────────────────────────────────────────────────────

function normalise(raw: RawFormJson): CourtForm {
  return {
    formCode: raw.formCode,
    title: raw.title,
    state: raw.state,
    county: raw.county ?? undefined,
    description: raw.description,
    required: raw.required,
    effectiveDate: raw.effectiveDate,
    version: raw.version,
    sourceUrl: raw.sourceUrl,
    sourceCourtName: raw.sourceCourtName,
    fields: raw.fields,
  };
}

/** All WA King County forms, loaded from /knowledge/forms/wa/king/forms.json */
const WA_KING_FORMS: CourtForm[] = (kingForms as RawFormJson[]).map(normalise);

/** Flat catalog: state → county → formCode → CourtForm */
const CATALOG: Record<string, Record<string, Record<string, CourtForm>>> = {
  WA: {
    king: Object.fromEntries(WA_KING_FORMS.map((f) => [f.formCode, f])),
  },
};

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Get all forms for a given state + county.
 * Falls back to state-level forms when county-specific catalog not found.
 */
export function getFormsForCounty(state: string, county: string): CourtForm[] {
  const stateKey = state.toUpperCase();
  const countyKey = county.toLowerCase();
  return Object.values(CATALOG[stateKey]?.[countyKey] ?? {});
}

/**
 * Look up a single form by code, for a given state + county.
 */
export function getFormByCode(
  formCode: string,
  state = "WA",
  county = "king"
): CourtForm | undefined {
  const stateKey = state.toUpperCase();
  const countyKey = county.toLowerCase();
  return CATALOG[stateKey]?.[countyKey]?.[formCode];
}

/**
 * Get multiple forms by code list.
 * Skips codes not found in the catalog (logs a warning).
 */
export function getFormsByCodes(
  formCodes: string[],
  state = "WA",
  county = "king"
): CourtForm[] {
  return formCodes.flatMap((code) => {
    const form = getFormByCode(code, state, county);
    if (!form) {
      console.warn(`[FormCatalogLoader] Unknown form code: ${code} (${state}/${county})`);
      return [];
    }
    return [form];
  });
}
