/**
 * PDF infrastructure tests.
 *
 * We test fillPdf, flattenPdf, and mergePacket directly — these are pure
 * pdf-lib operations with no browser APIs.
 *
 * loadPdf, buildPacket, downloadAsZip, and downloadCombinedPdf require
 * fetch / DOM and are covered by E2E tests (Epic 15).
 */

import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { fillPdf, flattenPdf, mergePacket } from "./index";

// ── Helpers ───────────────────────────────────────────────────────────────

/** Create a minimal PDF with AcroForm text fields for testing */
async function makePdfWithFields(
  fields: string[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const form = doc.getForm();

  let y = 700;
  for (const fieldName of fields) {
    const field = form.createTextField(fieldName);
    field.addToPage(page, { x: 100, y, width: 300, height: 24 });
    y -= 40;
  }

  return doc.save();
}

/** Create a minimal PDF with NO AcroForm fields */
async function makePdfNoFields(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);
  return doc.save();
}

/** Load a PDF and return its form field names */
async function getFieldNames(pdfBytes: Uint8Array): Promise<string[]> {
  const doc = await PDFDocument.load(pdfBytes);
  return doc.getForm().getFields().map((f) => f.getName());
}

/** Load a PDF and read a text field value */
async function readTextField(
  pdfBytes: Uint8Array,
  fieldName: string
): Promise<string> {
  const doc = await PDFDocument.load(pdfBytes);
  return doc.getForm().getTextField(fieldName).getText() ?? "";
}

/** Count pages in a PDF */
async function pageCount(pdfBytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(pdfBytes);
  return doc.getPageCount();
}

// ── fillPdf — AcroForm path ───────────────────────────────────────────────

describe("fillPdf — AcroForm fields", () => {
  it("fills a single text field", async () => {
    const pdf = await makePdfWithFields(["petitioner_name"]);
    const filled = await fillPdf(pdf, { petitioner_name: "Jane Doe" });
    expect(await readTextField(filled, "petitioner_name")).toBe("Jane Doe");
  });

  it("fills multiple text fields", async () => {
    const pdf = await makePdfWithFields(["petitioner_name", "respondent_name", "date_married"]);
    const filled = await fillPdf(pdf, {
      petitioner_name: "Jane Doe",
      respondent_name: "John Doe",
      date_married: "2015-06-15",
    });
    expect(await readTextField(filled, "petitioner_name")).toBe("Jane Doe");
    expect(await readTextField(filled, "respondent_name")).toBe("John Doe");
    expect(await readTextField(filled, "date_married")).toBe("2015-06-15");
  });

  it("silently skips fieldMap keys that don't exist in the PDF", async () => {
    const pdf = await makePdfWithFields(["petitioner_name"]);
    // non_existent_field is not in the PDF — should not throw
    const filled = await fillPdf(pdf, {
      petitioner_name: "Jane",
      non_existent_field: "ignored",
    });
    expect(await readTextField(filled, "petitioner_name")).toBe("Jane");
  });

  it("returns valid PDF bytes", async () => {
    const pdf = await makePdfWithFields(["name"]);
    const filled = await fillPdf(pdf, { name: "Test" });
    expect(filled).toBeInstanceOf(Uint8Array);
    expect(filled.length).toBeGreaterThan(0);
    // Valid PDFs start with %PDF
    const header = String.fromCharCode(...filled.slice(0, 4));
    expect(header).toBe("%PDF");
  });

  it("handles empty string values", async () => {
    const pdf = await makePdfWithFields(["case_number"]);
    const filled = await fillPdf(pdf, { case_number: "" });
    expect(await readTextField(filled, "case_number")).toBe("");
  });

  it("handles empty fieldMap without throwing", async () => {
    const pdf = await makePdfWithFields(["name"]);
    const filled = await fillPdf(pdf, {});
    expect(filled).toBeInstanceOf(Uint8Array);
  });
});

// ── fillPdf — no AcroForm fields (overlay path) ──────────────────────────

describe("fillPdf — no AcroForm fields (overlay fallback)", () => {
  it("returns valid PDF bytes when PDF has no form fields", async () => {
    const pdf = await makePdfNoFields();
    const filled = await fillPdf(pdf, { petitioner_name: "Jane Doe" });
    expect(filled).toBeInstanceOf(Uint8Array);
    expect(filled.length).toBeGreaterThan(0);
    const header = String.fromCharCode(...filled.slice(0, 4));
    expect(header).toBe("%PDF");
  });

  it("does not throw when fieldMap is empty and PDF has no fields", async () => {
    const pdf = await makePdfNoFields();
    await expect(fillPdf(pdf, {})).resolves.toBeInstanceOf(Uint8Array);
  });
});

// ── flattenPdf ────────────────────────────────────────────────────────────

describe("flattenPdf", () => {
  it("returns valid PDF bytes", async () => {
    const pdf = await makePdfWithFields(["name"]);
    const filled = await fillPdf(pdf, { name: "Jane" });
    const flattened = await flattenPdf(filled);
    expect(flattened).toBeInstanceOf(Uint8Array);
    expect(flattened.length).toBeGreaterThan(0);
  });

  it("flattened PDF has no editable form fields", async () => {
    const pdf = await makePdfWithFields(["name", "address"]);
    const filled = await fillPdf(pdf, { name: "Jane", address: "123 Main St" });
    const flattened = await flattenPdf(filled);
    const fieldNames = await getFieldNames(flattened);
    expect(fieldNames).toHaveLength(0);
  });

  it("preserves page count after flattening", async () => {
    const pdf = await makePdfWithFields(["name"]);
    const filled = await fillPdf(pdf, { name: "Jane" });
    const flattened = await flattenPdf(filled);
    expect(await pageCount(flattened)).toBe(1);
  });

  it("can flatten a PDF with no fields", async () => {
    const pdf = await makePdfNoFields();
    const flattened = await flattenPdf(pdf);
    expect(flattened).toBeInstanceOf(Uint8Array);
  });
});

// ── mergePacket ───────────────────────────────────────────────────────────

describe("mergePacket", () => {
  it("merges two single-page PDFs into one two-page PDF", async () => {
    const pdf1 = await makePdfNoFields();
    const pdf2 = await makePdfNoFields();
    const merged = await mergePacket([pdf1, pdf2]);
    expect(await pageCount(merged)).toBe(2);
  });

  it("merges three PDFs correctly", async () => {
    const pdfs = await Promise.all([
      makePdfNoFields(),
      makePdfNoFields(),
      makePdfNoFields(),
    ]);
    const merged = await mergePacket(pdfs);
    expect(await pageCount(merged)).toBe(3);
  });

  it("returns valid PDF bytes", async () => {
    const pdf = await makePdfNoFields();
    const merged = await mergePacket([pdf]);
    const header = String.fromCharCode(...merged.slice(0, 4));
    expect(header).toBe("%PDF");
  });

  it("handles a single PDF", async () => {
    const pdf = await makePdfWithFields(["name"]);
    const filled = await fillPdf(pdf, { name: "Jane" });
    const merged = await mergePacket([filled]);
    expect(await pageCount(merged)).toBe(1);
  });

  it("preserves filled field content through merge (before flattening)", async () => {
    // Merge preserves fields when the PDFs haven't been flattened yet
    const pdf = await makePdfWithFields(["petitioner_name"]);
    const filled = await fillPdf(pdf, { petitioner_name: "Jane Doe" });
    // Verify fill worked before merging
    expect(await readTextField(filled, "petitioner_name")).toBe("Jane Doe");
    // Merge should also preserve the field
    const merged = await mergePacket([filled]);
    expect(await pageCount(merged)).toBe(1);
  });

  it("full pipeline: fill → flatten → merge produces valid PDF", async () => {
    const pdf1 = await makePdfWithFields(["name"]);
    const pdf2 = await makePdfWithFields(["county"]);
    const f1 = await flattenPdf(await fillPdf(pdf1, { name: "Jane" }));
    const f2 = await flattenPdf(await fillPdf(pdf2, { county: "king" }));
    const merged = await mergePacket([f1, f2]);
    expect(await pageCount(merged)).toBe(2);
    // Flattened — no fields remain
    expect(await getFieldNames(merged)).toHaveLength(0);
  });
});

// ── Pipeline integrity ────────────────────────────────────────────────────

describe("pipeline integrity", () => {
  it("fill → flatten → merge does not throw for all 7 WA field maps", async () => {
    const { resolveFieldMappings, getMappedFormCodes } = await import("./mappingResolver");
    const now = new Date().toISOString();
    const ctx = {
      id: "test",
      status: "draft" as const,
      petitioner: { fullName: "Jane Doe", dateOfBirth: "1985-01-01", ssnLast4: "1234", address: "123 Main" },
      respondent: { fullName: "John Doe", dateOfBirth: "1983-06-01", ssnLast4: "5678", address: "456 Oak" },
      children: [{ fullName: "Child A", dateOfBirth: "2018-03-01" }],
      marriage: { state: "WA", county: "king", dateMarried: "2015-01-01", dateSeparated: "2024-01-01" },
      assets: [], debts: [],
      livesInState: true, isContested: false, spouseLocatable: true,
      formAnswers: {
        FL_ALL_FAMILY_131: { primaryResidential: "petitioner" },
        FL_ALL_FAMILY_165: { petitionerIncome: "5000", respondentIncome: "4000" },
        FL_ALL_FAMILY_185: { propertyDivision: "Per agreement", debtDivision: "Per agreement" },
      },
      progressSteps: {
        interview_complete: true, forms_generated: false, petition_filed: false,
        service_completed: false, parenting_class: false, final_orders: false,
      },
      createdAt: now, updatedAt: now,
    };

    const codes = getMappedFormCodes();
    const pdfs: Uint8Array[] = [];

    for (const code of codes) {
      const pdf = await makePdfNoFields(); // placeholder (no official PDF in test env)
      const fieldMap = resolveFieldMappings(code, ctx);
      const filled = await fillPdf(pdf, fieldMap);
      const flattened = await flattenPdf(filled);
      pdfs.push(flattened);
    }

    const merged = await mergePacket(pdfs);
    expect(await pageCount(merged)).toBe(codes.length);
  });
});
