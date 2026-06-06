import type { Person } from "./Person";
import type { Child } from "./Child";
import type { Marriage } from "./Marriage";
import type { Asset, Debt } from "./AssetDebt";

/**
 * The canonical input to every system: rules engine, PDF filler,
 * AI assistant, checklist generator.
 *
 * This is the single source of truth for a divorce case.
 * No UI code. No database code.
 */
export type CaseStatus =
  | "draft"
  | "interview_complete"
  | "forms_generated"
  | "petition_filed"
  | "service_completed"
  | "parenting_class"
  | "final_orders";

export interface ProgressSteps {
  interview_complete: boolean;
  forms_generated: boolean;
  petition_filed: boolean;
  service_completed: boolean;
  parenting_class: boolean;
  final_orders: boolean;
}

export interface CaseContext {
  /** Unique identifier for this case */
  id: string;

  /** Current workflow status */
  status: CaseStatus;

  /** The person initiating the divorce */
  petitioner: Person;

  /** The other spouse */
  respondent: Person;

  /** Minor children of the marriage */
  children: Child[];

  /** Facts about the marriage */
  marriage: Marriage;

  /** Marital assets */
  assets: Asset[];

  /** Shared debts */
  debts: Debt[];

  // ── Eligibility flags ──────────────────────────────────────────────
  /** True if petitioner currently lives in the filing state */
  livesInState: boolean;

  /** True if the divorce is uncontested */
  isContested: boolean;

  /** True if the respondent can be located for service */
  spouseLocatable: boolean;

  // ── Form answers ───────────────────────────────────────────────────
  /** Per-form field answers keyed by formCode → fieldKey → value */
  formAnswers: Record<string, Record<string, string>>;

  /** Manual progress step toggles */
  progressSteps: ProgressSteps;

  // ── Timestamps ─────────────────────────────────────────────────────
  createdAt: string;
  updatedAt: string;
}

// ── Convenience selectors (pure functions on CaseContext) ────────────

export function hasChildren(ctx: CaseContext): boolean {
  return ctx.children.length > 0;
}

export function filingState(ctx: CaseContext): string {
  return ctx.marriage.state;
}

export function filingCounty(ctx: CaseContext): string {
  return ctx.marriage.county;
}
