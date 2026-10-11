# Search and AI discovery

SchoolXense metadata is assembled in the server layout and rendered through the reusable SEO component. Organization, WebSite and breadcrumb entities share a safely escaped JSON-LD graph. Public references include robots.txt, llms.txt, llms-full.txt and the AI-agent manifest. Private pages and preview responses are excluded from indexing.

The public landing banner identifies the E-WIN parent organization. Structured data describes identity and services without claiming accreditation, customer outcomes or guaranteed earnings. Search visibility and AI citations require external indexing and cannot be guaranteed by markup.

## Preview activation

Create a Convex preview deploy key for the SchoolXense project in the Convex dashboard and store it as the GitHub repository secret CONVEX_PREVIEW_DEPLOY_KEY. The key must be a preview key, never the production deployment key. PR CI creates an isolated backend, builds against its returned URL and publishes a matching Pages branch. The build script rejects the production Convex hostname.

Configure preview Better Auth origin and session secrets independently. Keep payments, payouts and ecosystem synchronization disabled in the preview backend. Preview R2 buckets and queues must exist before publishing. A missing key leaves preview unavailable with an explicit CI notice.

Remaining validation includes live rendered-source inspection, structured-data validators, Search Console submission, dynamic catalogue sitemap coverage, content freshness metadata, localized pages and a 1200×630 social image. The current icon is used as the fallback social image.
