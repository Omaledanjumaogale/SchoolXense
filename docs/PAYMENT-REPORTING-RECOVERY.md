# Payment and reporting recovery evidence

## E-WIN reporting

The previous signed mother readiness request returned HTTP 500 because `pastel-lemur-183` was disabled by team free-plan limits. E-WIN now runs on `affable-dragon-883.eu-west-1.convex.cloud`. The new signed readiness endpoint returned HTTP 200 with `ready: true`, `reportingOnly: true` and `settlementOwner: schoolxense`.

The existing real SchoolXense event was replayed twice against the new mother endpoint. Both requests returned HTTP 200 and matching event receipts, verifying duplicate-safe recovery. SchoolXense's endpoint and synchronization flag were updated and delivery ran successfully with zero ready events pending. Recovery artifacts stay in ignored `.backups` and `.artifacts` directories. Signup, access plans and settlement remain independent. Existing outbox backoff/quarantine/replay controls remain in place.

## Payment provider activation

Read-only Flutterwave v3 probes for `/banks/NG` and `/balances` both returned HTTP 401 with `Invalid authorization key`. The configured secret is not a classic v3 `FLWSECK…` credential. This application currently uses v3 hosted checkout. A valid v3 credential or a separately implemented and tested v4 client-credentials integration is required before activation.

Payment and payout activation must cover the Pages checkout/webhook service, Convex settlement/payout actions, and the queue consumer. Provider dashboard webhooks must point to `https://schoolxense.ewinproject.org/api/webhooks/flutterwave`. Preview stays disabled regardless of production activation.

## Payout implementation

Bank onboarding now requires an authenticated, active adult account with completed signup. The provider resolves the selected bank account, the account name must match the profile, and a durable beneficiary is saved with only the account's last four digits. Bank changes are blocked while payouts remain unsettled. Onboarding is rate limited.

Payout requests freeze their beneficiary reference and retain the two-independent-reviewer policy. Dispatch claims each queued payout transactionally before sending its unique reference to Flutterwave. Unconfirmed provider outcomes remain processing for reconciliation rather than being retried as new transfers. The admin console accepts a provider transfer ID and verifies its terminal state, reference, amount and currency before settling. Pending provider transfers do not return wallet funds as failures.

These implementation checks do not establish a successful live charge or transfer. Provider authentication and end-to-end acceptance remain required.
