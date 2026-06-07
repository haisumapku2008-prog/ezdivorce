"use client";

/**
 * Interview page — TurboTax-style guided interview.
 *
 * Epic 6: All questions are loaded from /src/interview/questions.json.
 * No question text is hardcoded in this component.
 * The QuestionRenderer component handles all input types generically.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCase } from "@/lib/store/case-store";
import { US_STATES, getCountiesForState } from "@/lib/states";
import { getFormDisplayNames } from "@/lib/rules/determineRequiredForms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { USState } from "@/lib/types";
import {
  getSteps,
  getQuestionsForStep,
  isStepComplete,
} from "@/interview/questionLoader";
import type { QuestionDefinition } from "@/interview/types";

// Derive steps from JSON — never hardcoded
const STEPS = [...getSteps(), "Review"];

export default function InterviewPage() {
  const router = useRouter();
  const {
    caseData,
    updateCase,
    requiredFormCodes,
    referralRequired,
    referralReason,
    completeInterview,
  } = useCase();
  const [step, setStep] = useState(0);

  const currentStepName = STEPS[step];
  const isReviewStep = currentStepName === "Review";

  // Get questions for the current step, filtered by showIf
  const questions = isReviewStep
    ? []
    : getQuestionsForStep(currentStepName, caseData as Record<string, unknown>);

  const stepComplete = isReviewStep || isStepComplete(currentStepName, caseData as Record<string, unknown>);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    completeInterview();
    router.push(referralRequired ? "/interview" : "/forms");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Progress header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Divorce filing interview
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Step {step + 1} of {STEPS.length}: {currentStepName}
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-teal-600 transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{currentStepName}</h2>
          {currentStepName === "Property" && (
            <p className="mt-1 text-sm text-slate-600">
              Select all that apply to your marital estate:
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Render each question via the generic QuestionRenderer */}
          {!isReviewStep &&
            questions.map((q) => (
              <QuestionRenderer
                key={q.id}
                question={q}
                caseData={caseData}
                updateCase={updateCase}
              />
            ))}

          {/* Review step */}
          {isReviewStep && (
            <ReviewStep
              caseData={caseData}
              referralRequired={referralRequired}
              referralReason={referralReason}
              requiredFormCodes={requiredFormCodes}
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={back} disabled={step === 0}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} disabled={!stepComplete}>
                Continue
              </Button>
            ) : referralRequired ? (
              <Button variant="secondary" onClick={() => setStep(0)}>
                Start over
              </Button>
            ) : (
              <Button onClick={finish}>Generate forms →</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Generic Question Renderer ─────────────────────────────────────────────

function QuestionRenderer({
  question: q,
  caseData,
  updateCase,
}: {
  question: QuestionDefinition;
  caseData: Record<string, unknown>;
  updateCase: (partial: Record<string, unknown>) => void;
}) {
  const value = caseData[q.field];

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {q.question}
      </label>
      {q.helpText && (
        <p className="mb-2 text-xs text-slate-500">{q.helpText}</p>
      )}

      {/* State selector */}
      {q.type === "state-select" && (
        <select
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          value={(value as string) ?? "WA"}
          onChange={(e) => {
            const state = e.target.value as USState;
            const newCounties = getCountiesForState(state);
            updateCase({ state, county: newCounties[0]?.value ?? "" });
          }}
        >
          {US_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name} {s.supported ? "✓" : "(coming soon)"}
            </option>
          ))}
        </select>
      )}

      {/* County selector */}
      {q.type === "county-select" && (
        <select
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          value={(value as string) ?? ""}
          onChange={(e) => updateCase({ [q.field]: e.target.value })}
        >
          {getCountiesForState((caseData.state as USState) ?? "WA").map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      )}

      {/* Boolean toggle */}
      {q.type === "boolean" && (
        <div className="flex gap-2">
          {(q.labels ?? ["No", "Yes"]).map((label, i) => {
            const boolVal = q.invertDisplay ? i === 0 : i === 1;
            const active = value === boolVal;
            return (
              <button
                key={label}
                type="button"
                onClick={() => updateCase({ [q.field]: boolVal })}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  active
                    ? "border-teal-600 bg-teal-50 text-teal-800"
                    : "border-slate-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Checkbox (single) */}
      {q.type === "checkbox" && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => updateCase({ [q.field]: e.target.checked })}
            className="rounded border-slate-300"
          />
          {q.question}
        </label>
      )}

      {/* Text / email inputs */}
      {(q.type === "text" || q.type === "email") && (
        <input
          type={q.type}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          value={(value as string) ?? ""}
          onChange={(e) => updateCase({ [q.field]: e.target.value })}
          placeholder={q.placeholder}
        />
      )}

      {/* Date input */}
      {q.type === "date" && (
        <input
          type="date"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          value={(value as string) ?? ""}
          onChange={(e) => updateCase({ [q.field]: e.target.value })}
        />
      )}

      {/* Number input */}
      {q.type === "number" && (
        <input
          type="number"
          min={q.min}
          max={q.max}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          value={(value as number) ?? ""}
          onChange={(e) =>
            updateCase({ [q.field]: parseInt(e.target.value) || 0 })
          }
        />
      )}

      {/* Select */}
      {q.type === "select" && q.options && (
        <select
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          value={(value as string) ?? ""}
          onChange={(e) => updateCase({ [q.field]: e.target.value })}
        >
          <option value="">Select…</option>
          {q.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

// ── Review Step ───────────────────────────────────────────────────────────

function ReviewStep({
  caseData,
  referralRequired,
  referralReason,
  requiredFormCodes,
}: {
  caseData: Record<string, unknown>;
  referralRequired: boolean;
  referralReason?: string;
  requiredFormCodes: string[];
}) {
  return (
    <div className="space-y-4">
      {referralRequired ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="font-medium text-amber-900">Referral recommended</p>
          <p className="mt-2 text-sm text-amber-800">{referralReason}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            Based on your answers, our rules engine determined these forms are
            required:
          </p>
          <ul className="space-y-2">
            {getFormDisplayNames(requiredFormCodes).map((name) => (
              <li key={name} className="flex items-center gap-2 text-sm">
                <Badge variant="success">Required</Badge>
                {name}
              </li>
            ))}
          </ul>
        </>
      )}
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-slate-500">State</dt>
        <dd>{String(caseData.state ?? "—")}</dd>
        <dt className="text-slate-500">County</dt>
        <dd>{String(caseData.county ?? "—")}</dd>
        <dt className="text-slate-500">Children</dt>
        <dd>{caseData.hasChildren ? "Yes" : "No"}</dd>
        <dt className="text-slate-500">Contested</dt>
        <dd>{caseData.isContested ? "Yes" : "No"}</dd>
      </dl>
    </div>
  );
}
