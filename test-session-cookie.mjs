// Run: node --experimental-strip-types test-session-cookie.mjs
//
// The cookie must never outlive the token inside it. A cookie that survives its
// JWT is the state that produced the /dashboard <-> /auth/login redirect loop:
// middleware sees a cookie and says "authenticated", the server layout verifies
// the token and says "not", and they bounce.
import assert from "node:assert/strict";
import { sessionCookieOptions } from "./src/lib/session-cookie.ts";

const jwt = (payload) =>
  `${Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url")}.` +
  `${Buffer.from(JSON.stringify(payload)).toString("base64url")}.sig`;

const now = Math.floor(Date.now() / 1000);

// Lifetime tracks the token's own exp, not a hardcoded constant.
const sevenDays = sessionCookieOptions(jwt({ exp: now + 7 * 86400 }));
assert.ok(Math.abs(sevenDays.maxAge - 7 * 86400) <= 2, "should expire with the JWT");

const oneHour = sessionCookieOptions(jwt({ exp: now + 3600 }));
assert.ok(Math.abs(oneHour.maxAge - 3600) <= 2, "short token => short cookie");

// Anything we cannot read a future exp from becomes a session cookie
// (maxAge undefined) rather than a long-lived guess.
for (const token of [
  jwt({ exp: now - 60 }),        // already expired
  jwt({ sub: "u1" }),            // no exp
  jwt({ exp: "soon" }),          // exp not a number
  "not-a-jwt",
  "",
  "a.!!!not-base64!!!.c",
]) {
  assert.equal(
    sessionCookieOptions(token).maxAge,
    undefined,
    `unreadable exp must not get a lifetime: ${token.slice(0, 24)}`,
  );
}

// Flags the cookie must always carry.
const opts = sessionCookieOptions(jwt({ exp: now + 86400 }));
assert.equal(opts.httpOnly, true);
assert.equal(opts.sameSite, "lax");
assert.equal(opts.path, "/");

console.log("ok — cookie never outlives its token");
