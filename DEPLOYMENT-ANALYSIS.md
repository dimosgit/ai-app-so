# SAP BTP Deployment Analysis Report

Date: 2026-03-04  
Project: `ai-app-so`

## Scope

- Analyzed local project configuration and generated deployment artifacts.
- Reviewed existing deploy/runtime logs already stored in the repo (no new deployment executed).
- Cross-checked findings against official SAP CAP/Work Zone documentation.

## Executive Summary

Your deployment setup currently mixes two different runtime models:

1. SAP Build Work Zone managed approuter model.
2. A custom standalone approuter model.

The frontend currently uses URL patterns that fit model (1), while your standalone approuter routes are configured for model (2). This mismatch is a high-probability reason why UI requests fail after deployment.

There is also a packaging/routing inconsistency: your approuter has a namespaced HTML5 route, but the generated HTML5 ZIP does not contain namespaced files.

## Findings (Prioritized)

### 1) Critical: Managed-vs-Standalone routing mismatch

Evidence:

- UI datasource calls destination-prefixed path: [/Users/dimouzunov/Westernacher_Work/12 CoE UX : UI/02 Value Preposition/02 CoE Coding/ai-app-so/app/salesorders/webapp/manifest.json:14](/Users/dimouzunov/Westernacher_Work/12%20CoE%20UX%20:%20UI/02%20Value%20Preposition/02%20CoE%20Coding/ai-app-so/app/salesorders/webapp/manifest.json:14) (`/ai-app-so-srv-api/odata/v4/sales-order/`).
- Standalone approuter OData route expects non-prefixed path: [/Users/dimouzunov/Westernacher_Work/12 CoE UX : UI/02 Value Preposition/02 CoE Coding/ai-app-so/app/router/xs-app.json:6](/Users/dimouzunov/Westernacher_Work/12%20CoE%20UX%20:%20UI/02%20Value%20Preposition/02%20CoE%20Coding/ai-app-so/app/router/xs-app.json:6).

Impact:

- If app is opened via standalone approuter welcome URL, backend calls from UI likely miss matching route.

Inference:

- High confidence for standalone-approuter launch path.
- Medium confidence for Work Zone launch path (depends on whether your tile points to managed runtime only).

### 2) High: Namespaced route exists, but ZIP artifact is not namespaced

Evidence:

- Namespaced route is configured: [/Users/dimouzunov/Westernacher_Work/12 CoE UX : UI/02 Value Preposition/02 CoE Coding/ai-app-so/app/router/xs-app.json:13](/Users/dimouzunov/Westernacher_Work/12%20CoE%20UX%20:%20UI/02%20Value%20Preposition/02%20CoE%20Coding/ai-app-so/app/router/xs-app.json:13).
- Build script does not run namespace enrichment: [/Users/dimouzunov/Westernacher_Work/12 CoE UX : UI/02 Value Preposition/02 CoE Coding/ai-app-so/app/salesorders/package.json:12](/Users/dimouzunov/Westernacher_Work/12%20CoE%20UX%20:%20UI/02%20Value%20Preposition/02%20CoE%20Coding/ai-app-so/app/salesorders/package.json:12).
- Namespace enrichment script exists but is unused: [/Users/dimouzunov/Westernacher_Work/12 CoE UX : UI/02 Value Preposition/02 CoE Coding/ai-app-so/app/salesorders/scripts/enrich-flp-namespace.js:8](/Users/dimouzunov/Westernacher_Work/12%20CoE%20UX%20:%20UI/02%20Value%20Preposition/02%20CoE%20Coding/ai-app-so/app/salesorders/scripts/enrich-flp-namespace.js:8).
- Current ZIP contains only root-level files (`Component.js`, `manifest.json`, `index.html`) and no `ai/app/so/salesorders/*` entries.

Impact:

- Requests routed to `/ai/app/so/salesorders/*` can fail depending on launch/runtime path.

### 3) Medium: Role template reference mismatch

Evidence:

- MTA references `$XSAPPNAME.Token_Exchange`: [/Users/dimouzunov/Westernacher_Work/12 CoE UX : UI/02 Value Preposition/02 CoE Coding/ai-app-so/mta.yaml:135](/Users/dimouzunov/Westernacher_Work/12%20CoE%20UX%20:%20UI/02%20Value%20Preposition/02%20CoE%20Coding/ai-app-so/mta.yaml:135).
- `xs-security.json` defines only `UserRole`: [/Users/dimouzunov/Westernacher_Work/12 CoE UX : UI/02 Value Preposition/02 CoE Coding/ai-app-so/xs-security.json:11](/Users/dimouzunov/Westernacher_Work/12%20CoE%20UX%20:%20UI/02%20Value%20Preposition/02%20CoE%20Coding/ai-app-so/xs-security.json:11).

Impact:

- Possible authorization/role-collection inconsistency during provisioning/assignment.

### 4) Historical but important: backend service crash was previously a blocker

Evidence from stored logs:

- Repeated runtime crash: `Didn't find a configuration for 'cds.requires.API_SALES_ORDER_SRV'` in [/Users/dimouzunov/Westernacher_Work/12 CoE UX : UI/02 Value Preposition/02 CoE Coding/ai-app-so/srv_live.log:64](/Users/dimouzunov/Westernacher_Work/12%20CoE%20UX%20:%20UI/02%20Value%20Preposition/02%20CoE%20Coding/ai-app-so/srv_live.log:64) and [/Users/dimouzunov/Westernacher_Work/12 CoE UX : UI/02 Value Preposition/02 CoE Coding/ai-app-so/srv_idle.log:113](/Users/dimouzunov/Westernacher_Work/12%20CoE%20UX%20:%20UI/02%20Value%20Preposition/02%20CoE%20Coding/ai-app-so/srv_idle.log:113).
- Later deploy log shows service connecting and listening correctly: [/Users/dimouzunov/Westernacher_Work/12 CoE UX : UI/02 Value Preposition/02 CoE Coding/ai-app-so/mta-op-74d15436-1656-11f1-b3c5-eeee0a8dbe08/ai-app-so-srv.log:224](/Users/dimouzunov/Westernacher_Work/12%20CoE%20UX%20:%20UI/02%20Value%20Preposition/02%20CoE%20Coding/ai-app-so/mta-op-74d15436-1656-11f1-b3c5-eeee0a8dbe08/ai-app-so-srv.log:224), [/Users/dimouzunov/Westernacher_Work/12 CoE UX : UI/02 Value Preposition/02 CoE Coding/ai-app-so/mta-op-74d15436-1656-11f1-b3c5-eeee0a8dbe08/ai-app-so-srv.log:230](/Users/dimouzunov/Westernacher_Work/12%20CoE%20UX%20:%20UI/02%20Value%20Preposition/02%20CoE%20Coding/ai-app-so/mta-op-74d15436-1656-11f1-b3c5-eeee0a8dbe08/ai-app-so-srv.log:230).

Impact:

- If this regression returns, frontend appears broken although issue is backend startup.

### 5) Critical: DB Deployer Crashes Repeatedly ("Codependent step exited")

Evidence from BTP Cockpit Application Events (2026-03-04):

- `app.crash` at 09:36:16, 09:36:30, 09:36:43 — three crashes in ~27 seconds.
- All show `Exit description: Codependent step exited`, `Reason: CRASHED`.
- Each crash is on a different instance/cell, confirming CF retried and failed 3 times.

#### What "Codependent step exited" means

Cloud Foundry Diego runs two codependent processes in each container (app process + sidecar). When one exits, the other is killed with this message. For `type: hdb` modules, the deployer is a one-shot process — it runs `@sap/hdi-deploy`, deploys artifacts, and exits. If it exits non-zero (failure), CF retries and eventually gives up. The rapid ~14-second intervals confirm the HDI deploy is failing immediately rather than timing out.

#### Most likely root causes

**A) HANA Cloud instance stopped or HDI container binding broken**

- The MTA resource `ai-app-so-db` requires `service: hana`, `service-plan: hdi-shared`.
- If the HANA Cloud instance is stopped, not provisioned, or `hdi-shared` plan is not entitled, the deployer connects, fails, and exits non-zero.
- Diagnostic: `cf service ai-app-so-db` — status must be `create succeeded`.

**B) Insufficient memory (128M)**

- Current config: `memory: 128M` in `mta.yaml` for `ai-app-so-db-deployer`.
- `@sap/hdi-deploy` v5 + `hdb` v2 + Node.js heap + HANA Cloud TLS handshake can exceed 128M during connection setup.
- An OOM kill by Diego manifests as "Codependent step exited" rather than a clear OOM message.
- Fix: increase to `256M`.

**C) Missing `health-check-type: none`**

- One-shot deployer modules should not be port-health-checked by CF (they exit after deployment).
- `type: hdb` in MTA normally injects this, but some MTA build tool versions don't.
- Without it, CF's port-based health check times out and kills the container.
- Fix: explicitly set `health-check-type: none` and `no-route: true`.

**D) Stale `gen/db` artifacts**

- If `db/schema.cds` was modified after the last `cds build --production`, the generated `.hdbtable`/`.hdbview` files may conflict with what the HDI container already has from a prior (partial) deployment.
- Fix: always run `cds build --production` before `mbt build`.

#### Recommended MTA config for db-deployer

```yaml
- name: ai-app-so-db-deployer
    type: hdb
    path: gen/db
    parameters:
      buildpack: nodejs_buildpack
      memory: 256M
      disk-quota: 256M
      health-check-type: none
      no-route: true
    requires:
      - name: ai-app-so-db
```

#### Diagnostic commands

```bash
# 1. Check HANA service instance health
cf service ai-app-so-db

# 2. Check service keys/bindings
cf service-keys ai-app-so-db

# 3. Read actual deployer logs (the real HDI error)
cf logs ai-app-so-db-deployer --recent

# 4. If logs rotated, restage and watch live
cf logs ai-app-so-db-deployer &
cf restage ai-app-so-db-deployer
```

The output of `cf logs ai-app-so-db-deployer --recent` will contain the `@sap/hdi-deploy` output showing exactly which artifact failed and why (e.g., connection failure, insufficient privilege, SQL error in artifact).

---

## What To Improve (Concrete)

### A) Pick one runtime model and align all paths

Option 1: Work Zone managed approuter only

- Keep destination-prefixed URI in manifest.
- Consider removing standalone approuter dependency from the launch path.

Option 2: Standalone approuter as main entry

- Change UI datasource to `/odata/v4/sales-order/` OR add matching route for `/ai-app-so-srv-api/(.*)`.
- Ensure welcome route and backend route strategy are consistent.

### B) Fix packaging/routing consistency

- Either remove namespaced route if not needed, or include namespaced assets in ZIP by integrating `enrich-flp-namespace.js` into `build:cf`.

### C) Fix security descriptor alignment

- Align `role-template-references` with actual role templates in `xs-security.json`.

### D) Strengthen predeploy checks

Your current smoke check script passes, but it does not validate route-to-datasource consistency or ZIP path expectations: [/Users/dimouzunov/Westernacher_Work/12 CoE UX : UI/02 Value Preposition/02 CoE Coding/ai-app-so/scripts/predeploy-check.js:114](/Users/dimouzunov/Westernacher_Work/12%20CoE%20UX%20:%20UI/02%20Value%20Preposition/02%20CoE%20Coding/ai-app-so/scripts/predeploy-check.js:114).

Add checks for:

- Manifest datasource URI prefix vs approuter route match.
- Presence/absence of `ai/app/so/salesorders/*` in final ZIP based on configured routes.

## Testing Without Work Zone (No Redeploy Required)

### 1) Backend-only verification (no frontend)

- Call service metadata and entity endpoints directly (with auth token):
  - `/odata/v4/sales-order/$metadata`
  - `/odata/v4/sales-order/SalesOrders`
- This isolates CAP/service issues from UI/Work Zone.

### 2) Local FLP sandbox verification (no BTP)

- Use existing script: `npm --prefix app/salesorders run start`.
- Opens local FLP sandbox in `app/salesorders/webapp/test/flpSandbox.html`.

### 3) Hybrid local runtime with real bound services

- Use `cds bind` + `cds watch --profile hybrid` for local runtime against cloud service bindings.

### 4) Direct standalone approuter verification (cloud, but no Work Zone)

- Access app via CF approuter route directly and inspect network requests.
- If this works while Work Zone fails, issue is in Work Zone content/provider setup, not app runtime.

## Official SAP Documentation Used

- CAP Deploy to Cloud Foundry (includes Work Zone deployment section and managed approuter guidance):
  - https://cap.cloud.sap/docs/guides/deployment/to-cf#deploy-to-sap-build-work-zone
- CAP `cds bind` / hybrid local testing:
  - https://cap.cloud.sap/docs/node.js/cds-connect#cds-bind-usage
- CAP local app index / local testing flow:
  - https://cap.cloud.sap/docs/get-started/in-a-nutshell#with-local-cap-server
- SAP Build Work Zone content/task-center guidance (content manager and channel sync context):
  - https://help.sap.com/docs/sap-build-work-zone-standard-edition/sap-build-work-zone-standard-edition/create-task-center-tiles-from-managed-application-routers

## Confidence

- Routing-model mismatch: High
- Namespaced ZIP vs route mismatch: High
- Security role-template mismatch impact: Medium
- Work Zone content-manager-only misconfiguration as sole root cause: Medium
