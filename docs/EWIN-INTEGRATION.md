# E-WIN reporting integration

SchoolXense and E-WIN remain separate applications. Each application owns its signup, verified identity, session, roles, plans, entitlements, and administrative access. Linking an account never grants a role or paid feature on either application.

SchoolXense owns and settles every SchoolXense order. E-WIN receives signed reporting records for oversight and attribution. A reported payment, commission, or wallet movement must never create an E-WIN ledger entry, balance, withdrawal, or second commission.

## Account linking

1. The signed-in SchoolXense member opens the E-WIN connection frame.
2. E-WIN authenticates the member on `ewinproject.org` and receives the SchoolXense `ecosystemId` through the allowlisted frame protocol.
3. E-WIN stores a one-to-one `platform_account_links` record and returns a five-minute HMAC-SHA256 assertion containing the E-WIN member ID, link ID, referral code, and SchoolXense subject.
4. SchoolXense verifies the assertion with `EWIN_SYNC_SECRET`, binds it to the current SchoolXense session, rejects duplicate ownership, and records the link.

The assertion contains no password, email verification token, session cookie, NIN, bank account, or provider secret. A link can identify reporting records; it cannot authenticate the member into the other application. Linking preserves the original referral attribution; the linked member's own referral code must never replace their referrer's code.

## Reporting outbox

`convex/ecosystem.ts` delivers allowlisted version 1 events to `EWIN_SYNC_ENDPOINT`. Requests use timestamped HMAC signatures and stable event IDs. Failed deliveries use exponential backoff, quarantine after repeated or permanent failures, and can be replayed by audited SchoolXense staff.

Supported reports are identity creation, account linking, central referral attribution, learning completion, aggregate learning performance, verified SchoolXense payments, SchoolXense commissions, and signed SchoolXense wallet movements. Financial amounts are integer kobo strings and remain reporting-only.

Set the same high-entropy `EWIN_SYNC_SECRET` in both Convex deployments. Set `EWIN_SYNC_ENABLED=true` only after the mother endpoint is deployed and the readiness probe succeeds. Preview must use an isolated Convex deployment and separate credentials.

## Operations

SchoolXense staff can inspect and replay failed outbox events from the admin workflow queue. E-WIN administrators can inspect linked accounts, attributed onboarding, learning results, payment reports, and wallet movement at `/admin/schoolxense`.

Before enabling production sync, verify both deployments use the same secret, the SchoolXense endpoint is the E-WIN Convex HTTP action `/schoolxense/events`, the allowed frame origin is `https://schoolxense.ewinproject.org`, and no reporting handler calls the E-WIN ledger.
