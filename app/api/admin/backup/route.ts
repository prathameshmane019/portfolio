import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, hasValidOrigin, isValidAdminSession } from "@/lib/admin-auth";
import { parsePortfolioContent, readPortfolioContent, writePortfolioContent } from "@/lib/content-store";
import {
  isPdf,
  MAX_BACKUP_BYTES,
  MAX_RESUME_BYTES,
  readResumeAsset,
  removeResumeAsset,
  writeResumeAsset,
} from "@/lib/resume-store";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Sign in to download a backup." }, { status: 401 });
  }
  try {
    const backup = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: await readPortfolioContent(),
      resumePdf: (await readResumeAsset())?.toString("base64") ?? null,
    };
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="portfolio-backup-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Unable to create portfolio backup.", error);
    return NextResponse.json({ error: "Backup could not be created." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Sign in to restore a backup." }, { status: 401 });
  }
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BACKUP_BYTES) {
    return NextResponse.json({ error: "Backup file is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Backup must be a valid JSON file." }, { status: 400 });
  }
  const payload = typeof body === "object" && body !== null && "data" in body
    ? (body as { data: unknown }).data
    : body;
  const includesResumeAsset = typeof body === "object" && body !== null && "resumePdf" in body;
  const resumeValue = includesResumeAsset
    ? (body as { resumePdf?: unknown }).resumePdf
    : undefined;
  let resumeBuffer: Buffer | null = null;
  if (resumeValue !== undefined && resumeValue !== null) {
    if (typeof resumeValue !== "string" || resumeValue.length > Math.ceil(MAX_RESUME_BYTES / 3) * 4 + 8 || !/^[A-Za-z0-9+/]*={0,2}$/.test(resumeValue)) {
      return NextResponse.json({ error: "Backup résumé data is invalid or too large." }, { status: 400 });
    }
    resumeBuffer = Buffer.from(resumeValue, "base64");
    if (resumeBuffer.length > MAX_RESUME_BYTES || !isPdf(resumeBuffer)) {
      return NextResponse.json({ error: "Backup résumé is not a valid PDF." }, { status: 400 });
    }
  }
  const content = parsePortfolioContent(payload);
  if (!content) {
    return NextResponse.json({ error: "This backup is not compatible with the current site schema." }, { status: 400 });
  }
  try {
    if (resumeBuffer) await writeResumeAsset(resumeBuffer);
    if (includesResumeAsset && resumeValue === null) await removeResumeAsset();
    const restored = await writePortfolioContent(content);
    return NextResponse.json({ ok: true, content: restored, restoredResume: includesResumeAsset });
  } catch (error) {
    if (error instanceof Error && error.message === "Portfolio content is invalid.") {
      return NextResponse.json({ error: "This backup is not compatible with the current site schema." }, { status: 400 });
    }
    console.error("Unable to restore portfolio backup.", error);
    return NextResponse.json({ error: "Backup could not be restored to the configured JSON file." }, { status: 500 });
  }
}
