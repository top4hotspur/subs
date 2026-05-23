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
  - hourly staffing bars for a selected day
  - 14-day staffing forecast cards
  - long-term day grid toggle with staff counts per day
  - bookings bars for the same preview window

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

## Staffing forecast (local/mock)
Implemented in:
- `src/lib/calendar/staffing-forecast.ts`

Helpers:
- `buildHourlyStaffingForDate`
- `buildStaffingForecast14Days`
- `buildDailyStaffingSummary`
- `countBookingsByDay`

Current behavior:
- uses local business availability as opening-window context
- applies staff rota and break windows
- applies staff holiday and business closure blocking
- outputs local preview counts only (not guaranteed production availability)


## 30-day Calendar Inspection View
- Calendar preview now shows a rolling 30-day grid per industry.
- Each day tile shows UK date, available staff count, and booking/request count.
- Day tiles are clickable and open a detail panel for that date.
- Detail panel includes customer/time/service/status/assigned staff/preferred staff/notes.
- Includes custom date inspection so admins can inspect dates outside the visible 30-day window.
- Navigation supports Previous 30 days, Next 30 days, and Today.
- Booking counts use preferredDate, with createdAtIso date fallback when preferredDate is missing.
- Cancelled and no-show requests are excluded from booking counts, but still visible in day detail.


## Calendar preview UX update (local mock)
- Default calendar summary view is now 7 days (compact).
- 30-day view is hidden by default and can be toggled on demand.
- Navigation supports: Previous 7 days, Next 7 days, Today.
- Both 7-day and 30-day day tiles are clickable.
- Selected day detail includes:
  - staff available count
  - booking/request count
  - closure warning (if present)
  - staff level by hour
  - appointments/bookings by hour
  - request detail list (time, customer, service/type, status, assigned/preferred staff, notes)
- Inspect date input allows detail lookup outside visible windows.

## Booking day availability tiles (local mock)
- src/lib/calendar/booking-day-availability.ts builds the next open booking days for appointment industries.
- It combines business opening windows, rota, closures, holidays, and local request conflicts.
- Fully booked days are marked unavailable and disabled in booking UI.

## Slot interval display rules (local mock)
- appointmentSettings.appointmentSlotIntervalMinutes controls slot display density.
- 60-minute interval: hourly slot buttons.
- 30-minute interval: half-hour slot buttons.
- 15-minute interval: hour-level parent buttons first, then quarter-hour options inside the selected hour.
- Slot interval rendering still respects closures, holidays, and local conflict flags.


## Rota compactness and duration linkage
- Rota editor remains single-staff focused with compact weekday rows and collapsible break editors.
- Service duration/buffer values from business admin are fed into local slot suggestion generation.

