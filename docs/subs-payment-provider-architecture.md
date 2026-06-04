# Subscriber payment provider architecture

Last updated: 2026-06-03

This document covers payment processors used by subscriber businesses to take payments from their own customers. It is separate from MyExperiment.club platform subscription billing.

## Current architecture findings

What exists now:
- Platform subscription checkout uses Stripe Checkout/Billing for MyExperiment.club setup and subscription purchases.
- Platform subscription status is stored on `SetupRequest` and `SubscriptionRecord`.
- Subscriber bookings are stored in `CustomerSiteBooking` with payment fields including `paymentStatus`, `paymentMethod`, `paymentAmountPence`, `paymentCurrency`, `paymentProvider`, `paymentProviderSessionId` and `paymentProviderPaymentIntentId`.
- Subscriber business payment preferences are stored on `CustomerSiteSettings` with setup intent fields: `paymentProcessorSetupMode`, `paymentProcessorName`, `paymentProcessorAccountRef`, `paymentProcessorNotes`, `acceptCashPayments`, `acceptCardPayments`, `requireBookingPrepayment` and `allowInStorePaymentRecording`.
- Public booking uses `getCustomerSiteBookingPaymentDecision()` to block online paid booking when tenant checkout is not connected.
- Staff/business admin can record manual/cash/card-terminal payment status without processing a card online.
- Customer account has a saved payment methods placeholder only.

Safe to reuse:
- Tenant-scoped booking records and payment status fields.
- Tenant-scoped `CustomerSiteSettings` non-secret provider intent/reference fields.
- Existing manual payment recording and payment-status display.
- The public booking guardrail that blocks required online prepayment while no tenant provider checkout is connected.

Must not be reused:
- Platform Stripe subscription credentials must not be treated as a subscriber business payment account.
- `/api/stripe/webhook` should remain the platform subscription webhook unless a deliberate separated tenant-payment Stripe design is implemented.
- Customer card details must never be collected or stored by MyExperiment.club.
- Provider API keys, secret keys, access tokens and webhook secrets must not be entered into plain admin fields or exposed to client-side code.

Current security gaps / risks:
- The old dormant `stripe-booking-checkout` helper is now an explicit deprecated stub. Tenant Stripe booking payments must use `stripe-tenant-checkout.ts`; `/api/stripe/webhook` remains platform subscription-only.
- There is no tenant-scoped secure provider credential model yet.
- There is no encrypted-at-rest secret store or provider OAuth/Connect flow for subscriber payment credentials.
- There is no provider-specific tenant webhook route/idempotency log yet.
- `paymentProcessorAccountRef` and notes are safe only for public/account references, not secrets.

Tenant isolation risks to avoid:
- Never use platform Stripe customer/subscription IDs as tenant customer payment records.
- Never update a booking from a webhook unless the event is signature-verified and maps to both `tenantSiteId` and `bookingId`.
- Never trust unverified metadata alone.
- Never expose one tenant's provider connection/account reference to another tenant or to public visitors.

Missing future models:
- Tenant-scoped payment provider configuration table.
- Secure credential reference table or external secret-store pointer.
- Provider webhook event/idempotency table.
- Provider vaulted customer/payment-method mapping for saved cards.

## Supported integration modes

### 1. Manual / record payments only

Current safe fallback. No online checkout is created. Customers can book when prepayment is not required or when manual/cash/card-terminal handling is allowed. Business/staff admin can record payment status manually.

### 2. Customer pays business directly via connected provider

Future integration mode. The subscriber business connects its own Stripe, Square, PayPal, SumUp/Zettle, Worldpay or other provider account. Customer checkout is created only using that tenant's provider configuration. Provider webhook confirmation updates tenant booking payment state.

This requires secure credential handling or OAuth/Connect, provider signature verification and tenant-specific idempotency.

### 3. Platform-assisted payments / connect model

Future design option. For example, Stripe Connect or another marketplace/connect model where the platform facilitates payments without storing raw card details. This must be intentionally designed before use and should not reuse the current platform subscription billing credentials implicitly.

## Proposed provider configuration model

The OAuth/connect-first foundation now uses a tenant-scoped non-secret connection model:

```prisma
model CustomerSitePaymentProviderConnection {
  id                       String   @id @default(cuid())
  tenantSiteId             String
  provider                 String   // STRIPE, SQUARE, PAYPAL, SUMUP, ZETTLE, WORLDPAY, OTHER
  connectionMode           String   // MANUAL_ONLY, OAUTH_PENDING, OAUTH_CONNECTED, ASSISTED_SETUP, DISCONNECTED
  environment              String   // TEST, LIVE
  providerAccountId        String?
  providerAccountName      String?
  providerAccountEmail     String?
  connectionStatus         String   // NOT_STARTED, PENDING, CONNECTED, NEEDS_ATTENTION, DISCONNECTED
  connectedAt              DateTime?
  disconnectedAt           DateTime?
  lastVerifiedAt           DateTime?
  setupNotes               String?
  publicEnabled            Boolean  @default(false)
  secureSecretRef          String?
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt
}
```

Secrets must not be stored in plaintext. `secureSecretRef` is a placeholder for encrypted credential storage or provider OAuth/Connect storage; no access tokens are written in the current foundation. If the app uses environment variables only, that is acceptable for platform billing but not scalable or safe for many subscriber businesses.

Recommended future secret handling:
- Provider OAuth/Connect where possible.
- KMS/Secrets Manager or equivalent encrypted-at-rest secret store.
- Separate test/live credentials and explicit mode.
- Never expose secret values to browser/client code.
- Never log secrets.
- Rotate/revoke credentials when business access changes.

## Provider-specific admin guidance

Business admin should show provider-specific instructions when the provider changes:
- Stripe: Stripe account ID or Connect account ID, test/live mode later, separate tenant webhook later. Do not enter secret keys.
- Square: merchant/location reference, OAuth/token storage later, Square webhook validation later.
- PayPal: business email or merchant ID, webhook verification later.
- SumUp/Zettle: account reference/email and manual/provider-assisted mode until API support is designed.
- Worldpay/Other: account reference and setup notes; provider-specific hosted checkout/callback validation must be designed before going live.

Warnings:
- If prepayment is required but provider is not connected, customers cannot complete online paid bookings until setup is complete.
- If manual/cash is allowed, customers can still book and payment can be recorded manually where settings allow it.

Current admin UI:
- Stripe shows Stripe-hosted Account Links onboarding when selected.
- If the platform Stripe secret is missing, Stripe Account Links returns a setup-needed message and no fake success.
- Square still has an OAuth-style placeholder route, but Square checkout is not live.
- PayPal, SumUp, Zettle, Worldpay and Other show assisted setup guidance.
- Admin can mark assisted setup pending, which stores non-secret account reference/notes and leaves checkout disabled.

Current route foundation:
- `POST /api/site-admin/[siteSlug]/payments/stripe/connect/start`
- `GET /api/site-admin/[siteSlug]/payments/stripe/connect/callback`
- `POST /api/site-admin/[siteSlug]/payments/square/connect/start`
- `GET /api/site-admin/[siteSlug]/payments/square/connect/callback`

These routes require a signed-in site admin for the matching tenant. Stripe now uses Accounts v2 plus Account Links: the start route creates or reuses a connected account ID (`acct_...`), stores that non-secret account metadata, and redirects the business admin to Stripe-hosted onboarding. The Account Link refresh URL creates a fresh Account Link. The return callback retrieves the connected account from Stripe and updates connection status. Raw access tokens are not requested, stored or exposed client-side.

Required Stripe Connect/tenant payment config:
- `STRIPE_SECRET_KEY` for the MyExperiment.club platform Stripe account.
- `STRIPE_TENANT_WEBHOOK_SECRET` for `/api/sites/payments/stripe/webhook`.
- `NEXT_PUBLIC_SITE_URL` for absolute hosted return URLs where needed.

`STRIPE_CONNECT_CLIENT_ID` is not required for the Account Links path. If the platform Stripe secret is missing, the Stripe onboarding action returns a setup-needed response and leaves the connection pending. If the tenant webhook secret is missing, connected accounts can be recorded but booking checkout remains unavailable so the app does not create payments it cannot verify.

User-facing connection mode labels say `Account Link Pending` and `Account Link Connected`. The internal `OAUTH_PENDING` / `OAUTH_CONNECTED` values are retained for compatibility with existing stored rows and provider-connection guards.

## Booking flow rules

Manual-only:
- Do not create online checkout.
- Booking can be confirmed when prepayment is not required or manual/cash handling is allowed.

Prepayment required but no connected provider:
- Block public booking or show contact-business message.
- Do not create a confirmed unpaid online booking unless a deliberate manual override setting exists.

Provider connected:
- Create a payment session only from that tenant's provider config.
- `paymentStatus=PENDING` until provider webhook confirmation.
- Never mark paid from client redirect alone.
- Store provider session/payment intent IDs on the tenant booking.

Stripe Connect / Account Links v1:
- Uses Stripe Checkout with the tenant connected account ID (`acct_...`) in the Stripe account request context.
- Checkout sessions are created against the connected account rather than by collecting tenant secret keys.
- No application fee is added in this first pass.
- Booking metadata includes `tenantSiteId`, `siteSlug`, `bookingId`, `serviceId`, optional `staffId` and customer email.
- The booking is created as `CONFIRMED` with `paymentStatus=PENDING` to hold the slot while the customer completes checkout.
- If checkout session creation fails, the pending booking is cancelled/marked failed so it does not silently hold the slot.
- If checkout is abandoned after a session is created, the booking remains held only while the Stripe Checkout session is valid. The app stores `paymentProviderCheckoutExpiresAt` where Stripe returns it and uses a 30-minute fallback hold window when expiry is missing. Stripe `checkout.session.expired` marks the booking cancelled/failed, and site admin has a fallback `Cancel expired pending payment` action.

Quote-required service:
- Do not create online payment session.
- Route to quote/contact flow.

## Webhook architecture

Platform and subscriber payment webhooks are separate:
- Current platform subscription webhook: `/api/stripe/webhook`.
- Subscriber Stripe booking webhook: `/api/sites/payments/stripe/webhook`.
- Future subscriber Square webhook: `/api/sites/payments/square/webhook`.
- Similar provider-specific routes for PayPal/Worldpay/etc.

Webhook requirements:
- Verify provider signature before processing.
- Identify provider and environment.
- Map event to `tenantSiteId` and `bookingId`.
- Confirm the booking belongs to the tenant and expected provider session/payment ID.
- Use idempotency/event IDs to prevent duplicate updates.
- Log unknown/unmatched events safely without leaking secrets.
- Update only matching tenant booking/payment state.
- Do not break platform subscription webhook behaviour.

Current route status:
- `POST /api/sites/payments/stripe/webhook` verifies the Stripe signature with `STRIPE_TENANT_WEBHOOK_SECRET`, maps events through snapshot `event.data.object.metadata` to `tenantSiteId` + `bookingId`, checks the booking belongs to that tenant, updates paid/failed state, and ignores duplicate paid updates.
- Stripe dashboard destination required for tenant booking payments:
  - Scope/listen mode: `Connected accounts` / `Events on Connected accounts`, not `Your account`.
  - Event payload style: `snapshot events`, not `thin events`.
  - Endpoint URL: `https://myexperiment.club/api/sites/payments/stripe/webhook`.
  - Required events: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`.
  - Signing secret env var: `STRIPE_TENANT_WEBHOOK_SECRET` from this connected-accounts snapshot destination.
- Thin events are not supported by the current tenant booking handler. Thin event types such as `v1.checkout.session.completed` are rejected with `TENANT_STRIPE_WEBHOOK_THIN_EVENTS_NOT_SUPPORTED` so the platform does not fake successful payment handling without booking metadata.
- `POST /api/sites/payments/square/webhook` remains a `501` verification-required stub.

## Slot blocking and pending payment cleanup

Availability blocks:
- paid/confirmed bookings;
- confirmed manual/cash bookings;
- pending Stripe online-card bookings only while the Checkout session is still valid or within the 30-minute fallback hold window.

Availability does not block:
- `CANCELLED` bookings;
- `FAILED` or refunded payment bookings;
- expired pending Stripe bookings after their hold window.

Site-admin Bookings shows pending Stripe checkout age, expiry where recorded, connected account, session and payment-intent references. The `Cancel expired pending payment` action cancels/releases a pending Stripe booking without marking it paid.

## Refund groundwork

Live automated refunds are not enabled yet. The system stores Stripe session/payment-intent references and connected account ID, but it does not yet store provider refund IDs or a refund idempotency key/table. For now, site-admin shows manual Stripe refund guidance for paid online-card bookings. A future safe refund milestone should create refunds against the correct connected-account/payment-intent context, record provider refund IDs, prevent duplicate refunds, and update booking payment/refund state only after provider success.

## Saved cards future

MyExperiment.club must not store card details. Saved cards can only be provider-backed:
- Provider vaulted customer/payment method ID.
- Tenant/provider customer mapping.
- Customer consent.
- Available only for connected providers that support vaulted payment methods.
- Clear test/live separation.

Customer account should keep the saved-payment-method placeholder until provider-backed vaulting exists.

## FAQ/marketing copy

Suggested copy:

> Can I use my existing payment provider?
>
> In many cases, yes. We can support common providers such as Stripe, Square, PayPal, SumUp/Zettle and other payment platforms depending on your setup. If you already use a provider, let us know during setup and we'll confirm the best way to connect payments to your site. More providers may be available on request.

Also state:
- MyExperiment.club does not store card details.
- Some providers may require additional setup.
- Manual payment recording remains available.

## Current live boundary

Stripe Connect is the first implemented subscriber-provider checkout path. Current live-safe behaviour is:
- Stripe is the only provider that can create subscriber booking Checkout Sessions.
- Square/PayPal/SumUp/Zettle/Worldpay remain assisted setup/manual until their provider-specific OAuth/webhook paths are built.
- Stripe uses Accounts v2 + Account Links, not legacy Connect OAuth client IDs.
- No business-owner secret keys are requested.
- No card details are stored.
- Public booking blocks required online prepayment where Stripe Connect or tenant webhook config is unavailable.
- Manual/cash/card-terminal recording remains the fallback where enabled.

## Platform checkout test separation

`/admin/billing-test` is a platform-admin smoke tool for MyExperiment.club platform Stripe Checkout. It must remain separate from subscriber-business Stripe Connect checkout.

Platform billing test:
- uses the platform `STRIPE_SECRET_KEY` only;
- uses `STRIPE_PLATFORM_TEST_PRICE_ID` when available;
- can look up an active/default price from `STRIPE_PLATFORM_TEST_PRODUCT_ID` as a fallback;
- creates Checkout Sessions without `stripeAccount` / connected-account context;
- returns to `/admin/billing-test` and does not provision tenant sites;
- sets `metadata.paymentPurpose=PLATFORM_BILLING_TEST` so the platform webhook can safely no-op the smoke event.

Subscriber booking checkout remains tenant-scoped:
- `/site-admin/[siteSlug]` Stripe onboarding uses Accounts v2 + Account Links;
- tenant Checkout uses the connected `acct_...` context only after onboarding and tenant webhook config are ready;
- `/api/sites/payments/stripe/webhook` handles tenant booking payment events;
- `/api/stripe/webhook` remains platform setup/subscription billing only.

A Stripe Product ID such as `prod_...` is not a Checkout line item by itself. Hosted smoke tests should prefer `STRIPE_PLATFORM_TEST_PRICE_ID=price_...` and use the product ID only to help find or validate the intended Stripe product.
