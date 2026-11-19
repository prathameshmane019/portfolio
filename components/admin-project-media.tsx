"use client";

import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import type { Project } from "@/data/projects";
import type { PortfolioContent } from "@/lib/content-store";

type Props = {
  projects: Project[];
  disabled: boolean;
  onContentUpdated: (content: PortfolioContent) => void;
};

const MAX_SCREENSHOTS = 8;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export default function AdminProjectMedia({ projects, disabled, onContentUpdated }: Props) {
  const [busyKey, setBusyKey] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function upload(project: Project, kind: "cover" | "screenshot", event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      setError("Choose a JPEG, PNG, or WebP image up to 4 MB.");
      return;
    }

    const key = `${project.slug}:${kind}`;
    setBusyKey(key);
    setError("");
    setFeedback("");
    const form = new FormData();
    form.set("projectSlug", project.slug);
    form.set("kind", kind);
    form.set("image", file);
    try {
      const response = await fetch("/api/admin/projects/media", { method: "POST", body: form });
      const result = await response.json() as { content?: PortfolioContent; error?: string };
      if (!response.ok || !result.content) throw new Error(result.error || "Image upload failed.");
      onContentUpdated(result.content);
      setFeedback(`${kind === "cover" ? "Cover" : "Screenshot"} uploaded for ${project.shortTitle}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image upload failed.");
    } finally {
      setBusyKey("");
    }
  }

  async function remove(project: Project, kind: "cover" | "screenshot", url: string) {
    setBusyKey(`${project.slug}:${url}`);
    setError("");
    setFeedback("");
    try {
      const response = await fetch("/api/admin/projects/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectSlug: project.slug, kind, url }),
      });
      const result = await response.json() as { content?: PortfolioContent; error?: string };
      if (!response.ok || !result.content) throw new Error(result.error || "Image could not be removed.");
      onContentUpdated(result.content);
      setFeedback(`Image removed from ${project.shortTitle}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image could not be removed.");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <section className="admin-project-media" aria-labelledby="project-media-title">
      <div className="admin-project-media-heading">
        <div>
          <span className="admin-resume-kicker">PROJECT ASSETS / JPEG · PNG · WEBP</span>
          <h2 id="project-media-title">Project images</h2>
          <p>Upload one cover and up to {MAX_SCREENSHOTS} screenshots per project. JPEG, PNG, or WebP, up to 4 MB each.</p>
        </div>
      </div>
      {disabled && <p className="admin-editor-tip" role="status">Image controls are paused while project edits are unsaved. Save or discard those edits to continue.</p>}
      {error && <p className="admin-alert admin-alert-error" role="alert">{error}</p>}
      {feedback && <p className="admin-alert admin-alert-success" role="status">{feedback}</p>}
      <div className="admin-project-media-list">
        {projects.map((project) => {
          const screenshots = project.screenshots || [];
          const busy = busyKey.startsWith(`${project.slug}:`);
          return (
            <article className="admin-project-media-card" key={project.slug}>
              <header>
                <div><small>{project.number} / {project.slug}</small><h3>{project.shortTitle}</h3></div>
                {project.confidential && <span className="admin-media-locked">REDACTED</span>}
              </header>
              {project.confidential ? (
                <p className="admin-empty">Image uploads are disabled for projects marked confidential.</p>
              ) : (
                <>
                  <div className="admin-project-media-assets">
                    <section>
                      <div className="admin-media-slot-heading"><span>COVER</span>{project.coverImage && <button type="button" disabled={disabled || busy} onClick={() => void remove(project, "cover", project.coverImage!)}>REMOVE</button>}</div>
                      {project.coverImage ? <Image src={project.coverImage} alt={`${project.shortTitle} cover preview`} width={640} height={360} unoptimized /> : <div className="admin-media-empty">NO COVER IMAGE</div>}
                      <input
                        ref={(element) => { inputRefs.current[`${project.slug}:cover`] = element; }}
                        className="admin-visually-hidden"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        aria-label={`Upload ${project.shortTitle} cover image`}
                        disabled={disabled || busy}
                        onChange={(event) => void upload(project, "cover", event)}
                      />
                      <button type="button" className="admin-media-upload" disabled={disabled || busy} onClick={() => inputRefs.current[`${project.slug}:cover`]?.click()}>
                        {busyKey === `${project.slug}:cover` ? "UPLOADING…" : project.coverImage ? "REPLACE COVER" : "+ ADD COVER"}
                      </button>
                    </section>
                    <section>
                      <div className="admin-media-slot-heading"><span>SCREENSHOTS / {screenshots.length} OF {MAX_SCREENSHOTS}</span></div>
                      <div className="admin-media-screenshot-grid">
                        {screenshots.map((url, index) => (
                          <div key={url}>
                            <Image src={url} alt={`${project.shortTitle} screenshot ${index + 1}`} width={320} height={180} unoptimized />
                            <button type="button" disabled={disabled || busy} aria-label={`Remove screenshot ${index + 1} from ${project.shortTitle}`} onClick={() => void remove(project, "screenshot", url)}>×</button>
                          </div>
                        ))}
                        {screenshots.length === 0 && <div className="admin-media-empty">NO SCREENSHOTS</div>}
                      </div>
                      <input
                        ref={(element) => { inputRefs.current[`${project.slug}:screenshot`] = element; }}
                        className="admin-visually-hidden"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        aria-label={`Upload screenshot for ${project.shortTitle}`}
                        disabled={disabled || busy || screenshots.length >= MAX_SCREENSHOTS}
                        onChange={(event) => void upload(project, "screenshot", event)}
                      />
                      <button type="button" className="admin-media-upload" disabled={disabled || busy || screenshots.length >= MAX_SCREENSHOTS} onClick={() => inputRefs.current[`${project.slug}:screenshot`]?.click()}>
                        {busyKey === `${project.slug}:screenshot` ? "UPLOADING…" : "+ ADD SCREENSHOT"}
                      </button>
                    </section>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
