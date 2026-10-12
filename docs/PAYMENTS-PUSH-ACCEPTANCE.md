# Production gateways and notification acceptance

## Ownership and environments

SchoolXense settles its orders. E-WIN receives verified reporting only. Production uses the tacit-snail-617 Convex deployment. Preview has separate backend, R2 and queue resources; checkout, payout dispatch, refunds, Web Push and ecosystem delivery remain disabled there. Live credentials are server secrets, never committed source or browser configuration.

## Checkout and settlement

The checkout page offers Korapay hosted checkout and Flutterwave v4 bank transfer. Convex obtains the amount from the existing plan/order catalogue, verifies the account, claims initialization atomically and binds an order to one provider. A redirect cannot settle an order. Korapay uses server-secret charge verification. Flutterwave exchanges its client ID/secret for an OAuth token and verifies a v4 charge.

Flutterwave temporary accounts may add a provider fee. The application stores the exact returned transfer total and fee, displays both separately from the plan price, rejects unexpected fee increases above the configured code ceiling, and requires an exact provider receipt amount. The learning/subscription ledger continues to use the plan price. Refunds return the original order amount; provider fees may have separate provider rules.

Callbacks are HMAC verified: Flutterwave signs the raw body with a base64 SHA-256 digest; Korapay signs the JSON data object with a hex SHA-256 digest. The Cloudflare queue independently fetches the transaction, then posts to the authenticated Convex settlement endpoint. Provider namespace, reference, currency and amount checks, plus transaction idempotency, protect settlement. Nonterminal transactions and failed settlement delivery retry; the dead-letter queue captures exhausted deliveries.

Configure the Flutterwave dashboard's webhook URL as `https://schoolxense.ewinproject.org/api/webhooks/flutterwave`, using the configured secret hash. Korapay initialization/payout requests include `https://schoolxense.ewinproject.org/api/webhooks/korapay`; set the same URL as the provider dashboard default. The application does not have a provider-dashboard API that establishes those settings. User/admin receipt verification provides a recovery path if callbacks are missed.

Expired transfer accounts must not be paid or reused. Initialization uncertainty remains visible for reconciliation; the application never starts a different provider checkout on that order. Flutterwave recovery reuses its original provider idempotency key. A new provider reference must not be invented to resolve an uncertain outcome.

## Payouts and refunds

Production payouts use Korapay. Bank onboarding loads supported banks with the public key, resolves the Nigerian account with currency `NGN`, and requires an exact normalized profile-name match. Full account routing is AES-GCM encrypted with an owner-bound additional authenticated value. Public/account queries return masked digits only. Retain the dedicated bank encryption key in recovery storage; replacing it prevents decryption of existing bank routing.

Two different active staff reviewers must approve every payout; neither can be its recipient. Dispatch rechecks approvals and bank ownership and atomically claims the request before contacting the provider. A timeout is held for reconciliation and never automatically resubmitted. The admin console can dispatch approved requests and verify terminal transfer results. Failed, provider-confirmed transfers return held funds once.

Ordinary booking disputes support independent review, approved provider refunds and server-verified refund completion for Korapay, Flutterwave v4 and legacy v3 receipts. Admin reconciliation only fetches an existing refund receipt. It does not submit a second refund. Financial tests use mocked receipts; production transfer/refund completion requires an actual funded transaction.

## Web Push and email

Production VAPID credentials, durable owner-bound device subscriptions and an opt-in interface are configured. Up to five active devices per account are allowed. The subscription endpoint restricts push-provider hosts, rejects cross-account takeover, and supports revocation. The delivery job uses leases, bounded batches, backoff and 404/410 deactivation. Only generic localized reminders appear on the lock screen. Notification clicks open `/notifications`; private details require sign-in. Push-service acceptance does not establish physical display.

Email acceptance IDs are recorded without storing reset/verification links or raw recipient addresses. Resend outcome polling records delivery, delay, bounce, complaint and failure separately. Staff can refresh and view those records in the console. Authentication/recovery emails, account controls, checkout controls, bank onboarding and push reminders have maintained dictionaries for English, Hausa, Igbo, Yoruba, French, Arabic, Portuguese and Swahili. Locale preference is persisted in a cookie and sent to authentication email requests. Arabic controls use RTL. Curriculum, custom admin notes and all dashboard prose are not fully translated; native-speaker review is still needed.

## Live evidence — October 11, 2026

- Owner sign-in and session token succeeded; trusted staff access remained present.
- Flutterwave OAuth and the live customer-list API returned HTTP 200.
- Flutterwave accepted creation of a temporary virtual account. A server-priced annual-plan test order retrieved valid bank instructions and remained pending.
- Korapay balance, bank list, account-resolution contract and payout-history API calls succeeded. Korapay accepted hosted checkout for a server-priced monthly-plan test order; it remained pending.
- No money was transferred or refunded during these checks. Successful financial settlement and payout/refund completion have not been established by those initialization checks.
- Google/GitHub authorization initialization returned HTTP 200 and the production callback URLs. Completion of provider account consent and callback sign-in remains unverified.
- The owner password-recovery request returned HTTP 200. Resend subsequently reported the message as delivered.
- The user confirmed the PWA is already installed. A physical-device offline reopening result and physical push display remain unverified.

See the automated gateway/access tests for tampered signature, gateway mismatch, amount mismatch, duplicate settlement, preview isolation, encrypted bank storage, push ownership and email outcome checks. CI additionally checks frontend/backend types, production build, browser/mobile PWA behavior and dependency vulnerabilities.

## October 12 follow-up

Branding now uses the same descriptive SchoolXense main title as the discovery metadata. The manifest retains its installed application ID and name, adds an E-WIN education description and dashboard/practice/wallet shortcuts. Trusted staff receive a reversible header switch between `/home` and `/ops`; backend admin authorization remains required.

Bundled dashboard translations cover learning, wallet, tutoring, collaboration, institution and admin UI prose in the seven additional supported languages. Translation generation used public UI strings only. Account/user content and provider diagnostics remain verbatim; native-speaker acceptance remains pending. The locale preference is shared across the dashboard and forms, including Arabic RTL.

A signed-in user with an active device subscription can request a rate-limited generic test reminder from Notifications. Queueing is distinct from provider acceptance and physical device display. Preview rejects test delivery.

Fresh financial readiness inspection found no verified payout bank account and zero owner wallet balance. Although the owner authorized a discretionary small test, no funding instrument or eligible recipient was available, so no payment/payout/refund was executed and no artificial funds were created. Independent staff approvals remain required.

Google and GitHub authorization initialization again returned 200 with the production callback URLs. Full interactive consent/callback remains pending. Provider-dashboard inspection was attempted, but browser control timed out before returning account settings. Dashboard webhook settings and physical offline/push outcomes remain unconfirmed.
