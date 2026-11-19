import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, hasValidOrigin, isValidAdminSession } from "@/lib/admin-auth";
import { writePortfolioContent, readPortfolioContent } from "@/lib/content-store";
import {
  isMongoConfigured,
  isPersistentStoreRequiredButMissing,
  MONGODB_SETUP_MESSAGE,
} from "@/lib/mongodb";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
}

function contentWriteError(error: unknown) {
  if (isMongoConfigured()) {
    return "MongoDB Atlas could not save the content. Verify MONGODB_URI, MONGODB_DB, Atlas network access, and the database user's permissions; check the server log for details.";
  }

  const code = typeof error === "object" && error !== null && "code" in error
    ? error.code
    : undefined;

  if (code === "EROFS") {
    return "The server filesystem is read-only. Configure PORTFOLIO_CONTENT_FILE to point to a writable persistent volume, or use a database-backed content store.";
  }
  if (code === "EACCES" || code === "EPERM") {
    return "The server does not have permission to write the content file. Check directory permissions and whether the file is locked.";
  }
  if (code === "ENOSPC") {
    return "The server has no free storage space for the content file.";
  }
  if (code === "EBUSY") {
    return "The content file is currently locked by another process. Close programs using it and try again.";
  }
  return "Content could not be saved. Check the server log for the filesystem error and verify PORTFOLIO_CONTENT_FILE points to a writable location.";
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Sign in to manage portfolio content." }, { status: 401 });
  }
  if (isPersistentStoreRequiredButMissing()) {
    return NextResponse.json({ error: MONGODB_SETUP_MESSAGE }, { status: 503 });
  }
  try {
    return NextResponse.json(await readPortfolioContent(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Unable to read portfolio content.", error);
    return NextResponse.json({ error: "Saved content could not be read. Restore a backup or contact support." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Sign in to manage portfolio content." }, { status: 401 });
  }
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  if (isPersistentStoreRequiredButMissing()) {
    return NextResponse.json({ error: MONGODB_SETUP_MESSAGE }, { status: 503 });
  }

  const length = Number(request.headers.get("content-length") || 0);
  if (length > 1_000_000) {
    return NextResponse.json({ error: "Content file is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Content must be valid JSON." }, { status: 400 });
  }
  try {
    const content = await writePortfolioContent(body);
    return NextResponse.json({ ok: true, content });
  } catch (error) {
    if (error instanceof Error && error.message === "Portfolio content is invalid.") {
      return NextResponse.json({ error: "Content structure is invalid. Review the fields and try again." }, { status: 400 });
    }
    console.error("Unable to save portfolio content.", error);
    return NextResponse.json({ error: contentWriteError(error) }, { status: 500 });
  }
}
