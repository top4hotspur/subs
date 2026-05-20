# Subs UI Style Notes

## Button contrast fix
Resolved a site-wide CTA contrast issue where dark buttons could appear with unreadable labels in hosted views.

## Shared button style helper
Added:
- `src/lib/ui/button-styles.ts`

Shared classes:
- `primaryButtonClass`
- `secondaryButtonClass`
- `outlineButtonClass`
- `dangerButtonClass`
- `mutedButtonClass`
- `smallButtonClass`

These include focus-visible rings and high-contrast text/background combinations.

## Preferred button hierarchy
- Primary: conversion CTA (`Start setup`, primary submits)
- Secondary: important but non-final actions (`Customise my demo`, quick actions)
- Outline: neutral navigation/actions (`View demo site`, toggles)
- Danger: destructive/local clear/cancel actions

## Contrast rules
- Dark backgrounds must always use explicit `text-white`.
- Avoid pure black buttons unless contrast is verified.
- Never render unlabeled CTA blocks.

## Scope
Applied across main flows:
- industry CTAs
- pricing card CTA
- demo preview/client/customiser/draft picker actions
- request form submit
- setup confirmation CTA group
- setup form submit

Still local/static/mock only.
