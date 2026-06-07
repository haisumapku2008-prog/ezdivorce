"use client";

/**
 * case-store.tsx
 *
 * React context that holds the active divorce case.
 *
 * Epic 7: The store now produces CaseContext (canonical domain type) as its
 * primary output. All downstream systems — rules engine, PDF layer,
 * checklist generator, AI assistant — consume CaseContext directly.
 *
 * CaseData (the flat localStorage shape) is kept as the persistence format
 * for backward-compatibility with existing stored browser data.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { CaseData, USState } from "@/lib/types";
import type { CaseContext, ProgressSteps } from "@/domain/CaseContext";
import type { Person } from "@/domain/Person";
import type { Child } from "@/domain/Child";
import type { Asset, Debt } from "@/domain/AssetDebt";
import {
  determineRequiredForms,
  getFormCodes,
} from "@/rules/determineRequiredForms";
import { getFormsByCodes } from "@/catalog/FormCatalogLoader";

const STORAGE_KEY = "divorce-filing-case";

// ── Default empty case ────────────────────────────────────────────────────

function createEmptyCase(): CaseData {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
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
    petitionerName: "",
    respondentName: "",
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
  };
}

// ── CaseData → CaseContext bridge ─────────────────────────────────────────

/**
 * Convert the flat CaseData (localStorage shape) into the canonical CaseContext
 * that the rules engine, PDF layer, and checklist generator consume.
 */
export function toCaseContext(d: CaseData): CaseContext {
  const petitioner: Person = {
    fullName: d.petitionerName,
    email: d.petitionerEmail,
    phone: d.petitionerPhone,
    address: d.petitionerAddress,
  };

  const respondent: Person = {
    fullName: d.respondentName,
    address: d.respondentAddress,
  };

  // Build child array from flat count field.
  // Epic 6 (JSON interview) will capture individual child details;
  // until then we synthesise placeholder Child records from the count.
  const children: Child[] = d.hasChildren
    ? Array.from({ length: d.childrenCount ?? 1 }, (_, i) => ({
        fullName: `Child ${i + 1}`,
        dateOfBirth: "",
      }))
    : [];

  const assets: Asset[] = [
    ...(d.hasHouse ? [{ type: "real_estate" as const, description: "Marital home" }] : []),
    ...(d.hasVehicles ? [{ type: "vehicle" as const, description: "Vehicle(s)" }] : []),
    ...(d.hasRetirement ? [{ type: "retirement" as const, description: "Retirement account(s)" }] : []),
  ];

  const debts: Debt[] = d.hasDebt
    ? [{ type: "other" as const, description: "Shared debt" }]
    : [];

  const progressSteps: ProgressSteps = {
    interview_complete: Boolean(d.progressSteps?.interview_complete),
    forms_generated: Boolean(d.progressSteps?.forms_generated),
    petition_filed: Boolean(d.progressSteps?.petition_filed),
    service_completed: Boolean(d.progressSteps?.service_completed),
    parenting_class: Boolean(d.progressSteps?.parenting_class),
    final_orders: Boolean(d.progressSteps?.final_orders),
  };

  return {
    id: d.id,
    status: d.status,
    petitioner,
    respondent,
    children,
    marriage: {
      state: d.state,
      county: d.county,
      dateMarried: d.dateMarried,
      dateSeparated: d.dateSeparated,
    },
    assets,
    debts,
    livesInState: d.livesInState,
    isContested: d.isContested,
    spouseLocatable: d.spouseLocatable,
    formAnswers: d.formAnswers,
    progressSteps,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

// ── Context value type ────────────────────────────────────────────────────

interface CaseContextValue {
  /** Flat persistence shape — used by existing UI pages */
  caseData: CaseData;
  /** Canonical domain type — used by rules, PDF, checklist, AI */
  caseContext: CaseContext;
  updateCase: (partial: Partial<CaseData>) => void;
  requiredFormCodes: string[];
  referralRequired: boolean;
  referralReason?: string;
  resetCase: () => void;
  completeInterview: () => void;
  markFormsGenerated: () => void;
  toggleProgressStep: (key: keyof CaseData["progressSteps"]) => void;
}

const CaseReactContext = createContext<CaseContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────

export function CaseProvider({ children }: { children: React.ReactNode }) {
  const [caseData, setCaseData] = useState<CaseData>(createEmptyCase);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCaseData(JSON.parse(stored) as CaseData);
      } catch {
        /* use default */
      }
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(caseData));
    }
  }, [caseData, hydrated]);

  const updateCase = useCallback((partial: Partial<CaseData>) => {
    setCaseData((prev) => ({
      ...prev,
      ...partial,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const resetCase = useCallback(() => {
    const fresh = createEmptyCase();
    setCaseData(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }, []);

  // Derive CaseContext from CaseData
  const caseContext = toCaseContext(caseData);

  // Run the rules engine against CaseContext (canonical input)
  const determination = determineRequiredForms(caseContext);
  const requiredFormCodes = getFormCodes(determination);

  const completeInterview = useCallback(() => {
    setCaseData((prev) => {
      const ctx = toCaseContext(prev);
      const det = determineRequiredForms(ctx);
      const codes = getFormCodes(det);
      const forms = getFormsByCodes(codes, prev.state, prev.county);

      // Pre-populate all form fields we can derive from CaseContext
      const formAnswers: Record<string, Record<string, string>> = {};
      for (const form of forms) {
        formAnswers[form.formCode] = {
          petitionerName: prev.petitionerName,
          respondentName: prev.respondentName,
          petitionerAddress: prev.petitionerAddress ?? "",
          respondentAddress: prev.respondentAddress ?? "",
          petitionerDOB: "",
          respondentDOB: "",
          petitionerSSN: "",
          respondentSSN: "",
          dateMarried: prev.dateMarried ?? "",
          dateSeparated: prev.dateSeparated ?? "",
          county: prev.county,
          courtName: `${prev.county.charAt(0).toUpperCase() + prev.county.slice(1)} County Superior Court`,
          hasChildren: String(prev.hasChildren),
          childrenCount: String(prev.childrenCount ?? ""),
          grounds: "irretrievably_broken",
        };
      }

      // Use formCode as key (new catalog uses formCode, not code)
      // Also populate under old `code` key for backward-compat with forms page
      const legacyFormAnswers: Record<string, Record<string, string>> = {};
      for (const form of forms) {
        legacyFormAnswers[form.formCode] = formAnswers[form.formCode];
      }

      return {
        ...prev,
        formAnswers: legacyFormAnswers,
        status: "interview_complete",
        progressSteps: { ...prev.progressSteps, interview_complete: true },
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const markFormsGenerated = useCallback(() => {
    setCaseData((prev) => ({
      ...prev,
      status: "forms_generated",
      progressSteps: { ...prev.progressSteps, forms_generated: true },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const toggleProgressStep = useCallback(
    (key: keyof CaseData["progressSteps"]) => {
      setCaseData((prev) => ({
        ...prev,
        progressSteps: {
          ...prev.progressSteps,
          [key]: !prev.progressSteps[key],
        },
        updatedAt: new Date().toISOString(),
      }));
    },
    []
  );

  if (!hydrated) return null;

  return (
    <CaseReactContext.Provider
      value={{
        caseData,
        caseContext,
        updateCase,
        requiredFormCodes,
        referralRequired: determination.referralRequired,
        referralReason: determination.referralRequired
          ? determination.referralReason
          : undefined,
        resetCase,
        completeInterview,
        markFormsGenerated,
        toggleProgressStep,
      }}
    >
      {children}
    </CaseReactContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────

export function useCase() {
  const ctx = useContext(CaseReactContext);
  if (!ctx) throw new Error("useCase must be used within CaseProvider");
  return ctx;
}

export function useStateSupport(state: USState) {
  return state === "WA";
}
