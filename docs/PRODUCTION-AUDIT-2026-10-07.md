# SchoolXense production and E-WIN integration audit

Audit date: 7 October 2026. SchoolXense revision: `ccf403cf16f6263509ad3ba28170a7a673a62bbb` (`master`). Mother repository reviewed read-only at revision `9cf0c6718305af6a9828116589acd5ed2b42b64b` (`main`).

## Assessment

SchoolXense has moved substantially beyond its browser-local demo. Better Auth, authenticated Convex operations, server-side subscription entitlements, server-priced orders, protected administration, R2 media routes and a signed E-WIN reporting channel are implemented. It is **not yet ready to enable the full advertised commercial platform**. Several product workflows are partial, and payment/payout acceptance, operational isolation and recovery controls remain incomplete.

The E-WIN mother application is connected at the reporting transport level. Production SchoolXense has `EWIN_SYNC_ENABLED=true`. A fresh signed, non-writing readiness request to the mother endpoint returned HTTP 200, `ready=true`, `reportingOnly=true`, `settlementOwner=schoolxense`. This proves endpoint reachability, shared signing agreement and the receiver's database readiness. It does **not** prove that every queued event has been delivered, that the central console shows all reports, or that accounts share identity or sessions.

Preserve the agreed financial contract: SchoolXense owns order settlement and its ledger. E-WIN receives verified reporting only. A report must never independently credit the central wallet.

## Scope and evidence

Reviewed authentication, role/profile gates, plan catalog and entitlements, Convex schema/components/functions, checkout/ledger/escrow/payouts, practice/AI/content workflows, tutor bundles and ordinary bookings, live dashboard bindings, public catalogues, media/Cloudflare configuration, CI, PWA/SEO sources, and both sides of the E-WIN integration.

Fresh verification:

- Unit suite: **69 tests passed in 5 files**.
- Backend TypeScript check: passed.
- Svelte frontend check: passed with zero errors and zero warnings.
- `npm audit`: **zero known vulnerabilities** at audit time. The earlier seven-vulnerability report is obsolete for this revision.
- Latest production CI run: successful for this revision, including verification, deployment and smoke checks: https://github.com/Omaledanjumaogale/SchoolXense/actions/runs/37669155105.
- Cloudflare Pages preview/production configuration inspected; both have Convex URL variables, document/image R2 bindings and payment queue producers. All four R2 buckets have managed public access disabled.
- Backend configuration inspected without printing secret values: Google/GitHub credential pairs present; E-WIN sync enabled; payments and payouts disabled.
- Fresh signed E-WIN readiness probe: HTTP 200 as described above.
- Public health endpoint: HTTP 200; protected admin health endpoint: HTTP 401 without a session. E-WIN `/connect/schoolcbt` returned HTTP 200 with a CSP explicitly allowing SchoolXense as its frame ancestor and private/no-store caching.

Previously retained evidence from the same deployed revision:

- Live AGNES request at `2026-10-07T18:49:27.751Z`: `agnes-3.0-flash`, one validated Physics/JAMB draft stored unreviewed, 1,807 ms, primary succeeded. A real AI call has been tested; no new billable AI request was made for this audit. Workers AI failover was not exercised by that result.
- Earlier owner sign-in, session and Convex token requests returned HTTP 200; trusted staff role was present. Resend delivery inspection found delivered verification/recovery messages. These are historical checks, not proof that every future message delivers.
- Earlier CI/browser checks included 14 desktop/Pixel 5 tests and live tutor-bundle/admin visual checks.

Limitations: this audit did not simulate a live charge, transfer or refund; complete Google/GitHub provider journeys; conduct a load test or restore exercise; inspect every production record; or certify WAF/queue operational behavior. A fresh owner authentication attempt used a local environment lacking the test password and returned HTTP 400. That attempt is invalid evidence of a credential regression; owner authentication needs a credential-complete retest. No secret, credential, NIN, session token or private record is included here. No production records were deleted, no compensation policy was approved, and no deployment configuration was changed.

## Priority findings

P1 means resolve before enabling the affected paid workflow. P2 means material product/operational work before claiming the complete platform. Findings below are source-confirmed unless explicitly called out as an unverified operational check.

| ID | Priority | Finding and consequence | Evidence | Required completion |
|---|---|---|---|---|
| A01 | P1 | Preview and production Pages environments point to the **same production Convex deployment**. Preview actions can affect live users and data. | `scripts/verify-configuration.mjs`; `.github/workflows/ci.yml`; `wrangler.toml` | Give previews an isolated Convex deployment and separate identity/provider secrets. Verify CI browser mutations cannot write production. |
| A02 | P1 | Ordinary booking creation checks overlap with bundle sessions, but not other ordinary bookings, and accepts an arbitrary future slot without checking offer availability. | `convex/market.ts`, `create` | Validate structured availability and atomically reject all overlapping reservations across both booking systems. |
| A03 | P1 | An ordinary tutor can mark a confirmed booking delivered before its scheduled time; this starts the automatic 48-hour escrow release window. | `convex/market.ts`, `deliver`; `convex/crons.ts` | Enforce session timing and delivery evidence, and test early delivery/automatic release together. |
| A04 | P1 | Ordinary booking handoff omits the receiving tutor's active status, profile, tutor role and paid earning-capability checks used by initial booking creation. | `convex/market.ts`, `handoff` versus `create` | Revalidate the receiving tutor, identity/safeguarding approvals, capacity and current entitlement in the handoff transaction. Add direct mutation regression tests. |
| A05 | P1 | Ordinary disputes can freeze escrow, but a complete staff resolution/refund path is absent. The separate bundle dispute resolver does not resolve ordinary bookings. | `convex/market.ts`, `openDispute`; `convex/trust.ts`; `convex/portal.ts`, ops payload; `src/lib/live/AdminOperations.svelte` | Add audited independent staff decisions, provider refund execution/reconciliation, ledger reversals and user notifications; expose disputes in the console. |
| A06 | P1 | Payout execution builds transfer rows without recipient or bank-routing details. Verified bank-account onboarding is not fully exposed through a durable user workflow. | `convex/money.ts`, `runPayouts`, `requestPayout`; payout-account schema | Implement provider recipient creation/name matching, recipient-bound transfers, transfer verification/failure reconciliation, and sandbox acceptance. Keep payouts disabled. |
| A07 | P1 | Paid usage royalties cannot work as written: `servedPaying` is initialized to zero and never incremented by practice; monthly computation consumes that field. It also uses lifetime counters rather than a closed monthly period. | `convex/practice.ts`, answer statistics; `convex/studio.ts`, `computeMonthly` | Record attributable paid usage by period; close periods exactly once; reconcile royalty metadata and ledger postings; test reruns and late events. |
| A08 | P1 | Tutor bundle capacity counts pending orders without expiry. Abandoned checkouts can keep consuming capacity indefinitely. Available slots are not reserved as a set when selling/allocating six-credit bundles. | `convex/checkout.ts`, plus_tutor branch; `convex/lib/tutorBundle.ts`; `convex/tutorBundles.ts` | Add expiring order holds and a capacity model accounting for unscheduled credits across all allocated bundles. Test two buyers competing for the same six slots. Allocation/scheduling guards prevent some conflicts, but purchase capacity is not a guarantee of six available sessions. |
| A09 | P2 | Library catalogue still reads the demo store and calls `hive.buyPack`. Production demo data is disabled, leaving this route unwired to real packs rather than providing a live marketplace. | `src/routes/(public)/library/+page.svelte`; `src/lib/hive/store.svelte.ts` | Bind catalogue/details/purchases to Convex; use authoritative checkout and receipt-based buyer downloads. Remove obsolete demo purchase calls from production surfaces. |
| A10 | P2 | Pack submission stops at `checking`; the Copyleaks step exists as a comment, without an implemented originality action/callback/publishing lifecycle. File submission uses Convex `_storage` while the requested durable media system is R2. | `convex/studio.ts`, `submitPack`; media routes | Choose the originality service, build durable scan/review/publish/reject/versioning, and align private pack storage/download authorization with R2. |
| A11 | P2 | E-WIN outbox throws on the first failed event. A permanently rejected event can block later batches. Event rows/admin view lack retry count, last failure, backoff and quarantine/replay decisions. | `convex/ecosystem.ts`; `src/lib/live/AdminOperations.svelte` | Add independent per-event retries, failure classification, dead-letter handling, signed replay and reconciliation dashboards. Verify actual receipt IDs for real existing events. |
| A12 | P2 | Account connection is a two-session iframe bridge, not durable identity linking or SSO. The mother receiver maps a referral to its owner; that does not identify the SchoolXense learner as a central member. | School `EwinConnection.svelte`, `referrals.ts`, `ecosystem.ts`; mother `schoolxense.ts`, connect routes | Add a consented, revocable two-account linking contract with immutable IDs. Keep referral attribution separate from subject identity. |
| A13 | P2 | Many route names exist, but share a generic workspace list. Tasks can be claimed without a complete submit/review/reward workflow; contracts have partial bid/split/release functions without complete funding/award/milestone lifecycle; skills/cohorts lack complete operational journeys. | `src/lib/live/LiveWorkspace.svelte`; `convex/collab.ts`; `convex/portal.ts` | Create explicit lifecycle mutations, domain screens and admin queues. A schema or dashboard list is not feature completion. |
| A14 | P2 | Review cards/mastery are returned, but the live review/study-plan screens are largely lists; a complete due-card answer/reschedule and actionable generated-plan workflow is not established. | `LiveWorkspace.svelte`; practice/workspace functions | Wire review actions, due scheduling and plan progress to durable backend state and plan capabilities. |
| A15 | P2 | Admin coverage is incomplete: ordinary disputes/integrity workflows are not fully surfaced; specialized ops routes repeat the same workspace; fixed result limits omit older records. | `portal.workspace` ops; `trust.ts`; `LiveWorkspace.svelte` | Add domain-specific queues, pagination/search/filters, assignees, decision evidence and reconciliation rather than raw lists. |
| A16 | P2 | Health reports primarily credential presence. Email configuration does not prove delivery; payments configuration does not prove settlement; sync enabled does not prove outbox clearance. | `convex/admin.ts`, `health` | Add provider result timestamps, delivery/bounce events, queue lag/failure metrics and last successful reconciliation. Keep safe probes separate from actions that incur costs. |
| A17 | P2 | Migration is defined, but an explicit exported runner, recorded dry run/completion and aggregate backfill are not established. | `convex/components.ts` | Add safe migration orchestration, inspect component progress, and verify existing attempts/identities are covered before claiming historical analytics accuracy. |
| A18 | P2 | Privacy export covers only profile, attempts, payments and certificates. It omits other personal data domains; deletion/retention and NIN key rotation/recovery procedures are incomplete. | `convex/users.ts`, `exportMine`; `convex/identity.ts` | Implement authenticated complete exports and retention/deletion workflows with ledger preservation rules and verified recovery. |
| A19 | P1 before exposure | Realtime room Worker does not verify a participant token: authorization is only a comment, and any matching room path is forwarded to the Durable Object. Incoming updates also lack content/size validation and compaction; memory grows between snapshots. Public deployment of this Worker was not established. | `workers/realtime-rooms/src/index.ts` | Keep it unexposed until Convex mints short-lived participant/room-bound tokens, the Worker verifies them and origins, and message size/rate/schema limits, safe compaction and participant revocation are implemented. Wire an actual client before advertising whiteboard/video collaboration. |
| A20 | P2 | SchoolXense response hooks add several security headers but do not set a CSP; authenticated no-store route matching omits some newer app domains. Worker sources are outside the existing app/backend verification scope. | `src/hooks.server.ts`; `_headers`; `.github/workflows/ci.yml`; live health header inspection | Add/test a provider-compatible CSP and systematic private-route cache policy; include standalone Worker typechecks/tests in CI. Verify static header placement in the Pages output. |

Further hardening: the generic `withAccess().action` helper checks verified identity but does not apply its declared role/tenant/capability constraints. Current actions must perform their own downstream checks; strengthen the helper or make its limits explicit and test every action directly. Privileged MFA, administrator-role revocation/session response, provider-secret rotation and central key rotation are also not established as complete features.

Payout policy/UI mismatch: backend requests at or below ₦500,000 enter `queued` without two staff approvals, while the admin UI describes two independent approvals as required. Choose and enforce one documented policy. Requests can reserve wallet funds while provider execution is disabled; make that operational state clear and provide an audited cancellation/unreserve path.

NIN updates correctly return prior approved NIN verifications to pending (`convex/identity.ts`); this is implemented and should be retained. Self-requested earning roles are currently granted immediately and create pending verification records; role presence alone must never be displayed as professional verification.

## Implemented versus remaining

| Domain | Implemented | Remaining / verification needed |
|---|---|---|
| Authentication | Better Auth/Convex adapter; verified email requirement; reset-password with session revocation; session/token handling; conditional Google/GitHub providers | Complete live provider journeys and credential-complete owner retest; delivery webhooks/retries; privileged MFA and support recovery policy |
| Roles and access | Trusted backend roles; active-account/profile checks; adult and tenant checks; owner nomination; staff bypass; protected admin header/console | Direct coverage of every action and ordinary marketplace transition; lifecycle for role suspension/revocation; granular staff permissions |
| Signup/profile | NIN, state/LGA, WhatsApp fields; validated residence; encrypted private NIN; profile updates; password visibility controls | Provider identity verification beyond manual review; retention/key rotation/recovery; complete privacy workflow |
| Paid entitlement | Plan-catalog capabilities; start/expiry/status checks; successful fulfilled payment ownership/amount/currency checks; renewal checkout/cancellation handling | Payment sandbox/live acceptance; plan transition/overlap policy; actual recurring billing if advertised. Cancellation handling alone is not automatic recurring billing |
| Practice/AI | Reviewed-question practice, persisted attempts/mastery, free daily limit; authenticated/rate-limited validated AGNES drafts; Workers AI fallback code; editorial queue | Load/quality evaluation, failover test, broad subject content coverage, review/study-plan actions, paid royalty attribution |
| Tutor bundle | Six credits; admin policy/roster/allocation; guardian approval; scheduling/cancellation; threads/meeting link; resources/worksheets; reports/feedback/disputes; receipt-backed funding | Compensation intentionally unset; verified real tutor roster/capacity; live meeting provider experience; capacity holds and paid acceptance. Supplied meeting URLs do not implement an embedded video service |
| Ordinary tutoring | Offers, booking, guardian consent, checkout, threads, escrow delivery/confirmation/handoff/dispute creation | A02–A05; real meeting/session resources; full cancellation/refund/no-show workflows; user dispute form and accurate ratings input |
| Wallet/payouts | Ledger and escrow infrastructure; wallet history remains available after subscription expiry; payout request/approval primitives | Recipient onboarding, complete transfer/refund reconciliation, approvals threshold aligned with UI, statement exports and acceptance tests |
| Studio/library | Question submission and independent reviews; content validation; pack schema/submission and receipt purchase backend primitives | Royalty fix; originality pipeline; live library bindings; private buyer downloads/version entitlements; funded briefs management |
| Collaboration/tasks | Teams, split acceptance, bids, task claims and participant-checked messages | Contract creation/award/funding; milestones/submission/review/disputes; task creation/proof/approval/reward; full UI and admin controls |
| Institutions | Tenant membership checks; trial institution creation; hosted exam management primitives and UI | Paid seat/licence lifecycle; invitations/rosters; complete candidate delivery/proctoring/results journey; limits/reporting across tenants |
| Administration | Health, enquiries, support/report decisions, content/NIN review, account restrictions, institution trials, payout approvals, tutor bundles, audit/outbox lists | Complete remaining domain queues, receipt reconciliation, pagination, alerts, staff appointment/revocation UI and independent operational evidence |
| Landing/public content | Real photos outside hero, additional sections, example-labelled testimonials, FAQ and persistent enquiry submission | Real consented customer statements; ongoing content/brand sweep including remaining Hive titles; delivery/notification process for enquiries |
| Media | Private R2 buckets; signed authenticated uploads; cached public image route; private document access | Pack buyer grants; orphan cleanup/retention; file-content safety/scanning and operational upload/download coverage |
| SEO/AEO/GEO | Canonical configuration, sitemap/SEO resources and structured content exist | Route-by-route title/canonical/structured-data audit; live catalogue metadata; broken/empty dynamic links; accessibility/performance and search-console validation. Search visibility cannot be guaranteed by metadata alone |
| PWA/mobile | Manifest/icons/service worker/offline page; static caching; dynamic study packs excluded; earlier desktop/mobile checks | Real installation/update/offline-device tests; broader dashboard accessibility/responsiveness. Paid/private offline data requires a separate safe design |
| Cloudflare | Pages project/live domain; per-environment R2/queue declarations; private managed bucket access; successful deployment | Isolated preview Convex; verify consumer/DLQ bindings and secrets, WAF rule effectiveness, queue lag, alerts and backup/restore. Declaration is not operational verification |
| CI/dependencies | Latest CI deploy/smoke green; 69 tests; audit clean; auth replacement completed | Expand tests for above defects and cross-platform events; isolate test data; supply-chain pinning and restore/load drills |

## Convex component assessment

Five root components are mounted in `convex/convex.config.ts`. More packages do not automatically complete missing business workflows.

| Component | Current status | Required configuration/integration |
|---|---|---|
| `@convex-dev/better-auth` | Installed/mounted; actual authentication adapter and token flows implemented | OAuth callback dashboards; complete provider acceptance; lifecycle/recovery hardening |
| `@convex-dev/rate-limiter` | Installed/mounted and used for enquiries, free practice and AI; some named policies are unused | Audit coverage per public/expensive operation; define quotas by actor/tenant; alert on rejection patterns |
| `@convex-dev/aggregate` | Installed/mounted; practice attempt insertion and overview counts wired | Historical backfill, updates/deletes consistency and aggregate reconciliation; paginated admin analytics |
| `@convex-dev/workflow` | Installed/mounted; payment fulfillment workflow implemented | Inspect failed/in-progress instances; define retries/compensation for external steps; operational visibility |
| `@convex-dev/migrations` | Installed/mounted; SchoolXense identity namespace migration defined | Export/configure runner; safe dry run, recovery export and recorded completion |
| `@convex-dev/workpool` | Dependency installed; no independent root mount in this app; Workflow uses Workpool internally | Reuse Workflow first, or mount a dedicated pool when implementing independent outbox/originality workloads. Do not label it a separately completed root integration |
| `@convex-dev/resend` | Not installed | Recommended for durable verification/recovery/notification sending. Wire provider delivery/bounce callbacks and store status; component queueing does not prove inbox receipt |

Recommend **one new component now: Resend**, if its API fits the current auth email hooks. Reuse existing Workflow/Workpool facilities for robust event delivery and originality jobs before adding competing queue abstractions. Official references: [Resend](https://www.convex.dev/components/resend), [Workflow](https://www.convex.dev/components/workflow), [Workflow/Workpool guidance](https://docs.convex.dev/agents/workflows).

Do not install Agent/RAG/Presence/R2/Crons merely to increase the component count. Agent/RAG becomes relevant only for a defined retrieval tutor feature; Presence for actual collaborative rooms; the R2 component only if storage architecture is deliberately moved from the existing Pages binding routes; runtime Crons only if administrators need dynamic schedules. Native Convex crons already exist. Component deployment was exercised by successful CI, but this audit did not inspect every component's production state or migration history.

## E-WIN integration: actual contract and remaining work

Mother repository: https://github.com/Omaledanjumaogale/E_WIN_Project_Ecosystem.git. Public domain: https://ewinproject.org. Registered platform identifier remains **`schoolcbt`**, displayed as SchoolXense; source events use **`schoolxense`**. Preserve that explicit mapping when changing branding.

Implemented on SchoolXense:

1. Namespaced identities `schoolxense:<authId>` and immutable referral attribution.
2. Central referral validation plus local referral handling.
3. Durable event rows for identity creation, attributed onboarding, completed learning, verified payment and credited commission.
4. Five-minute signed HTTP outbox delivery with timestamp/HMAC, timeout and matching receipt ID.
5. Origin/source-checked iframe connection to `/connect/schoolcbt`, central referral lookup and user-consented learning-result import.

Implemented in the reviewed mother source:

1. SchoolXense registry/domain mapping and trusted standalone-origin validation.
2. Signed `/schoolxense/events` receiver, allowed event types/fields, financial field validation and receipt idempotency.
3. `platform_events` storage with `settlementOwner: schoolxense`, `reportingOnly: true`; no wallet credit from these reports.
4. Readiness probe querying the receipt table; live probe passed.
5. Authenticated central record import through the member connection bridge.

Still required for a complete ecosystem:

- Durable two-account identity link, explicit scopes, consent history, revocation and account-deletion behavior. Referral owner identification is not subject identity linking.
- Central admin views for SchoolXense onboarding, usage, order/commission reports and reconciliation. Verify actual existing event-to-receipt-to-dashboard records end to end.
- Reliable outbox retries, poison-event quarantine, replay and metrics; key versioning/rotation and event payload hash checks on duplicate IDs.
- Publish/version the identity, tenant, event schema and financial reporting contracts shared by both repositories, with integration tests and compatibility rules.
- Distinguish authoritative signed learning events from browser-requested private result imports. The latter should remain user-supplied informational records, not trusted financial/certification evidence.
- Decide where central staff may request changes and implement delegated authorization. Central reports currently do not grant SchoolXense staff permissions or paid access.
- Make central endpoint/platform identifiers configurable per environment rather than keeping production URLs in preview code.

No universal sign-in, shared password store, automatic cross-platform paid entitlement, central cash settlement or synchronized balances are established by the current bridge. These require separate contracts and implementation; enabling them accidentally would conflict with the agreed reporting-only settlement model.

## Recommended completion order and acceptance

1. **Protect environments and close financial workflow defects:** separate preview backend; fix booking timing/capacity/handoff/disputes, royalties and payouts; retain disabled commercial gates. Acceptance: direct unauthorized/stale-role tests plus provider sandbox charge/refund/transfer reconciliation and idempotent duplicate callbacks.
2. **Finish advertised paid products:** live library/private buyer resources, originality pipeline, complete tasks/contracts/review/institution lifecycles. Acceptance: user-to-admin-to-ledger journeys work without browser demo state.
3. **Complete ecosystem operations:** consented identity link, reliable signed delivery, central reporting dashboards, reconciliation and shared contract tests. Acceptance: existing real events have matching receipts and central views, and reports never create duplicate credits.
4. **Operational launch readiness:** durable email status, provider OAuth acceptance, component migration/backfill evidence, production backups/restore, queue/WAF/alerts, load/accessibility/PWA/SEO checks. Acceptance: recorded results and recovery procedures rather than configured-only labels.
5. **Tutor launch decision:** an administrator explicitly approves compensation, verified tutors/capacity and provider readiness. Compensation remains unset as instructed; no implied default was introduced by this audit.

Do not delete shared production data or legacy records as a cleanup shortcut. Identify ownership, export recovery data and prove restoration first. Audit findings are recommendations and verified gaps; this report does not claim those fixes were implemented.

## Implementation follow-up

Work on branch `codex/production-workflows` addresses the highest-risk access, marketplace, financial-accounting and synchronization gaps. Preview is fail-closed until `CONVEX_PREVIEW_DEPLOY_KEY` and isolated Cloudflare preview URLs are supplied. Payment, payout, refund and realtime-room activation remain disabled pending provider acceptance and environment configuration.
