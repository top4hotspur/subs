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
- `subs-staff-roles:<industrySlug>`

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
- `subs-staff-rota:<industrySlug>` for working-day and break-window modeling

See:
- `docs/subs-availability-calendar-model.md`

## Current UI usage
- `/admin/settings`: staff role editor + staff editor + availability editor
- `/admin/settings`: staff rota & breaks editor (local mock)
- customer request form: optional preferred-staff selector
- `/admin`: assignment dropdown when staff exists

## Custom role definitions
Each industry can define local role labels (for example Senior Barber, Dispatcher, Colourist) without changing platform enums.
Staff records can also hold `roleLabel` for business-specific naming.

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

