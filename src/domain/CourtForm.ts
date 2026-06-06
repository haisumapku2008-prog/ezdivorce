/**
 * Metadata about an official court form.
 * Mirrors the JSON structure in /knowledge/forms/.
 * No UI code. No database code.
 */
export interface CourtFormField {
  key: string;
  label: string;
  type: "text" | "date" | "select" | "checkbox" | "textarea" | "number";
  required?: boolean;
  options?: { value: string; label: string }[];
  helpText?: string;
  pdfField?: string;          // AcroForm field name in the official PDF
}

export interface CourtForm {
  formCode: string;           // e.g. "FL_ALL_FAMILY_103"
  title: string;
  state: string;              // "WA" | "ALL"
  county?: string;            // null = applies to all counties in state
  description: string;
  required: boolean;
  effectiveDate: string;      // ISO date
  version: string;            // form version, e.g. "09/2022"
  sourceUrl: string;          // official PDF URL
  sourceCourtName: string;    // e.g. "Washington State Courts"
  fields: CourtFormField[];
}
