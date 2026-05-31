"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCase } from "@/lib/store/case-store";
import { US_STATES, getCountiesForState } from "@/lib/states";
import { getFormDisplayNames } from "@/lib/rules/determineRequiredForms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { USState } from "@/lib/types";

const STEPS = [
  "Location",
  "Residency",
  "Marriage",
  "Children",
  "Property",
  "Parties",
  "Review",
];

export default function InterviewPage() {
  const router = useRouter();
  const { caseData, updateCase, requiredFormCodes, referralRequired, referralReason, completeInterview } = useCase();
  const [step, setStep] = useState(0);

  const counties = getCountiesForState(caseData.state);
  const stateInfo = US_STATES.find((s) => s.code === caseData.state);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    completeInterview();
    router.push(referralRequired ? "/interview" : "/forms");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Divorce filing interview</h1>
        <p className="mt-1 text-sm text-slate-600">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
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
          <h2 className="text-lg font-semibold">{STEPS[step]}</h2>
        </CardHeader>
        <CardContent className="space-y-5">
          {step === 0 && (
            <>
              <Field label="State of residence">
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={caseData.state}
                  onChange={(e) => {
                    const state = e.target.value as USState;
                    const newCounties = getCountiesForState(state);
                    updateCase({
                      state,
                      county: newCounties[0]?.value ?? "",
                    });
                  }}
                >
                  {US_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} {s.supported ? "✓" : "(coming soon)"}
                    </option>
                  ))}
                </select>
              </Field>
              {!stateInfo?.supported && (
                <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                  {caseData.state} is not yet fully supported. You can preview the interview, but form generation requires Washington State.
                </div>
              )}
              {counties.length > 0 && (
                <Field label="County where you will file">
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={caseData.county}
                    onChange={(e) => updateCase({ county: e.target.value })}
                  >
                    {counties.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="City (optional)">
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={caseData.city ?? ""}
                  onChange={(e) => updateCase({ city: e.target.value })}
                  placeholder="e.g. Seattle"
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="Do you currently live in this state?">
                <ToggleGroup
                  value={caseData.livesInState}
                  onChange={(v) => updateCase({ livesInState: v })}
                  labels={["Yes", "No"]}
                />
              </Field>
              <Field label="Is your spouse expected to disagree with the divorce terms?">
                <ToggleGroup
                  value={caseData.isContested}
                  onChange={(v) => updateCase({ isContested: v })}
                  labels={["No — uncontested", "Yes — contested"]}
                />
              </Field>
              <Field label="Can your spouse be located for service?">
                <ToggleGroup
                  value={caseData.spouseLocatable}
                  onChange={(v) => updateCase({ spouseLocatable: v })}
                  labels={["Yes", "No / unknown"]}
                />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Date of marriage">
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={caseData.dateMarried ?? ""}
                  onChange={(e) => updateCase({ dateMarried: e.target.value })}
                />
              </Field>
              <Field label="Date of separation">
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={caseData.dateSeparated ?? ""}
                  onChange={(e) => updateCase({ dateSeparated: e.target.value })}
                />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="Do you have minor children together?">
                <ToggleGroup
                  value={caseData.hasChildren}
                  onChange={(v) => updateCase({ hasChildren: v })}
                  labels={["No", "Yes"]}
                />
              </Field>
              {caseData.hasChildren && (
                <Field label="Number of minor children">
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={caseData.childrenCount ?? ""}
                    onChange={(e) => updateCase({ childrenCount: parseInt(e.target.value) || 0 })}
                  />
                </Field>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <p className="text-sm text-slate-600">Select all that apply to your marital estate:</p>
              {[
                { key: "hasHouse" as const, label: "Real estate / home" },
                { key: "hasVehicles" as const, label: "Vehicles" },
                { key: "hasRetirement" as const, label: "Retirement accounts" },
                { key: "hasDebt" as const, label: "Shared debt" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={caseData[key]}
                    onChange={(e) => updateCase({ [key]: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  {label}
                </label>
              ))}
            </>
          )}

          {step === 5 && (
            <>
              <Field label="Your full legal name (Petitioner)">
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={caseData.petitionerName}
                  onChange={(e) => updateCase({ petitionerName: e.target.value })}
                />
              </Field>
              <Field label="Spouse's full legal name (Respondent)">
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={caseData.respondentName}
                  onChange={(e) => updateCase({ respondentName: e.target.value })}
                />
              </Field>
              <Field label="Your email">
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={caseData.petitionerEmail ?? ""}
                  onChange={(e) => updateCase({ petitionerEmail: e.target.value })}
                />
              </Field>
            </>
          )}

          {step === 6 && (
            <div className="space-y-4">
              {referralRequired ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="font-medium text-amber-900">Referral recommended</p>
                  <p className="mt-2 text-sm text-amber-800">{referralReason}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600">
                    Based on your answers, our rules engine determined these forms are required:
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
                <dd>{caseData.state}</dd>
                <dt className="text-slate-500">County</dt>
                <dd>{caseData.county}</dd>
                <dt className="text-slate-500">Children</dt>
                <dd>{caseData.hasChildren ? "Yes" : "No"}</dd>
              </dl>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={back} disabled={step === 0}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>Continue</Button>
            ) : referralRequired ? (
              <Button variant="secondary" onClick={() => setStep(0)}>Start over</Button>
            ) : (
              <Button onClick={finish}>Generate forms →</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function ToggleGroup({
  value,
  onChange,
  labels,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  labels: [string, string];
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 rounded-lg border px-3 py-2 text-sm ${!value ? "border-teal-600 bg-teal-50 text-teal-800" : "border-slate-300"}`}
      >
        {labels[0]}
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 rounded-lg border px-3 py-2 text-sm ${value ? "border-teal-600 bg-teal-50 text-teal-800" : "border-slate-300"}`}
      >
        {labels[1]}
      </button>
    </div>
  );
}
