# Subs Product Flow

## Customer journey
1. Customer lands on an industry page.
2. Customer opens and customises the demo.
3. Customer clicks Start setup.
4. Customer chooses domain and communication options.
5. Customer submits setup request review.
6. Request is saved in browser localStorage (mock only).
7. Customer sees setup confirmation page with status and next steps.
8. Customer can review local request in mock `/account` portal.
9. Admin can review, filter, and progress local queue in mock `/admin` portal.

## Route strategy (v1)
Path-based routes are used in v1:
- `/[industry]`
- `/demo/[industry]`
- `/demo/[industry]/customise`
- `/setup/[industry]`
- `/setup/confirmation`

### Canonical slug list (12)
- `taxi`
- `barbers`
- `hairdressers`
- `beauticians`
- `nail-salon`
- `massage`
- `window-cleaning`
- `dog-grooming`
- `driving-instructors`
- `mobile-valeting`
- `cleaners`
- `gardeners`

All template/pricing/setup data is currently static/mock.

## Pricing model
Single offer (no tiers):
- £149 setup one-off
- £30/month subscription
- £49 domain registration/management one-off (only when requested)
- Optional WhatsApp add-on +£10/month
- Email notifications included

## Setup request statuses (mock flow)
- `DRAFT_DEMO`
- `SETUP_REVIEW_REQUESTED`
- `DOMAIN_DETAILS_REQUIRED`
- `PAYMENT_PENDING`
- `SITE_PROVISIONING`
- `SITE_LIVE`
- `CHANGE_REQUESTED`
- `CANCELLED`

## Future optional subdomain redirects
Possible future redirects:
- `taxi.myexperiment.club` -> `/taxi`
- `barbers.myexperiment.club` -> `/barbers`
- `hairdressers.myexperiment.club` -> `/hairdressers`
- `beauticians.myexperiment.club` -> `/beauticians`
- `nail-salon.myexperiment.club` -> `/nail-salon`
- `massage.myexperiment.club` -> `/massage`
- `window-cleaning.myexperiment.club` -> `/window-cleaning`
- `dog-grooming.myexperiment.club` -> `/dog-grooming`
- `driving-instructors.myexperiment.club` -> `/driving-instructors`
- `mobile-valeting.myexperiment.club` -> `/mobile-valeting`
- `cleaners.myexperiment.club` -> `/cleaners`
- `gardeners.myexperiment.club` -> `/gardeners`

## Future customer portal
`/account` currently reads local mock setup requests only.
Future scope includes billing, payment, support requests, and live status tracking.

## Future admin portal
`/admin` currently reads local mock setup queue, supports local filtering, and local status changes only.
Future scope includes authenticated operations, workflow automation, and live provisioning controls.

## Future individual site functionality
Future booking/job completion idea:
- When a job/booking is completed, the business can click "complete job".
- This closes the booking.
- The system sends the customer an email/message confirming completion.
- Message can say: "This is to confirm completion of your booking. Hope everything went well."
- If the customer has another live booking, include: "See you on [date]."
- If no other live booking exists, include: "Hope to see you again soon" with a link back to the website.
- Include a review request/link.
- Email is standard.
- WhatsApp version only if WhatsApp add-on is enabled.

## Future AWS hosting/provisioning concept
In later phases, configured customer sites will be provisioned to managed AWS hosting.

No AWS resources are created in the current project state.
