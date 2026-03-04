# Deployment Fixes Plan

This document merges findings from `DEPLOYMENT-ANALYSIS.md` and `DEPLOYMENT-ANALYSIS-codex.md` into a coherent plan to resolve the deployment issues in the `ai-app-so` project.

## 1. Executive Summary of Findings

The deployment failures are categorized into three primary areas:

1.  **Strategic Runtime Mismatch**: Inconsistent configuration between Managed (Work Zone) and Standalone approuters.
2.  **Artifact & Routing Inconsistency**: Mismatch between the namespaced OData routes and the non-namespaced HTML5 ZIP contents.
3.  **Infrastructure & Security Issues**: Critical DB deployer crashes (likely memory/health-check related) and misaligned security role templates.

---

## 2. Comparison of Analysis Documents

| Category            | DEPLOYMENT-ANALYSIS.md                                                    | DEPLOYMENT-ANALYSIS-codex.md                                     | Similarity/Difference                                       |
| :------------------ | :------------------------------------------------------------------------ | :--------------------------------------------------------------- | :---------------------------------------------------------- |
| **OData Routing**   | Identifies mismatch between `/ai-app-so-srv-api/` and `^/odata/v4/`.      | Reinforces the OData path mismatch.                              | **Identical** - High priority.                              |
| **HTML5 Namespace** | ZIP is not namespaced but routes are.                                     | Explains why `Component.js` failed to load in Work Zone.         | **Complementary** - Codex provides deeper "Why".            |
| **DB Deployer**     | Detailed analysis of "Codependent step exited" and memory (128M vs 256M). | Not explicitly detailed in Findings section (briefly mentioned). | **Difference** - Standalone analysis is much stronger here. |
| **Security/Roles**  | Identifies `$XSAPPNAME.Token_Exchange` mismatch.                          | Confirms role template alignment issue.                          | **Identical**.                                              |
| **Backend Crashes** | Notes historical `API_SALES_ORDER_SRV` config missing.                    | Notes historical config issue but confirms it was fixed.         | **Identical context**.                                      |

---

## 3. Coherent Fix Plan

### Phase 1: Infrastructure & DB (Critical)

_Goal: Fix the crashing DB deployer to ensure a stable foundation._

- [ ] **Increase DB Deployer Memory**: Update `mta.yaml` for `ai-app-so-db-deployer` from `128M` to `256M`.
- [ ] **Disable DB Health Checks**: Add `health-check-type: none` and `no-route: true` to the DB deployer in `mta.yaml`.
- [ ] **Clean Build**: Always run `cds build --production` before building the MTAR to ensure fresh HDB artifacts.

### Phase 2: Strategic Routing Alignment

_Goal: Choose a single runtime model to avoid URL resolution failures._

- [ ] **Option Selection**: Align on **Standalone Approuter** as the primary entry point (recommended for this project's current structure).
- [ ] **Fix OData DataSource**:
  - Update `app/salesorders/webapp/manifest.json` to use `/odata/v4/sales-order/` (removing the `-api` prefix) OR
  - Update `app/router/xs-app.json` to handle the `/ai-app-so-srv-api/` prefix.
- [ ] **Align Namespacing**:
  - **EITHER**: Integrate `app/salesorders/scripts/enrich-flp-namespace.js` into the `build:cf` script in `app/salesorders/package.json` to ensure the ZIP matches the `/ai/app/so/salesorders/` route.
  - **OR**: Simplify `app/router/xs-app.json` by removing the namespaced route if standard Work Zone integration is not required.

### Phase 3: Security & Authorization

_Goal: Synchronize MTA and XSUAA descriptors._

- [ ] **Align Role Templates**: Ensure `mta.yaml` role collection references actually exist in `xs-security.json`. Remove `$XSAPPNAME.Token_Exchange` if not defined, or add the template to `xs-security.json`.

### Phase 4: Validation & Testing

_Goal: Verify fixes without relying solely on Work Zone._

- [ ] **Pre-deploy Check Enhancement**: Update `scripts/predeploy-check.js` to validate:
  - DataSource URI prefix vs Approuter routes.
  - ZIP content structure vs configured static routes.
- [ ] **Direct Testing**:
  - Test backend via `/odata/v4/sales-order/SalesOrders`.
  - Test frontend via standalone approuter URL directly.

---

## 4. Required File Changes (Summary)

1.  **[mta.yaml](mta.yaml)**: Update DB deployer parameters and check role references.
2.  **[app/router/xs-app.json](app/router/xs-app.json)**: Align routes with manifest data sources and ZIP layout.
3.  **[app/salesorders/webapp/manifest.json](app/salesorders/webapp/manifest.json)**: Verify and fix OData service URI.
4.  **[xs-security.json](xs-security.json)**: Ensure all referenced roles are defined.
5.  **[app/salesorders/package.json](app/salesorders/package.json)**: Update build script to include namespace enrichment if needed.
