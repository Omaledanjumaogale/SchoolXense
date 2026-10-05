import { defineApp } from 'convex/server';
import rateLimiter from '@convex-dev/rate-limiter/convex.config';
import aggregate from '@convex-dev/aggregate/convex.config';
import workflow from '@convex-dev/workflow/convex.config';
import migrations from '@convex-dev/migrations/convex.config';
import betterAuth from '@convex-dev/better-auth/convex.config';

const app = defineApp();
app.use(betterAuth);
app.use(rateLimiter);
app.use(aggregate);
app.use(workflow);
app.use(migrations);
export default app;
