// Run: node --experimental-strip-types test-middleware-redirect.mjs
//
// Guards the /dashboard <-> /auth/login redirect loop: middleware trusts cookie
// PRESENCE, the server layouts validate the token. If middleware ever bounces a
// cookie-holder off /auth/login again, an expired token ping-pongs forever.
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// Next's bundler resolves bare "next/server"; plain node needs the .js.
registerHooks({
  resolve(spec, ctx, next) {
    return next(spec === "next/server" ? "next/server.js" : spec, ctx);
  },
});

const { NextRequest } = await import("next/server.js");
const { middleware } = await import("./middleware.ts");

const req = (path, { token } = {}) => {
  const r = new NextRequest(new URL(path, "https://satziyo.uz"));
  if (token) r.cookies.set("token", token);
  return r;
};
const loc = (res) => res.headers.get("location");

// The loop: a stale-but-present cookie must NOT bounce off the login page.
for (const target of ["/dashboard", "/settings", "/support", "/admin"]) {
  const res = await middleware(
    req(`/auth/login?redirect=${encodeURIComponent(target)}`, { token: "stale" })
  );
  assert.equal(loc(res), null, `login?redirect=${target} must render, not redirect`);
}

// No cookie on a protected route -> one redirect to login, carrying the target.
const guarded = await middleware(req("/dashboard"));
assert.equal(new URL(loc(guarded)).pathname, "/auth/login");
assert.equal(new URL(loc(guarded)).searchParams.get("redirect"), "/dashboard");

// Cookie present -> protected route is served (the layout does the real check).
assert.equal(loc(await middleware(req("/dashboard", { token: "x" }))), null);

// Public routes and API are untouched either way.
assert.equal(loc(await middleware(req("/"))), null);
assert.equal(loc(await middleware(req("/api/auth/me"))), null);

console.log("ok — no redirect loop");
