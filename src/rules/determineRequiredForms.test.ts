import { describe, it, expect } from "vitest";
import {
  determineRequiredForms,
  getFormCodes,
  requireForm,
  type DetermineFormsResult,
} from "./determineRequiredForms";
import type { CaseContext } from "../domain/CaseContext";

// ── Fixture factory ────────────────────────────────────────────────────────

type Input = Pick<
  CaseContext,
  "marriage" | "children" | "isContested" | "livesInState" | "spouseLocatable"
>;

function makeCtx(overrides: Partial<Input> = {}): Input {
  return {
    marriage: { state: "WA", county: "king", dateMarried: "2015-06-01", dateSeparated: "2024-01-01" },
    children: [],
    isContested: false,
    livesInState: true,
    spouseLocatable: true,
    ...overrides,
  };
}

function asFormsResult(result: DetermineFormsResult) {
  if (result.referralRequired) throw new Error("Expected FormsResult, got ReferralResult");
  return result;
}

function asReferral(result: DetermineFormsResult) {
  if (!result.referralRequired) throw new Error("Expected ReferralResult, got FormsResult");
  return result;
}

// ── Happy paths ────────────────────────────────────────────────────────────

describe("WA uncontested — no children", () => {
  it("returns referralRequired: false", () => {
    const result = determineRequiredForms(makeCtx());
    expect(result.referralRequired).toBe(false);
  });

  it("includes all three base forms", () => {
    const codes = getFormCodes(determineRequiredForms(makeCtx()));
    expect(codes).toContain("FL_ALL_FAMILY_101");
    expect(codes).toContain("FL_ALL_FAMILY_103");
    expect(codes).toContain("FL_ALL_FAMILY_119");
  });

  it("includes the no-children final order form", () => {
    const codes = getFormCodes(determineRequiredForms(makeCtx()));
    expect(codes).toContain("FL_ALL_FAMILY_185");
  });

  it("does NOT include children-specific forms", () => {
    const codes = getFormCodes(determineRequiredForms(makeCtx()));
    expect(codes).not.toContain("FL_ALL_FAMILY_131");
    expect(codes).not.toContain("FL_ALL_FAMILY_140");
    expect(codes).not.toContain("FL_ALL_FAMILY_165");
  });

  it("returns exactly 4 forms", () => {
    const result = asFormsResult(determineRequiredForms(makeCtx()));
    expect(result.forms).toHaveLength(4);
  });
});

describe("WA uncontested — with children", () => {
  const ctx = makeCtx({
    children: [{ fullName: "Child A", dateOfBirth: "2018-03-15" }],
  });

  it("returns referralRequired: false", () => {
    expect(determineRequiredForms(ctx).referralRequired).toBe(false);
  });

  it("includes all three base forms", () => {
    const codes = getFormCodes(determineRequiredForms(ctx));
    expect(codes).toContain("FL_ALL_FAMILY_101");
    expect(codes).toContain("FL_ALL_FAMILY_103");
    expect(codes).toContain("FL_ALL_FAMILY_119");
  });

  it("includes parenting plan form", () => {
    const codes = getFormCodes(determineRequiredForms(ctx));
    expect(codes).toContain("FL_ALL_FAMILY_131");
  });

  it("includes minor children declaration form", () => {
    const codes = getFormCodes(determineRequiredForms(ctx));
    expect(codes).toContain("FL_ALL_FAMILY_140");
  });

  it("includes child support worksheets", () => {
    const codes = getFormCodes(determineRequiredForms(ctx));
    expect(codes).toContain("FL_ALL_FAMILY_165");
  });

  it("does NOT include no-children final order", () => {
    const codes = getFormCodes(determineRequiredForms(ctx));
    expect(codes).not.toContain("FL_ALL_FAMILY_185");
  });

  it("returns exactly 6 forms", () => {
    const result = asFormsResult(determineRequiredForms(ctx));
    expect(result.forms).toHaveLength(6);
  });

  it("works with multiple children", () => {
    const multiChild = makeCtx({
      children: [
        { fullName: "Child A", dateOfBirth: "2018-03-15" },
        { fullName: "Child B", dateOfBirth: "2020-07-22" },
      ],
    });
    const result = asFormsResult(determineRequiredForms(multiChild));
    expect(result.forms).toHaveLength(6);
    expect(getFormCodes(determineRequiredForms(multiChild))).toContain("FL_ALL_FAMILY_131");
  });
});

// ── Traceability fields ────────────────────────────────────────────────────

describe("FormRequirement traceability (Principle 2)", () => {
  it("every form has a non-empty sourceUrl", () => {
    const result = asFormsResult(determineRequiredForms(makeCtx()));
    for (const form of result.forms) {
      expect(form.sourceUrl).toBeTruthy();
      expect(form.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it("every form has a non-empty effectiveDate", () => {
    const result = asFormsResult(determineRequiredForms(makeCtx()));
    for (const form of result.forms) {
      expect(form.effectiveDate).toBeTruthy();
    }
  });

  it("every form has a non-empty version", () => {
    const result = asFormsResult(determineRequiredForms(makeCtx()));
    for (const form of result.forms) {
      expect(form.version).toBeTruthy();
    }
  });

  it("every form has required: true", () => {
    const result = asFormsResult(determineRequiredForms(makeCtx()));
    for (const form of result.forms) {
      expect(form.required).toBe(true);
    }
  });

  it("every form has a non-empty title", () => {
    const result = asFormsResult(determineRequiredForms(makeCtx()));
    for (const form of result.forms) {
      expect(form.title).toBeTruthy();
    }
  });
});

// ── Referral paths ─────────────────────────────────────────────────────────

describe("contested divorce → referral", () => {
  it("returns referralRequired: true", () => {
    const result = determineRequiredForms(makeCtx({ isContested: true }));
    expect(result.referralRequired).toBe(true);
  });

  it("returns no form codes", () => {
    expect(getFormCodes(determineRequiredForms(makeCtx({ isContested: true })))).toHaveLength(0);
  });

  it("referral reason mentions contested", () => {
    const result = asReferral(determineRequiredForms(makeCtx({ isContested: true })));
    expect(result.referralReason.toLowerCase()).toContain("contested");
  });

  it("contested flag overrides children flag", () => {
    const result = determineRequiredForms(
      makeCtx({
        isContested: true,
        children: [{ fullName: "Child A", dateOfBirth: "2020-01-01" }],
      })
    );
    expect(result.referralRequired).toBe(true);
  });
});

describe("petitioner does not live in state → referral", () => {
  it("returns referralRequired: true", () => {
    const result = determineRequiredForms(makeCtx({ livesInState: false }));
    expect(result.referralRequired).toBe(true);
  });

  it("returns no form codes", () => {
    expect(getFormCodes(determineRequiredForms(makeCtx({ livesInState: false })))).toHaveLength(0);
  });

  it("referral reason mentions residency", () => {
    const result = asReferral(determineRequiredForms(makeCtx({ livesInState: false })));
    expect(result.referralReason.toLowerCase()).toContain("residency");
  });
});

describe("spouse cannot be located → referral", () => {
  it("returns referralRequired: true", () => {
    const result = determineRequiredForms(makeCtx({ spouseLocatable: false }));
    expect(result.referralRequired).toBe(true);
  });

  it("returns no form codes", () => {
    expect(getFormCodes(determineRequiredForms(makeCtx({ spouseLocatable: false })))).toHaveLength(0);
  });

  it("referral reason mentions service", () => {
    const result = asReferral(determineRequiredForms(makeCtx({ spouseLocatable: false })));
    expect(result.referralReason.toLowerCase()).toContain("service");
  });
});

describe("unsupported state → referral", () => {
  const nonWaCtx = makeCtx({ marriage: { state: "CA", county: "los-angeles" } });

  it("returns referralRequired: true for CA", () => {
    expect(determineRequiredForms(nonWaCtx).referralRequired).toBe(true);
  });

  it("returns no form codes", () => {
    expect(getFormCodes(determineRequiredForms(nonWaCtx))).toHaveLength(0);
  });

  it("referral reason names the unsupported state", () => {
    const result = asReferral(determineRequiredForms(nonWaCtx));
    expect(result.referralReason).toContain("CA");
  });

  it("returns referral for TX", () => {
    const txCtx = makeCtx({ marriage: { state: "TX", county: "harris" } });
    expect(determineRequiredForms(txCtx).referralRequired).toBe(true);
  });

  it("returns referral for FL", () => {
    const flCtx = makeCtx({ marriage: { state: "FL", county: "miami-dade" } });
    expect(determineRequiredForms(flCtx).referralRequired).toBe(true);
  });
});

// ── Referral priority ordering ─────────────────────────────────────────────

describe("referral guard priority", () => {
  it("contested takes priority over non-resident", () => {
    const result = determineRequiredForms(
      makeCtx({ isContested: true, livesInState: false })
    );
    expect(result.referralRequired).toBe(true);
    const r = asReferral(result);
    expect(r.referralReason.toLowerCase()).toContain("contested");
  });

  it("non-resident takes priority over unlocatable spouse", () => {
    const result = determineRequiredForms(
      makeCtx({ livesInState: false, spouseLocatable: false })
    );
    expect(result.referralRequired).toBe(true);
    const r = asReferral(result);
    expect(r.referralReason.toLowerCase()).toContain("residency");
  });
});

// ── getFormCodes helper ────────────────────────────────────────────────────

describe("getFormCodes helper", () => {
  it("returns empty array for referral result", () => {
    const result = determineRequiredForms(makeCtx({ isContested: true }));
    expect(getFormCodes(result)).toEqual([]);
  });

  it("returns form code strings for forms result", () => {
    const codes = getFormCodes(determineRequiredForms(makeCtx()));
    expect(Array.isArray(codes)).toBe(true);
    expect(codes.every((c) => typeof c === "string")).toBe(true);
  });
});

// ── Internal: requireForm ──────────────────────────────────────────────────

describe("requireForm (internal)", () => {
  it("returns a FormRequirement for a known code", () => {
    const form = requireForm("FL_ALL_FAMILY_103");
    expect(form.formCode).toBe("FL_ALL_FAMILY_103");
    expect(form.required).toBe(true);
  });

  it("throws for an unknown form code", () => {
    expect(() => requireForm("UNKNOWN_FORM_999")).toThrow("Unknown form code: UNKNOWN_FORM_999");
  });
});

// ── WA counties ────────────────────────────────────────────────────────────

describe("WA — different counties all produce the same form set", () => {
  const counties = ["king", "pierce", "snohomish", "spokane", "clark"];

  for (const county of counties) {
    it(`county: ${county} — no children → 4 forms`, () => {
      const ctx = makeCtx({ marriage: { state: "WA", county } });
      const result = asFormsResult(determineRequiredForms(ctx));
      expect(result.forms).toHaveLength(4);
    });
  }
});
