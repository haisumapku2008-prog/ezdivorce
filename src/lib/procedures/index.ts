/**
 * src/lib/procedures/index.ts
 *
 * Thin adapter — public API preserved for backward compatibility.
 * All logic has moved to /src/catalog/ProcedureLoader.ts.
 * All data has moved to /knowledge/procedures/.
 *
 * Do NOT add county conditionals here. Add a JSON file to /knowledge/procedures/ instead.
 */

import { generateChecklist as _generateChecklist } from "../../catalog/ProcedureLoader";
import type { ProcedureStep } from "../types";
import type { CountyProcedureStep } from "../../domain/CountyProcedure";

function toProcedureStep(step: CountyProcedureStep): ProcedureStep {
  return {
    stepNumber: step.stepNumber,
    title: step.title,
    description: step.description,
    category: step.category,
    url: step.url,
    fees: step.fees ?? undefined,
    timeline: step.timeline ?? undefined,
    requiredDocuments: step.requiredDocuments ?? undefined,
  };
}

/**
 * @deprecated Use ProcedureLoader.generateChecklist() directly.
 * This wrapper is kept for backward compatibility with existing pages.
 */
export function generateChecklist(
  county: string,
  hasChildren: boolean,
  state: string
): ProcedureStep[] {
  if (state !== "WA") {
    return [
      {
        stepNumber: 1,
        title: "State not yet supported",
        description:
          "Detailed county procedures are currently available for Washington State. " +
          "Select WA to see full guidance.",
        category: "preparation",
      },
    ];
  }

  const steps = _generateChecklist(state, county, hasChildren);

  if (steps.length === 0) {
    return [
      {
        stepNumber: 1,
        title: "County procedures coming soon",
        description: `Detailed procedures for ${county} County are not yet available. Check back soon.`,
        category: "preparation",
      },
    ];
  }

  return steps.map(toProcedureStep);
}

export function getCountyDisplayName(county: string): string {
  const names: Record<string, string> = {
    king: "King County",
    pierce: "Pierce County",
    snohomish: "Snohomish County",
    spokane: "Spokane County",
    clark: "Clark County",
    thurston: "Thurston County",
    kitsap: "Kitsap County",
    yakima: "Yakima County",
    whatcom: "Whatcom County",
    benton: "Benton County",
  };
  return names[county] ?? county;
}
