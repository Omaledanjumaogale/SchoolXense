# SchoolXense · Convex backend

One deployment, ten domains (`schema.ts`). Every public function is wrapped in `withAccess({ role, tenantArg, adultOnly })` from `lib/access.ts`; money moves only through `lib/ledger.ts#post`, which rejects any transaction whose rows don't sum to zero.

| Demo store (`src/lib/hive/store.svelte.ts`) | Convex function |
| --- | --- |
| `practiceStart / practiceNext / practiceAnswer / practiceFinish` | `practice.start / nextItem / answer / finish` |
| `reviewDue / readiness` | `practice.reviewDue / readiness` |
| `matchOffers / bookingsCreate / bookingsDeliver / bookingsConfirm / bookingsDispute / bookingsHandoff / joinCohort` | `market.match / create / deliver / confirm / openDispute / handoff / joinCohort` |
| `completePayment` (sandbox) | `money.settlePayment` (internal, via `http.ts /payments/settle` from the Queue consumer) |
| `cron()` escrow release | `money.releaseDue` (cron, 15 min) → `money.releaseEscrow` |
| `requestPayout / runPayouts / approvePayout` | `money.requestPayout / runPayouts` (cron 18:00 WAT) `/ approvePayout` (two-person) |
| `studioSubmit / studioReview / royaltiesComputeMonthly / packsSubmit` | `studio.submit / review / computeMonthly` (cron) `/ submitPack` |
| `splitRulesSet / teamsAcceptSplit / contractsBid / milestoneRelease / tasksClaim / threadsSend` | `collab.setSplitRules / acceptSplit / bid / releaseMilestone / claimTask / send` |
| `seatsAssign / hostedExamsSchedule / proctorLog` | `institutions.assignSeat / scheduleExam / logProctor` |
| `integrityResolve / flagsToggle` | `trust.resolveIntegrity / setFlag` |
| `consentDecide / privacyExport / requestRole` | `users.decideConsent / exportMine / requestRole` |

Engines (`src/lib/engines/*`) are imported directly, so grading, IRT, SM-2 and Hive Share math are identical in the browser demo, the tests and production.

Setup: `npx convex dev` → generates `_generated/` → set env vars → `npx convex deploy`.
