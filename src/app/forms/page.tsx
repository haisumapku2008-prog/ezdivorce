"use client";

import { useState } from "react";
import Link from "next/link";
import { useCase } from "@/lib/store/case-store";
import { getFormsByCodes } from "@/lib/forms/catalog";
import { downloadAllForms, downloadCombinedPacket } from "@/lib/pdf/generatePacket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FormsPage() {
  const { caseData, updateCase, requiredFormCodes, referralRequired, referralReason, markFormsGenerated } = useCase();
  const [activeForm, setActiveForm] = useState(requiredFormCodes[0] ?? "");
  const [downloading, setDownloading] = useState(false);

  const forms = getFormsByCodes(requiredFormCodes);
  const currentForm = forms.find((f) => f.code === activeForm);
  const answers = caseData.formAnswers[activeForm] ?? {};

  const updateField = (key: string, value: string) => {
    updateCase({
      formAnswers: {
        ...caseData.formAnswers,
        [activeForm]: {
          ...answers,
          [key]: value,
        },
      },
    });
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      await downloadAllForms(caseData, requiredFormCodes);
      markFormsGenerated();
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadCombined = async () => {
    setDownloading(true);
    try {
      await downloadCombinedPacket(caseData, requiredFormCodes);
      markFormsGenerated();
    } finally {
      setDownloading(false);
    }
  };

  if (referralRequired || requiredFormCodes.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">No forms available</h1>
        <p className="mt-4 text-slate-600">{referralReason ?? "Complete the interview first."}</p>
        <Link href="/interview" className="mt-6 inline-block">
          <Button>Start interview</Button>
        </Link>
      </div>
    );
  }

  if (!caseData.progressSteps.interview_complete) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Complete your interview first</h1>
        <Link href="/interview" className="mt-6 inline-block">
          <Button>Go to interview</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit your forms</h1>
          <p className="mt-1 text-sm text-slate-600">
            All fields are editable. Changes sync across your filing packet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadAll} disabled={downloading}>
            Download all PDFs
          </Button>
          <Button onClick={handleDownloadCombined} disabled={downloading}>
            {downloading ? "Generating…" : "Download combined packet"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-2">
          {forms.map((form) => (
            <button
              key={form.code}
              onClick={() => setActiveForm(form.code)}
              className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                activeForm === form.code
                  ? "border-teal-600 bg-teal-50 text-teal-900"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className="block font-medium">{form.name}</span>
              <span className="text-xs text-slate-500">{form.code}</span>
            </button>
          ))}
        </aside>

        {currentForm && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{currentForm.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{currentForm.description}</p>
                </div>
                <Badge>{currentForm.code}</Badge>
              </div>
              {currentForm.officialUrl && (
                <a
                  href={currentForm.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-teal-600 hover:underline"
                >
                  View official form →
                </a>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {currentForm.fields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </label>
                  {field.helpText && (
                    <p className="mb-1 text-xs text-slate-500">{field.helpText}</p>
                  )}
                  {field.type === "textarea" ? (
                    <textarea
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      rows={3}
                      value={answers[field.key] ?? ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                    />
                  ) : field.type === "select" ? (
                    <select
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={answers[field.key] ?? ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                    >
                      <option value="">Select…</option>
                      {field.options?.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : field.type === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={answers[field.key] === "true"}
                      onChange={(e) => updateField(field.key, String(e.target.checked))}
                      className="rounded border-slate-300"
                    />
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={answers[field.key] ?? ""}
                      onChange={(e) => updateField(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <Link href="/interview">
          <Button variant="outline">← Back to interview</Button>
        </Link>
        <Link href="/checklist">
          <Button>View filing guide →</Button>
        </Link>
      </div>
    </div>
  );
}
