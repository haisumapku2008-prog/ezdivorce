/**
 * A step in the county-specific divorce filing procedure.
 * Mirrors the JSON structure in /knowledge/procedures/.
 * No UI code. No database code.
 */
export type ProcedureCategory =
  | "preparation"
  | "filing"
  | "service"
  | "post_filing"
  | "completion";

export interface CountyProcedureStep {
  stepNumber: number;
  title: string;
  description: string;
  category: ProcedureCategory;
  url?: string;
  fees?: string;
  timeline?: string;
  requiredDocuments?: string[];
  requiresChildren?: boolean; // if true, step is only shown when children present
}

export interface CountyProcedure {
  county: string;             // slug, e.g. "king"
  state: string;              // two-letter code, e.g. "WA"
  caseType: string;           // e.g. "divorce-uncontested"
  effectiveDate: string;      // ISO date
  sourceUrl: string;          // official court page for these procedures
  steps: CountyProcedureStep[];
}
