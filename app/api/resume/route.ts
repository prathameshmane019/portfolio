import { NextResponse } from "next/server";
import { readResumeAsset } from "@/lib/resume-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const resume = await readResumeAsset();
    if (!resume) {
      return NextResponse.json({ error: "Résumé is not available." }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(resume), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resume.pdf"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Unable to read the public résumé file.", error);
    return NextResponse.json({ error: "Résumé is temporarily unavailable." }, { status: 500 });
  }
}
