# Tutor bundle operations

Plus + Tutor costs ₦25,000 and includes six 45-minute sessions and 90 days of learning access. Its implementation uses authenticated Convex queries and mutations; it does not create sample tutors or successful payments.

An administrator must configure the per-session service budget in the Admin Console and enable allocation. Compensation starts unset, as requested by the owner. A tutor accepts the configured budget by submitting six or more dated slots and capacity against their own tutoring offer. Staff review identity verification and approve the roster. Under-18 allocation additionally requires safeguarding approval. Tutors need their trusted role, complete adult profile and active earning entitlement.

Checkout derives the purchase amount from the plan catalog, validates guardian ownership, checks approved capacity, and records the accepted budget on the payment. Provider settlement reserves six session amounts in escrow; the remainder follows the existing subscription split. The snapshot cannot change with a later policy update. Verified fulfilment creates exactly one bundle and six credits per payment. A payment being accepted, a saved role or a browser URL cannot create session credits.

The learner selects a subject and goal. Staff assign an eligible tutor with matching subject, accepted compensation and available capacity. A linked guardian approves a minor's tutor. Scheduling reserves one credit in a transaction and checks tutor and learner collisions. Regular marketplace bookings also reject overlap with reserved bundle sessions. Participants receive a private thread; all linked guardians are included for a minor. Google Meet and Zoom links are restricted to participants and exposed only during the join window. SchoolXense does not provision video rooms or recordings.

Learners may submit their own drafts. After the session, the assigned tutor records covered material, evidence of progress, next practice and feedback on any submitted draft. Confirmation releases that credit's funded service share using the existing session Hive Share (80% tutor earnings). Staff can resolve a dispute by restoring the original credit or confirming evidenced delivery. Completion and release are idempotent. There is no automatic payment for unused or disputed sessions. Expired bundles and unused held funds require staff support and refund reconciliation; automatic provider refunds are not implemented.

Cancellation at least 24 hours ahead restores the credit. Later changes need staff review. Six original downloadable worksheets and individual progress reports are available in the bundle workspace. Session records, reports, history and funds remain inspectable after expiry; new paid actions and meeting access check current paid entitlements and the settled purchase.

Payment providers remain subject to the existing production activation gate. An enabled bundle policy alone does not activate payment secrets. Existing allocated purchases can continue under their accepted compensation when future sales are paused.

## Live AI evidence

The health endpoint distinguishes configured credentials from the latest actual generation result. A bounded generation saves validated questions as unreviewed and records provider, model, duration, time, stored count and whether the AGNES primary failed. Failure records do not claim healthy provider operation. The Admin Console's live-check button requests one original practice question under the existing authorization and rate limit. Questions require a different reviewer before publication.

`node scripts/verify-live-ai.mjs` deliberately performs one live authenticated request. Supply the owner test password through `SCHOOLXENSE_OWNER_TEST_PASSWORD`, never in tracked files. Sanitized results are written to the ignored `.artifacts/live-ai.json`. This is an explicit acceptance check, not part of CI's unit tests. Provider success today is not a continuous availability guarantee.
