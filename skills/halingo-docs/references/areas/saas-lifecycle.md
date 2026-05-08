# SaaS Lifecycle

## What this area covers

How a practice subscribes to Halingo, manages its plan and payment method, gets billed for its subscription, and earns / redeems referral rewards.

## Features in this area

- Subscription management — pick a plan, change plans, cancel, restart.
- Billing — payment-method capture, recurring charge against the practice's card, billing history.
- Payment processor sync — synchronisation of payment events (charge succeeded / failed / refunded, subscription updated) from the integrated processor.
- Referral programme — *aanbrengbonus*: an existing customer earns a free month for each successful referral that converts to a paid subscription.

## Key product behaviors

- A subscription is owned by a **practice**, not by a user. One user may belong to multiple practices, each with its own subscription state.
- Only the praktijkverantwoordelijke (practice owner) can change the plan, change the payment method, or cancel.
- A new practice may have a free trial period; the trial is opened on first practice creation and converts to a paid subscription on first successful charge.
- Failed payments transition the subscription to a dunning state; access is preserved during the grace window, then suspended.
- Each subscription charge produces a Halingo SaaS invoice that the practice owner can download from the billing-history screen.

## Referral programme (aanbrengbonus)

- The referrer (an existing customer) sends a personalised invite link by email from inside Halingo.
- When the recipient accepts and the resulting practice converts to a paid subscription, the referrer's next billing cycle is credited with one free month.
- The referrer can see the status of each invite (sent / accepted / converted / expired) in the referral overview.

## Belgian / regulatory notes

- Halingo invoices its customers under standard Belgian VAT rules for SaaS services to taxable entities; the SaaS invoice carries Halingo's BTW number, not the customer practice's.
- Belgian healthcare providers benefit from the art. 44 VAT exemption on their *clinical* invoices to patients and mutualiteiten — that exemption is unrelated to Halingo's own SaaS billing, which is taxable.

## Cross-references

- Identity — only the practice owner role can manage SaaS billing; permissions are gated accordingly.
- Practice Branding — practice creation and the SaaS subscription are linked: a practice without an active subscription has limited functionality.
- Payment Lifecycle — the same payment processor handles both clinical-invoice payments (where enabled) and SaaS subscription charges.
