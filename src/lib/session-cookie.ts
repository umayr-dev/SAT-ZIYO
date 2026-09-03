/**
 * Cookie options for the session token.
 *
 * The lifetime is read from the JWT's own `exp` claim rather than hardcoded.
 * The three places that set this cookie all used maxAge 30d while the backend
 * signs with expiresIn '7d' (backend src/auth/auth.module.ts), so for 23 days
 * out of every 30 a returning student carried a cookie whose token was already
 * dead. Middleware treats a present cookie as authenticated and the server
 * layouts validate it for real, so that gap is exactly the state that produced
 * the /dashboard <-> /auth/login redirect loop.
 *
 * Deriving the lifetime means the two can never drift again: change expiresIn
 * on the backend and the cookie follows.
 *
 * `exp` is read WITHOUT verifying the signature. That is safe for this one
 * purpose — sizing a cookie — because nothing here grants access; every request
 * is still authorised by the backend verifying the token properly. Never reuse
 * this to decide whether someone is logged in.
 */
export function sessionCookieOptions(token: string) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    // Undefined => a session cookie that dies with the browser. Used when the
    // token carries no readable exp: erring short can only cost a re-login,
    // erring long is what caused the loop.
    maxAge: jwtSecondsRemaining(token),
    path: "/",
  };
}

function jwtSecondsRemaining(token: string): number | undefined {
  const payload = token.split(".")[1];
  if (!payload) return undefined;
  try {
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const exp = JSON.parse(json)?.exp;
    if (typeof exp !== "number") return undefined;
    const seconds = Math.floor(exp - Date.now() / 1000);
    return seconds > 0 ? seconds : undefined;
  } catch {
    return undefined;
  }
}
