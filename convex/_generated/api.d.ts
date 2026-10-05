/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as checkout from "../checkout.js";
import type * as collab from "../collab.js";
import type * as components_ from "../components.js";
import type * as crons from "../crons.js";
import type * as ecosystem from "../ecosystem.js";
import type * as family from "../family.js";
import type * as http from "../http.js";
import type * as identity from "../identity.js";
import type * as institutions from "../institutions.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_entitlements from "../lib/entitlements.js";
import type * as lib_ledger from "../lib/ledger.js";
import type * as lib_profileValidation from "../lib/profileValidation.js";
import type * as market from "../market.js";
import type * as media from "../media.js";
import type * as money from "../money.js";
import type * as portal from "../portal.js";
import type * as practice from "../practice.js";
import type * as rateLimits from "../rateLimits.js";
import type * as referrals from "../referrals.js";
import type * as studio from "../studio.js";
import type * as subscriptions from "../subscriptions.js";
import type * as trust from "../trust.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  ai: typeof ai;
  auth: typeof auth;
  checkout: typeof checkout;
  collab: typeof collab;
  components: typeof components_;
  crons: typeof crons;
  ecosystem: typeof ecosystem;
  family: typeof family;
  http: typeof http;
  identity: typeof identity;
  institutions: typeof institutions;
  "lib/access": typeof lib_access;
  "lib/entitlements": typeof lib_entitlements;
  "lib/ledger": typeof lib_ledger;
  "lib/profileValidation": typeof lib_profileValidation;
  market: typeof market;
  media: typeof media;
  money: typeof money;
  portal: typeof portal;
  practice: typeof practice;
  rateLimits: typeof rateLimits;
  referrals: typeof referrals;
  studio: typeof studio;
  subscriptions: typeof subscriptions;
  trust: typeof trust;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  aggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"aggregate">;
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
};
