import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { getMongoDatabase, isMongoConfigured } from "@/lib/mongodb";
import { projects, type Project } from "@/data/projects";
import { achievements, education, experience, profile, skillGroups, stats } from "@/data/site";

export type PortfolioContent = {
  profile: {
    name: string;
    title: string;
    tagline: string;
    bio: string;
    location: string;
    coordinates: string;
    phone: string;
    email: string;
    github: string;
    linkedin: string;
    resume: string;
    currentFocus: string;
    learning: string;
    availability: string;
  };
  skillGroups: { name: string; number: string; skills: string[] }[];
  experience: { type: string; title: string; organization: string; date: string; details: string[] }[];
  education: { title: string; organization: string; date: string; detail: string }[];
  achievements: { type: string; title: string; detail: string; organization: string; mark: string }[];
  stats: { value: number; suffix: string; label: string; decimals?: number }[];
  projects: Project[];
};

const initialContent: PortfolioContent = {
  profile: { ...profile },
  skillGroups: skillGroups.map((group) => ({ ...group, skills: [...group.skills] })),
  experience: experience.map((item) => ({ ...item, details: [...item.details] })),
  education: education.map((item) => ({ ...item })),
  achievements: achievements.map((item) => ({ ...item })),
  stats: stats.map((item) => ({ ...item })),
  projects: projects.map((project) => ({
    ...project,
    category: [...project.category],
    features: [...project.features],
    stack: [...project.stack],
    contribution: [...project.contribution],
  })),
};

const contentPath = () => path.resolve(process.env.PORTFOLIO_CONTENT_FILE || "data/content.json");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasStrings(value: unknown, fields: string[]) {
  return isRecord(value) && fields.every((field) => typeof value[field] === "string");
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function validateContent(value: unknown): value is PortfolioContent {
  if (!isRecord(value) || !hasStrings(value.profile, [
    "name", "title", "tagline", "bio", "location", "coordinates", "phone", "email",
    "github", "linkedin", "resume", "currentFocus", "learning", "availability",
  ])) return false;

  const { skillGroups: skills, experience: jobs, education: schools, achievements: awards, stats: metrics, projects: work } = value;
  return Array.isArray(skills) && skills.every((item) =>
    hasStrings(item, ["name", "number"]) && isStringArray(item.skills)) &&
    Array.isArray(jobs) && jobs.every((item) =>
      hasStrings(item, ["type", "title", "organization", "date"]) && isStringArray(item.details)) &&
    Array.isArray(schools) && schools.every((item) =>
      hasStrings(item, ["title", "organization", "date", "detail"])) &&
    Array.isArray(awards) && awards.every((item) =>
      hasStrings(item, ["type", "title", "detail", "organization", "mark"])) &&
    Array.isArray(metrics) && metrics.every((item) =>
      isRecord(item) && typeof item.value === "number" && Number.isFinite(item.value) &&
      typeof item.suffix === "string" && typeof item.label === "string" &&
      (item.decimals === undefined || (typeof item.decimals === "number" && Number.isInteger(item.decimals)))) &&
    Array.isArray(work) && work.every((item) =>
      hasStrings(item, [
        "slug", "title", "shortTitle", "number", "description", "overview", "challenge",
        "solution", "role", "year", "learned", "visual",
      ]) &&
      Array.isArray(item.category) && item.category.length > 0 &&
      item.category.every((category: unknown) => ["Full Stack", "Web", "AI", "Mobile"].includes(String(category))) &&
      isStringArray(item.features) && isStringArray(item.stack) && isStringArray(item.contribution) &&
      (item.confidential === undefined || typeof item.confidential === "boolean") &&
      (item.live === undefined || typeof item.live === "string") &&
      (item.github === undefined || typeof item.github === "string") &&
      (item.coverImage === undefined || typeof item.coverImage === "string") &&
      (item.screenshots === undefined || isStringArray(item.screenshots))) &&
    new Set((work as { slug: string }[]).map((item) => item.slug)).size === work.length &&
    (work as { slug: string }[]).every((item) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug));
}

export function parsePortfolioContent(value: unknown): PortfolioContent | null {
  if (!validateContent(value)) return null;
  return value;
}

export async function readPortfolioContent(): Promise<PortfolioContent> {
  if (isMongoConfigured()) {
    const saved = await (await getMongoDatabase())
      .collection<{ _id: string; content: unknown }>("portfolio_content")
      .findOne({ _id: "main" });
    if (!saved) return initialContent;
    const content = parsePortfolioContent(saved.content);
    if (!content) throw new Error("Portfolio content in MongoDB does not match the expected schema.");
    return content;
  }

  try {
    const saved = await readFile(contentPath(), "utf8");
    const parsed: unknown = JSON.parse(saved);
    const content = parsePortfolioContent(parsed);
    if (!content) throw new Error("Portfolio content file does not match the expected schema.");
    return content;
  } catch (error) {
    if (isRecord(error) && error.code === "ENOENT") return initialContent;
    throw error;
  }
}

export async function writePortfolioContent(value: unknown): Promise<PortfolioContent> {
  const content = parsePortfolioContent(value);
  if (!content) throw new Error("Portfolio content is invalid.");

  if (isMongoConfigured()) {
    await (await getMongoDatabase())
      .collection<{ _id: string; content: PortfolioContent; updatedAt: Date }>("portfolio_content")
      .replaceOne(
      { _id: "main" },
      { content, updatedAt: new Date() },
      { upsert: true },
    );
    return content;
  }

  const destination = contentPath();
  const directory = path.dirname(destination);
  const temporary = path.join(directory, `.content-${randomUUID()}.tmp`);
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(temporary, `${JSON.stringify(content, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    await rename(temporary, destination);
  } catch (error) {
    const { unlink } = await import("node:fs/promises");
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
  return content;
}
