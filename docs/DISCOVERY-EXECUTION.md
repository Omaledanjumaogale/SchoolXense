# Discovery and UX execution record

## 1. Crawl configuration
Explicit bot rules, private-route exclusions, LLM references and AI manifests are provided. The sitemap paginates published Convex packs, eligible public tutors and upcoming cohorts, alongside static pages and locale introductions. Dynamic public pages load catalogue content on the server. Discovery outages return HTTP 503 with a retry hint instead of silently omitting the catalogue. The E-WIN ecosystem sitemap index links separately hosted sitemaps; cross-domain pages are not falsely listed as mother-owned URLs.

## 2. Metadata
Server layout data supplies canonical, robots, Open Graph and Twitter metadata through the shared SEO component. A 1200×630 SchoolXense social graphic is provided. Private pages are no-index and previews fail closed when they point to production.

## 3. Structured data
Organization, WebSite, breadcrumbs, FAQ, CreativeWork, ProfilePage, Course, Service and DefinedTerm schemas render in HTML. FAQ schemas use the same source as visible answers. Reusable Article, HowTo, Person and Service builders are available. No accreditation, customer reviews, income guarantees or invented publication dates are emitted. Historical catalogue publication dates are not recorded, so they are omitted rather than fabricated; future editorial publication tracking and reviewed backfill remain necessary.

## 4. Content and UX
Reusable answer-first, author, related-link, FAQ and page-template components are provided. The FAQ uses native accessible details with every answer present in HTML. The existing centralized toaster is preserved and receives new authenticated realtime Convex notifications. Configuration-health tooltips explain the difference between configured and successfully tested services.

## 5. Localization
Eight server-rendered introduction pages cover English, Hausa, Igbo, Yoruba, Arabic, Swahili, French and Portuguese, with hreflang and Arabic RTL. These are introductions only; English account and contractual flows are explicitly disclosed. Full curriculum and transactional translations require maintained translations and language review.

## 6. Validation and external activation
Live production and isolated preview checks confirmed FAQ HTML and schema, French translation/hreflang, Arabic RTL, sitemap, crawler manifests and a 1200×630 social image. The production release passed frontend/backend checks, unit tests, desktop/mobile browser tests and a zero-vulnerability npm audit. Search Console submission, external Rich Results validation, PageSpeed field results and actual AI citation monitoring remain external activation work. Markup cannot guarantee indexing or citations.

## 7. Remaining enterprise work
Device Web Push delivery still requires a VAPID key, durable subscriptions, a delivery worker and permission UX; realtime in-app notifications are implemented separately. Full background-workflow administration, exhaustive per-button QA, all content-page author/date audits and all-sister repository updates remain separate work. The new project preview key is configured and a manual preview has passed deployment and rendered-source checks. Independent preview authentication and separate R2/queue resources are configured. Production mother reporting is enabled after signed readiness and duplicate-safe event replay succeeded on the migrated E-WIN backend. Payments/payouts remain blocked by invalid provider authentication. Preview email/AI/OAuth provider activation remains separate.

## Quick wins delivered
1. Server-rendered public catalogue and pack content.
2. Shared FAQ content and schema.
3. Parent/child organization discovery links.
4. Canonical/no-index boundaries and a full-size social card.
5. Locale introductions with reciprocal hreflang.
