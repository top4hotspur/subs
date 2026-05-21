# Subs Taxi Request Workflow (Local Mock)

## Scope
- Industry: `taxi`
- Storage: browser localStorage only
- No backend/auth/API/database/maps/pricing engine/dispatch integration

## Customer request flow
Taxi demo request form now supports:
- Heading: `Request fare or book ride`
- Required: customer name, email or phone, pickup, destination, pickup date, pickup time, journey type
- Optional: return journey + return date/time, passengers, luggage, flight number, child seat notes, accessibility notes, corporate reference, stops, journey notes

## Journey types
- Local taxi/private hire
- Airport transfer
- Corporate/operator booking
- Golf transfer
- Tourist tour
- Event transport
- Other

## Admin queue view
`/admin` shows taxi-specific request details:
- journey type
- pickup and destination
- pickup and return timing
- passenger/luggage details
- flight number
- accessibility and child-seat notes
- corporate reference and stops
- assigned staff/driver and status

## Limitations
- No map autocomplete or route distance pricing
- No live dispatch or driver app
- No real payment/messaging integrations
- No backend-safe concurrency checks
