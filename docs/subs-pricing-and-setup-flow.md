# Subs Pricing And Setup Flow

## Single-offer pricing model
There are no Starter/Professional/Premium tiers.

One full website offer for all supported industries:
- Website setup fee: £149 one-off
- Monthly website subscription: £30/month
- Domain registration/management: £49 one-off only if requested
- Optional WhatsApp add-on (Twilio): +£10/month
- Email notifications: included

The demo a customer customises is the website they receive.

## Domain options
Customers choose one option during setup:
1. Existing domain (customer updates nameservers/DNS)
2. Customer buys domain and points it to us
3. We register/manage domain (+£49 one-off)

## Communication options
Customers choose one option during setup:
1. Email only (included)
2. Email + WhatsApp (+£10/month)

## Setup journey
1. Customer browses an industry page.
2. Customer views and customises the demo.
3. Customer clicks "Start setup".
4. Customer selects domain option and communication option.
5. Customer reviews pricing summary and setup request.
6. Customer submits "Request setup review" (no live payment in current version).

## Why Stripe is not implemented yet
Stripe is intentionally deferred in this phase to keep scope focused on:
- pricing clarity
- setup capture flow
- industry-specific demo-to-setup journey

## Future workflow
Planned later-phase workflow:
1. Real account creation and authentication.
2. Stripe checkout and subscription setup.
3. Persisted setup requests and provisioning states.
4. Customer portal for billing and support.
5. Admin portal for setup operations and template management.

## Domain and communication wording updates
- Domain options now capture: existing domain, optional planned domain (customer buys), or multi-line domain ideas (we register/manage).
- Communication section is now labelled **Customer communications** with clearer wording: Email only (included) or Email + WhatsApp (+GBP10/month).
- No domain availability checks or real messaging integrations are implemented in this mock flow.

