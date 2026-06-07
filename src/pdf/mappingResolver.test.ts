import { describe, it, expect } from "vitest";
import { resolveFieldMappings, getMappedFormCodes, getMappingFile } from "./mappingResolver";
import type { CaseContext } from "../domain/CaseContext";

function makeCtx(overrides: Partial<CaseContext> = {}): CaseContext {
  const now = new Date().toISOString();
  return {
    id: "test-123",
    status: "interview_complete",
    petitioner: {
      fullName: "Jane Smith",
      dateOfBirth: "1985-04-12",
      ssnLast4: "4321",
      address: "123 Main St, Seattle WA 98101",
      email: "jane@example.com",
      phone: "206-555-0100",
    },
    respondent: {
      fullName: "John Smith",
      dateOfBirth: "1983-07-22",
      ssnLast4: "8765",
      address: "456 Oak Ave, Bellevue WA 98004",
    },
    children: [],
    marriage: {
      state: "WA",
      county: "king",
      dateMarried: "2015-06-15",
      dateSeparated: "2024-03-01",
    },
    assets: [],
    debts: [],
    livesInState: true,
    isContested: false,
    spouseLocatable: true,
    formAnswers: {},
    progressSteps: {
      interview_complete: true,
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

// ── getMappedFormCodes ────────────────────────────────────────────────────

describe("getMappedFormCodes", () => {
  it("returns all 7 WA form codes", () => {
    const codes = getMappedFormCodes();
    expect(codes).toContain("FL_ALL_FAMILY_101");
    expect(codes).toContain("FL_ALL_FAMILY_103");
    expect(codes).toContain("FL_ALL_FAMILY_119");
    expect(codes).toContain("FL_ALL_FAMILY_140");
    expect(codes).toContain("FL_ALL_FAMILY_131");
    expect(codes).toContain("FL_ALL_FAMILY_165");
    expect(codes).toContain("FL_ALL_FAMILY_185");
  });

  it("returns exactly 7 codes", () => {
    expect(getMappedFormCodes()).toHaveLength(7);
  });
});

// ── getMappingFile ────────────────────────────────────────────────────────

describe("getMappingFile", () => {
  it("returns the mapping file for a known form", () => {
    const file = getMappingFile("FL_ALL_FAMILY_103");
    expect(file).toBeDefined();
    expect(file!._meta.formCode).toBe("FL_ALL_FAMILY_103");
  });

  it("returns undefined for an unknown form", () => {
    expect(getMappingFile("UNKNOWN_FORM")).toBeUndefined();
  });

  it("every mapping file has a sourceUrl", () => {
    for (const code of getMappedFormCodes()) {
      const file = getMappingFile(code)!;
      expect(file._meta.sourceUrl).toMatch(/^https:\/\//);
    }
  });
});

// ── resolveFieldMappings: FL_ALL_FAMILY_101 ───────────────────────────────

describe("FL_ALL_FAMILY_101 — Confidential Information", () => {
  it("resolves petitioner_name", () => {
    const m = resolveFieldMappings("FL_ALL_FAMILY_101", makeCtx());
    expect(m.petitioner_name).toBe("Jane Smith");
  });

  it("resolves respondent_name", () => {
    const m = resolveFieldMappings("FL_ALL_FAMILY_101", makeCtx());
    expect(m.respondent_name).toBe("John Smith");
  });

  it("resolves petitioner_dob", () => {
    const m = resolveFieldMappings("FL_ALL_FAMILY_101", makeCtx());
    expect(m.petitioner_dob).toBe("1985-04-12");
  });

  it("resolves respondent_dob", () => {
    const m = resolveFieldMappings("FL_ALL_FAMILY_101", makeCtx());
    expect(m.respondent_dob).toBe("1983-07-22");
  });

  it("resolves petitioner_ssn_last4", () => {
    const m = resolveFieldMappings("FL_ALL_FAMILY_101", makeCtx());
    expect(m.petitioner_ssn_last4).toBe("4321");
  });

  it("resolves respondent_ssn_last4", () => {
    const m = resolveFieldMappings("FL_ALL_FAMILY_101", makeCtx());
    expect(m.respondent_ssn_last4).toBe("8765");
  });
});

// ── resolveFieldMappings: FL_ALL_FAMILY_103 ───────────────────────────────

describe("FL_ALL_FAMILY_103 — Petition for Dissolution", () => {
  it("resolves petitioner and respondent names", () => {
    const m = resolveFieldMappings("FL_ALL_FAMILY_103", makeCtx());
    expect(m.petitioner_name).toBe("Jane Smith");
    expect(m.respondent_name).toBe("John Smith");
  });

  it("resolves addresses", () => {
    const m = resolveFieldMappings("FL_ALL_FAMILY_103", makeCtx());
    expect(m.petitioner_address).toBe("123 Main St, Seattle WA 98101");
    expect(m.respondent_address).toBe("456 Oak Ave, Bellevue WA 98004");
  });

  it("resolves marriage dates", () => {
    const m = resolveFieldMappings("FL_ALL_FAMILY_103", makeCtx());
    expect(m.date_married).toBe("2015-06-15");
    expect(m.date_separated).toBe("2024-03-01");
  });

  it("resolves county_of_filing", () => {
    const m = resolveFieldMappings("FL_ALL_FAMILY_103", makeCtx());
    expect(m.county_of_filing).toBe("king");
  });

  it("resolves grounds as literal", () => {
    const m = resolveFieldMappings("FL_ALL_FAMILY_103", makeCtx());
    expect(m.grounds).toBe("irretrievably_broken");
  });

  it("resolves has_children as No when no children", () => {
    const m = resolveFieldMappings("FL_ALL_FAMILY_103", makeCtx({ children: [] }));
    expect(m.has_children).toBe("No");
  });

  it("resolves has_children as Yes when children present", () => {
    const ctx = makeCtx({ children: [{ fullName: "Child A", dateOfBirth: "2018-01-01" }] });
    const m = resolveFieldMappings("FL_ALL_FAMILY_103", ctx);
    expect(m.has_children).toBe("Yes");
  });

  it("resolves children_count correctly", () => {
    const ctx = makeCtx({
      children: [
        { fullName: "Child A", dateOfBirth: "2018-01-01" },
        { fullName: "Child B", dateOfBirth: "2020-05-10" },
      ],
    });
    const m = resolveFieldMappings("FL_ALL_FAMILY_103", ctx);
    expect(m.children_count).toBe("2");
  });
});

// ── resolveFieldMappings: FL_ALL_FAMILY_119 ───────────────────────────────

describe("FL_ALL_FAMILY_119 — Summons", () => {
  it("resolves court_name from county", () => {
    const m = resolveFieldMappings("FL_ALL_FAMILY_119", makeCtx());
    expect(m.court_name).toBe("King County Superior Court");
  });

  it("capitalises county name in court_name", () => {
    const ctx = makeCtx({ marriage: { state: "WA", county: "pierce" } });
    const m = resolveFieldMappings("FL_ALL_FAMILY_119", ctx);
    expect(m.court_name).toBe("Pierce County Superior Court");
  });

  it("resolves case_number as empty literal", () => {
    const m = resolveFieldMappings("FL_ALL_FAMILY_119", makeCtx());
    expect(m.case_number).toBe("");
  });
});

// ── resolveFieldMappings: FL_ALL_FAMILY_140 ───────────────────────────────

describe("FL_ALL_FAMILY_140 — Declaration Re Minor Children", () => {
  it("resolves children_count", () => {
    const ctx = makeCtx({ children: [{ fullName: "Child A", dateOfBirth: "2019-06-01" }] });
    const m = resolveFieldMappings("FL_ALL_FAMILY_140", ctx);
    expect(m.children_count).toBe("1");
  });

  it("resolves children_names_dobs as formatted list", () => {
    const ctx = makeCtx({
      children: [
        { fullName: "Alice Smith", dateOfBirth: "2018-03-15" },
        { fullName: "Bob Smith", dateOfBirth: "2020-07-22" },
      ],
    });
    const m = resolveFieldMappings("FL_ALL_FAMILY_140", ctx);
    expect(m.children_names_dobs).toBe("Alice Smith (2018-03-15), Bob Smith (2020-07-22)");
  });

  it("handles child with no DOB in children_names_dobs", () => {
    const ctx = makeCtx({ children: [{ fullName: "Child A", dateOfBirth: "" }] });
    const m = resolveFieldMappings("FL_ALL_FAMILY_140", ctx);
    expect(m.children_names_dobs).toBe("Child A");
  });
});

// ── resolveFieldMappings: FL_ALL_FAMILY_131 ───────────────────────────────

describe("FL_ALL_FAMILY_131 — Parenting Plan", () => {
  it("resolves formAnswer for primaryResidential", () => {
    const ctx = makeCtx({
      formAnswers: {
        FL_ALL_FAMILY_131: { primaryResidential: "petitioner" },
      },
    });
    const m = resolveFieldMappings("FL_ALL_FAMILY_131", ctx);
    expect(m.primary_residential).toBe("petitioner");
  });

  it("returns empty string when formAnswer not set", () => {
    const m = resolveFieldMappings("FL_ALL_FAMILY_131", makeCtx());
    expect(m.primary_residential).toBe("");
  });
});

// ── resolveFieldMappings: FL_ALL_FAMILY_165 ───────────────────────────────

describe("FL_ALL_FAMILY_165 — Child Support Worksheets", () => {
  it("resolves petitioner income from formAnswers", () => {
    const ctx = makeCtx({
      formAnswers: { FL_ALL_FAMILY_165: { petitionerIncome: "5000" } },
    });
    const m = resolveFieldMappings("FL_ALL_FAMILY_165", ctx);
    expect(m.petitioner_gross_income).toBe("5000");
  });
});

// ── resolveFieldMappings: FL_ALL_FAMILY_185 ───────────────────────────────

describe("FL_ALL_FAMILY_185 — Decree of Dissolution", () => {
  it("resolves petitioner and respondent names", () => {
    const m = resolveFieldMappings("FL_ALL_FAMILY_185", makeCtx());
    expect(m.petitioner_name).toBe("Jane Smith");
    expect(m.respondent_name).toBe("John Smith");
  });

  it("resolves property_division from formAnswers", () => {
    const ctx = makeCtx({
      formAnswers: {
        FL_ALL_FAMILY_185: { propertyDivision: "House goes to petitioner" },
      },
    });
    const m = resolveFieldMappings("FL_ALL_FAMILY_185", ctx);
    expect(m.property_division).toBe("House goes to petitioner");
  });
});

// ── Unknown form ──────────────────────────────────────────────────────────

describe("unknown form code", () => {
  it("returns empty object for unknown form", () => {
    const m = resolveFieldMappings("UNKNOWN_FORM_999", makeCtx());
    expect(m).toEqual({});
  });
});

// ── All forms produce string values ──────────────────────────────────────

describe("all resolved values are strings", () => {
  for (const formCode of [
    "FL_ALL_FAMILY_101",
    "FL_ALL_FAMILY_103",
    "FL_ALL_FAMILY_119",
    "FL_ALL_FAMILY_185",
  ]) {
    it(`${formCode} — all values are strings`, () => {
      const m = resolveFieldMappings(formCode, makeCtx());
      for (const [, val] of Object.entries(m)) {
        expect(typeof val).toBe("string");
      }
    });
  }
});
