import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, hasValidOrigin, isValidAdminSession } from "@/lib/admin-auth";
import { readPortfolioContent, writePortfolioContent } from "@/lib/content-store";
import {
  MAX_PROJECT_IMAGE_BYTES,
  MAX_PROJECT_SCREENSHOTS,
  projectImageId,
  removeProjectImage,
  saveProjectImage,
} from "@/lib/project-media-store";
import { isMongoConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";

function authorized(request: NextRequest) {
  return isValidAdminSession(request.cookies.get(ADMIN_COOKIE)?.value);
}

function storageAvailable() {
  return !process.env.VERCEL || isMongoConfigured();
}

function storageError() {
  return NextResponse.json({
    error: "Project image storage is unavailable. Configure MONGODB_URI in Vercel and redeploy.",
  }, { status: 503 });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Sign in to manage project images." }, { status: 401 });
  }
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  if (!storageAvailable()) return storageError();
  if (Number(request.headers.get("content-length") || 0) > MAX_PROJECT_IMAGE_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "Project images must be 4 MB or smaller." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  const slug = form.get("projectSlug");
  const kind = form.get("kind");
  const file = form.get("image");
  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: "Choose a valid project." }, { status: 400 });
  }
  if (kind !== "cover" && kind !== "screenshot") {
    return NextResponse.json({ error: "Image type must be cover or screenshot." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_PROJECT_IMAGE_BYTES) {
    return NextResponse.json({ error: "Choose a JPEG, PNG, or WebP image up to 4 MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let saved: Awaited<ReturnType<typeof saveProjectImage>> | null = null;
  try {
    const content = await readPortfolioContent();
    const project = content.projects.find((item) => item.slug === slug);
    if (!project) return NextResponse.json({ error: "Project was not found." }, { status: 404 });
    if (project.confidential) {
      return NextResponse.json({ error: "Images are disabled for projects marked confidential." }, { status: 403 });
    }
    if (kind === "screenshot" && (project.screenshots?.length || 0) >= MAX_PROJECT_SCREENSHOTS) {
      return NextResponse.json({ error: `A project can have up to ${MAX_PROJECT_SCREENSHOTS} screenshots.` }, { status: 400 });
    }

    saved = await saveProjectImage(buffer, file.type);
    const previousCover = kind === "cover" ? project.coverImage : undefined;
    if (kind === "cover") project.coverImage = saved.url;
    else project.screenshots = [...(project.screenshots || []), saved.url];

    try {
      await writePortfolioContent(content);
    } catch (error) {
      await removeProjectImage(saved.id).catch((cleanupError: unknown) => {
        console.error("Unable to remove an unreferenced project image after a failed content save.", cleanupError);
      });
      throw error;
    }

    if (previousCover) {
      const oldId = projectImageId(previousCover);
      if (oldId) {
        await removeProjectImage(oldId).catch((cleanupError: unknown) => {
          console.error("New cover saved, but the replaced image could not be removed.", cleanupError);
        });
      }
    }
    return NextResponse.json({ ok: true, content, image: { url: saved.url, contentType: saved.contentType, size: buffer.length } });
  } catch (error) {
    if (error instanceof Error && (
      error.message === "Project images must be 4 MB or smaller." ||
      error.message === "Choose a valid JPEG, PNG, or WebP image."
    )) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Unable to save project media.", error);
    return NextResponse.json({
      error: isMongoConfigured()
        ? "Project image could not be saved. Check that the local MONGODB_URI is valid and Atlas is reachable, then try again."
        : "Project image could not be saved to data/project-media. Check that the project folder is writable, then try again.",
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Sign in to manage project images." }, { status: 401 });
  }
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  if (!storageAvailable()) return storageError();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (
    typeof body !== "object" || body === null || Array.isArray(body) ||
    !("projectSlug" in body) || typeof body.projectSlug !== "string" ||
    !("kind" in body) || (body.kind !== "cover" && body.kind !== "screenshot") ||
    !("url" in body) || typeof body.url !== "string"
  ) {
    return NextResponse.json({ error: "Project, image type, and image URL are required." }, { status: 400 });
  }

  const id = projectImageId(body.url);
  if (!id) return NextResponse.json({ error: "Image URL is invalid." }, { status: 400 });
  const projectSlug = body.projectSlug;
  const kind = body.kind;
  const url = body.url;

  try {
    const content = await readPortfolioContent();
    const project = content.projects.find((item) => item.slug === projectSlug);
    if (!project) return NextResponse.json({ error: "Project was not found." }, { status: 404 });
    if (kind === "cover") {
      if (project.coverImage !== url) return NextResponse.json({ error: "Cover image was not found." }, { status: 404 });
      delete project.coverImage;
    } else {
      if (!project.screenshots?.includes(url)) {
        return NextResponse.json({ error: "Screenshot was not found." }, { status: 404 });
      }
      project.screenshots = project.screenshots.filter((imageUrl) => imageUrl !== url);
      if (project.screenshots.length === 0) delete project.screenshots;
    }
    await writePortfolioContent(content);

    const stillReferenced = content.projects.some(
      (item) => item.coverImage === url || item.screenshots?.includes(url),
    );
    if (!stillReferenced) {
      await removeProjectImage(id).catch((cleanupError: unknown) => {
        console.error("Image was removed from project content, but its stored asset could not be deleted.", cleanupError);
      });
    }
    return NextResponse.json({ ok: true, content });
  } catch (error) {
    console.error("Unable to remove project media.", error);
    return NextResponse.json({ error: "Project image could not be removed." }, { status: 500 });
  }
}
