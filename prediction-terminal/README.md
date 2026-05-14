# Prediction Market Intelligence Terminal

Terminal-style intelligence dashboard for prediction market analysis.

This is the initial scaffold. It contains the folder layout, placeholder
components, placeholder library functions, base types, and a dummy
`/api/analyze` route. No real analysis logic, API integration, or database
is wired up yet.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router)
- TypeScript
- Tailwind CSS
- Recharts (optional, to be added when charts are implemented)
- Deploy target: Vercel

## Project structure

```
prediction-terminal/
  app/                 # App Router entrypoints + API routes
  components/
    terminal/          # 3-panel terminal shell
    input/             # Data input widgets
    analytics/         # Analytical panels (frequency, transition, etc.)
    ui/                # Small presentational primitives
  lib/                 # Pure analysis helpers (placeholders for now)
  types/               # Shared TypeScript types
  data/                # Sample / fixture data
  public/              # Static assets
```

## Getting started

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Then open <http://localhost:3000> to see the terminal layout.

## Available scripts

| Script          | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the Next.js dev server         |
| `npm run build` | Build the production bundle          |
| `npm run start` | Run the production server            |
| `npm run lint`  | Lint the codebase with ESLint        |

## API

`POST /api/analyze` currently returns a static dummy `AnalysisResult` payload.
The real pipeline (parser, frequency, transition, probability, entropy,
normalization, summary) will be wired up in a later iteration.

## Status

Scaffold only. Logic, API integration, and persistence will come next.
