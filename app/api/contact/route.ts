import { NextRequest, NextResponse } from "next/server";
import { readPortfolioContent, type PortfolioContent } from "@/lib/content-store";
import {
  sendOwnerNotification,
  sendSenderAcknowledgement,
} from "@/lib/contact-mailer";
import {
  saveContactMessage,
  updateContactMessage,
  type ContactMessage,
} from "@/lib/contact-store";
import { isPersistentStoreRequiredButMissing, MONGODB_SETUP_MESSAGE } from "@/lib/mongodb";

export const runtime = "nodejs";

type ContactBody = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown;
};

type RateRecord = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 5;
const requests = new Map<string, RateRecord>();

function getClientKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export async function POST(request: NextRequest) {
  if (isPersistentStoreRequiredButMissing()) {
    return NextResponse.json({ error: MONGODB_SETUP_MESSAGE }, { status: 503 });
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16_384) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  const key = getClientKey(request);
  const now = Date.now();
  const record = requests.get(key);
  if (record && record.resetAt > now && record.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((record.resetAt - now) / 1000)) } },
    );
  }

  let body: ContactBody;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
    }
    body = parsed as ContactBody;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (
    name.length < 1 ||
    name.length > 100 ||
    /[\r\n]/.test(name) ||
    !isValidEmail(email) ||
    /[\r\n]/.test(email) ||
    message.length < 10 ||
    message.length > 4000
  ) {
    return NextResponse.json({ error: "Please check your name, email, and message." }, { status: 400 });
  }

  requests.set(key, {
    count: record && record.resetAt > now ? record.count + 1 : 1,
    resetAt: record && record.resetAt > now ? record.resetAt : now + WINDOW_MS,
  });

  let saved: ContactMessage;
  let profile: PortfolioContent["profile"];
  try {
    ({ profile } = await readPortfolioContent());
    saved = await saveContactMessage({ name, email, body: message });
  } catch (error) {
    console.error("Unable to save a portfolio contact message.", error);
    return NextResponse.json(
      { error: "Your message could not be saved. Please email directly." },
      { status: 500 },
    );
  }

  const [ownerResult, senderResult] = await Promise.allSettled([
    sendOwnerNotification({ name, email }, message, profile.email),
    sendSenderAcknowledgement({ name, email }, profile.name),
  ]);
  const ownerNotified = ownerResult.status === "fulfilled";
  const senderAcknowledged = senderResult.status === "fulfilled";

  if (!ownerNotified) console.error("Unable to email the portfolio owner about a saved contact message.", ownerResult.reason);
  if (!senderAcknowledged) console.error("Unable to send a contact acknowledgment to the sender.", senderResult.reason);

  let deliveryStatusSaved = true;
  try {
    const updated = await updateContactMessage(saved.id, (current) => ({
      ...current,
      ownerNotified,
      senderAcknowledged,
    }));
    if (!updated) throw new Error("Saved contact message was not found while updating delivery status.");
  } catch (error) {
    deliveryStatusSaved = false;
    console.error("Contact message was saved, but its email delivery status could not be recorded.", error);
  }

  return NextResponse.json({
    ok: true,
    delivery: { ownerNotified, senderAcknowledged, statusSaved: deliveryStatusSaved },
  });
}
