import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, hasValidOrigin, isValidAdminSession } from "@/lib/admin-auth";
import { listContactMessages, updateContactMessage } from "@/lib/contact-store";
import { isPersistentStoreRequiredButMissing, MONGODB_SETUP_MESSAGE } from "@/lib/mongodb";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Sign in to view messages." }, { status: 401 });
  }
  if (isPersistentStoreRequiredButMissing()) {
    return NextResponse.json({ error: MONGODB_SETUP_MESSAGE }, { status: 503 });
  }
  try {
    return NextResponse.json({ messages: await listContactMessages() }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Unable to read the contact inbox.", error);
    return NextResponse.json({ error: "Saved messages could not be read." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Sign in to manage messages." }, { status: 401 });
  }
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  if (isPersistentStoreRequiredButMissing()) {
    return NextResponse.json({ error: MONGODB_SETUP_MESSAGE }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (
    typeof body !== "object" || body === null || Array.isArray(body) ||
    !("id" in body) || typeof body.id !== "string" ||
    !("action" in body) || body.action !== "read"
  ) {
    return NextResponse.json({ error: "A message ID and valid action are required." }, { status: 400 });
  }

  try {
    const updated = await updateContactMessage(body.id, (message) => ({
      ...message,
      status: message.status === "new" ? "read" : message.status,
    }));
    if (!updated) return NextResponse.json({ error: "Message was not found." }, { status: 404 });
    return NextResponse.json({ ok: true, message: updated });
  } catch (error) {
    console.error("Unable to update a contact message.", error);
    return NextResponse.json({ error: "Message status could not be saved." }, { status: 500 });
  }
}
