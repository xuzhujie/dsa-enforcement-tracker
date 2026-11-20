# DSA Tracker Productionization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the bilingual DSA tracker from a curated static MVP into a source-first, reviewable, searchable and operational enforcement register with a materially broader official case catalogue.

**Architecture:** Keep the GitHub Pages frontend static, but make the repository data-first. A normalized registry JSON is generated from the typed seed records and loaded by the app; a Python monitor refreshes only official-source updates, deduplicates them, records monitor runs, and places unseen items into a review queue without silently changing verified case status. The UI adds search, risk/authority/country filters, shareable case-detail state and calendar export while GitHub Actions runs tests, data validation, monitoring and Pages deployment.

**Tech Stack:** React + TypeScript + Vite, vanilla CSS, Python 3 standard library for monitoring, Node test runner via `tsx`, GitHub Actions and GitHub Pages.

**Spec:** `README.md` and the goal in the active conversation: complete items 1–5 (data layer, ingestion/review loop, broader official catalogue, operational UI, and CI/operations).

## Global Constraints

- Official sources first: European Commission DSA pages, DSC pages, EUR-Lex and CURIA; no news-only status changes.
- Every case status change must retain `case_id`, `source_url`, `source_type`, `evidence_snapshot` and `last_verified_at`.
- The bilingual toggle must cover newly added UI, case and calendar content.
- Automatic monitoring may create/update feeds and review queue records, but must not auto-promote an unreviewed item to a verified case status.
- GitHub Pages remains a static deployment; do not add a runtime backend requirement.
- Existing build, test and deploy workflows must remain green.

## Review Focus

- Duplicate official announcements for the same matter → one canonical source key and one review-queue entry.
- A new official update must not overwrite a manually verified case status → ingestion writes `review_queue` and `monitor_runs` only.
- Empty, malformed or unavailable source feeds → monitor run is recorded as failed and the last good feed remains intact.
- Deep links to case details and browser back/forward → hash state opens the right case and clears cleanly.
- CSV/Markdown/JSON/ICS export values with commas, quotes, Unicode or empty deadlines → valid escaped output and stable filenames.

---

### Task 1: Normalized registry and data contracts

**Files:**
- Create: `src/data/registry.ts`
- Create: `scripts/export_registry.ts`
- Create: `public/data/registry.json`
- Modify: `src/data/cases.ts`
- Modify: `src/App.tsx`
- Create: `tests/registry.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces `RegistryPayload`, `loadRegistry()`, `dedupeRegistryCases()` and a generated `public/data/registry.json` containing `enforcement_cases`, `case_events`, `legal_basis`, `entities`, `regulators`, `remedies_measures`, `fines`, `compliance_actions`, `sources`, `review_logs`, `monitor_runs`, `review_queue` and `calendar`.
- The app consumes `RegistryPayload` and falls back to the typed seed only when the registry fetch fails.

- [x] Write failing tests for registry object coverage, case/event foreign-key integrity and duplicate case IDs.
- [x] Run the new registry test and observe the expected module-not-found RED result before implementation.
- [x] Implement the normalized TypeScript contracts and a generator command (`npm run data:export`) that serializes the curated seed into the registry payload.
- [x] Load the registry in the app and preserve the current UI behavior during fetch/fallback.
- [x] Run `npm test`, `npm run build`, `npm run lint` and `npm run data:export`; verify all normalized arrays and foreign keys are present.
- [ ] Commit as `feat: add normalized DSA registry`.

### Task 2: Official ingestion, deduplication and review queue

**Files:**
- Modify: `scripts/check_updates.py`
- Create: `scripts/validate_registry.py`
- Create: `public/data/review_queue.json`
- Create: `public/data/monitor_runs.json`
- Create: `tests/test_monitor.py`
- Modify: `.github/workflows/monitor.yml`

**Interfaces:**
- Produces `normalize_item()`, `item_key()`, `merge_feed()`, `validate_registry_file()` and monitor outputs `updates.json`, `review_queue.json`, `monitor_runs.json`.
- The monitor accepts RSS XML text through a pure function for deterministic tests and only performs network I/O in `main()`.

- [ ] Write failing Python tests for duplicate links, duplicate normalized titles, malformed RSS, empty feeds, review-queue preservation and monitor-run failure records.
- [ ] Run `python -m unittest discover -s tests -p 'test_*.py'` and observe the expected failures.
- [ ] Implement source hashing, stable item keys, bounded retries, atomic JSON writes, review queue append/dedupe and monitor-run records.
- [ ] Add the registry validator to the monitor workflow; make the workflow fail loudly without replacing the last good feed.
- [ ] Run Python tests, `python scripts/validate_registry.py`, `npm test` and `npm run build`.
- [ ] Commit as `feat: add official-source review queue`.

### Task 3: Expand and verify the official case catalogue

**Files:**
- Modify: `src/data/cases.ts`
- Modify: `public/data/updates.json`
- Modify: `README.md`
- Create: `tests/catalogue.test.ts`

**Interfaces:**
- Adds canonical, linked records for AliExpress, Temu, Booking.com, Meta addictive-design proceedings and current VLOP/VLOSE designation changes, without double-counting remedies as new matters.
- Each added record includes bilingual title/summary, category, DSA articles, official URL, source type, evidence snapshot, first/latest date, risk level and owner/next action.

- [ ] Write failing catalogue tests for minimum matter coverage, official-domain URLs, unique `case_id`, linked event dates and at least one decision, proceeding, remedy, RFI and DSC/CURIA record.
- [ ] Run the catalogue test and observe missing records/URLs fail.
- [ ] Add records and events from official Commission/DSC/CURIA sources, preserving canonical case IDs and separating case events from remediation workstreams.
- [ ] Refresh the bilingual update feed with the newest official items and update the data-as-of marker.
- [ ] Run catalogue tests, full tests and build.
- [ ] Commit as `feat: expand official DSA case catalogue`.

### Task 4: Search, case detail workflow and calendar exports

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/data/cases.ts`
- Create: `tests/export.test.ts`

**Interfaces:**
- Adds `searchCases()`, `exportCalendarIcs()`, and shareable `#case/<case_id>` state.
- UI consumes normalized cases and provides search, country/authority/risk/status filters, full case detail view, source/evidence metadata and ICS export.

- [ ] Write failing tests for search across bilingual title/entity, CSV escaping, Markdown/JSON output and valid UTC ICS lines.
- [ ] Run the tests and observe the new behavior fail.
- [ ] Implement the smallest pure export/search helpers, then wire the controls and detail state into the existing dashboard.
- [ ] Validate the flow in a browser: app loads → search/filter → open case detail → back/forward hash → export calendar.
- [ ] Run full tests, build and browser smoke checks with console inspection.
- [ ] Commit as `feat: add DSA search details and calendar export`.

### Task 5: CI, monitoring operations and release documentation

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy.yml`
- Modify: `.github/workflows/monitor.yml`
- Modify: `README.md`
- Create: `docs/data-operations.md`

**Interfaces:**
- CI runs Python validation, Node tests and production build on push and pull request.
- Monitoring runs on schedule and manual dispatch, updates only changed data files, records run metadata and exposes a clear failure signal.
- Pages deployment consumes the exact build artifact produced by CI-compatible commands.

- [ ] Write a validation test/fixture for the monitor workflow’s no-change and failure paths.
- [ ] Run all local checks and inspect workflow YAML with a parser/linter available in the environment.
- [ ] Implement CI, workflow permissions, concurrency, artifact retention, operational docs and a link to the live Pages site.
- [ ] Push to GitHub, verify CI and Pages runs, verify the live URL and confirm the working tree is clean.
- [ ] Commit as `ci: harden DSA tracker operations`.

