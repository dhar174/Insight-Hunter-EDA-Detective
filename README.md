# Join Quest

Join Quest is a gamified React + TypeScript web app for teaching data science students how SQL-style table relationships translate into real `pandas` work in Python.

Students play as an analyst answering stakeholder requests across:

- e-commerce operations
- HR analytics
- school analytics

The app teaches:

- SQL-to-pandas loading with `pd.read_sql(...)`
- join keys and relationship reasoning
- `merge()` with practical inner vs left join choices
- grouped summaries and multi-table business questions
- analyst-style interpretation after the code runs

## Experience

Each mission includes:

- a business request panel with why the question matters
- an interactive table explorer with schema, sample rows, and key hints
- a relationship map for join planning
- a Python editor powered by a Pyodide worker
- output previews for `merged` and `result`
- interpretation prompts, hints, and scoring

Progress is saved locally in the browser with unlocks, best scores, attempts, and hint usage.

## Stack

- React 19
- Vite
- TypeScript
- React Router
- CodeMirror 6
- Pyodide in a dedicated Web Worker
- Vitest + Testing Library
- Playwright smoke script

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL and start with `Boot the Warehouse Feed`.

## Scripts

```bash
npm run build
npm run lint
npm run test:run
npm run test:e2e
```

`test:e2e` runs a browser smoke flow that opens the onboarding mission, waits for Pyodide to initialize, grades the mission, and checks the progress screen.

## Notes

- The Python runtime is fully client-side. There is no backend or user account system in v1.
- Mission grading uses hidden expected outputs plus rubric-style interpretation checks; it does not use an LLM.
- Vite currently warns that the Pyodide bundle is large. That is expected for this version because the app ships a browser Python runtime.
