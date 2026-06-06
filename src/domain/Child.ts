/**
 * A minor child of the marriage.
 * No UI code. No database code.
 */
export interface Child {
  fullName: string;
  dateOfBirth: string;        // ISO date string
  livesWithPrimary?: "petitioner" | "respondent" | "shared";
}
