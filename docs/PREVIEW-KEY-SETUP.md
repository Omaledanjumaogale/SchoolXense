# Isolated preview deployment access

The SchoolXense project has a project-scoped preview key in the GitHub Actions secret `CONVEX_PREVIEW_DEPLOY_KEY`. It was created using the already authenticated Convex session and the official project management API. The value is not committed or printed in logs.

To replace it manually:

1. Sign in to the [Convex dashboard](https://dashboard.convex.dev/).
2. Select the `omaledanjumaogale` team and the `schoolcbt` project. Its production deployment is `adjoining-dalmatian-113`; the key must be a project **preview** key, not this production deployment's key.
3. Open project settings and generate a preview deploy key. Name it `SchoolXense GitHub isolated previews`.
4. Open [SchoolXense Actions secrets](https://github.com/Omaledanjumaogale/SchoolXense/settings/secrets/actions), update `CONVEX_PREVIEW_DEPLOY_KEY`, and paste the value there.
5. Rerun the pull request workflow. The preview job requires the key's `preview:` prefix and uses a separate `pr-N` backend.
6. Revoke the superseded preview key in Convex after verifying the replacement.

Official references: [multiple deployments](https://docs.convex.dev/production/multiple-deployments) and [create preview deploy key API](https://docs.convex.dev/management-api/create-preview-deploy-key).

Preview defaults use their own Better Auth secret. Each PR sets its own Pages origin. Preview media buckets and payment queue use `-preview` resource names. Payment, payout and E-WIN reporting synchronization switches stay disabled. Production records are never exported or copied into preview. Configure separate provider credentials before exercising email, OAuth or AI flows.
