import type { CaseData, FormRequirementRule } from "../types";

/** Deterministic rules — no AI. Washington uncontested divorce forms. */
const WA_BASE_FORMS = [
  "FL_ALL_FAMILY_101",
  "FL_ALL_FAMILY_103",
  "FL_ALL_FAMILY_119",
];

const WA_CHILD_FORMS = [
  "FL_ALL_FAMILY_140",
  "FL_ALL_FAMILY_131",
  "FL_ALL_FAMILY_165",
];

const WA_NO_CHILD_FORMS = [
  "FL_ALL_FAMILY_185",
];

export const WA_FORM_REQUIREMENTS: FormRequirementRule[] = [
  {
    hasChildren: false,
    isContested: false,
    requiredFormCodes: [...WA_BASE_FORMS, ...WA_NO_CHILD_FORMS],
  },
  {
    hasChildren: true,
    isContested: false,
    requiredFormCodes: [...WA_BASE_FORMS, ...WA_CHILD_FORMS],
  },
];

export interface FormDeterminationResult {
  formCodes: string[];
  referralRequired: boolean;
  referralReason?: string;
}

/**
 * Deterministic rules engine — determines required forms from case data.
 * AI must NEVER be used for this function.
 */
export function determineRequiredForms(caseData: Pick<
  CaseData,
  "state" | "county" | "hasChildren" | "isContested" | "livesInState" | "spouseLocatable"
>): FormDeterminationResult {
  if (caseData.isContested) {
    return {
      formCodes: [],
      referralRequired: true,
      referralReason:
        "Contested divorces require legal representation. Our MVP supports uncontested divorces only. Please consult a family law attorney.",
    };
  }

  if (!caseData.livesInState) {
    return {
      formCodes: [],
      referralRequired: true,
      referralReason:
        "You must meet Washington residency requirements to file here. Consider consulting an attorney about jurisdiction.",
    };
  }

  if (!caseData.spouseLocatable) {
    return {
      formCodes: [],
      referralRequired: true,
      referralReason:
        "If your spouse cannot be located, alternative service rules apply. Please seek legal assistance.",
    };
  }

  if (caseData.state !== "WA") {
    return {
      formCodes: [],
      referralRequired: true,
      referralReason: `${caseData.state} is not yet supported in this prototype. Washington State is fully supported — select WA to continue.`,
    };
  }

  const rule = WA_FORM_REQUIREMENTS.find(
    (r) =>
      r.hasChildren === caseData.hasChildren &&
      r.isContested === false
  );

  return {
    formCodes: rule?.requiredFormCodes ?? WA_BASE_FORMS,
    referralRequired: false,
  };
}

export function getFormDisplayNames(codes: string[]): string[] {
  const names: Record<string, string> = {
    FL_ALL_FAMILY_101: "Confidential Information (FL All Family 101)",
    FL_ALL_FAMILY_103: "Petition for Dissolution (FL All Family 103)",
    FL_ALL_FAMILY_119: "Summons (FL All Family 119)",
    FL_ALL_FAMILY_140: "Declaration Re Minor Children (FL All Family 140)",
    FL_ALL_FAMILY_131: "Parenting Plan (FL All Family 131)",
    FL_ALL_FAMILY_165: "Child Support Worksheets (FL All Family 165)",
    FL_ALL_FAMILY_185: "Final Divorce Order (FL All Family 185)",
  };
  return codes.map((c) => names[c] ?? c);
}
