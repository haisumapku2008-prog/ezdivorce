# Divorce Filing Assistant

TurboTax-style DIY divorce filing prototype for Washington State (King County MVP), expanding to all US states.

## Features

- **Deterministic rules engine** — form requirements come from code, not AI
- **50-state selector** — Washington fully supported; other states show coming-soon flow
- **Guided interview** — residency, county, marriage, children, property, parties
- **Online form editor** — edit all required forms before download
- **One-click PDF download** — individual forms or combined filing packet
- **County filing checklist** — detailed King County procedures with links and timelines
- **Progress dashboard** — track steps through final orders
- **Admin panel** — view forms catalog and rules at `/admin`

## Tech stack

- Next.js 15, TypeScript, Tailwind CSS v4
- React Hook Form + Zod (ready for validation expansion)
- pdf-lib for PDF generation
- Vitest for rules engine tests
- LocalStorage for prototype persistence (Supabase schema defined in spec for production)

## Getting started

```bash
cd ~/Projects/divorce-filing-assistant
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Run tests

```bash
npm test
```

## Project structure

```
src/
  app/           # Pages: interview, forms, checklist, dashboard, admin
  components/    # UI components
  lib/
    forms/       # Forms catalog and field mappings
    rules/       # determineRequiredForms() — deterministic
    procedures/  # County-specific filing checklists
    states/      # All 50 US states
    pdf/         # PDF packet generation
    store/       # Case state (localStorage)
```

## Disclaimer

Prototype only. Not legal advice. Consult a licensed attorney for legal guidance.
