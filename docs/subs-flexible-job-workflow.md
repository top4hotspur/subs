# Subs Flexible Job Workflow (Local Mock)

## Supported industries
- `window-cleaning`
- `cleaners`
- `gardeners`
- `mobile-valeting`

## Shared workflow model
Flexible job industries use the same `CustomerRequest` model as other industries with additional optional fields:
- `frequency`
- `propertyType`
- `accessNotes`
- `preferredVisitWindow`
- `photoNotes`
- `vehicleDetails`

## Request form behavior
- Requires customer name and either email or phone.
- Requires service and address/location.
- Requires preferred date or preferred visit window.
- Frequency options:
  - One-off
  - Weekly
  - Fortnightly
  - Monthly
  - Not sure yet
- Supports optional job context fields (property/vehicle/access/photo notes).

## Admin review behavior
`/admin` shows flexible-job workflow cards with:
- service
- address/location
- frequency
- preferred date/window
- property/vehicle details
- access/photo notes
- assigned staff
- status actions

## Limitations (local mock)
- Browser localStorage only.
- No real photo upload yet (text notes only).
- No backend quote engine, route planning, or scheduling optimization.
- No API/auth/database persistence.

## Future direction
- Add quote versioning and approval flow.
- Add route planning and staff/day capacity checks.
- Add media uploads for job photos.
- Move persistence and workflow orchestration to backend services.
