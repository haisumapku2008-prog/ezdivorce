/**
 * /src/pdf/mappingResolver.ts
 *
 * Epic 9: Resolves PDF field mappings from /knowledge/pdf-mappings JSON files.
 *
 * No mapping logic lives in this file — all mappings are data.
 * This module only interprets the mapping expressions.
 *
 * Mapping expression syntax:
 *   "some.path"                        → dot-path into CaseContext
 *   "__literal:value"                  → hard-coded string value
 *   "__bool:some.path"                 → resolves path, returns "Yes"/"No"
 *   "__county_court:marriage.county"   → "<County> County Superior Court"
 *   "__children_list:children"         → "Name (DOB), Name (DOB), ..."
 *   "__formAnswer:FORM_CODE.fieldKey"  → looks up formAnswers[FORM_CODE][fieldKey]
 */

import type { CaseContext } from "../domain/CaseContext";

// ── Static JSON imports (one per form) ───────────────────────────────────

import mapping101 from "../../knowledge/pdf-mappings/wa/FL_ALL_FAMILY_101.json";
import mapping103 from "../../knowledge/pdf-mappings/wa/FL_ALL_FAMILY_103.json";
import mapping119 from "../../knowledge/pdf-mappings/wa/FL_ALL_FAMILY_119.json";
import mapping140 from "../../knowledge/pdf-mappings/wa/FL_ALL_FAMILY_140.json";
import mapping131 from "../../knowledge/pdf-mappings/wa/FL_ALL_FAMILY_131.json";
import mapping165 from "../../knowledge/pdf-mappings/wa/FL_ALL_FAMILY_165.json";
import mapping185 from "../../knowledge/pdf-mappings/wa/FL_ALL_FAMILY_185.json";

// ── Registry ──────────────────────────────────────────────────────────────

interface MappingFile {
  _meta: { formCode: string; title: string; sourceUrl: string; effectiveDate: string; version: string; notes?: string };
  mappings: Record<string, string>;
}

const MAPPING_REGISTRY: Record<string, MappingFile> = {
  FL_ALL_FAMILY_101: mapping101 as MappingFile,
  FL_ALL_FAMILY_103: mapping103 as MappingFile,
  FL_ALL_FAMILY_119: mapping119 as MappingFile,
  FL_ALL_FAMILY_140: mapping140 as MappingFile,
  FL_ALL_FAMILY_131: mapping131 as MappingFile,
  FL_ALL_FAMILY_165: mapping165 as MappingFile,
  FL_ALL_FAMILY_185: mapping185 as MappingFile,
};

// ── Path resolver ─────────────────────────────────────────────────────────

/**
 * Resolve a dot-notation path against an object.
 * e.g. "petitioner.fullName" against CaseContext → "Jane Doe"
 */
function resolvePath(obj: unknown, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return "";
    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else {
      return "";
    }
  }
  if (current === null || current === undefined) return "";
  return String(current);
}

/**
 * Capitalise first letter of a string.
 */
function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Expression evaluator ──────────────────────────────────────────────────

function evaluateExpression(expression: string, ctx: CaseContext): string {
  // __literal:value → return the literal string after the colon
  if (expression.startsWith("__literal:")) {
    return expression.slice("__literal:".length);
  }

  // __bool:path → "Yes" if truthy, "No" if falsy
  if (expression.startsWith("__bool:")) {
    const path = expression.slice("__bool:".length);
    const val = resolvePath(ctx, path);
    // Special case: children.length — check array length
    if (path === "children.length") {
      return ctx.children.length > 0 ? "Yes" : "No";
    }
    return val && val !== "0" && val !== "false" ? "Yes" : "No";
  }

  // __county_court:path → "<County> County Superior Court"
  if (expression.startsWith("__county_court:")) {
    const path = expression.slice("__county_court:".length);
    const county = resolvePath(ctx, path);
    return `${capitalise(county)} County Superior Court`;
  }

  // __children_list:children → "Child 1 (DOB), Child 2 (DOB)"
  if (expression.startsWith("__children_list:")) {
    return ctx.children
      .map((c) => (c.dateOfBirth ? `${c.fullName} (${c.dateOfBirth})` : c.fullName))
      .join(", ");
  }

  // __formAnswer:FORM_CODE.fieldKey → formAnswers[FORM_CODE][fieldKey]
  if (expression.startsWith("__formAnswer:")) {
    const ref = expression.slice("__formAnswer:".length);
    const dotIdx = ref.indexOf(".");
    if (dotIdx === -1) return "";
    const formCode = ref.slice(0, dotIdx);
    const fieldKey = ref.slice(dotIdx + 1);
    return ctx.formAnswers?.[formCode]?.[fieldKey] ?? "";
  }

  // Default: dot-path resolution against CaseContext
  // Special case: children.length → number as string
  if (expression === "children.length") {
    return String(ctx.children.length);
  }

  return resolvePath(ctx, expression);
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Resolve all PDF field mappings for a given form against a CaseContext.
 *
 * Returns a flat Record<pdfFieldName, resolvedValue> ready to pass to fillPdf().
 */
export function resolveFieldMappings(
  formCode: string,
  ctx: CaseContext
): Record<string, string> {
  const mappingFile = MAPPING_REGISTRY[formCode];
  if (!mappingFile) {
    console.warn(`[mappingResolver] No mapping file for form: ${formCode}`);
    return {};
  }

  const resolved: Record<string, string> = {};
  for (const [pdfField, expression] of Object.entries(mappingFile.mappings)) {
    resolved[pdfField] = evaluateExpression(expression, ctx);
  }
  return resolved;
}

/**
 * List all form codes that have a mapping file registered.
 */
export function getMappedFormCodes(): string[] {
  return Object.keys(MAPPING_REGISTRY);
}

/**
 * Get the raw mapping file for a form (for admin/debugging).
 */
export function getMappingFile(formCode: string): MappingFile | undefined {
  return MAPPING_REGISTRY[formCode];
}
