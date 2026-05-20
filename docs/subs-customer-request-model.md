# Subs Customer Request Model

## Purpose
Shared enquiry/booking/job model across industries with local mock persistence.

## UI consistency
Customer request status and labels are now centralized:
- `src/lib/ui/display-labels.ts`
- `src/components/requests/request-status-badge.tsx`

Used in account/admin views for consistent status wording and tone rendering.

## Lifecycle notes
Completion still stamps local:
- `completionMessageSentAtIso`
- `reviewRequestSentAtIso`

No real messaging/delivery is implemented.

## Local appointment conflict behavior
- Appointment slot availability checks can use existing browser-local customer requests.
- Slot blocking is staff-specific and industry-specific.
- Requests in `CANCELLED` and `NO_SHOW` are ignored for blocking.
- Tentative and active workflow statuses are treated as blocking in this local mock until released by admin workflow.
- This is not backend-safe concurrency; future production behavior requires server validation + transactional persistence.


## Analytics Relationship
- Customer requests are now also used as a local analytics source for conversion, service demand, and estimated income summaries in /admin
- Request monetary fields (quotedPriceGbp, inalPriceGbp) are preferred when available for estimates

