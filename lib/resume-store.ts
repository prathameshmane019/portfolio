import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { unlink } from "node:fs/promises";

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;
export const MAX_BACKUP_BYTES = Math.ceil(MAX_RESUME_BYTES / 3) * 4 + 2 * 1024 * 1024;
const resumePath = path.resolve(process.env.PORTFOLIO_RESUME_FILE || path.join("public", "resume.pdf"));

export function isPdf(buffer: Buffer) {
  return buffer.length >= 8 && buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

export async function readResumeAsset() {
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
  try {
    await unlink(resumePath);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return;
    throw error;
  }
}
