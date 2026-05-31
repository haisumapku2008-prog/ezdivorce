export type USState =
  | "AL" | "AK" | "AZ" | "AR" | "CA" | "CO" | "CT" | "DE" | "FL" | "GA"
  | "HI" | "ID" | "IL" | "IN" | "IA" | "KS" | "KY" | "LA" | "ME" | "MD"
  | "MA" | "MI" | "MN" | "MS" | "MO" | "MT" | "NE" | "NV" | "NH" | "NJ"
  | "NM" | "NY" | "NC" | "ND" | "OH" | "OK" | "OR" | "PA" | "RI" | "SC"
  | "SD" | "TN" | "TX" | "UT" | "VT" | "VA" | "WA" | "WV" | "WI" | "WY";

export type CaseStatus =
  | "draft"
  | "interview_complete"
  | "forms_generated"
  | "petition_filed"
  | "service_completed"
  | "parenting_class"
  | "final_orders";

export interface CaseData {
  id: string;
  state: USState;
  county: string;
  city?: string;
  status: CaseStatus;
  hasChildren: boolean;
  isContested: boolean;
  livesInState: boolean;
  dateMarried?: string;
  dateSeparated?: string;
  spouseLocatable: boolean;
  hasHouse: boolean;
  hasVehicles: boolean;
  hasRetirement: boolean;
  hasDebt: boolean;
  petitionerName: string;
  respondentName: string;
  petitionerEmail?: string;
  petitionerPhone?: string;
  petitionerAddress?: string;
  respondentAddress?: string;
  childrenCount?: number;
  formAnswers: Record<string, Record<string, string>>;
  progressSteps: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface FormDefinition {
  code: string;
  name: string;
  state: USState | "ALL";
  description: string;
  fields: FormFieldDefinition[];
  officialUrl?: string;
}

export interface FormFieldDefinition {
  key: string;
  label: string;
  type: "text" | "date" | "select" | "checkbox" | "textarea" | "number";
  required?: boolean;
  options?: { value: string; label: string }[];
  helpText?: string;
  pdfField?: string;
}

export interface ProcedureStep {
  stepNumber: number;
  title: string;
  description: string;
  url?: string;
  requiredDocuments?: string[];
  fees?: string;
  timeline?: string;
  category: "preparation" | "filing" | "service" | "post_filing" | "completion";
}

export interface FormRequirementRule {
  county?: string;
  hasChildren?: boolean;
  isContested?: boolean;
  requiredFormCodes: string[];
}

export const PROGRESS_STEP_KEYS = [
  "interview_complete",
  "forms_generated",
  "petition_filed",
  "service_completed",
  "parenting_class",
  "final_orders",
] as const;

export type ProgressStepKey = (typeof PROGRESS_STEP_KEYS)[number];

export const PROGRESS_STEP_LABELS: Record<ProgressStepKey, string> = {
  interview_complete: "Interview Complete",
  forms_generated: "Forms Generated",
  petition_filed: "Petition Filed",
  service_completed: "Service Completed",
  parenting_class: "Parenting Class",
  final_orders: "Final Orders",
};
