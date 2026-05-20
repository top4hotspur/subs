# Subs UI Display Helpers

## Purpose
Centralize user-facing labels, tones, and lightweight formatting so status/option wording stays consistent across pages.

## Source
- `src/lib/ui/display-labels.ts`

## Covered helpers
- Domain and communication labels/descriptions
- Customer request kind/status/pricing/location labels
- Staff role/availability/assignment labels
- Availability window and weekday labels
- Notification channel/event/tone labels
- Formatting helpers (`formatGbp`, `formatIsoDateTime`, `formatOptional`)

## Request status badge
- `src/components/requests/request-status-badge.tsx`
- Uses centralized request status label + tone helpers
- Shared across account/admin request cards

## Design rule
Display helpers are presentation-only and should not contain business workflow logic.

## Current scope
Everything remains local/static/mock. No backend/auth/integration behavior is introduced here.

