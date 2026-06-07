/**
 * /src/pdf/index.ts
 *
 * Epic 8: PDF infrastructure.
 *
 * Four named exports matching the spec:
 *   loadPdf(formCode)              → Uint8Array  (loads official PDF template)
 *   fillPdf(bytes, fieldMap)       → Uint8Array  (fills AcroForm fields)
 *   flattenPdf(bytes)              → Uint8Array  (flattens — fields become read-only)
 *   mergePacket(pdfs[])            → Uint8Array  (combines into single PDF)
 *
 * Plus helpers:
 *   buildPacket(formCodes, ctx)    → {filename, data}[]  (resolve + fill all forms)
 *   downloadAsZip(files)           → triggers browser ZIP download
 *   downloadCombinedPdf(bytes)     → triggers browser PDF download
 *
 * All field mapping logic lives in mappingResolver.ts — none here.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import type { CaseContext } from "../domain/CaseContext";
import { resolveFieldMappings } from "./mappingResolver";
import { getFormByCode } from "../catalog/FormCatalogLoader";

// ── loadPdf ───────────────────────────────────────────────────────────────

/**
 * Load the official court PDF for a given form code.
 *
 * Strategy (in order):
 *  1. Fetch from /public/forms/wa/{formCode}.pdf (official court PDF hosted locally)
 *  2. If not found (404), fall back to a generated placeholder PDF
 *
 * When real PDFs are added to /public/forms/wa/, they will be used automatically.
 */
export async function loadPdf(formCode: string): Promise<Uint8Array> {
  try {
    const res = await fetch(`/forms/wa/${formCode}.pdf`);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    }
  } catch {
    // Fall through to placeholder
  }

  // Fallback: generate a labelled placeholder PDF
  return generatePlaceholderPdf(formCode);
}

// ── fillPdf ───────────────────────────────────────────────────────────────

/**
 * Fill PDF fields using the provided field map.
 *
 * For PDFs with AcroForm fields: fills them by name using pdf-lib.
 * For PDFs without AcroForm fields (scanned): overlays text at page top.
 *
 * @param pdfBytes  - Raw PDF bytes (from loadPdf)
 * @param fieldMap  - { pdfFieldName: resolvedValue } (from mappingResolver)
 */
export async function fillPdf(
  pdfBytes: Uint8Array,
  fieldMap: Record<string, string>
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pdfForm = doc.getForm();
  const fields = pdfForm.getFields();

  if (fields.length > 0) {
    // AcroForm path: fill named fields
    for (const [fieldName, value] of Object.entries(fieldMap)) {
      try {
        const field = pdfForm.getField(fieldName);
        const fieldType = field.constructor.name;

        if (fieldType === "PDFTextField") {
          pdfForm.getTextField(fieldName).setText(value);
        } else if (fieldType === "PDFCheckBox") {
          if (value === "Yes" || value === "true") {
            pdfForm.getCheckBox(fieldName).check();
          } else {
            pdfForm.getCheckBox(fieldName).uncheck();
          }
        } else if (fieldType === "PDFDropdown") {
          try {
            pdfForm.getDropdown(fieldName).select(value);
          } catch {
            // Value may not be in dropdown options — skip silently
          }
        }
      } catch {
        // Field name not found in this PDF — expected for placeholder PDFs
      }
    }
  } else {
    // No AcroForm: overlay text summary at the top of page 1
    await overlayTextSummary(doc, fieldMap);
  }

  return doc.save();
}

// ── flattenPdf ────────────────────────────────────────────────────────────

/**
 * Flatten PDF form fields so they become static text (read-only after printing).
 * This is the final step before packaging for download.
 */
export async function flattenPdf(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  doc.getForm().flatten();
  return doc.save();
}

// ── mergePacket ───────────────────────────────────────────────────────────

/**
 * Merge multiple PDFs into a single combined PDF.
 * Page order matches the input array order.
 */
export async function mergePacket(pdfs: Uint8Array[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();

  for (const pdfBytes of pdfs) {
    const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }

  return merged.save();
}

// ── buildPacket ───────────────────────────────────────────────────────────

/**
 * Full pipeline: for each form code, load → fill (from CaseContext mappings) → flatten.
 * Returns ready-to-download file entries.
 */
export async function buildPacket(
  formCodes: string[],
  ctx: CaseContext
): Promise<{ filename: string; data: Uint8Array }[]> {
  const results: { filename: string; data: Uint8Array }[] = [];

  for (const formCode of formCodes) {
    const rawPdf = await loadPdf(formCode);
    const fieldMap = resolveFieldMappings(formCode, ctx);
    const filled = await fillPdf(rawPdf, fieldMap);
    const flattened = await flattenPdf(filled);
    results.push({ filename: `${formCode}.pdf`, data: flattened });
  }

  return results;
}

// ── downloadAsZip ─────────────────────────────────────────────────────────

/**
 * Package all PDFs into a single ZIP and trigger a browser download.
 * Spec output format: single ZIP.
 */
export async function downloadAsZip(
  files: { filename: string; data: Uint8Array }[],
  zipName = `divorce-filing-packet-${Date.now()}.zip`
): Promise<void> {
  const zip = new JSZip();

  for (const { filename, data } of files) {
    zip.file(filename, data);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  triggerDownload(zipBlob, zipName);
}

/**
 * Download a single combined PDF (all forms merged into one file).
 */
export async function downloadCombinedPdf(
  files: { filename: string; data: Uint8Array }[],
  county = "filing"
): Promise<void> {
  const merged = await mergePacket(files.map((f) => f.data));
  const blob = new Blob([merged], { type: "application/pdf" });
  triggerDownload(blob, `divorce-packet-${county}-${Date.now()}.pdf`);
}

// ── Internal helpers ──────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a labelled placeholder PDF when the official court PDF is not
 * yet available in /public/forms/wa/.
 *
 * The placeholder clearly identifies itself as NOT an official form.
 * Once official PDFs are added, loadPdf() will use them automatically.
 */
async function generatePlaceholderPdf(formCode: string): Promise<Uint8Array> {
  const form = getFormByCode(formCode);
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([612, 792]);
  const { width, height } = page.getSize();
  let y = height - 50;

  const draw = (text: string, size: number, isBold = false, color = rgb(0.1, 0.1, 0.2)) => {
    if (y < 60) {
      page = doc.addPage([612, 792]);
      y = height - 50;
    }
    page.drawText(text, {
      x: 50,
      y,
      size,
      font: isBold ? bold : font,
      color,
      maxWidth: width - 100,
    });
    y -= size + 8;
  };

  // Header banner
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: rgb(0.95, 0.95, 0.98) });
  draw(form?.title ?? formCode, 15, true);
  draw(`Form code: ${formCode}`, 10, false, rgb(0.4, 0.4, 0.4));
  draw("─".repeat(72), 8);
  y -= 6;

  // Disclaimer
  draw("⚠  PLACEHOLDER — Official court PDF not yet loaded", 10, true, rgb(0.7, 0.4, 0.0));
  draw("This document is for review only and cannot be filed with a court.", 9, false, rgb(0.5, 0.3, 0.0));
  draw("Official PDFs are sourced from courts.wa.gov.", 9, false, rgb(0.5, 0.3, 0.0));
  y -= 8;
  draw("─".repeat(72), 8);
  y -= 6;

  return doc.save();
}

/**
 * Overlay a text summary on page 1 of a PDF that has no AcroForm fields.
 * Used as a fallback for scanned/image-based court PDFs.
 */
async function overlayTextSummary(
  doc: PDFDocument,
  fieldMap: Record<string, string>
): Promise<void> {
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.getPage(0);
  const { width, height } = page.getSize();

  // Semi-transparent overlay box
  page.drawRectangle({
    x: 30,
    y: height - 200,
    width: width - 60,
    height: 190,
    color: rgb(1, 1, 0.9),
    opacity: 0.92,
    borderColor: rgb(0.8, 0.7, 0.2),
    borderWidth: 1,
  });

  let y = height - 55;
  page.drawText("Filled by EZDivorce (text overlay — no AcroForm fields in source PDF)", {
    x: 40, y, size: 8, font, color: rgb(0.5, 0.4, 0.0), maxWidth: width - 80,
  });
  y -= 16;

  for (const [field, value] of Object.entries(fieldMap).slice(0, 10)) {
    if (!value) continue;
    page.drawText(`${field}: `, { x: 40, y, size: 8, font: bold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(value, { x: 160, y, size: 8, font, color: rgb(0.1, 0.1, 0.1), maxWidth: width - 180 });
    y -= 14;
    if (y < height - 195) break;
  }
}
