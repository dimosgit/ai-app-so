# Modified Master Plan (Hardened)

## Objective

Deliver a CAP + Fiori app that is not only deployed, but reliably visible and assignable in SAP Build Work Zone on first pass.

## Success Criteria (Definition of Done)

- App is verified locally in FLP sandbox before cloud deployment.
- App runs via AppRouter route.
- App is listed in HTML5 app repo via destination.
- App appears in Work Zone Content Explorer after channel sync.
- App is assigned to site audience and visible to end user in runtime.

## Phase 0 — Preconditions (No Coding Yet)

- Confirm target CF org/space and subaccount.
- Confirm Work Zone model used by tenant:
  - Classic role-based content, or
  - Spaces/Pages model.
- Confirm destination scope expected by Work Zone provider (subaccount-visible).

**Gate 0 (must pass):** documented target site + channel + assignment model.

## Phase 1 — Project and Runtime Skeleton

- CAP service + db + auth baseline.
- AppRouter module included from start.
- HTML5 app-host and app-runtime resources included from start.
- Destination service included from start.

**Gate 1:** `cf services` shows all required instances healthy.

## Phase 1.5 — Local Runtime Validation (Mandatory, No Deploy)

- Start CAP locally with mocks/in-memory.
- Start FE local server and open FLP sandbox URL.
- Validate local runtime contract:
  - OData metadata reachable
  - FLP shell actually renders (renderer init)
  - FE component loads without 404/500
  - `UI.LineItem` present in metadata
  - sample data size is realistic for UX checks

**Gate 1.5 (hard stop):** No `mbt build`/`cf deploy` until all local checks pass.

## Phase 2 — UI Launch Metadata Before First Deploy

- Set app metadata in `manifest.json`:
  - stable app id
  - `sap.cloud.service`
  - `crossNavigation.inbounds` intent
- Do not reference undefined annotation datasources in `manifest.json`.
- Ensure build output is consistent with source metadata.

**Gate 2:** launch intent and metadata validated in built manifest.

## Phase 3 — MTA Content Wiring (Single Shot)

- Use content deployer for html5 artifacts.
- Use destination content module for both:
  - instance destination
  - subaccount destination (for Work Zone provider visibility)
- Keep destination naming deterministic.

**Gate 3:** destination API confirms expected destination fields:

- `sap.cloud.service`
- `app_host_id`
- `content_endpoint`
- correct auth type

## Phase 4 — Deploy and Technical Validation

- Build + deploy once (`mbt build`, `cf deploy -f`).
- Validate:
  - app route alive
  - `cf html5-list -di <destination-instance> -u` contains app

**Gate 4:** technical deploy and html5 listing pass.

## Phase 5 — Work Zone Content Validation (Before Role Assignment)

- Channel Manager sync targeted provider.
- Check sync report specifically for app id.
- Confirm app appears in Content Explorer.

**Gate 5:** app discoverable in Content Explorer.

## Phase 6 — Site Exposure (Model-Specific)

### If classic role-based site

- Add app to role (or catalog/group if tenant requires).
- Assign role in site settings.
- Publish site.

### If spaces/pages site

- Add app tile to page/workpage.
- Assign page/space role.
- Publish site.

**Gate 6:** app visible to target user in runtime (or App Finder + pin path).

## Phase 7 — Stabilization and Cleanup

- Capture runbook with exact commands and screenshots of key settings.
- Remove temporary diagnostics and noisy generated changes from core commits.
- Tag release commit.

## Command Checklist (Operational)

- local CAP + FE run commands
- FLP sandbox URL check
- metadata checks (`UI.LineItem`, service health)
- `cf target`
- `mbt build -p=cf`
- `cf deploy mta_archives/<archive>.mtar -f`
- `cf html5-list -di <destination-service-instance> -u`
- destination API checks for instance/subaccount destinations
- Work Zone channel sync + report check

## Anti-Loop Rules (From Lessons Learned)

- Never deploy to cloud before local FLP runtime is validated.
- Never treat CF deploy success as Work Zone success.
- Never proceed to site role/page assignment before Content Explorer discovery.
- Never debug roles when channel/provider sync does not contain app.
- Do not mix generated artifact churn with semantic infrastructure fixes.

## Suggested Timeline (If Followed from Start)

- Phase 0–1: 1–2 hours
- Phase 1.5: 30–45 minutes
- Phase 2–4: 1 hour
- Phase 5–6: 30–60 minutes
- Phase 7: 30 minutes

Expected first-pass completion: same day with minimal rework.
