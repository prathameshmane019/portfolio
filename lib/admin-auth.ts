import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "portfolio_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

function signature(expires: string) {
  const secret = sessionSecret();
  if (!secret) return null;
  return createHmac("sha256", secret)
    .update(`${process.env.ADMIN_EMAIL?.toLowerCase() || ""}:${expires}`)
    .digest("base64url");
}

export function createAdminSession() {
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  const signed = signature(expires);
  return signed ? `${expires}.${signed}` : null;
}

export function isValidAdminSession(token: string | undefined) {
  if (!token) return false;
  const [expires, provided, extra] = token.split(".");
  if (!expires || !provided || extra || !/^\d+$/.test(expires) || Number(expires) <= Date.now() / 1000) return false;
  const expected = signature(expires);
  if (!expected) return false;
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

export function passwordMatches(password: string, configured: string) {
  const actualHash = createHmac("sha256", "portfolio-admin-password").update(password).digest();
  const configuredHash = createHmac("sha256", "portfolio-admin-password").update(configured).digest();
  return timingSafeEqual(actualHash, configuredHash);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function hasValidOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export function credentialsConfigured() {
  return Boolean(
    process.env.ADMIN_EMAIL &&
    process.env.ADMIN_PASSWORD &&
    sessionSecret(),
  );
}
