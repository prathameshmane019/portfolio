import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, hasValidOrigin, isValidAdminSession } from "@/lib/admin-auth";
import { readPortfolioContent, writePortfolioContent } from "@/lib/content-store";
import { isPdf, MAX_RESUME_BYTES, writeResumeAsset } from "@/lib/resume-store";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Sign in to upload a résumé." }, { status: 401 });
  }
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_RESUME_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "Résumé must be smaller than 10 MB." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Choose a valid PDF file to upload." }, { status: 400 });
  }

  const file = form.get("resume");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".pdf") || file.size === 0 || file.size > MAX_RESUME_BYTES) {
    return NextResponse.json({ error: "Choose a PDF file smaller than 10 MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isPdf(buffer)) {
    return NextResponse.json({ error: "This file does not appear to be a valid PDF." }, { status: 400 });
  }

  try {
    const content = await readPortfolioContent();
    await writeResumeAsset(buffer);
    content.profile.resume = "/api/resume";
    await writePortfolioContent(content);
    return NextResponse.json({
      ok: true,
      resume: { url: content.profile.resume, name: file.name, size: buffer.length },
    });
  } catch (error) {
    console.error("Unable to save the uploaded portfolio résumé.", error);
    return NextResponse.json({ error: "The résumé could not be saved on this server." }, { status: 500 });
  }
}
