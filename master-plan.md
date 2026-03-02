# Master Plan: Sales Order Attention List on SAP BTP

## Goal (Functional)

- Provide a Work Zone tile that launches an app showing Sales Orders needing attention.
- App has:
  1. List page with columns: Sales Order, Customer (Sold-to), Net Value + Currency, Requested Delivery Date, Reason (tag)
  2. Detail page
  3. Action: “Mark as Needs Review” (+ optional note)
- “Needs Review” must persist (stored in BTP backend persistence) and be visible after refresh.

## Constraints

- Backend: CAP Node.js on Cloud Foundry.
- Frontend: Fiori Elements (OData V4) app consuming the CAP service.
- Data source: read Sales Orders via BTP Destination named: S4_SALESORDER_ODATA.
- Do NOT write back to S/4. Only read from S/4 and write Needs Review into CAP persistence.
- Prefer CLI-driven workflow as much as possible.
- If the S/4 destination call fails at runtime for any reason, implement a fallback so the demo still works (mock/sample data).

## Known Destination

- Destination name: S4_SALESORDER_ODATA
- URL: https://dispatcher.westernacher.com:8090/sap/opu/odata/sap/API_SALES_ORDER_SRV/

## Deployment Deliverables

- Create a GitHub repo and push all code.
- Deploy backend to Cloud Foundry and provide the live route/URL.
- Deploy UI to HTML5 Application Repository and provide the app ID/launch URL.
- Provide info to add the app as a tile to an existing Work Zone site.

## Milestones

- [x] M1 Repo created
- [x] M2 CAP service ready
- [x] M3 UI generated
- [x] M4 Deployed to CF
- [x] M5 Published to HTML5 repo
- [ ] M6 Tile ready in Work Zone

## Technical Context

- CF API: https://api.cf.eu10-004.hana.ondemand.com
- Org: westernacher-global-dev
- Space: Global-Development
- Work Zone Site ID: 7ff32ef3-4720-47b3-b5e2-ecfe912d1eb1
- Persistence: HANA / HDI Container
