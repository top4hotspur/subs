# Subs Staff Model

## Purpose
Shared staff/team layer for all 12 industries in local mock mode.

## Core types
- `StaffRoleType`
- `StaffAvailabilityMode`
- `StaffAssignmentMode`
- `StaffMember`

Implemented in:
- `src/lib/staff/staff-types.ts`

## Local storage
- `subs-staff:<industrySlug>`

Helper:
- `src/lib/staff/local-staff.ts`

## Industry defaults
Helper file:
- `src/lib/staff/industry-staff-defaults.ts`

## Services + staff linking
Each staff member stores `serviceIds`, enabling service-to-staff mapping for future slot logic and assignment.

## Availability integration
Availability windows are stored separately and linked by `staffId`:
- `subs-staff-availability:<industrySlug>`

See:
- `docs/subs-availability-calendar-model.md`

## Current UI usage
- `/admin/settings`: staff editor + availability editor
- customer request form: optional preferred-staff selector
- `/admin`: assignment dropdown when staff exists

## Future work
- role-based permissions
- calendar availability engine
- DB/API persistence
- conflict checking and auto-assignment logic

## Appointment staff rules (future)
- Customer can only choose staff when business/admin enables customer staff choice.
- Chosen staff must be working for the selected date/time.
- Chosen staff must not already have another booking at that time.
- Staff rota and break windows must be applied before exposing final available slots.

