# Subs Customer Site Provisioning Architecture

Last updated: 2026-05-22

## Purpose

Define the safest v1 architecture for turning MyExperiment.club setup requests into live customer websites, while keeping the product fast to ship and maintainable.

This document is architecture-only. It does not change runtime behavior.

## A/B/C Comparison

### A) Shared app + one central Postgres DB + siteId/tenant routing by domain

One app serves platform pages and customer websites. A central DB stores all site data with strict `siteId` scoping.

Pros:
- Fastest path to market.
- Lowest v1 operating complexity and cost.
- Single deployment pipeline.
- Easy platform-wide admin queue/reporting.
- Clean fit for current local/mock model migrating to persistence.

Cons:
- Requires strict tenant isolation guardrails in every query/write path.
- A bad unscoped query can leak tenant data.

### B) Separate Amplify app/database per customer

Each customer receives dedicated infra and deployment.

Pros:
- Strong infra isolation per customer.
- Lower cross-customer blast radius.

Cons:
- Very high operational overhead for v1.
- Slow onboarding and release management.
- Harder centralized admin and analytics.
- Higher cost at low scale.

### C) Hybrid: central platform + shared tenant sites first, split selected customers later

Start as shared model, keep a future carve-out option for large/regulatory customers.

Pros:
- Same speed/cost benefits as A at launch.
- Keeps strategic flexibility.
- Avoids premature overengineering.

Cons:
- Requires clear data/deployment boundaries for eventual carve-out.

## Recommended v1 Model

Recommended: **C as roadmap, implemented as A now**.

Practical v1 decision:
- Shared MyExperiment.club app.
- One central Postgres database.
- One `tenant_site` (site) record per customer business.
- Custom domain -> site mapping table.
- All operational records scoped by `siteId`.
- No per-customer DB/deployment initially.

## Customer-Site Lifecycle

Suggested lifecycle statuses:
- `SETUP_REQUESTED`
- `PAYMENT_PENDING`
- `DOMAIN_DETAILS_REQUIRED`
- `DOMAIN_PENDING`
- `DNS_INSTRUCTIONS_SENT`
- `SITE_PROVISIONING`
- `SITE_READY`
- `SITE_LIVE`
- `SUSPENDED`
- `CANCELLED`

Notes:
- Status transitions should be event/audit logged.
- `SITE_READY` = provisioned and awaiting final live/domain confirmation.

## Platform Admin Workflow

Platform admin needs:
- Subscribers/sites list.
- Site status.
- Domain status.
- Payment/subscription status.
- WhatsApp add-on status.
- Setup checklist progress.
- Notes/audit history.

Minimum operational actions:
- `Start site setup`
- `Mark DNS instructions sent`
- `Mark site live`
- Add note/event

## Domain Model

Support domain paths:
1. Customer already owns domain and updates DNS/nameservers.
2. Customer buys domain and points it to platform.
3. Platform registers/manages domain.

Model expectations:
- Capture domain suggestions from setup flow.
- Track primary domain per site.
- Track root + `www` handling.
- DNS verification/progress status.
- Domain event history.

Automation path:
- Start manual domain/DNS operations.
- Add Route 53/Amplify automation later.

## Data Model Additions

Recommended additions:
- `tenant_sites` / `sites`
- `site_domains`
- `site_provisioning_tasks`
- `site_status_events`
- `subscriptions` (placeholder)
- `domain_status_events`

Relationship to existing tables:
- `setup_requests` stays intake source.
- `demo_draft_snapshots` stores handoff context.
- `setup_requests` links to eventual `tenant_site` when provisioning starts.

## Website Rendering Model

For customer domain requests:
1. Read incoming host/domain.
2. Lookup active mapping in `site_domains`.
3. Resolve `siteId`.
4. Load site settings/template/data by `siteId`.
5. Render correct industry/customer experience.

If host is unknown:
- Return safe fallback (platform home or controlled not-found).

## Database Strategy

v1 strategy:
- Central DB first.
- Scope all records by `siteId` where applicable.
- Keep repository methods explicit about tenant/site scope.

Recommendation:
- **Central Neon DB is still correct for v1**.
- **Per-customer DB is not recommended in v1**.

When to split later:
- Contractual isolation requirements.
- Compliance/legal constraints.
- Very large tenant scale/performance hotspots.
- Premium dedicated-enterprise tier.

## AWS/Amplify Implications

- Current Amplify-hosted app can stay as central platform host.
- Future custom domains can point to same app if host-to-site routing is implemented.
- Domain attachment/DNS can start manual.
- Automation can be added later without architecture reset.

## First Backend Milestone Impact

Current recommendation remains valid:
- Persist setup requests + demo draft handoff first.
- Keep local fallback during rollout.

Updated near-term schema priority after that:
- Add `tenant_sites`, `site_domains`, and provisioning tables early before broad live-site provisioning logic.

## Recommended Implementation Sequence

1. Create central Neon DB.
2. Apply existing setup request migration(s).
3. Add site/domain/provisioning schema.
4. Persist setup requests in production flow (with local fallback).
5. Add platform admin subscriber/site setup queue.
6. Add `Start site setup` mock action and provisioning checklist workflow.
7. Add domain instruction workflow + DNS status tracking.
8. Add auth/roles for platform admin and business owner.
9. Add domain automation and deeper billing/notification integrations later.

## Risks and Guardrails

Risks:
- Tenant data leakage from missing site scope.
- Over-automation too early.
- Billing/workflow coupling before core provisioning is stable.

Guardrails:
- Require `siteId` scoping in repositories/services.
- Add status/event audit trails.
- Keep setup intake, provisioning orchestration, and live runtime concerns separated.

## Decision Summary

- Correct v1 architecture: shared app + central DB + strict site/tenant scoping.
- Roadmap posture: hybrid (shared first, selective split only when justified).
- Central Neon DB remains the right next step.
- Per-customer DB/deployment should be deferred.
