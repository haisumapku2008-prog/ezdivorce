import type { CaseData, ProcedureStep } from "../types";

const KING_COUNTY_BASE: ProcedureStep[] = [
  {
    stepNumber: 1,
    title: "Confirm required forms",
    description:
      "Use our interview to determine your exact form set. King County requires official Washington State FL All Family forms. Verify your packet matches your situation (with or without minor children).",
    url: "https://www.washingtonlawhelp.org/en/get-family-law-forms",
    category: "preparation",
    timeline: "30–60 minutes",
  },
  {
    stepNumber: 2,
    title: "Create a King County e-filing account",
    description:
      "Register at the King County Superior Court e-filing portal (File & ServeXpress or approved provider). You will need a valid email, payment method for filing fees, and your completed forms in PDF format.",
    url: "https://kingcounty.gov/en/dept/dja/courts/superior-court/e-filing",
    category: "preparation",
    fees: "Filing fee ~$314 for dissolution (verify current fee schedule)",
    timeline: "15 minutes",
  },
  {
    stepNumber: 3,
    title: "File the Petition and Summons",
    description:
      "Upload your Petition (FL All Family 103), Summons (FL All Family 119), and Confidential Information form (FL All Family 101). If you have children, include the Declaration Re Minor Children, Parenting Plan, and Child Support Worksheets. Pay the filing fee online.",
    url: "https://kingcounty.gov/en/dept/dja/courts/superior-court/family-law",
    requiredDocuments: ["FL All Family 101", "FL All Family 103", "FL All Family 119"],
    category: "filing",
    fees: "~$314 filing fee",
    timeline: "Same day once forms are ready",
  },
  {
    stepNumber: 4,
    title: "Serve your spouse",
    description:
      "Your spouse must be formally served with the Summons and Petition. Acceptable methods include personal service by a third party (not you), service by sheriff, or acceptance of service if your spouse cooperates. File proof of service with the court.",
    url: "https://www.washingtonlawhelp.org/en/divorce-guide/serving-divorce-papers",
    requiredDocuments: ["Proof of Personal Service or Acceptance of Service"],
    category: "service",
    timeline: "Within 90 days of filing; sooner is better",
  },
  {
    stepNumber: 5,
    title: "Complete mandatory parenting seminar (if children)",
    description:
      "If you have minor children, both parents must typically complete a parenting seminar approved by the court within 60 days of service. Register early — classes fill up. Keep your certificate of completion.",
    url: "https://www.kingcounty.gov/depts/superior-court/family-court/parenting-seminar",
    category: "post_filing",
    fees: "Varies by provider (~$40–$60)",
    timeline: "Within 60 days of service",
  },
  {
    stepNumber: 6,
    title: "Observe the 90-day waiting period",
    description:
      "Washington requires a minimum 90-day waiting period from the date of filing and service before the court can enter final orders. Use this time to finalize your parenting plan, support calculations, and property/debt division.",
    url: "https://www.washingtonlawhelp.org/en/divorce-guide",
    category: "post_filing",
    timeline: "Minimum 90 days from filing",
  },
  {
    stepNumber: 7,
    title: "Submit final orders and schedule hearing (if needed)",
    description:
      "Prepare Findings of Fact, Conclusions of Law, and Decree of Dissolution (FL All Family 185 or equivalent). For agreed cases, you may submit by mail or e-filing depending on local rules. Some King County cases require a brief hearing.",
    url: "https://www.washingtonlawhelp.org/en/divorce-guide/finalizing-divorce",
    requiredDocuments: ["Final Divorce Order", "Parenting Plan (if children)", "Child Support Order (if children)"],
    category: "completion",
    timeline: "After 90-day waiting period",
  },
];

const PIERCE_COUNTY_OVERRIDES: Partial<ProcedureStep>[] = [
  {
    stepNumber: 2,
    title: "Create a Pierce County e-filing account",
    description: "Register with Pierce County Superior Court e-filing. Requirements mirror King County but use Pierce County portals.",
    url: "https://www.piercecountywa.gov/609/Superior-Court",
  },
];

function applyCountyOverrides(steps: ProcedureStep[], county: string): ProcedureStep[] {
  if (county === "pierce") {
    return steps.map((step) => {
      const override = PIERCE_COUNTY_OVERRIDES.find((o) => o.stepNumber === step.stepNumber);
      return override ? { ...step, ...override } : step;
    });
  }
  return steps;
}

/**
 * Deterministic procedure engine — generates county-specific filing checklist.
 */
export function generateChecklist(
  county: string,
  hasChildren: boolean,
  state: string
): ProcedureStep[] {
  if (state !== "WA") {
    return [{
      stepNumber: 1,
      title: "State not yet supported",
      description: "Detailed county procedures are available for Washington State counties. Select WA to see full guidance.",
      category: "preparation",
    }];
  }

  let steps = applyCountyOverrides([...KING_COUNTY_BASE], county);

  if (!hasChildren) {
    steps = steps.filter((s) => s.stepNumber !== 5);
    steps = steps.map((s, i) => ({ ...s, stepNumber: i + 1 }));
  }

  return steps;
}

export function getCountyDisplayName(county: string): string {
  const names: Record<string, string> = {
    king: "King County",
    pierce: "Pierce County",
    snohomish: "Snohomish County",
    spokane: "Spokane County",
    clark: "Clark County",
    thurston: "Thurston County",
    kitsap: "Kitsap County",
    yakima: "Yakima County",
    whatcom: "Whatcom County",
    benton: "Benton County",
  };
  return names[county] ?? county;
}
