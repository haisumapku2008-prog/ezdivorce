"use client";

import Link from "next/link";
import { useCase } from "@/lib/store/case-store";
import { generateChecklist, getCountyDisplayName } from "@/lib/procedures";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const categoryLabels: Record<string, string> = {
  preparation: "Preparation",
  filing: "Filing",
  service: "Service",
  post_filing: "After filing",
  completion: "Completion",
};

export default function ChecklistPage() {
  const { caseData } = useCase();
  const steps = generateChecklist(caseData.county, caseData.hasChildren, caseData.state);
  const countyName = getCountyDisplayName(caseData.county);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Badge className="mb-3">{caseData.state} · {countyName}</Badge>
        <h1 className="text-2xl font-bold text-slate-900">Filing guide to 100% completion</h1>
        <p className="mt-2 text-slate-600">
          Step-by-step instructions for your county. Follow each step in order.
          {caseData.hasChildren && " Includes parenting seminar requirements."}
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <Card key={step.stepNumber}>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
                  {step.stepNumber}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">{step.title}</h2>
                    <Badge variant="muted">{categoryLabels[step.category] ?? step.category}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>

                  <dl className="mt-3 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                    {step.timeline && (
                      <>
                        <dt className="font-medium">Timeline</dt>
                        <dd>{step.timeline}</dd>
                      </>
                    )}
                    {step.fees && (
                      <>
                        <dt className="font-medium">Fees</dt>
                        <dd>{step.fees}</dd>
                      </>
                    )}
                  </dl>

                  {step.requiredDocuments && step.requiredDocuments.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-slate-500">Required documents</p>
                      <ul className="mt-1 flex flex-wrap gap-1">
                        {step.requiredDocuments.map((doc) => (
                          <Badge key={doc} variant="default">{doc}</Badge>
                        ))}
                      </ul>
                    </div>
                  )}

                  {step.url && (
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm font-medium text-teal-600 hover:underline"
                    >
                      Open official resource →
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-teal-200 bg-teal-50 p-6">
        <h3 className="font-semibold text-teal-900">Washington Law Help resources</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <a href="https://www.washingtonlawhelp.org/en/get-family-law-forms" className="text-teal-700 hover:underline" target="_blank" rel="noopener noreferrer">
              Get Family Law Forms questionnaire
            </a>
          </li>
          <li>
            <a href="https://www.washingtonlawhelp.org/en/divorce-guide" className="text-teal-700 hover:underline" target="_blank" rel="noopener noreferrer">
              Complete Washington divorce guide
            </a>
          </li>
        </ul>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/forms"><Button variant="outline">← Edit forms</Button></Link>
        <Link href="/dashboard"><Button>Track progress →</Button></Link>
      </div>
    </div>
  );
}
