# Subs Staff-Assisted Booking (Local Mock)

## Purpose
Allow staff/admin users to create bookings for customers who phone in, without requiring live customer login during the call.

## Current local mock behavior
- Admin page includes a `Staff-assisted booking` panel.
- Scope currently targets appointment-led industries:
  - barbers
  - hairdressers
  - nail-salon
  - beauticians
  - massage
  - dog-grooming
- Staff can select industry, customer details, service, optional staff member, date/time, and notes.
- Submission creates a local customer request in browser storage.

## Local metadata captured
Staff-assisted requests can include:
- `createdByStaff`
- `customerRegistrationRequired`
- `paymentRequired`
- `mockRegistrationPaymentLink`
- `registrationCompletedAtIso` (future local use)
- `paymentCompletedAtIso` (future local use)

## Mock registration/payment handoff
After creation, the UI shows a local success panel with a mock email-style message including a registration/payment link.

Live intent (not implemented):
- customer receives real email
- customer sets password
- customer completes payment
- booking transitions to fully confirmed flow

## Not implemented
- no real auth/identity registration
- no real payment processing
- no real email dispatch
- no server-side verification
