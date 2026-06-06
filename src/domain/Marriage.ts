/**
 * Facts about the marriage itself.
 * No UI code. No database code.
 */
export interface Marriage {
  dateMarried?: string;       // ISO date string
  dateSeparated?: string;     // ISO date string
  county: string;             // county slug where filing will occur, e.g. "king"
  state: string;              // two-letter state code, e.g. "WA"
}
