# Lessons Learned: Why This Took Longer Than Needed

## Scope of Analysis

- Commit window analyzed: `a0f6c32` → `b105212` (17 commits over ~18 hours).
- Main hotspots by repeated edits: `mta.yaml`, `app/salesorders/webapp/manifest.json`, destination content wiring, Work Zone content visibility steps.

## What Actually Slowed Us Down

## 1) Architecture Was Solved Incrementally Instead of Front-Loaded

- We started with working CAP/UI, then added AppRouter + html5 repo + destination content later.
- This created rework in `mta.yaml` across multiple commits (`00e4059`, `fbaf6c7`, `72c36ca`, `5aa7f67`, `b105212`).
- Impact: many build/deploy cycles just to converge infrastructure wiring.

## 2) Visibility Model Mismatch (CF Success != Work Zone Visibility)

- We validated deployment in CF (`cf html5-list`) early, but Work Zone reads from provider/content model and site assignments.
- We chased “missing app” as deployment issue while it was also a content-governance issue (channel scope, site content assignment).
- Impact: successful technical deployments still looked like failures in UX outcome.

## 3) Metadata Gaps in Launch Content

- App visibility depended on launch metadata and intent quality.
- Critical fix arrived late: `crossNavigation.inbounds` correction and deterministic launch metadata handling.
- Impact: repeated sync attempts with no tile despite healthy backend and destination.

## 4) Instance vs Subaccount Destination Scope Confusion

- Instance destinations existed and worked for CLI listing, but Work Zone discovery required subaccount-relevant destination/provider visibility.
- We validated wrong scope first, then corrected.
- Impact: false confidence from successful CLI checks.

## 5) Dist Artifacts in Git Increased Noise

- Frequent commits of `dist/*.zip`, `Component-preload.js`, and lockfile churn inflated diffs and obscured root changes.
- Impact: harder to spot semantic fixes vs generated artifact changes.

## 6) Verification Gates Were Missing at Each Stage

- We had checks, but not a strict gate checklist before progressing.
- Example: no hard gate that app must be discoverable in Work Zone Content Explorer before moving to site role assignment.
- Impact: loops between deployment, destination tweaks, and role/site debugging.

## 7) Local Runtime Gate Was Introduced Too Late

- We focused on CF + Work Zone visibility first, then discovered runtime issues (blank FLP shell, no default columns, small fallback dataset).
- Local FLP sandbox validation would have surfaced these before any deploy/redeploy loops.
- Impact: avoidable cloud cycles and delayed root-cause isolation.

## 8) Metadata/Annotation Contract Was Not Enforced Locally

- Manifest referenced an undefined annotation datasource (`annotations: ["annotation"]`), while FE table behavior relied on annotation metadata.
- Result was unstable/default column behavior in local FE runtime.
- Impact: UI looked broken even when services were up.

## What Worked Well

- Rapid commit cadence preserved traceability.
- CF operational checks were strong (`cf services`, service keys, destination API inspection, html5 listing).
- Once metadata + scope were corrected, visibility was achieved quickly.

## Root Cause Summary

- Primary root cause: end-to-end visibility requirements were split across three systems (CF deploy, destination scope, Work Zone content/site model), but handled sequentially and partially verified.
- Secondary root cause: generated artifact churn and late metadata correction masked the true blockers.

## Process Fixes (Actionable)

- Freeze an “E2E visibility contract” before first deploy:
  - Launch intent metadata
  - Destination scope (subaccount vs instance)
  - Channel/provider sync target
  - Site assignment model (classic roles vs spaces/pages)
- Enforce gate-based progression:
  1. CF technical deploy gate
  2. Content discovery gate
  3. Site exposure gate
  4. Runtime user gate
- Keep generated UI artifacts out of troubleshooting commits when possible.
- Use a single diagnostics sheet per cycle: command, expected, actual, decision.
- Add a strict local-first gate before any deploy:
  1. CAP OData metadata reachable (`/odata/v4/sales-order/$metadata`)
  2. FLP sandbox renders shell (renderer initialized)
  3. FE component loads from local UI server
  4. `UI.LineItem` present in metadata
  5. list endpoint returns expected sample volume

## Local Validation Contract (New)

- **No deploy allowed** until these local checks pass in one run:
  - `npx cds run --in-memory --with-mocks` starts cleanly
  - `npm --prefix app/salesorders run start` serves FLP sandbox
  - `http://localhost:8080/test/flpSandbox.html?...#SalesOrderReview-display` renders
  - `curl` confirms `UI.LineItem` exists in metadata
  - `curl` confirms non-trivial local dataset (not just 2–3 records)
- Keep this as the first troubleshooting step whenever app appears “frozen”.

## Commit-Pattern Insights

- High-rework files:
  - `mta.yaml` (infrastructure convergence)
  - `app/salesorders/webapp/manifest.json` (launch metadata)
  - destination content blocks (scope corrections)
- Most expensive loop:
  - Build/deploy success + app visible in CLI + still absent in Work Zone tile.

## Preventive Checklist for Next App

- Before first deploy, confirm:
  - App has valid `sap.cloud.service` and launch intent metadata.
  - MTA contains html5 host/runtime, destination service with content module.
  - Destination plan includes subaccount visibility where Work Zone reads.
- Before role/site work, confirm app appears in Work Zone Content Explorer.
- Only then proceed to site assignment and publish.
- Before any cloud deploy, confirm local FLP runtime is healthy and deterministic.
- Do not rely on browser personalization state when validating default columns; validate via metadata (`UI.LineItem`) first.
