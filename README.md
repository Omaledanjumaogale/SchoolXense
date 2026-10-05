# SchoolXense

SchoolXense is the education application at https://schoolxense.ewinproject.org, part of the E-WIN Project ecosystem. This repository replaces the former SchoolCBT implementation while preserving its Git history. Local legacy source and recovery exports remain outside the published application.

## Stack and live data

SvelteKit 2 / Svelte 5, Convex subscriptions and server-enforced access, Convex Better Auth, Cloudflare Pages, private R2 media storage and queue consumers. Production does not use browser persona selection or localStorage as its database. Demo persistence is available only with an explicit PUBLIC_DEMO_MODE=true setting.

## Development and checks

Use Node 22. Run `npm ci`, `npm run dev`. Run `npm run check`, `npm run check:backend`, `npm test`, `npm audit --audit-level=low`, `npm run build`, then `npm run test:e2e`. The browser suite covers desktop Chromium and Pixel 5. `.npmrc` preserves the dependency installation mode used by the lockfile.

Copy `.env.example` to ignored `.env.local`. Never commit credentials, export files, or legacy application archives. Public Convex URLs are not deployment secrets. GitHub CI runs checks before its protected production deployment job; the repository default branch is master, and the Pages production branch label is main.

## Identity and administration

Better Auth handles verified email, recovery, Google/GitHub callbacks and sessions. The nominated owner must finish verification and password setup, sign in at `/admin-login`, complete adult profile setup and activate administrator access. Staff visibility derives from trusted backend roles. The verified owner can appoint independent adult staff; appointments and review decisions are audited.

Signup and profile forms collect state/FCT, dependent LGA, WhatsApp and NIN. NIN is AES-GCM encrypted in a private table using a stable 32-byte hex NIN_ENCRYPTION_KEY configured in Convex; profiles and admin lists receive only its last four digits. Entering a NIN does not verify it. The residence dataset contains 37 state/FCT entries and 774 LGAs, with attribution in docs/DATA-ATTRIBUTION.md.

The admin console includes enquiries, support and safety review, identity verification, content decisions, account controls, institution trial onboarding, independent payout approvals, audit records and ecosystem event receipts. `/api/admin/health` requires a staff session and reports database access and provider configuration without revealing credentials or sending billable probes.

## Payments and AI

Orders derive authoritative integer-kobo prices on the server. Client URL statuses cannot settle orders. Flutterwave verification precedes idempotent ledger settlement and workflow fulfilment. PAYMENTS_ENABLED and PAYOUTS_ENABLED remain false until actual provider acceptance is complete; no simulated checkout becomes real credit. AGNES provides structured AI drafts with a Workers AI fallback, authentication, quotas and output validation. Drafts require independent editorial approval before practice publication.

## Storage and deployment

Wrangler declares Convex HTTP/public URLs, document/image R2 bindings and payment queue bindings consistently for default, preview and production. Buckets remain private. Authenticated uploads receive temporary signed permissions; document downloads check ownership; public photos are served through cached image routes. Preview uses separate media buckets and queues.

GitHub production secrets: CONVEX_DEPLOY_KEY, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN. Provider and internal secrets are configured directly in Convex/Pages. See `.env.example`. Run `node scripts/verify-configuration.mjs` and `node scripts/smoke-live.mjs` after deployment. Provisioning scripts read ignored local environment settings; optional credentials attachment parsing requires CREDENTIALS_ATTACHMENT.

## E-WIN integration

SchoolXense owns its settlements. E-WIN receives signed, idempotent reports of onboarding, completed learning, verified payments and credited commissions. These reports cannot post to the central cash ledger. Central referral codes are checked against the live E-WIN registry; established attribution cannot be overwritten. Users can connect through the origin-restricted E-WIN frame, read their central code and consent to private learning-record copies. Accounts and roles remain separate until proof of both accounts is implemented. See docs/EWIN-INTEGRATION-CONTRACT.md.

## Public experience

Landing photography is real licensed illustrative imagery, outside the hero. Example stories are labelled until consented customer testimonials are published. FAQ, enquiries, canonical URLs, organization/FAQ structured data, sitemap, robots and llms.txt support discovery. The installable PWA caches public assets and an offline reconnect screen; it excludes private account, API and payment content.

## Acceptance boundaries

Configured credentials do not prove successful OAuth provider journeys, inbox delivery, AI generation or payment settlement. Owner verification needs the recipient. OAuth dashboard callbacks must allow the canonical `/api/auth/callback/google` and `/api/auth/callback/github` URLs. The Cloudflare zone currently has its five custom WAF rules allocated; no unrelated rule has been removed to add a SchoolXense rule. Payment acceptance, provider journeys and new financial flows must be exercised before enabling collection/payouts.
