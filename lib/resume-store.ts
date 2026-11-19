import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { unlink } from "node:fs/promises";
import { Binary } from "mongodb";
import { getMongoDatabase, isMongoConfigured } from "@/lib/mongodb";

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;
export const MAX_BACKUP_BYTES = Math.ceil(MAX_RESUME_BYTES / 3) * 4 + 2 * 1024 * 1024;
const resumePath = path.resolve(process.env.PORTFOLIO_RESUME_FILE || path.join("public", "resume.pdf"));

export function isPdf(buffer: Buffer) {
  return buffer.length >= 8 && buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

export async function readResumeAsset() {
  if (isMongoConfigured()) {
    const asset = await (await getMongoDatabase())
      .collection<{ _id: string; data: Binary | Uint8Array; updatedAt?: Date }>("portfolio_assets")
      .findOne({ _id: "resume" });
    if (!asset) return null;
    return Buffer.from(asset.data instanceof Binary ? asset.data.value() : asset.data);
  }

  try {
    return await readFile(resumePath);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

export async function writeResumeAsset(buffer: Buffer) {
  if (buffer.length === 0 || buffer.length > MAX_RESUME_BYTES || !isPdf(buffer)) {
    throw new Error("Resume must be a PDF file under 10 MB.");
  }
  if (isMongoConfigured()) {
    await (await getMongoDatabase())
      .collection<{ _id: string; data: Buffer; updatedAt: Date }>("portfolio_assets")
      .replaceOne(
      { _id: "resume" },
      { data: buffer, updatedAt: new Date() },
      { upsert: true },
    );
    return;
  }

  const directory = path.dirname(resumePath);
  const temporary = path.join(directory, `.resume-${randomUUID()}.tmp`);
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(temporary, buffer, { flag: "wx" });
    await rename(temporary, resumePath);
  } catch (error) {
    const { unlink } = await import("node:fs/promises");
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

export async function removeResumeAsset() {
  if (isMongoConfigured()) {
    await (await getMongoDatabase())
      .collection<{ _id: string; data: Uint8Array }>("portfolio_assets")
      .deleteOne({ _id: "resume" });
    return;
  }

  try {
    await unlink(resumePath);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return;
    throw error;
  }
}
