import { describe, it, expect } from "vitest";
import { determineRequiredForms } from "./determineRequiredForms";

describe("determineRequiredForms", () => {
  const baseCase = {
    state: "WA" as const,
    county: "king",
    livesInState: true,
    spouseLocatable: true,
    isContested: false,
  };

  it("returns base forms for no-children uncontested WA case", () => {
    const result = determineRequiredForms({ ...baseCase, hasChildren: false });
    expect(result.referralRequired).toBe(false);
    expect(result.formCodes).toContain("FL_ALL_FAMILY_103");
    expect(result.formCodes).toContain("FL_ALL_FAMILY_185");
    expect(result.formCodes).not.toContain("FL_ALL_FAMILY_131");
  });

  it("adds parenting forms when children present", () => {
    const result = determineRequiredForms({ ...baseCase, hasChildren: true });
    expect(result.formCodes).toContain("FL_ALL_FAMILY_131");
    expect(result.formCodes).toContain("FL_ALL_FAMILY_165");
    expect(result.formCodes).not.toContain("FL_ALL_FAMILY_185");
  });

  it("refers contested cases", () => {
    const result = determineRequiredForms({ ...baseCase, hasChildren: false, isContested: true });
    expect(result.referralRequired).toBe(true);
    expect(result.formCodes).toHaveLength(0);
  });

  it("refers unsupported states", () => {
    const result = determineRequiredForms({
      ...baseCase,
      state: "CA",
      hasChildren: false,
    });
    expect(result.referralRequired).toBe(true);
  });
});
