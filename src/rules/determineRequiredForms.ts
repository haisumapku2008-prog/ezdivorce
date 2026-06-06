/**
 * /src/rules/determineRequiredForms.ts
 *
 * Deterministic rules engine. No AI. No API calls. Pure logic.
 *
 * Input:  CaseContext
 * Output: FormRequirement[]
 *
 * Every returned FormRequirement carries full traceability per Principle 2:
 *   sourceUrl, effectiveDate, version
 */

import type { CaseContext } from "../domain/CaseContext";
import type { FormRequirement } from "../domain/FormRequirement";
import { hasChildren } from "../domain/CaseContext";

// ── Referral result ────────────────────────────────────────────────────────

export interface ReferralResult {
  referralRequired: true;
  referralReason: string;
}

export interface FormsResult {
  referralRequired: false;
  forms: FormRequirement[];
}

export type DetermineFormsResult = ReferralResult | FormsResult;

// ── WA form registry ───────────────────────────────────────────────────────
// Source: https://www.courts.wa.gov/forms/?fa=forms.contribute&formID=13
// These will be superseded by the knowledge layer (Epic 4) once that
// catalog loader is wired in. For now they live here as the authoritative
// fallback so the rules engine is self-contained and testable.

const WA_FORMS: Record<string, Omit<FormRequirement, "required">> = {
  FL_ALL_FAMILY_101: {
    formCode: "FL_ALL_FAMILY_101",
    title: "Confidential Information (FL All Family 101)",
    sourceUrl: "https://www.courts.wa.gov/forms/documents/FL_All_Family_101.pdf",
    effectiveDate: "2022-09-01",
    version: "09/2022",
  },
  FL_ALL_FAMILY_103: {
    formCode: "FL_ALL_FAMILY_103",
    title: "Petition for Dissolution of Marriage (FL All Family 103)",
    sourceUrl: "https://www.courts.wa.gov/forms/documents/FL_All_Family_103.pdf",
    effectiveDate: "2022-09-01",
    version: "09/2022",
  },
  FL_ALL_FAMILY_119: {
    formCode: "FL_ALL_FAMILY_119",
    title: "Summons: Notice About a Marriage (FL All Family 119)",
    sourceUrl: "https://www.courts.wa.gov/forms/documents/FL_All_Family_119.pdf",
    effectiveDate: "2022-09-01",
    version: "09/2022",
  },
  FL_ALL_FAMILY_140: {
    formCode: "FL_ALL_FAMILY_140",
    title: "Declaration Re: Service Members Civil Relief Act (FL All Family 140)",
    sourceUrl: "https://www.courts.wa.gov/forms/documents/FL_All_Family_140.pdf",
    effectiveDate: "2022-09-01",
    version: "09/2022",
  },
  FL_ALL_FAMILY_131: {
    formCode: "FL_ALL_FAMILY_131",
    title: "Parenting Plan (FL All Family 131)",
    sourceUrl: "https://www.courts.wa.gov/forms/documents/FL_All_Family_131.pdf",
    effectiveDate: "2022-09-01",
    version: "09/2022",
  },
  FL_ALL_FAMILY_165: {
    formCode: "FL_ALL_FAMILY_165",
    title: "Child Support Worksheets (FL All Family 165)",
    sourceUrl: "https://www.courts.wa.gov/forms/documents/FL_All_Family_165.pdf",
    effectiveDate: "2022-09-01",
    version: "09/2022",
  },
  FL_ALL_FAMILY_185: {
    formCode: "FL_ALL_FAMILY_185",
    title: "Decree of Dissolution of Marriage (FL All Family 185)",
    sourceUrl: "https://www.courts.wa.gov/forms/documents/FL_All_Family_185.pdf",
    effectiveDate: "2022-09-01",
    version: "09/2022",
  },
};

/** @internal Exported for testing only */
export function requireForm(code: string): FormRequirement {
  const entry = WA_FORMS[code];
  if (!entry) throw new Error(`Unknown form code: ${code}`);
  return { ...entry, required: true };
}

// ── Form sets ──────────────────────────────────────────────────────────────

/** Core forms required in every WA uncontested dissolution */
const WA_BASE_FORMS = [
  "FL_ALL_FAMILY_101",
  "FL_ALL_FAMILY_103",
  "FL_ALL_FAMILY_119",
] as const;

/** Additional forms when minor children are present */
const WA_CHILDREN_FORMS = [
  "FL_ALL_FAMILY_140",
  "FL_ALL_FAMILY_131",
  "FL_ALL_FAMILY_165",
] as const;

/** Final order form when no minor children */
const WA_NO_CHILDREN_FORMS = [
  "FL_ALL_FAMILY_185",
] as const;

// ── Main entrypoint ────────────────────────────────────────────────────────

/**
 * Determine which court forms are required for a given case.
 *
 * AI must NEVER be used in this function.
 * All logic is deterministic and traceable to statute / court rules.
 */
export function determineRequiredForms(
  ctx: Pick<
    CaseContext,
    | "marriage"
    | "children"
    | "isContested"
    | "livesInState"
    | "spouseLocatable"
  >
): DetermineFormsResult {
  // Guard: contested divorce — out of scope for v2
  if (ctx.isContested) {
    return {
      referralRequired: true,
      referralReason:
        "Contested divorces require legal representation. " +
        "EZDivorce supports uncontested divorces only. " +
        "Please consult a licensed family law attorney.",
    };
  }

  // Guard: petitioner does not live in Washington
  if (!ctx.livesInState) {
    return {
      referralRequired: true,
      referralReason:
        "You must meet Washington State residency requirements to file here. " +
        "Washington requires that one spouse has lived in the state for at least 90 days. " +
        "Please consult an attorney about jurisdiction.",
    };
  }

  // Guard: respondent cannot be located
  if (!ctx.spouseLocatable) {
    return {
      referralRequired: true,
      referralReason:
        "If your spouse cannot be located, alternative service rules apply " +
        "(service by publication). This requires court approval and legal guidance. " +
        "Please seek legal assistance.",
    };
  }

  // Guard: state not yet supported
  if (ctx.marriage.state !== "WA") {
    return {
      referralRequired: true,
      referralReason:
        `${ctx.marriage.state} is not yet supported. ` +
        "EZDivorce currently supports Washington State only.",
    };
  }

  // Determine form set
  const formCodes: string[] = [...WA_BASE_FORMS];

  if (hasChildren(ctx as CaseContext)) {
    formCodes.push(...WA_CHILDREN_FORMS);
  } else {
    formCodes.push(...WA_NO_CHILDREN_FORMS);
  }

  return {
    referralRequired: false,
    forms: formCodes.map(requireForm),
  };
}

// ── Convenience helpers ────────────────────────────────────────────────────

/** Extract just the form codes from a FormsResult */
export function getFormCodes(result: DetermineFormsResult): string[] {
  if (result.referralRequired) return [];
  return result.forms.map((f) => f.formCode);
}
