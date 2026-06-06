/**
 * A court form determined to be required by the rules engine.
 * Carries full traceability per Principle 2.
 * No UI code. No database code.
 */
export interface FormRequirement {
  formCode: string;           // e.g. "FL_ALL_FAMILY_103"
  title: string;              // human-readable name
  required: boolean;
  sourceUrl: string;          // official court URL for this form
  effectiveDate: string;      // ISO date — when this requirement took effect
  version: string;            // form version string, e.g. "09/2022"
}
