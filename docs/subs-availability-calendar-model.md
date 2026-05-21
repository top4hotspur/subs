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
- `StaffBreakWindow`
- `StaffRotaDay`
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
- `src/lib/calendar/local-staff-rota.ts`

Keys:
- `subs-business-availability:<industrySlug>`
- `subs-staff-availability:<industrySlug>`
- `subs-staff-rota:<industrySlug>`
- `subs-business-closures:<industrySlug>`
- `subs-staff-holidays:<industrySlug>`

## Local helper behavior
Availability functions:
- `listLocalBusinessAvailability`
- `saveLocalBusinessAvailability`
- `seedLocalBusinessAvailability`
- `listLocalStaffAvailability`
- `saveLocalStaffAvailability`
- `seedLocalStaffAvailability`
- `getStaffAvailability`
- `updateStaffAvailability`
- `clearLocalAvailability`

Rota functions:
- `listLocalStaffRota`
- `getLocalStaffRotaForStaff`
- `saveLocalStaffRota`
- `updateLocalStaffRotaForStaff`
- `seedLocalStaffRota`
- `clearLocalStaffRota`

Seeding:
- creates sensible Mon-Fri or Tue-Sat defaults based on industry style
- creates per-staff weekday rota rows
- includes a default lunch break on working days
- seeding only runs when no data exists

## Admin settings UI
`/admin/settings` includes:
- Availability editor (window CRUD for business/staff)
- Staff rota & breaks editor (working days + break windows per staff member)
- Holidays and Closures editor (business closed dates + staff holiday dates)
- Calendar preview (informational summary + mock upcoming items)

## Appointment slot usage (current mock)
Preferred slot tiles can use:
- staff rota day windows when a staff member is selected
- break windows to avoid suggesting times inside breaks
- business availability fallback when no staff rota/day window exists
- local request conflict checks to flag already-booked staff slots as unavailable

This is still local/mock preferred-slot behavior only.
Conflict checks are browser-local only and do not provide backend-grade concurrency protection.

## Not implemented yet
- no conflict-checking engine
- no guaranteed slot generation from booking conflicts
- no external calendar sync (Google/Outlook)
- no DB/API persistence
- no real-time dispatch or optimization
- no server-side transaction/locking to prevent double booking across devices

## Appointment availability rules (future)
For real appointment booking, slot availability must eventually combine:
- business opening windows
- staff rota/working days
- staff breaks
- service duration and buffers
- existing bookings at the same time
- whether customer staff selection is enabled by admin

## Future direction
Later backend work can persist availability by site + staff, add conflict checks, and build slot availability and assignment workflows on top of this model.
