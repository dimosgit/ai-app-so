# SAP BTP Deployment Analysis Report (Codex)

Date: 2026-03-04  
Project: `ai-app-so`

## Objective
Identify why frontend behavior fails after deployment to SAP BTP, without running a new deployment, and provide actionable improvements plus non-Work-Zone test options.

## Evidence Base
Analyzed files and logs in this repo:
- `mta.yaml`
- `app/router/xs-app.json`
- `app/salesorders/webapp/manifest.json`
- `app/salesorders/webapp/index.html`
- `app/salesorders/package.json`
- `app/salesorders/scripts/enrich-flp-namespace.js`
- `scripts/predeploy-check.js`
- `xs-security.json`
- `srv_live.log`, `srv_idle.log`
- `mta-op-74d15436-1656-11f1-b3c5-eeee0a8dbe08/*`

## Executive Summary
Your frontend deployment issue is most likely caused by runtime model mismatch and route/artifact inconsistency:
1. UI datasource path is destination-prefixed (`/ai-app-so-srv-api/...`) but standalone approuter route is non-prefixed (`/odata/v4/...`).
2. Approuter has namespaced static route (`/ai/app/so/salesorders/*`) but current HTML5 ZIP has only root-level resources.
3. Security descriptor and MTA role-template reference are not aligned (`Token_Exchange`).

Additionally, earlier deployments show backend crashes due to missing `cds.requires.API_SALES_ORDER_SRV`; later logs show this was fixed in another deployment cycle.

## Findings (Prioritized)

### 1) Critical: OData path mismatch between UI and standalone approuter
- UI datasource: `/ai-app-so-srv-api/odata/v4/sales-order/` in `app/salesorders/webapp/manifest.json`.
- Standalone approuter backend route: `^/odata/v4/sales-order/(.*)$` in `app/router/xs-app.json`.

Why it matters:
- If users launch via your standalone approuter route, requests from UI can miss route matching.

### 2) High: Namespaced HTML5 route exists, but ZIP content is not namespaced
- Route exists in `app/router/xs-app.json`: `^/ai/app/so/salesorders/(.*)$`.
- `build:cf` does not execute namespace enrichment script.
- `salesorders.zip` currently contains only root files (`Component.js`, `manifest.json`, `index.html`, `i18n/*`), not `ai/app/so/salesorders/*` structure.

Why it matters:
- Runtime path and packaged artifact must be consistent; otherwise static resource requests fail depending on launch context.

### 2.1) Direct answer: why `Component.js` was not loading in Work Zone
Most probable chain (based on your repo evidence):
1. Work Zone/Launchpad requested `Component.js` through namespaced path (`/ai/app/so/salesorders/Component.js`) as noted in `lessons-learned.md`.
2. At that stage, approuter pathing was not fully aligned for that request pattern, so request resolution failed (`404` case documented in `lessons-learned.md`).
3. In the current state, namespaced route exists, but packaged HTML5 content is still root-only; this can keep static loading fragile depending on whether runtime resolves app content by namespaced path or root path.

What this means:
- The failure was not that `Component.js` code itself is invalid.
- The failure was primarily URL/path resolution (route + artifact layout + runtime model alignment).

### 3) Medium: Role template mismatch in auth config
- `mta.yaml` references `$XSAPPNAME.Token_Exchange` in role collection.
- `xs-security.json` defines only `UserRole`; no `Token_Exchange` role-template is present.

Why it matters:
- Can lead to inconsistent authorization setup and role assignment behavior.

### 4) Historical blocker observed in stored logs
- Earlier logs repeatedly show:
  - `Didn't find a configuration for 'cds.requires.API_SALES_ORDER_SRV'`
- Later operation logs show service starts correctly and connects to `API_SALES_ORDER_SRV`.

Why it matters:
- Frontend appears broken when backend has startup/config regressions.

## What Should Be Improved

### A) Choose one runtime strategy and align all paths
Option 1: Managed approuter (Work Zone-centric)
- Keep destination-prefixed datasource path in `manifest.json`.
- Avoid relying on standalone approuter as primary launch path.

Option 2: Standalone approuter-centric
- Either change datasource URI to `/odata/v4/sales-order/`, or add explicit approuter route for `/ai-app-so-srv-api/(.*)` to backend destination.

### B) Make packaging consistent with routes
- If keeping `/ai/app/so/salesorders/*` route, include namespaced files in final ZIP by integrating namespace script into `build:cf`.
- If not needed, simplify routes to match actual artifact layout.

### C) Align security artifacts
- Ensure role-template names in `mta.yaml` match those defined in `xs-security.json`.

### D) Extend predeploy validation
Current `scripts/predeploy-check.js` is good, but add checks for:
- Datasource URI prefix vs approuter route compatibility.
- Expected ZIP layout (root-only vs namespaced) based on route strategy.

## How You Can Test Without Work Zone

### 1) Backend-only
- Validate CAP service endpoints directly:
  - `/odata/v4/sales-order/$metadata`
  - `/odata/v4/sales-order/SalesOrders`

### 2) Local FLP sandbox
- Run `npm --prefix app/salesorders run start`.
- Use local sandbox (`webapp/test/flpSandbox.html`) to validate FE behavior independent of Work Zone.

### 3) Local-hybrid with real bindings
- Use `cds bind` + `cds watch --profile hybrid` for local runtime with cloud service bindings.

### 4) Direct CF approuter runtime (no Work Zone)
- Open standalone approuter route directly and inspect network calls.
- If direct approuter works but Work Zone fails, issue is likely Work Zone content/provider configuration.

## Official SAP Documentation
- CAP deploy to Cloud Foundry (incl. Work Zone section):
  - https://cap.cloud.sap/docs/guides/deployment/to-cf#deploy-to-sap-build-work-zone
- CAP `cds bind` and hybrid testing:
  - https://cap.cloud.sap/docs/node.js/cds-connect#cds-bind-usage
- CAP local run/get-started:
  - https://cap.cloud.sap/docs/get-started/in-a-nutshell#with-local-cap-server
- SAP Build Work Zone (managed approuter content/task-center context):
  - https://help.sap.com/docs/sap-build-work-zone-standard-edition/sap-build-work-zone-standard-edition/create-task-center-tiles-from-managed-application-routers

## Confidence
- Runtime-model/path mismatch: High
- Route vs artifact mismatch: High
- Security-template mismatch impact: Medium
- Work Zone-only misconfiguration as sole cause: Medium
