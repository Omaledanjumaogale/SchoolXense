# SchoolXense / E-WIN integration contract v1

SchoolXense owns its authentication namespace, learner records, tenant memberships, orders and settlement. E-WIN receives signed verified reporting only, as selected by the owner. Reports cannot credit the central ledger. A verified email is a contact attribute, not a cross-application identity key.

## Identity and tenancy

The stable subject is `schoolxense:<Better Auth user id>`. Linking to an ecosystem identity requires a signed assertion from a separately configured trusted issuer, explicit user consent and proof of both accounts. Email matching alone never links identities. Each tenant must have an approved mapping between the two applications. A role granted in another application never becomes SchoolXense administrator access. SchoolXense evaluates its own active account, role and tenant membership for every operation.

## Payments

SchoolXense creates and owns its orders and integer-kobo prices. Only its verified Flutterwave settlement service may grant payment entitlements. An ecosystem event, URL parameter or other application's payment record cannot mark a SchoolXense order paid. Refunds and transfers require their own provider verification and reconciliation. No shared wallet or automatic cross-application earnings transfer is enabled.

## Data sharing and transport

The outbox contains versioned identity/onboarding, completed-learning, verified-payment and credited-commission reports with an opaque subject. Reports include central referral attribution and integer-kobo strings where applicable. No NIN, passwords, session tokens, question answers, bank details, guardian relationships or contact details are shared. Users may also consent to selected private learning-record imports through the existing E-WIN frame; this keeps the central session on the central origin and never imports cash.

Outbound synchronization is disabled by default. Activation requires an agreed HTTPS `EWIN_SYNC_ENDPOINT`, a signing secret, a receipt contract and an explicit `EWIN_SYNC_ENABLED=true` setting. Requests use `X-SchoolXense-Timestamp`, `X-SchoolXense-Event` and `X-SchoolXense-Signature` headers. The signature is HMAC-SHA256 over `timestamp + "." + exact request body`. Receivers must check a five-minute timestamp window and deduplicate `eventId`; a successful receipt must return `{ "acceptedEventId": "<eventId>" }`. Retries preserve event identifiers. Inbound role, tenancy and financial changes are not supported by this contract.

## Recovery and rollout

The pre-change export is retained locally in `.backups/pre-schoolxense.zip`; all 20 exported legacy application tables were empty. Future migrations act only on SchoolXense users with an `authId`. Before changing this ownership boundary, export again and identify the exact records owned by SchoolXense. The mother application's `schoolcbt` platform ID remains stable while its canonical public name/domain becomes SchoolXense. The signed receiver is `/schoolxense/events`; enable outbound delivery only after the central receiver has deployed and its signed readiness probe passes. Reporting acceptance and actual settled payments are separate checks.
