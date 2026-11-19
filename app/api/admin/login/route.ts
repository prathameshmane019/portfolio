import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminSession,
  credentialsConfigured,
  hasValidOrigin,
  passwordMatches,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

type Attempt = { count: number; resetAt: number };
const attempts = new Map<string, Attempt>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function sameText(left: string, right: string) {
  const leftHash = Buffer.from(left);
  const rightHash = Buffer.from(right);
  if (leftHash.length !== rightHash.length) {
    const paddedLeft = Buffer.alloc(Math.max(leftHash.length, rightHash.length));
    const paddedRight = Buffer.alloc(Math.max(leftHash.length, rightHash.length));
    leftHash.copy(paddedLeft);
    rightHash.copy(paddedRight);
    timingSafeEqual(paddedLeft, paddedRight);
    return false;
  }
  return timingSafeEqual(leftHash, rightHash);
}

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  if (!credentialsConfigured()) {
    return NextResponse.json({ error: "Admin sign-in is not configured on the server." }, { status: 503 });
  }
  if (Number(request.headers.get("content-length") || 0) > 8_192) {
    return NextResponse.json({ error: "Sign-in request is too large." }, { status: 413 });
  }

  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const existing = attempts.get(key);
  if (existing && existing.resetAt > now && existing.count >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Too many sign-in attempts. Try again in 15 minutes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }
  const values = body as { email?: unknown; password?: unknown };
  const email = typeof values.email === "string" ? values.email.trim().toLowerCase() : "";
  const password = typeof values.password === "string" ? values.password : "";
  if (email.length > 254 || password.length > 256) {
    return NextResponse.json({ error: "Email or password is too long." }, { status: 400 });
  }
  const emailMatch = sameText(email, process.env.ADMIN_EMAIL!.trim().toLowerCase());
  const passwordMatch = passwordMatches(password, process.env.ADMIN_PASSWORD!);
  if (!emailMatch || !passwordMatch) {
    attempts.set(key, {
      count: existing && existing.resetAt > now ? existing.count + 1 : 1,
      resetAt: existing && existing.resetAt > now ? existing.resetAt : now + WINDOW_MS,
    });
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  attempts.delete(key);
  const token = createAdminSession();
  if (!token) {
    return NextResponse.json({ error: "Admin session signing is not configured." }, { status: 503 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
  return response;
}
