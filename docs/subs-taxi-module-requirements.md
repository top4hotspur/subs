# Subs Taxi/Private Hire Module Requirements

## Purpose and constraints
This document defines the taxi/private-hire industry module requirements for the shared MyExperiment.club / Subs platform.

Scope constraints for this phase:
- Shared Subs platform model only (no separate taxi codebase).
- Local/static/mock modelling only.
- No AWS resources.
- No Stripe or other payment integration implementation.
- No real auth implementation.
- No database implementation.
- No API endpoint implementation.

## A) Public customer journey
1. Land on `/taxi` industry page and see taxi/private-hire positioning, operations blueprint summary, and shared offer.
2. Click `View demo site` to preview taxi template behaviour.
3. Click `Customise my demo` to edit a named local draft in browser storage.
4. Click `Start setup` to submit setup requirements for this taxi business using the shared setup flow.
5. Future customer account (shared portal layer) allows tracking quote/booking activity once live systems are added.
6. Future quote/booking request journey starts from taxi site CTA and captures route, timing, passenger, contact, and special requirement details.

## B) Taxi booking/quote types
The taxi module should support these request types as structured options:
1. Local taxi/private hire journey.
2. Airport transfer.
3. Corporate/operator booking.
4. Golf transfer.
5. Tourist tour booking.
6. Event transport.
7. Return journey.
8. Multi-stop journey.
9. Accessibility-aware request (wheelchair/accessibility note).
10. Passenger/luggage-sensitive request.

## C) Quote/request fields
### Core journey fields
1. `journeyType` (local, airport, corporate, golf, tour, event).
2. `pickupAddress`.
3. `destinationAddress`.
4. `pickupDate`.
5. `pickupTime`.
6. `passengerCount`.
7. `contactName`.
8. `contactEmail`.
9. `contactPhone`.

### Conditional/optional fields
1. `returnJourneyRequired` (yes/no).
2. `returnDate`.
3. `returnTime`.
4. `stops` (ordered list for multi-stop).
5. `luggageCount` and/or luggage notes.
6. `flightNumber` (airport journeys).
7. `childSeatRequired` and child-seat notes.
8. `accessibilityNotes` (wheelchair, mobility support).
9. `corporateAccountReference` (for operator/corporate use).
10. `journeyNotes`.

### Workflow fields
1. `quoteStatus` (lifecycle-driven).
2. `paymentStatus` (future support modelled now).
3. `assignedDriverId` (future dispatch layer).
4. `assignedVehicleId` (future dispatch layer).
5. `createdAt` / `updatedAt` timestamps (future persistence model).

## D) Pricing model (design only, no engine implementation yet)
Taxi module should support a configurable pricing strategy model with these options:
1. Manual quote by operator.
2. Distance/time estimate guidance.
3. Airport fixed pricing.
4. Date/time uplift rules.
5. Night uplift rules.
6. Event/day uplift rules.
7. Corporate account pricing overrides.
8. Minimum fare rule.
9. Waiting-time pricing.
10. Extras/surcharge pricing.

Recommended fare breakdown structure for future implementation:
1. Base fare.
2. Distance/time component.
3. Uplift components.
4. Extras/surcharges.
5. Discount/adjustment (if applicable).
6. Quoted total and final total.

## E) Business admin needs
Taxi admin requirements inside shared Subs admin concepts:
1. Quote inbox with filters by status, date, and journey type.
2. Quote status workflow board (`REQUESTED` to `COMPLETED`/`CANCELLED`).
3. Pricing settings management (manual and rules-based modes).
4. Date/time, night, and event uplift configuration.
5. Driver allocation controls and assignment visibility.
6. Customer list and customer journey history.
7. Journey calendar/schedule view.
8. Payment status tracking (future payments capability integration).
9. Income/financial records (quoted vs confirmed vs paid).
10. Analytics for request volume, conversion, and completion.
11. Notification settings by event type.
12. Email messaging as standard.
13. WhatsApp messaging only if optional add-on is enabled.

## F) Customer portal needs
Taxi customer portal requirements (future shared portal extension):
1. View quote requests and status history.
2. Accept or decline quote.
3. Pay for booking if payment capability is enabled later.
4. View upcoming journeys and completed journeys.
5. Request cancellation or change.
6. Message operator about a quote/journey.
7. Set notification preferences (email standard, WhatsApp optional add-on).

## G) Driver/staff layer (future model only)
Future taxi operations layer should include:
1. Driver profiles.
2. Driver documents/compliance tracking.
3. Vehicle details and capacity.
4. Assignment of driver/vehicle to booking.
5. Driver notifications.
6. Driver job status updates.

Not in this phase:
- No driver app implementation.
- No live tracking implementation.
- No compliance automation implementation.

## H) Journey lifecycle
Canonical taxi/private-hire lifecycle for shared model alignment:
1. `DRAFT/REQUESTED`
2. `REVIEWING`
3. `QUOTED`
4. `ACCEPTED`
5. `PAYMENT_PENDING`
6. `CONFIRMED`
7. `DRIVER_ASSIGNED`
8. `IN_PROGRESS`
9. `COMPLETED`
10. `CANCELLED`
11. `NO_SHOW`

Lifecycle intent:
- Early states support quote triage.
- Mid states support customer decision and payment readiness.
- Late states support dispatch execution and completion reporting.

## I) Notifications
Taxi notification events:
1. Quote received.
2. Quote sent.
3. Quote accepted.
4. Booking confirmed.
5. Driver assigned.
6. Journey reminder.
7. Completion and review request.

Notification channel rules:
1. Email channel is standard/included.
2. WhatsApp channel is available only when the +£10/month add-on is enabled in shared setup.

## J) Shared platform vs taxi-specific vs future-only split
### Shared Subs platform concepts
1. Industry landing page, demo preview, customisation flow, setup flow.
2. Shared offer model: £149 setup, £30/month, optional £49 domain registration/management, optional +£10/month WhatsApp add-on.
3. Shared portal pattern (customer and admin layers).
4. Shared operations blueprint rendering and lifecycle display support.
5. Shared notification-channel rule model (email baseline, WhatsApp optional).

### Taxi-specific module concepts
1. Route-based quote/request workflow.
2. Taxi-specific journey types (airport, corporate, golf, tour, event, return, multi-stop).
3. Taxi-specific request fields (pickup/destination/time, flight, luggage, accessibility).
4. Taxi quote-to-booking lifecycle states and dispatch-oriented transitions.
5. Taxi pricing model options (manual quote, fixed airport fare, uplifts, waiting/extras).
6. Taxi admin priorities (quote inbox, driver allocation, journey calendar, income tracking).

### Not-now / future-only concepts
1. Real customer authentication.
2. Real data persistence and audit storage.
3. Real API endpoints and backend job engine.
4. Real payment processing integration.
5. Real mapping/autocomplete and route provider integration.
6. Real driver application and live dispatch telemetry.

## Alignment with existing Subs code
This requirement set maps to:
- Taxi blueprint data in `src/lib/industry/operations-blueprints.ts`.
- Shared blueprint types in `src/lib/industry/operations-types.ts`.
- Industry/setup/demo pages and shared mock portal/admin views already present in Subs.

No code or files are imported from any external taxi project.
