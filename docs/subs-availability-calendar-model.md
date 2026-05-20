# Subs Availability & Calendar Model

## Purpose
Provide a lightweight, shared availability layer for all industries so future booking-slot logic has structured data.
Current implementation is local browser storage only.

## Core types
Implemented in:
- `src/lib/calendar/calendar-types.ts`

Includes:
- `AvailabilityWindowType`
- `Weekday`
- `BusinessAvailabilityWindow`
- `StaffAvailabilityWindow`
- `ServiceSchedulingRule`
- `StaffBreakWindow` (placeholder for future rota/break logic)
- `StaffRotaDay` (placeholder for future rota/day modeling)
- `CalendarPreviewItem`

## Industry scheduling defaults
Implemented in:
- `src/lib/calendar/industry-calendar-defaults.ts`

Helpers:
- `getDefaultAvailabilityWindowTypeForIndustry`
- `getDefaultSchedulingNoteForIndustry`
- `getDefaultServiceDurationForIndustry`
- `shouldUseFixedSlotsByDefault`
- `shouldUseFlexibleWindowsByDefault`

Patterns:
- Fixed slots: barbers, hairdressers, beauticians, nail-salon, massage, dog-grooming, driving-instructors
- Flexible windows: window-cleaning, cleaners, gardeners, mobile-valeting
- Route-based: taxi

## Local storage keys
Implemented in:
- `src/lib/calendar/local-availability.ts`

Keys:
- `subs-business-availability:<industrySlug>`
- `subs-staff-availability:<industrySlug>`

## Local helper behavior
Functions:
- `listLocalBusinessAvailability`
- `saveLocalBusinessAvailability`
- `seedLocalBusinessAvailability`
- `listLocalStaffAvailability`
- `saveLocalStaffAvailability`
- `seedLocalStaffAvailability`
- `getStaffAvailability`
- `updateStaffAvailability`
- `clearLocalAvailability`

Seeding:
- creates sensible Mon-Sat windows based on industry type
- staff windows mirror business windows when staff exists
- seeding only runs when no data exists

## Admin settings UI
`/admin/settings` includes:
- Availability editor (window CRUD for business/staff)
- Calendar preview (informational summary + mock upcoming items)

## Not implemented yet
- no conflict-checking engine
- no guaranteed slot generation from booking conflicts
- no external calendar sync (Google/Outlook)
- no DB/API persistence
- no real-time dispatch or optimization

## Appointment availability rules (future)
For real appointment booking, slot availability must eventually combine:
- business opening windows
- staff rota/working days
- staff breaks
- service duration and buffers
- existing bookings at the same time
- whether customer staff selection is enabled by admin

Current implementation only offers preferred-slot suggestions and clearly marks that final confirmation comes from the business.

## Future direction
Later backend work can persist availability by site + staff, add conflict checks, and build slot availability and assignment workflows on top of this model.

