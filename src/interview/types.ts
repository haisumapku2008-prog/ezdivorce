/**
 * /src/interview/types.ts
 *
 * Types for the JSON-driven interview question engine.
 * Questions are defined in questions.json — never hardcoded in React components.
 */

export type QuestionType =
  | "text"
  | "email"
  | "date"
  | "number"
  | "boolean"
  | "checkbox"
  | "select"
  | "state-select"   // special: renders the full US state dropdown
  | "county-select"; // special: renders counties for the selected state

/** A condition that controls whether a question is shown */
export interface ShowIfCondition {
  field: string;
  value: string | boolean | number;
}

/** A single interview question definition */
export interface QuestionDefinition {
  /** Unique identifier, also used as the CaseData field key when field is absent */
  id: string;
  /** Step label, e.g. "Location", "Residency" */
  step: string;
  /** Input type */
  type: QuestionType;
  /** Plain-language question text */
  question: string;
  /** Optional additional context shown below the question */
  helpText?: string;
  /** CaseData field key this question writes to (defaults to id) */
  field: string;
  /** Whether an answer is required to advance */
  required: boolean;
  /** Placeholder text for text/email inputs */
  placeholder?: string;
  /** For boolean: [falseLabel, trueLabel] */
  labels?: [string, string];
  /**
   * For boolean: when true, the "Yes" button maps to false and vice versa.
   * Allows questions like "Is your spouse expected to DISAGREE?" where
   * selecting "No — uncontested" should store isContested = false.
   */
  invertDisplay?: boolean;
  /** For select: available options */
  options?: { value: string; label: string }[];
  /** For number: minimum value */
  min?: number;
  /** For number: maximum value */
  max?: number;
  /** Only render this question when the condition is met */
  showIf?: ShowIfCondition;
}

/** The ordered list of unique step names derived from questions */
export type InterviewStep = string;
