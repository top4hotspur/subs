# Subs Product Flow

## Current v1 flow
1. Industry page -> demo -> customise draft
2. Setup request submission (local)
3. Mock account/admin lifecycle

## UI display consistency layer
Status labels, option labels, tones, and small formatting helpers are centralized in:
- `src/lib/ui/display-labels.ts`

Customer request status badge shared component:
- `src/components/requests/request-status-badge.tsx`

This keeps wording/tone consistent across setup/customer/admin/calendar/notification screens.

## Scope
Local/static/mock only. No backend integrations added.


## Admin Analytics Preview (Local Mock)
- /admin now includes a local analytics and income preview to demonstrate future owner reportingn- Industry filter supports All industries or per-industry dashboard viewsn- This remains informational/local only and does not represent real financial processing


## Customer-facing UI system (v1 polish)
- Public pages now use a neutral tile/card style with dark hero panels, rounded surfaces, and clear CTA hierarchy
- Industry and demo experiences are visually aligned so the demo feels like a real customer website
- This remains a hosted demo/local mock foundation with unchanged backend constraints


## Visual consistency across public journey
- Homepage now matches the modern neutral design system used by industry, demo, and setup pages.
- Public flow remains: homepage -> industry page -> demo/customise -> setup request, with unchanged local/mock behavior.

