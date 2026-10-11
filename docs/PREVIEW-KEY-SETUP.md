# Isolated preview deployment access

SchoolXense production belongs to `elite-workforce / schoolxense`. The workflow accepts the project preview key from `CONVEX_PREVIEW_DEPLOY_KEY` or `PREVIEW_DEPLOY_KEY`; the latter is currently configured. A manual isolated preview was deployed and checked successfully at `https://pr-0.schoolxense.pages.dev` through GitHub Actions run `38143672707`.

To replace it manually:

1. Sign in to the [Convex dashboard](https://dashboard.convex.dev/).
2. Select the `elite-workforce` team and the `schoolxense` project. Its production deployment is `tacit-snail-617`; the key must be a project **preview** key, not this production deployment's key.
3. Open project settings and generate a preview deploy key. Name it `SchoolXense GitHub isolated previews`.
4. Open [SchoolXense Actions secrets](https://github.com/Omaledanjumaogale/SchoolXense/settings/secrets/actions), update `CONVEX_PREVIEW_DEPLOY_KEY` (or the existing `PREVIEW_DEPLOY_KEY`), and paste the value there.
5. Rerun the pull request workflow. The preview job requires the key's `preview:` prefix and uses a separate `pr-N` backend.
6. Revoke the superseded preview key in Convex after verifying the replacement.

Official references: [multiple deployments](https://docs.convex.dev/production/multiple-deployments) and [create preview deploy key API](https://docs.convex.dev/management-api/create-preview-deploy-key).

Preview defaults use their own Better Auth secret. Each PR sets its own Pages origin. Preview media buckets and payment queue use `-preview` resource names. Payment, payout and E-WIN reporting synchronization switches stay disabled. Production records are never exported or copied into preview. Configure separate provider credentials before exercising email, OAuth or AI flows.

To publish a preview while retaining only `master`, run the CI workflow manually with `preview_only=true`. It uses a separate `pr-0` backend and skips the production deploy job. Both preview session and FAQ routes returned HTTP 200 with no-index headers.
