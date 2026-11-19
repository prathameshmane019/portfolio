import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Binary } from "mongodb";
import { getMongoDatabase, isMongoConfigured } from "@/lib/mongodb";

export const MAX_PROJECT_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_PROJECT_SCREENSHOTS = 8;

const localDirectory = path.resolve("data/project-media");

export type ProjectImage = {
  id: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  data: Buffer;
};

function imageType(buffer: Buffer): ProjectImage["contentType"] | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export function projectImageId(url: string) {
  const match = /^\/api\/project-media\/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.exec(url);
  return match?.[1] ?? null;
}

export async function saveProjectImage(buffer: Buffer, declaredType: string) {
  if (buffer.length === 0 || buffer.length > MAX_PROJECT_IMAGE_BYTES) {
    throw new Error("Project images must be 4 MB or smaller.");
  }
  const contentType = imageType(buffer);
  if (!contentType || declaredType !== contentType) {
    throw new Error("Choose a valid JPEG, PNG, or WebP image.");
  }

  const id = randomUUID();
  if (isMongoConfigured()) {
    await (await getMongoDatabase())
      .collection<{ _id: string; contentType: ProjectImage["contentType"]; data: Buffer; createdAt: Date }>("project_media")
      .insertOne({
      _id: id,
      contentType,
      data: buffer,
      createdAt: new Date(),
    });
  } else {
    const destination = path.join(localDirectory, `${id}.${contentType.split("/")[1]}`);
    const temporary = `${destination}.tmp`;
    await mkdir(localDirectory, { recursive: true });
    try {
      await writeFile(temporary, buffer, { flag: "wx" });
      await rename(temporary, destination);
    } catch (error) {
      await unlink(temporary).catch(() => undefined);
      await unlink(destination).catch(() => undefined);
      throw error;
    }
  }
  return { id, url: `/api/project-media/${id}`, contentType };
}

export async function readProjectImage(id: string): Promise<ProjectImage | null> {
  if (isMongoConfigured()) {
    const image = await (await getMongoDatabase())
      .collection<{ _id: string; contentType: ProjectImage["contentType"]; data: Binary | Uint8Array }>("project_media")
      .findOne({ _id: id });
    if (!image) return null;
    return {
      id,
      contentType: image.contentType,
      data: Buffer.from(image.data instanceof Binary ? image.data.value() : image.data),
    };
  }

  for (const extension of ["jpeg", "png", "webp"]) {
    const file = path.join(localDirectory, `${id}.${extension}`);
    try {
      const data = await readFile(file);
      const contentType = imageType(data);
      if (contentType) return { id, contentType, data };
    } catch (error) {
      if (typeof error !== "object" || error === null || !("code" in error) || error.code !== "ENOENT") throw error;
    }
  }
  return null;
}

export async function removeProjectImage(id: string) {
  if (isMongoConfigured()) {
    await (await getMongoDatabase())
      .collection<{ _id: string; contentType: ProjectImage["contentType"]; data: Uint8Array }>("project_media")
      .deleteOne({ _id: id });
    return;
  }

  for (const extension of ["jpeg", "png", "webp"]) {
    const file = path.join(localDirectory, `${id}.${extension}`);
    await unlink(file).catch((error: unknown) => {
      if (typeof error !== "object" || error === null || !("code" in error) || error.code !== "ENOENT") throw error;
    });
  }
}
