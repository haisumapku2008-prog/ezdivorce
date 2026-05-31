import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    title: "Smart form determination",
    description:
      "A deterministic rules engine — not AI — selects the exact Washington forms for your county, children, and case type.",
  },
  {
    title: "TurboTax-style interview",
    description:
      "Answer plain-language questions. We auto-fill official court forms and let you edit every field before download.",
  },
  {
    title: "One-click filing packet",
    description:
      "Download all required PDFs individually or as a combined packet, ready for e-filing.",
  },
  {
    title: "Step-by-step county guide",
    description:
      "Crystal-clear instructions for King County and beyond: e-filing accounts, service, parenting classes, and timelines.",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(13,148,136,0.25),transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <Badge variant="default" className="mb-4 bg-teal-500/20 text-teal-100">
            Washington MVP · Expanding nationwide
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            DIY divorce filing, made as easy as TurboTax
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Determine the right forms, fill them online, download your complete filing packet,
            and follow county-specific guidance — all for a fraction of traditional services.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/interview">
              <Button size="lg" className="bg-teal-500 hover:bg-teal-400">
                Start free interview
              </Button>
            </Link>
            <Link href="/checklist">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                View filing guide
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-400">
            50 states listed · Washington fully supported · Uncontested divorces
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Better than form-filler sites
          </h2>
          <p className="mt-3 text-slate-600">
            Procedural accuracy is the hard part. We built the legal knowledge layer first.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <Card key={f.title}>
              <CardContent>
                <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
              <ol className="mt-6 space-y-4">
                {[
                  "Select your state and county",
                  "Complete a guided interview",
                  "Review and edit auto-filled forms",
                  "Download your filing packet",
                  "Follow your county checklist to 100% completion",
                ].map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-slate-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <Card className="bg-slate-50">
              <CardContent>
                <h3 className="font-semibold text-slate-900">Pricing (prototype)</h3>
                <p className="mt-2 text-3xl font-bold text-teal-700">$99</p>
                <p className="text-sm text-slate-500 line-through">vs. $299+ elsewhere</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>✓ All required forms for your scenario</li>
                  <li>✓ Unlimited edits before download</li>
                  <li>✓ County filing checklist included</li>
                  <li>✓ Progress tracker through final orders</li>
                </ul>
                <Link href="/interview" className="mt-6 block">
                  <Button className="w-full">Get started</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
