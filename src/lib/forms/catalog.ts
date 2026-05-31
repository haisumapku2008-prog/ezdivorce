import type { FormDefinition } from "../types";

const commonPetitionFields = [
  { key: "petitionerName", label: "Petitioner full legal name", type: "text" as const, required: true, pdfField: "petitioner_name" },
  { key: "respondentName", label: "Respondent full legal name", type: "text" as const, required: true, pdfField: "respondent_name" },
  { key: "petitionerAddress", label: "Petitioner address", type: "textarea" as const, required: true },
  { key: "respondentAddress", label: "Respondent last known address", type: "textarea" as const, required: true },
  { key: "dateMarried", label: "Date of marriage", type: "date" as const, required: true },
  { key: "dateSeparated", label: "Date of separation", type: "date" as const, required: true },
  { key: "county", label: "County of filing", type: "text" as const, required: true },
];

export const WA_FORMS: FormDefinition[] = [
  {
    code: "FL_ALL_FAMILY_101",
    name: "Confidential Information Form",
    state: "WA",
    description: "Required confidential identifying information for all family law cases.",
    officialUrl: "https://www.courts.wa.gov/forms/documents/FL_All_Family_101.pdf",
    fields: [
      { key: "petitionerName", label: "Petitioner name", type: "text", required: true },
      { key: "respondentName", label: "Respondent name", type: "text", required: true },
      { key: "petitionerDOB", label: "Petitioner date of birth", type: "date", required: true },
      { key: "respondentDOB", label: "Respondent date of birth", type: "date", required: true },
      { key: "petitionerSSN", label: "Petitioner SSN (last 4)", type: "text", required: true, helpText: "Only last 4 digits stored in prototype" },
      { key: "respondentSSN", label: "Respondent SSN (last 4)", type: "text", required: true },
    ],
  },
  {
    code: "FL_ALL_FAMILY_103",
    name: "Petition for Dissolution (Divorce)",
    state: "WA",
    description: "Primary petition to start an uncontested divorce in Washington.",
    officialUrl: "https://www.courts.wa.gov/forms/documents/FL_All_Family_103.pdf",
    fields: [
      ...commonPetitionFields,
      { key: "grounds", label: "Grounds for dissolution", type: "select", required: true, options: [
        { value: "irretrievably_broken", label: "Marriage is irretrievably broken" },
      ]},
      { key: "hasChildren", label: "Minor children of the marriage", type: "checkbox" },
      { key: "childrenCount", label: "Number of minor children", type: "number" },
    ],
  },
  {
    code: "FL_ALL_FAMILY_119",
    name: "Summons",
    state: "WA",
    description: "Official summons notifying respondent of the divorce action.",
    officialUrl: "https://www.courts.wa.gov/forms/documents/FL_All_Family_119.pdf",
    fields: [
      { key: "petitionerName", label: "Petitioner name", type: "text", required: true },
      { key: "respondentName", label: "Respondent name", type: "text", required: true },
      { key: "courtName", label: "Superior Court", type: "text", required: true, helpText: "e.g. King County Superior Court" },
      { key: "caseNumber", label: "Case number (if assigned)", type: "text" },
    ],
  },
  {
    code: "FL_ALL_FAMILY_140",
    name: "Declaration Re Minor Children",
    state: "WA",
    description: "Required when minor children are involved.",
    officialUrl: "https://www.courts.wa.gov/forms/documents/FL_All_Family_140.pdf",
    fields: [
      { key: "petitionerName", label: "Petitioner name", type: "text", required: true },
      { key: "respondentName", label: "Respondent name", type: "text", required: true },
      { key: "childrenCount", label: "Number of minor children", type: "number", required: true },
      { key: "childrenNames", label: "Names and dates of birth of each child", type: "textarea", required: true },
    ],
  },
  {
    code: "FL_ALL_FAMILY_131",
    name: "Parenting Plan",
    state: "WA",
    description: "Proposed residential schedule and decision-making for minor children.",
    officialUrl: "https://www.courts.wa.gov/forms/documents/FL_All_Family_131.pdf",
    fields: [
      { key: "petitionerName", label: "Petitioner name", type: "text", required: true },
      { key: "respondentName", label: "Respondent name", type: "text", required: true },
      { key: "primaryResidential", label: "Primary residential parent", type: "select", required: true, options: [
        { value: "petitioner", label: "Petitioner" },
        { value: "respondent", label: "Respondent" },
        { value: "shared", label: "Shared / equal time" },
      ]},
      { key: "holidaySchedule", label: "Holiday schedule summary", type: "textarea" },
      { key: "decisionMaking", label: "Major decision-making", type: "select", options: [
        { value: "joint", label: "Joint" },
        { value: "petitioner", label: "Petitioner" },
        { value: "respondent", label: "Respondent" },
      ]},
    ],
  },
  {
    code: "FL_ALL_FAMILY_165",
    name: "Child Support Worksheets",
    state: "WA",
    description: "Financial worksheets to calculate child support obligations.",
    officialUrl: "https://www.washingtonlawhelp.org/en/get-family-law-forms",
    fields: [
      { key: "petitionerIncome", label: "Petitioner gross monthly income", type: "number", required: true },
      { key: "respondentIncome", label: "Respondent gross monthly income", type: "number", required: true },
      { key: "childrenCount", label: "Number of children", type: "number", required: true },
      { key: "healthInsurance", label: "Who provides health insurance for children", type: "select", options: [
        { value: "petitioner", label: "Petitioner" },
        { value: "respondent", label: "Respondent" },
        { value: "both", label: "Both" },
      ]},
    ],
  },
  {
    code: "FL_ALL_FAMILY_185",
    name: "Final Divorce Order",
    state: "WA",
    description: "Proposed final orders for uncontested dissolution.",
    officialUrl: "https://www.courts.wa.gov/forms/documents/FL_All_Family_185.pdf",
    fields: [
      { key: "petitionerName", label: "Petitioner name", type: "text", required: true },
      { key: "respondentName", label: "Respondent name", type: "text", required: true },
      { key: "propertyDivision", label: "Property division summary", type: "textarea" },
      { key: "debtDivision", label: "Debt division summary", type: "textarea" },
    ],
  },
];

export const FORM_CATALOG: Record<string, FormDefinition> = Object.fromEntries(
  WA_FORMS.map((f) => [f.code, f])
);

export function getFormByCode(code: string): FormDefinition | undefined {
  return FORM_CATALOG[code];
}

export function getFormsByCodes(codes: string[]): FormDefinition[] {
  return codes.map((c) => FORM_CATALOG[c]).filter(Boolean);
}
