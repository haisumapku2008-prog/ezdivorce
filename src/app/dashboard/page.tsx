"use client";

import Link from "next/link";
import { useCase } from "@/lib/store/case-store";
import { PROGRESS_STEP_KEYS, PROGRESS_STEP_LABELS } from "@/lib/types";
import { getCountyDisplayName } from "@/lib/procedures";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { caseData, toggleProgressStep, resetCase } = useCase();
  const completedCount = PROGRESS_STEP_KEYS.filter((k) => caseData.progressSteps[k]).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your filing progress</h1>
          <p className="mt-1 text-sm text-slate-600">
            {getCountyDisplayName(caseData.county)}, {caseData.state} · Case {caseData.id.slice(0, 8)}
          </p>
        </div>
        <Badge variant={completedCount === PROGRESS_STEP_KEYS.length ? "success" : "default"}>
          {completedCount} / {PROGRESS_STEP_KEYS.length} complete
        </Badge>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold">Progress overview</h2>
        </CardHeader>
        <CardContent>
          <div className="mb-4 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-teal-600 transition-all"
              style={{ width: `${(completedCount / PROGRESS_STEP_KEYS.length) * 100}%` }}
            />
          </div>
          <ul className="space-y-3">
            {PROGRESS_STEP_KEYS.map((key) => {
              const done = caseData.progressSteps[key];
              return (
                <li key={key} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                    }`}>
                      {done ? "✓" : "○"}
                    </span>
                    <span className={done ? "text-slate-900" : "text-slate-600"}>
                      {PROGRESS_STEP_LABELS[key]}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleProgressStep(key)}
                    className="text-xs text-teal-600 hover:underline"
                  >
                    {done ? "Mark incomplete" : "Mark complete"}
                  </button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold">Case summary</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-slate-500">Petitioner</dt>
            <dd>{caseData.petitionerName || "—"}</dd>
            <dt className="text-slate-500">Respondent</dt>
            <dd>{caseData.respondentName || "—"}</dd>
            <dt className="text-slate-500">Minor children</dt>
            <dd>{caseData.hasChildren ? `Yes (${caseData.childrenCount ?? "?"})` : "No"}</dd>
            <dt className="text-slate-500">Case type</dt>
            <dd>{caseData.isContested ? "Contested" : "Uncontested"}</dd>
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/interview"><Button variant="outline">Edit interview</Button></Link>
        <Link href="/forms"><Button variant="outline">Edit forms</Button></Link>
        <Link href="/checklist"><Button>View filing guide</Button></Link>
        <Button variant="ghost" onClick={resetCase} className="text-red-600">
          Reset case
        </Button>
      </div>
    </div>
  );
}
