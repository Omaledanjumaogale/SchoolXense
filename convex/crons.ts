import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();
// Escrows release 48h after delivery when not disputed.
crons.interval('release due escrows', { minutes: 15 }, internal.money.releaseDue, {});
// No external request occurs unless the agreed ecosystem transport is explicitly enabled.
crons.interval('deliver ecosystem outbox', { minutes: 5 }, internal.ecosystem.deliver, {});
// Daily payouts at 18:00 WAT (17:00 UTC) via Flutterwave bulk transfer.
crons.daily('run payouts', { hourUTC: 17, minuteUTC: 0 }, internal.money.runPayouts, {});
// Monthly Studio royalties on the 1st at 06:00 WAT.
crons.monthly('studio royalties', { day: 1, hourUTC: 5, minuteUTC: 0 }, internal.studio.computeMonthly, {});
export default crons;
