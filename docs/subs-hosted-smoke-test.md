# Subs Hosted Smoke Test (Manual)

Run these checks on the hosted environment after deployment.

## Core pages
1. Open `/` and confirm homepage loads.
2. Open `/barbers` and confirm industry page loads.
3. From industry page, click **View demo site** and confirm `/demo/barbers` opens.
4. Click **Customise my demo** and confirm `/demo/barbers/customise` loads.
5. Confirm customiser creates/loads a local named draft and edits appear in preview.
6. Click **Start setup** and confirm `/setup/barbers` loads.
7. Submit setup form (mock) and confirm `/setup/confirmation` loads with request summary.

## Mock portal/admin flows
8. Open `/account` and confirm local setup request appears.
9. Open `/admin` and confirm setup queue and customer request queue render.
10. Open `/admin/settings` and confirm settings page loads.

## Admin local editors
11. In `/admin/settings`, verify services editor can add/edit/remove services locally.
12. Verify staff editor can add/edit/deactivate/reactivate staff locally.
13. Verify availability editor loads and can seed/edit local availability.
14. Verify notification template section loads and previews templates.
15. Return to `/admin` and confirm analytics/financials preview loads.

## UI/readability sanity
16. Confirm no dark/blank CTA buttons with unreadable labels.
17. Check key pages on mobile width for basic responsive layout sanity.

## Notes
- All persistence in this version is browser-local only (localStorage).
- This is a hosted demo/local mock platform foundation, not production persistence.
