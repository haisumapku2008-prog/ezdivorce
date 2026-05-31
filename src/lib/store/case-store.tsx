"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { CaseData, USState } from "@/lib/types";
import { determineRequiredForms } from "@/lib/rules/determineRequiredForms";
import { getFormsByCodes } from "@/lib/forms/catalog";

const STORAGE_KEY = "divorce-filing-case";

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

interface CaseContextValue {
  caseData: CaseData;
  updateCase: (partial: Partial<CaseData>) => void;
  requiredFormCodes: string[];
  referralRequired: boolean;
  referralReason?: string;
  resetCase: () => void;
  completeInterview: () => void;
  markFormsGenerated: () => void;
  toggleProgressStep: (key: keyof CaseData["progressSteps"]) => void;
}

const CaseContext = createContext<CaseContextValue | null>(null);

export function CaseProvider({ children }: { children: React.ReactNode }) {
  const [caseData, setCaseData] = useState<CaseData>(createEmptyCase);
  const [hydrated, setHydrated] = useState(false);

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

  const determination = determineRequiredForms(caseData);

  const completeInterview = useCallback(() => {
    setCaseData((prev) => {
      const forms = getFormsByCodes(
        determineRequiredForms(prev).formCodes
      );
      const formAnswers: Record<string, Record<string, string>> = {};
      for (const form of forms) {
        formAnswers[form.code] = {
          petitionerName: prev.petitionerName,
          respondentName: prev.respondentName,
          dateMarried: prev.dateMarried ?? "",
          dateSeparated: prev.dateSeparated ?? "",
          county: prev.county,
          hasChildren: String(prev.hasChildren),
          childrenCount: String(prev.childrenCount ?? ""),
        };
      }
      return {
        ...prev,
        formAnswers,
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

  const toggleProgressStep = useCallback((key: keyof CaseData["progressSteps"]) => {
    setCaseData((prev) => ({
      ...prev,
      progressSteps: { ...prev.progressSteps, [key]: !prev.progressSteps[key] },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  if (!hydrated) return null;

  return (
    <CaseContext.Provider
      value={{
        caseData,
        updateCase,
        requiredFormCodes: determination.formCodes,
        referralRequired: determination.referralRequired,
        referralReason: determination.referralReason,
        resetCase,
        completeInterview,
        markFormsGenerated,
        toggleProgressStep,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
}

export function useCase() {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error("useCase must be used within CaseProvider");
  return ctx;
}

export function useStateSupport(state: USState) {
  return state === "WA";
}
