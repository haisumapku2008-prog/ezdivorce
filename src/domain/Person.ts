/**
 * A party in the divorce case.
 * No UI code. No database code.
 */
export interface Person {
  fullName: string;
  dateOfBirth?: string;       // ISO date string
  ssnLast4?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  email?: string;
  phone?: string;
}
