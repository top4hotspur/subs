# Subs CRM Model (Local Mock)

## Purpose
Provide a browser-local CRM preview for business/admin users without backend dependencies.

## Route
- `/admin/crm`

## Data source
- Customer records are built from browser-local customer requests.
- Requests source key: `subs-customer-requests`
- CRM key: `subs-crm-customers`

## Matching rule
When building/updating customers from requests:
1. Match by email
2. Else match by phone
3. Else match by customer name

## Features
- Customer list with search (name/email/phone)
- Industry filter based on booking/request history
- Most-recent-first ordering by last booking timestamp
- Selected customer history view
- Local notes/tags editing
- Build CRM from local requests
- Clear local CRM (with confirm)
- CSV export:
  - customer list
  - selected customer history

## Storage and scope
- Browser-only localStorage
- No backend, no auth, no multi-user sync
- Data can differ per browser/device/profile

## Future backend/auth requirements
- Tenant-scoped customer table
- Request-to-customer linkage in DB
- Role-based access controls and audit logs
- Server-side CSV/report generation
- Pagination/search endpoints for larger datasets
