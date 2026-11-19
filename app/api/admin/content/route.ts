import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, hasValidOrigin, isValidAdminSession } from "@/lib/admin-auth";
import { writePortfolioContent, readPortfolioContent } from "@/lib/content-store";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Sign in to manage portfolio content." }, { status: 401 });
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
    return NextResponse.json({ error: "Content could not be saved to the configured JSON file." }, { status: 500 });
  }
}
