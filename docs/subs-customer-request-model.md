# Subs Customer Request Model

## Purpose
Shared enquiry/booking/job model across industries with local mock persistence.

Appointment-style booking flow currently covers:
- `barbers`
- `hairdressers`
- `nail-salon`
- `beauticians`
- `massage`
- `dog-grooming`

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

## Optional intake details
- `CustomerRequest.extraDetails?: Record<string, string>` is available for lightweight local/mock intake metadata.
- Current use:
  - dog grooming optional pet intake (pet name, breed, dog size, temperament notes).

## Local appointment conflict behavior
- Appointment slot availability checks can use existing browser-local customer requests.
- Slot blocking is staff-specific and industry-specific.
- Requests in `CANCELLED` and `NO_SHOW` are ignored for blocking.
- Tentative and active workflow statuses are treated as blocking in this local mock until released by admin workflow.
- This is not backend-safe concurrency; future production behavior requires server validation + transactional persistence.


## Analytics Relationship
- Customer requests are now also used as a local analytics source for conversion, service demand, and estimated income summaries in /admin
- Request monetary fields (quotedPriceGbp, inalPriceGbp) are preferred when available for estimates

## CRM relationship (local mock)
- `/admin` includes a local CRM panel that can build customer records from browser-local requests.
- Matching uses customer email first, then phone, then name as fallback.
- Booking history is derived from the same local request set.
- This is local-only preview behavior and not production-grade CRM persistence.



## Flexible job fields (local mock)
For window-cleaning, cleaners, gardeners, and mobile-valeting, requests can include:
- frequency
- propertyType
- accessNotes
- preferredVisitWindow
- photoNotes
- vehicleDetails

## Taxi request fields (local mock)
Taxi/private-hire requests can additionally include:
- journeyType
- returnJourneyRequired, returnDate, returnTime
- passengerCount, luggageCount
- flightNumber
- childSeatNotes
- accessibilityNotes
- corporateAccountReference
- stops

