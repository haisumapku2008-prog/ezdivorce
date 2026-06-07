import { describe, it, expect } from "vitest";
import { toCaseContext } from "./case-store";
import type { CaseData } from "@/lib/types";

function makeCase(overrides: Partial<CaseData> = {}): CaseData {
  const now = new Date().toISOString();
  return {
    id: "test-id-123",
    state: "WA",
    county: "king",
    status: "draft",
    hasChildren: false,
    isContested: false,
    livesInState: true,
    spouseLocatable: true,
    hasHouse: false,
    hasVehicles: false,
    hasRetirement: false,
    hasDebt: false,
    petitionerName: "Jane Doe",
    respondentName: "John Doe",
    petitionerEmail: "jane@example.com",
    petitionerPhone: "206-555-0100",
    petitionerAddress: "123 Main St, Seattle, WA 98101",
    respondentAddress: "456 Elm St, Bellevue, WA 98004",
    formAnswers: {},
    progressSteps: {
      interview_complete: false,
      forms_generated: false,
      petition_filed: false,
      service_completed: false,
      parenting_class: false,
      final_orders: false,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("toCaseContext", () => {
  it("maps petitioner fields correctly", () => {
    const ctx = toCaseContext(makeCase());
    expect(ctx.petitioner.fullName).toBe("Jane Doe");
    expect(ctx.petitioner.email).toBe("jane@example.com");
    expect(ctx.petitioner.phone).toBe("206-555-0100");
    expect(ctx.petitioner.address).toBe("123 Main St, Seattle, WA 98101");
  });

  it("maps respondent fields correctly", () => {
    const ctx = toCaseContext(makeCase());
    expect(ctx.respondent.fullName).toBe("John Doe");
    expect(ctx.respondent.address).toBe("456 Elm St, Bellevue, WA 98004");
  });

  it("maps marriage fields correctly", () => {
    const ctx = toCaseContext(
      makeCase({ dateMarried: "2015-06-01", dateSeparated: "2024-01-01" })
    );
    expect(ctx.marriage.state).toBe("WA");
    expect(ctx.marriage.county).toBe("king");
    expect(ctx.marriage.dateMarried).toBe("2015-06-01");
    expect(ctx.marriage.dateSeparated).toBe("2024-01-01");
  });

  it("produces empty children array when hasChildren is false", () => {
    const ctx = toCaseContext(makeCase({ hasChildren: false }));
    expect(ctx.children).toHaveLength(0);
  });

  it("synthesises child placeholders from childrenCount", () => {
    const ctx = toCaseContext(
      makeCase({ hasChildren: true, childrenCount: 3 })
    );
    expect(ctx.children).toHaveLength(3);
    expect(ctx.children[0].fullName).toBe("Child 1");
    expect(ctx.children[2].fullName).toBe("Child 3");
  });

  it("defaults to 1 child when childrenCount is missing but hasChildren true", () => {
    const ctx = toCaseContext(makeCase({ hasChildren: true, childrenCount: undefined }));
    expect(ctx.children).toHaveLength(1);
  });

  it("maps assets from boolean flags", () => {
    const ctx = toCaseContext(
      makeCase({ hasHouse: true, hasVehicles: true, hasRetirement: false })
    );
    expect(ctx.assets).toHaveLength(2);
    expect(ctx.assets.map((a) => a.type)).toContain("real_estate");
    expect(ctx.assets.map((a) => a.type)).toContain("vehicle");
    expect(ctx.assets.map((a) => a.type)).not.toContain("retirement");
  });

  it("maps debts from boolean flag", () => {
    const ctx = toCaseContext(makeCase({ hasDebt: true }));
    expect(ctx.debts).toHaveLength(1);
    expect(ctx.debts[0].type).toBe("other");
  });

  it("produces empty debts when hasDebt is false", () => {
    const ctx = toCaseContext(makeCase({ hasDebt: false }));
    expect(ctx.debts).toHaveLength(0);
  });

  it("maps eligibility flags correctly", () => {
    const ctx = toCaseContext(
      makeCase({ livesInState: false, isContested: true, spouseLocatable: false })
    );
    expect(ctx.livesInState).toBe(false);
    expect(ctx.isContested).toBe(true);
    expect(ctx.spouseLocatable).toBe(false);
  });

  it("maps progress steps correctly", () => {
    const ctx = toCaseContext(
      makeCase({
        progressSteps: {
          interview_complete: true,
          forms_generated: false,
          petition_filed: false,
          service_completed: false,
          parenting_class: false,
          final_orders: false,
        },
      })
    );
    expect(ctx.progressSteps.interview_complete).toBe(true);
    expect(ctx.progressSteps.forms_generated).toBe(false);
  });

  it("preserves id, status, createdAt, updatedAt", () => {
    const d = makeCase({ id: "abc-123", status: "interview_complete" });
    const ctx = toCaseContext(d);
    expect(ctx.id).toBe("abc-123");
    expect(ctx.status).toBe("interview_complete");
    expect(ctx.createdAt).toBe(d.createdAt);
    expect(ctx.updatedAt).toBe(d.updatedAt);
  });

  it("output is compatible with determineRequiredForms", () => {
    // Verifies the CaseContext shape satisfies the rules engine input
    import("@/rules/determineRequiredForms").then(({ determineRequiredForms }) => {
      const ctx = toCaseContext(makeCase({ hasChildren: true }));
      const result = determineRequiredForms(ctx);
      expect(result.referralRequired).toBe(false);
      if (!result.referralRequired) {
        expect(result.forms.length).toBeGreaterThan(0);
      }
    });
  });
});
