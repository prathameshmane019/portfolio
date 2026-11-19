import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, hasValidOrigin, isValidAdminSession } from "@/lib/admin-auth";
import { sendAdminReply } from "@/lib/contact-mailer";
import { listContactMessages, updateContactMessage, type ContactMessage } from "@/lib/contact-store";
import { readPortfolioContent } from "@/lib/content-store";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function authorized(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
}

function isSmtpAuthenticationFailure(error: unknown) {
  return typeof error === "object" && error !== null && "responseCode" in error && error.responseCode === 535;
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Sign in to reply to messages." }, { status: 401 });
  }
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") || 0) > 8_192) {
    return NextResponse.json({ error: "Reply is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Reply must be valid JSON." }, { status: 400 });
  }
  const reply = typeof body === "object" && body !== null && !Array.isArray(body) && "body" in body && typeof body.body === "string"
    ? body.body.trim()
    : "";
  if (reply.length < 1 || reply.length > 4_000) {
    return NextResponse.json({ error: "Reply must contain 1–4,000 characters." }, { status: 400 });
  }

  const { id } = await context.params;
  let message: ContactMessage;
  let profileName: string;
  try {
    const found = (await listContactMessages()).find((entry) => entry.id === id);
    if (!found) return NextResponse.json({ error: "Message was not found." }, { status: 404 });
    message = found;
    profileName = (await readPortfolioContent()).profile.name;
  } catch (error) {
    console.error("Unable to load the contact message or portfolio profile for a reply.", error);
    return NextResponse.json({ error: "Message details could not be loaded." }, { status: 500 });
  }

  try {
    await sendAdminReply({ name: message.name, email: message.email }, profileName, reply);
  } catch (error) {
    if (isSmtpAuthenticationFailure(error)) {
      console.error("Gmail rejected SMTP authentication for an admin reply (535). Check the configured SMTP account and App Password.");
      return NextResponse.json({
        error: "Gmail rejected the SMTP login. Verify SMTP_USER and replace SMTP_PASSWORD with a current Google App Password, then restart the server.",
      }, { status: 502 });
    }
    console.error("Unable to email a reply to a contact message.", error);
    return NextResponse.json({ error: "Reply could not be sent. Check SMTP configuration and try again." }, { status: 502 });
  }

  try {
    const updated = await updateContactMessage(id, (current) => ({
      ...current,
      status: "replied",
      replies: [...current.replies, { body: reply, sentAt: new Date().toISOString() }],
    }));
    if (!updated) {
      console.error("Reply was emailed but the corresponding contact message disappeared before it could be recorded.");
      return NextResponse.json({ error: "Reply was sent, but its history could not be saved." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: updated });
  } catch (error) {
    console.error("Reply was emailed but its contact history could not be saved.", error);
    return NextResponse.json({ error: "Reply was sent, but its history could not be saved." }, { status: 500 });
  }
}
