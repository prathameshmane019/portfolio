import { NextResponse } from "next/server";
import { readProjectImage } from "@/lib/project-media-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Image was not found." }, { status: 404 });
  }
  try {
    const image = await readProjectImage(id);
    if (!image) return NextResponse.json({ error: "Image was not found." }, { status: 404 });
    return new NextResponse(new Uint8Array(image.data), {
      headers: {
        "Content-Type": image.contentType,
        "Content-Length": String(image.data.length),
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Unable to read project media.", error);
    return NextResponse.json({ error: "Image is temporarily unavailable." }, { status: 500 });
  }
}
