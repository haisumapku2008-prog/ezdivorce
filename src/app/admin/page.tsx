import { WA_FORMS } from "@/lib/forms/catalog";
import { WA_FORM_REQUIREMENTS } from "@/lib/rules/determineRequiredForms";
import { US_STATES } from "@/lib/states";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Admin — Legal knowledge layer</h1>
      <p className="mt-2 text-slate-600">
        Internal view of forms catalog, rules engine, and state coverage. Form determination is deterministic — no AI.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">State coverage</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {US_STATES.map((s) => (
            <div
              key={s.code}
              className={`rounded-lg border px-3 py-2 text-sm ${
                s.supported ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-white"
              }`}
            >
              <span className="font-medium">{s.name}</span>
              <Badge variant={s.supported ? "success" : "muted"} className="ml-2">
                {s.supported ? "Active" : "Planned"}
              </Badge>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Washington forms catalog</h2>
        <div className="mt-4 space-y-3">
          {WA_FORMS.map((form) => (
            <Card key={form.code}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{form.name}</span>
                  <Badge>{form.code}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-slate-600">{form.description}</p>
                <p className="mt-2 text-xs text-slate-500">{form.fields.length} mapped fields</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Form requirement rules (WA)</h2>
        <div className="mt-4 space-y-4">
          {WA_FORM_REQUIREMENTS.map((rule, i) => (
            <Card key={i}>
              <CardContent>
                <pre className="text-xs text-slate-600">
                  {JSON.stringify(
                    { hasChildren: rule.hasChildren, isContested: rule.isContested },
                    null,
                    2
                  )}
                </pre>
                <p className="mt--2 text-sm font-medium">Required forms:</p>
                <ul className="mt-1 space-y-1">
                  {rule.requiredFormCodes.map((c) => (
                    <li key={c} className="text-sm text-teal-700">{c}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
