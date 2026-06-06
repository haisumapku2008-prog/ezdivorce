/**
 * A marital asset.
 * No UI code. No database code.
 */
export interface Asset {
  type: "real_estate" | "vehicle" | "retirement" | "bank_account" | "other";
  description?: string;
  estimatedValue?: number;
}

/**
 * A shared debt.
 * No UI code. No database code.
 */
export interface Debt {
  type: "mortgage" | "car_loan" | "credit_card" | "student_loan" | "other";
  description?: string;
  amount?: number;
}
