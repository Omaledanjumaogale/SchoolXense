# Production authorization

Better Auth owns authentication and session signing. Verified email alone does not complete application signup: the user must finish age-group, Nigerian state/LGA, WhatsApp and encrypted NIN setup. Account restrictions and profile completeness are checked by the backend before ordinary application operations.

The nominated owner activates the trusted `staff` role after verified sign-in at `/admin-login` and complete adult profile setup. Only backend role records expose and authorize the Admin Console. Once administration is already trusted, staff bypasses plan, ordinary role and learner-profile requirements to prevent administrative lockout. Administrators can finish their profile from Settings. Resource ownership, financial integrity and tenant checks still protect records.

The shared plan catalog supplies server prices, durations and capabilities. Paid access requires an unexpired subscription whose source payment is successful, fulfilled, in the correct currency, at the catalog price, and owned by the recorded payer for the exact beneficiary and plan. A linked, authenticated guardian can purchase for their child; unrelated beneficiaries are rejected. Guardian readiness reports use the child's entitlement. A saved role or tier does not grant paid access. Legacy subscriptions can be linked by the internal `subscriptions:reconcileLegacy` operation only when matching settled payment evidence exists; it does not delete records.

Free practice retains its 20-question daily limit. Personal mocks, review queues, readiness, creator work, AI generation, teaching-offer publishing and new collaboration work require their catalog capabilities. Existing wallet funds, transaction history, communications and fulfilment of already funded work remain accessible after plan expiry. Institution-hosted exams use tenant membership rather than a personal plan.

Same-plan renewal extends the verified purchased period. Changing plans starts the new duration at payment fulfilment. Fulfilment is idempotent. Cancellation marks the plan to end at its existing expiry; resuming removes that preference without creating time or charging a payment. All expiry decisions use the current server time, including during personal mock attempts. A scheduled expiry mutation invalidates live subscriptions at the purchased end time; its expected-date guard prevents an old timer from expiring a renewed plan. These are prepaid plans; no automatic billing is configured.

The tutor bundle is enquiry-only until tutor-session allocation is implemented. Live payments remain disabled until production payment activation is approved and verified; checkout has no simulated success fallback.

`scripts/verify-owner-auth.mjs` verifies sign-in, session retrieval, session token and profile state without printing credentials or tokens. Supply the owner password via `SCHOOLXENSE_OWNER_TEST_PASSWORD`. The optional `--request-recovery` sends an owner-requested recovery email. Resend's delivery events are inspected separately from accepted HTTP requests. A `sent` or accepted response alone is not proof of delivery.

Direct backend tests cover incomplete signup, stale roles, expiry, missing/refunded/wrongly owned payments, catalog capabilities, cancellation/resume, admin-only actions and idempotent payment fulfilment.
