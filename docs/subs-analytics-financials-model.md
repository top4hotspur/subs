# Subs Local Analytics & Financials Model

## Purpose
This model provides a browser-only analytics and financial preview for the mock admin portal. It helps demonstrate how the future business owner/admin portal can summarize demand, conversion, workload, and estimated income before real backend integrations are introduced.

## Data Sources (Local/Mock)
- `subs-customer-requests`
- `subs-staff:<industrySlug>`
- `subs-site-settings:<industrySlug>`

The dashboard reads localStorage data only and performs local calculations in the browser.

## Core Metrics
- Total requests
- Confirmed/completed requests
- Cancelled/no-show requests
- Conversion rate percentage (current implementation: `(confirmed + completed) / total`)
- Estimated gross income
- Confirmed income
- Completed income
- Pending/unpaid placeholder

## Income Estimation Logic
Per request, value is calculated using this order:
1. `finalPriceGbp`
2. `quotedPriceGbp`
3. Parsed `£X` from service `priceLabel` when available
4. `0` fallback

This is a demo estimate and is not accounting-grade data.

## Admin UX Integration
- `/admin` includes **Local analytics & income preview** with industry filter (`All` + each supported industry).
- Dashboard shows top services and staff workload summaries.
- `/admin/settings` includes an analytics/financials guidance card and points users to `/admin`.

## Limitations
- No real analytics SDK
- No page-view/session tracking
- No payment reconciliation
- No VAT/tax logic
- No invoice/billing engine
- No database persistence

## Future Migration Direction
Move calculations to backend services and persistent storage:
- Request/job analytics service
- Payment/accounting integration boundaries
- Auth-scoped business data access
- Historical trend reporting and exports

Until then, this remains local/static/mock for product demonstration only.

## Local trend views and CSV export
- Admin analytics now includes local request trend views for the last 7 days and last 30 days using browser-stored request timestamps.
- Daily trend buckets include totals and internal status/service/staff counts for mock reporting purposes.
- CSV export is browser-generated only (no backend): customer requests CSV and setup requests CSV.
- This is not real accounting, tax, payment reconciliation, or audited reporting.

