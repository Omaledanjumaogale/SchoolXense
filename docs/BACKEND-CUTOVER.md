# SchoolXense production backend cutover

Production moved to `https://tacit-snail-617.eu-west-1.convex.cloud`, with HTTP actions at `https://tacit-snail-617.eu-west-1.convex.site`, in `elite-workforce / schoolxense`.

The original backend was exported before cutover with file storage and component data. The recovery ZIP and environment backup are in the ignored local `.backups` directory. They contain private data and credentials and must not be committed. No records were deleted from the original deployment.

The snapshot import completed with 30 records, including Better Auth users, accounts, sessions and signing keys. Existing document IDs and encrypted identity records were preserved, along with their original encryption secret. The new backend mounts Better Auth, Aggregate, Rate Limiter, Migrations and Workflow, including their nested Workpool/Batch Worker components.

Authentication rate limiting uses Better Auth's atomic `consume` interface backed by the Convex Rate Limiter component. The Better Auth minimum version is 1.6.33. Legacy non-atomic get/set calls fail closed. This avoids the old adapter's duplicate `rateLimit` key failure.

Public application defaults, Wrangler production/default environments, the payment consumer production target, GitHub CI public endpoints, local settings, the GitHub production deploy secret and Cloudflare Pages production variables target the new deployment. Production deploy credentials remain server-only.

Payments, payouts and E-WIN synchronization are paused during cutover validation. R2 remains in the existing Cloudflare account; its objects do not require Convex re-import.

Preview production URL guards reject both the previous and new production deployments. Default preview Pages and payment consumer targets fail closed. The new project preview key is configured under `PREVIEW_DEPLOY_KEY`, and the manual `pr-0` preview deployment passed its workflow and rendered discovery checks. See [PREVIEW-KEY-SETUP.md](./PREVIEW-KEY-SETUP.md).

Validation evidence is recorded separately in ignored `.artifacts` files. Successful code deployment and snapshot import do not alone establish OAuth provider acceptance, recovery email delivery or payment acceptance. Those journeys require their own checks.
