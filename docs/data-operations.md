# Data operations · 数据运营

This tracker is intentionally static at runtime. GitHub Pages serves the React bundle and generated JSON; GitHub Actions performs source monitoring and quality checks. The verified case register is still curated by a human.

## Data flow

```text
Official EC / DSC / EUR-Lex / CURIA source
                │
                ▼
       scripts/check_updates.py
       normalize → hash → dedupe
                │
        ┌───────┴────────┐
        ▼                ▼
 public/data/      review_queue.json
 updates.json      pending human review
        │                │
        └───────┬────────┘
                ▼
       human verification / case promotion
                │
                ▼
       src/data/cases.ts → npm run data:export
                │
                ▼
       public/data/registry.json → GitHub Pages
```

## What the monitor may change

`check_updates.py` only writes the official activity feed, review queue and monitor-run ledger:

- `updates.json` is updated only when the normalized item list changes.
- `review_queue.json` appends unseen source items with `status: pending`; existing `accepted` or `rejected` decisions are preserved.
- `monitor_runs.json` records `success` and `failed` runs, including the error message for a failure.
- A malformed, empty or unavailable feed leaves the last good `updates.json` and review queue untouched. The workflow still fails loudly after recording the failure.
- The monitor never edits `src/data/cases.ts`, `registry.json`, or a case status. A reviewer must promote a source into the typed catalogue.

## Local commands

```bash
npm install
npm run data:export
npm run data:validate
python3 -m unittest discover -s tests -p 'test_*.py'
npm test
npm run lint
npm run build
```

To run the official monitor manually, use `python3 scripts/check_updates.py`. It performs bounded retries and requires network access to the official feed. Do not run it to replace curated case records.

## Review and promotion checklist

1. Open the source URL from `review_queue.json` and confirm it is an official Commission, DSC, EUR-Lex or CURIA page.
2. Check whether the item is a new matter or an event in an existing `case_id`; link decisions, commitments and remediation to the canonical matter instead of double-counting them.
3. Record the exact date, stage, DSA articles, source type, evidence snapshot, owner, next action and deadline in `src/data/cases.ts`.
4. Keep Chinese and English fields semantically aligned. Add an event and source link for each material status change.
5. Run `npm run data:export`, `npm run data:validate`, `npm test`, `npm run lint` and `npm run build`.
6. Commit the catalogue and generated registry together. The CI workflow must be green before the Pages deployment is considered current.

## Workflows and release

- `ci.yml` runs on pushes, pull requests and manual dispatch. It runs Python monitor tests, regenerates and validates the registry, then runs TypeScript tests, type-checking and the production build.
- `monitor.yml` runs daily at `07:42 UTC` and can be dispatched manually. It validates the registry, runs monitor regression tests, refreshes official source data and commits only the operational JSON files.
- `deploy.yml` runs on `main` pushes. It runs data validation and regression tests, builds `dist`, uploads that exact artifact and deploys it to Pages.
- Live site: [xuzhujie.github.io/dsa-enforcement-tracker](https://xuzhujie.github.io/dsa-enforcement-tracker/)

If a workflow fails, inspect the failed step and `public/data/monitor_runs.json` first. Do not manually delete the last good feed to make a run pass.
