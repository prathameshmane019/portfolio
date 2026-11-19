"use client";

import { ChangeEvent, DragEvent, FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PortfolioContent } from "@/lib/content-store";

type SectionKey = "profile" | "projects" | "experience" | "skillGroups" | "education" | "achievements" | "stats" | "messages";
type JsonRecord = Record<string, unknown>;

type AdminMessage = {
  id: string;
  name: string;
  email: string;
  body: string;
  receivedAt: string;
  status: "new" | "read" | "replied";
  ownerNotified: boolean;
  senderAcknowledged: boolean;
  replies: { body: string; sentAt: string }[];
};

const sections: { key: Exclude<SectionKey, "messages">; label: string; number: string; helper: string }[] = [
  { key: "profile", label: "Profile", number: "01", helper: "Identity, contact links, and the live status block." },
  { key: "projects", label: "Projects", number: "02", helper: "Case files, project index, and detail pages." },
  { key: "experience", label: "Experience", number: "03", helper: "Work history and role details." },
  { key: "skillGroups", label: "Skills", number: "04", helper: "Technology groups and the animated ticker." },
  { key: "education", label: "Education", number: "05", helper: "Education entries shown in the field log." },
  { key: "achievements", label: "Recognition", number: "06", helper: "Awards, certifications, and recognition stamps." },
  { key: "stats", label: "Stats", number: "07", helper: "The four animated numbers in the About section." },
];

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readableLabel(key: string) {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const updated = [...items];
  const [item] = updated.splice(from, 1);
  updated.splice(to, 0, item);
  return updated;
}

function moveEntries<T>(items: T[], from: number, to: number, reorderable: boolean, label: string) {
  const updated = moveItem(items, from, to);
  if (!reorderable || label !== "Skills" || !updated.every(isRecord)) return updated;
  return updated.map((item, index) => ({ ...item, number: String(index + 1).padStart(2, "0") })) as T[];
}

function removeEntry<T>(items: T[], index: number, reorderable: boolean, label: string) {
  const updated = items.filter((_, itemIndex) => itemIndex !== index);
  if (!reorderable || label !== "Skills" || !updated.every(isRecord)) return updated;
  return updated.map((item, itemIndex) => ({ ...item, number: String(itemIndex + 1).padStart(2, "0") })) as T[];
}

function SortableStringList({ label, value, onChange }: { label: string; value: string[]; onChange: (value: string[]) => void }) {
  const reorderScope = useId();
  const [newValue, setNewValue] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  function addItem() {
    const item = newValue.trim();
    if (!item || value.some((existing) => existing.toLowerCase() === item.toLowerCase())) return;
    onChange([...value, item]);
    setNewValue("");
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addItem();
    }
  }

  return (
    <div className="admin-sortable-list">
      <div className="admin-sortable-heading">
        <span>{readableLabel(label)} <small>DRAG TO REORDER · {value.length} ITEMS</small></span>
      </div>
      <div className="admin-sortable-items">
        {value.map((item, index) => (
          <div
            className={`admin-sortable-item${draggedIndex === index ? " is-dragged" : ""}${dropIndex === index ? " is-drop-target" : ""}`}
            key={`${item}-${index}`}
            data-skill-index={index}
            data-reorder-scope={reorderScope}
          >
            <button
              type="button"
              className="admin-drag-handle"
              aria-label={`Drag to reorder ${item}`}
              title="Drag to reorder"
              onPointerDown={(event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                setDraggedIndex(index);
              }}
              onPointerMove={(event) => {
                if (draggedIndex === null) return;
                const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>(`[data-reorder-scope="${reorderScope}"][data-skill-index]`);
                const to = Number(target?.dataset.skillIndex);
                setDropIndex(Number.isInteger(to) ? to : null);
              }}
              onPointerUp={(event) => {
                if (draggedIndex === null) return;
                const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>(`[data-reorder-scope="${reorderScope}"][data-skill-index]`);
                const to = Number(target?.dataset.skillIndex);
                if (Number.isInteger(to)) onChange(moveItem(value, draggedIndex, to));
                setDraggedIndex(null);
                setDropIndex(null);
              }}
              onPointerCancel={() => {
                setDraggedIndex(null);
                setDropIndex(null);
              }}
            >⠿</button>
            <span className="admin-sort-index">{String(index + 1).padStart(2, "0")}</span>
            <input
              aria-label={`${readableLabel(label)} item ${index + 1}`}
              value={item}
              onChange={(event) => onChange(value.map((current, itemIndex) => itemIndex === index ? event.target.value : current))}
            />
            <div className="admin-sort-actions">
              <button type="button" aria-label={`Move ${item} up`} disabled={index === 0} onClick={() => onChange(moveItem(value, index, index - 1))}>↑</button>
              <button type="button" aria-label={`Move ${item} down`} disabled={index === value.length - 1} onClick={() => onChange(moveItem(value, index, index + 1))}>↓</button>
              <button type="button" aria-label={`Remove ${item}`} onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}>×</button>
            </div>
          </div>
        ))}
        {value.length === 0 && <p className="admin-empty">No items yet. Add your first skill below.</p>}
      </div>
      <div className="admin-add-skill">
        <input aria-label={`Add ${readableLabel(label)}`} value={newValue} onChange={(event) => setNewValue(event.target.value)} onKeyDown={handleKeyDown} placeholder="Add a skill…" />
        <button type="button" disabled={!newValue.trim()} onClick={addItem}>+ ADD SKILL</button>
      </div>
    </div>
  );
}

function newItemFor(label: string): unknown {
  const templates: Record<string, JsonRecord> = {
    Projects: {
      slug: "new-project",
      title: "",
      shortTitle: "",
      category: ["Web"],
      number: "05",
      description: "",
      overview: "",
      features: [],
      stack: [],
      contribution: [],
      challenge: "",
      solution: "",
      role: "",
      year: "",
      learned: "",
      confidential: false,
      visual: "project-web",
    },
    Experience: { type: "work", title: "", organization: "", date: "", details: [] },
    Skills: { name: "", number: "", skills: [] },
    Education: { title: "", organization: "", date: "", detail: "" },
    Recognition: { type: "", title: "", detail: "", organization: "", mark: "" },
    Stats: { value: 0, suffix: "", label: "" },
  };
  return structuredClone(templates[label] || {});
}

function JsonField({
  label,
  value,
  onChange,
  depth = 0,
  filter = "",
  reorderable = false,
}: {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  depth?: number;
  filter?: string;
  reorderable?: boolean;
}) {
  const reorderScope = useId();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  if (typeof value === "string") {
    const longText = value.length > 110 || /bio|description|overview|challenge|solution|learned|detail/i.test(label);
    return (
      <label className={`admin-field${longText ? " admin-field-wide" : ""}`}>
        <span>{readableLabel(label)}</span>
        {longText ? (
          <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} />
        ) : (
          <input value={value} onChange={(event) => onChange(event.target.value)} />
        )}
      </label>
    );
  }
  if (typeof value === "number") {
    return (
      <label className="admin-field">
        <span>{readableLabel(label)}</span>
        <input type="number" step="any" value={value} onChange={(event) => onChange(event.target.value === "" ? 0 : Number(event.target.value))} />
      </label>
    );
  }
  if (typeof value === "boolean") {
    return (
      <label className="admin-checkbox">
        <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
        <span>{readableLabel(label)}</span>
      </label>
    );
  }
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string")) {
      if (reorderable) {
        return <SortableStringList label={label} value={value} onChange={onChange} />;
      }
      return (
        <label className="admin-field admin-field-wide">
          <span>{readableLabel(label)} <small>ONE ITEM PER LINE</small></span>
          <textarea
            rows={Math.min(Math.max(value.length + 1, 3), 8)}
            value={value.join("\n")}
            onChange={(event) => onChange(event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))}
          />
        </label>
      );
    }

    const entries = value.map((item, index) => ({ item, index }))
      .filter(({ item }) => !filter || JSON.stringify(item).toLowerCase().includes(filter.toLowerCase()));
    return (
      <div
        className={`admin-collection${depth ? " admin-collection-nested" : ""}`}
      >
        <div className="admin-collection-heading">
          <span>{readableLabel(label)} <small>{value.length} ENTRIES</small></span>
          <button
            type="button"
            className="admin-add-button"
            onClick={() => {
              const nextItem = newItemFor(readableLabel(label));
              if (reorderable && isRecord(nextItem)) nextItem.number = String(value.length + 1).padStart(2, "0");
              onChange([...value, nextItem]);
            }}
          >+ ADD</button>
        </div>
        {entries.map(({ item, index }) => (
          <article
            className={`admin-record${reorderable ? " admin-record-draggable" : ""}${draggedIndex === index ? " is-dragged" : ""}${dropIndex === index ? " is-drop-target" : ""}`}
            key={`${label}-${index}`}
            data-reorder-index={reorderable ? index : undefined}
            data-reorder-scope={reorderable ? reorderScope : undefined}
          >
            <div className="admin-record-heading">
              <span>
                {reorderable && (
                  <button
                    type="button"
                    className="admin-record-grip"
                    aria-label={`Drag to reorder ${isRecord(item) ? String(item.name || item.title || "skill group") : "skill group"}`}
                    title="Drag to reorder"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setDraggedIndex(index);
                    }}
                    onPointerMove={(event) => {
                      if (draggedIndex === null) return;
                      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>(`[data-reorder-scope="${reorderScope}"][data-reorder-index]`);
                      const to = Number(target?.dataset.reorderIndex);
                      setDropIndex(Number.isInteger(to) ? to : null);
                    }}
                    onPointerUp={(event) => {
                      if (draggedIndex === null) return;
                      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>(`[data-reorder-scope="${reorderScope}"][data-reorder-index]`);
                      const to = Number(target?.dataset.reorderIndex);
                      if (Number.isInteger(to)) onChange(moveEntries(value, draggedIndex, to, reorderable, readableLabel(label)));
                      setDraggedIndex(null);
                      setDropIndex(null);
                    }}
                    onPointerCancel={() => {
                      setDraggedIndex(null);
                      setDropIndex(null);
                    }}
                  >⠿</button>
                )}
                {String(index + 1).padStart(2, "0")} / {isRecord(item) ? String(item.shortTitle || item.title || item.name || item.organization || "NEW ENTRY") : "ENTRY"}
              </span>
              <div>
                {reorderable && <>
                  <button type="button" aria-label={`Move ${label} entry ${index + 1} up`} disabled={index === 0} onClick={() => onChange(moveEntries(value, index, index - 1, reorderable, readableLabel(label)))}>↑</button>
                  <button type="button" aria-label={`Move ${label} entry ${index + 1} down`} disabled={index === value.length - 1} onClick={() => onChange(moveEntries(value, index, index + 1, reorderable, readableLabel(label)))}>↓</button>
                </>}
                <button type="button" aria-label={`Remove ${label} entry ${index + 1}`} onClick={() => onChange(removeEntry(value, index, reorderable, readableLabel(label)))}>REMOVE ×</button>
              </div>
            </div>
            <JsonField
              label={label}
              value={item}
              depth={depth + 1}
              reorderable={reorderable}
              onChange={(nextItem) => onChange(value.map((current, itemIndex) => itemIndex === index ? nextItem : current))}
            />
          </article>
        ))}
        {filter && entries.length === 0 && <p className="admin-empty">No entries match “{filter}”.</p>}
      </div>
    );
  }
  if (isRecord(value)) {
    return (
      <div className={`admin-object${depth ? " admin-object-nested" : ""}`}>
        {Object.entries(value).map(([key, child]) => (
          <JsonField
            key={key}
            label={key}
            value={child}
            depth={depth + 1}
            reorderable={reorderable}
            onChange={(nextChild) => onChange({ ...value, [key]: nextChild })}
          />
        ))}
      </div>
    );
  }
  return null;
}

function findPlaceholders(value: unknown, path = "content"): string[] {
  if (typeof value === "string") {
    return /TODO|FIXME|\[confirm|\[placeholder/i.test(value) ? [path] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findPlaceholders(item, `${path}[${index + 1}]`));
  }
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, child]) => findPlaceholders(child, `${path}.${key}`));
  }
  return [];
}

export default function AdminDashboard() {
  const router = useRouter();
  const resumeInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState<PortfolioContent | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [selected, setSelected] = useState<SectionKey | "overview">("overview");
  const [sectionSearch, setSectionSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeDragging, setResumeDragging] = useState(false);
  const [contactMessages, setContactMessages] = useState<AdminMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState("");
  const [replyText, setReplyText] = useState("");
  const [inboxLoading, setInboxLoading] = useState(false);
  const [replySending, setReplySending] = useState(false);
  const [inboxRefresh, setInboxRefresh] = useState(0);

  const currentSnapshot = content ? JSON.stringify(content) : "";
  const dirty = Boolean(content && savedSnapshot !== currentSnapshot);
  const placeholders = useMemo(() => content ? findPlaceholders(content) : [], [content]);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/content", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as PortfolioContent | { error?: string };
        if (!response.ok) throw new Error("error" in result ? result.error : "Content could not be loaded.");
        if (active) {
          setContent(result as PortfolioContent);
          setSavedSnapshot(JSON.stringify(result));
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Content could not be loaded.");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const shortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        const form = document.querySelector<HTMLFormElement>("#admin-editor-form");
        form?.requestSubmit();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  useEffect(() => {
    if (selected !== "messages") return;
    let active = true;
    fetch("/api/admin/messages", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { messages?: AdminMessage[]; error?: string };
        if (!response.ok || !result.messages) throw new Error(result.error || "Messages could not be loaded.");
        if (active) {
          setContactMessages(result.messages);
          setSelectedMessageId((current) => result.messages?.some((entry) => entry.id === current) ? current : "");
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Messages could not be loaded.");
      })
      .finally(() => {
        if (active) setInboxLoading(false);
      });
    return () => { active = false; };
  }, [selected, inboxRefresh]);

  function updateSection(key: SectionKey, value: unknown) {
    setContent((current) => current ? { ...current, [key]: value } as PortfolioContent : current);
    setError("");
    setMessage("");
  }

  function selectSection(section: SectionKey | "overview") {
    setSelected(section);
    setSectionSearch("");
    setError("");
    setMessage("");
    if (section === "messages") setInboxLoading(true);
  }

  async function openContactMessage(entry: AdminMessage) {
    setSelectedMessageId(entry.id);
    setReplyText("");
    if (entry.status !== "new") return;
    try {
      const response = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id, action: "read" }),
      });
      const result = await response.json() as { message?: AdminMessage; error?: string };
      if (!response.ok || !result.message) throw new Error(result.error || "Message status could not be updated.");
      const updatedMessage = result.message;
      setContactMessages((current) => current.map((item) => item.id === entry.id ? updatedMessage : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Message status could not be updated.");
    }
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const activeMessage = contactMessages.find((entry) => entry.id === selectedMessageId);
    const body = replyText.trim();
    if (!activeMessage || !body) return;
    setReplySending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/messages/${encodeURIComponent(activeMessage.id)}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const result = await response.json() as { message?: AdminMessage; error?: string };
      if (!response.ok || !result.message) throw new Error(result.error || "Reply could not be sent.");
      const updatedMessage = result.message;
      setContactMessages((current) => current.map((item) => item.id === updatedMessage.id ? updatedMessage : item));
      setReplyText("");
      setMessage(`Reply sent to ${activeMessage.email}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Reply could not be sent.");
    } finally {
      setReplySending(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content || !dirty) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const result = await response.json() as { content?: PortfolioContent; error?: string };
      if (!response.ok || !result.content) throw new Error(result.error || "Could not save your changes.");
      setContent(result.content);
      setSavedSnapshot(JSON.stringify(result.content));
      setMessage("Saved to the live site JSON file.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your changes.");
    } finally {
      setBusy(false);
    }
  }

  async function restoreBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      setError("Backup file must be smaller than 16 MB.");
      return;
    }
    if (!window.confirm(`Restore ${file.name}? This replaces all current portfolio data.`)) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const raw = await file.text();
      const response = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: raw,
      });
      const result = await response.json() as { content?: PortfolioContent; error?: string; restoredResume?: boolean };
      if (!response.ok || !result.content) throw new Error(result.error || "Backup could not be restored.");
      setContent(result.content);
      setSavedSnapshot(JSON.stringify(result.content));
      setMessage(`Restored backup: ${file.name}${result.restoredResume ? " (including résumé PDF)" : ""}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Backup could not be restored.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadResume(file: File | undefined) {
    if (!file || !content) return;
    if (dirty) {
      setError("Save your profile edits before uploading a résumé.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf") || file.size === 0 || file.size > 10 * 1024 * 1024) {
      setError("Choose a PDF résumé smaller than 10 MB.");
      return;
    }

    setUploadingResume(true);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const body = new FormData();
      body.set("resume", file);
      const response = await fetch("/api/admin/resume", { method: "POST", body });
      const result = await response.json() as { resume?: { url: string; name: string; size: number }; error?: string };
      if (!response.ok || !result.resume) throw new Error(result.error || "Résumé upload failed.");
      const updated = {
        ...content,
        profile: { ...content.profile, resume: result.resume.url },
      };
      setContent(updated);
      setSavedSnapshot(JSON.stringify(updated));
      setMessage(`Résumé uploaded: ${result.resume.name} (${Math.max(1, Math.ceil(result.resume.size / 1024))} KB).`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Résumé upload failed.");
    } finally {
      setUploadingResume(false);
      setBusy(false);
    }
  }

  function onResumeDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setResumeDragging(false);
    void uploadResume(event.dataTransfer.files[0]);
  }

  async function logout() {
    const response = await fetch("/api/admin/logout", { method: "POST" });
    if (!response.ok) {
      setError("Sign-out failed. Close this browser session to clear access.");
      return;
    }
    router.replace("/admin/login");
  }

  async function downloadBackup() {
    if (dirty || uploadingResume) {
      setError("Save or finish your current changes before creating a backup.");
      return;
    }
    setError("");
    try {
      const response = await fetch("/api/admin/backup", { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error || "Backup could not be downloaded.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setMessage("Full-site backup downloaded.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Backup could not be downloaded.");
    }
  }

  function resetSection() {
    if (!content || !window.confirm("Discard every unsaved change on this page?")) return;
    setContent(JSON.parse(savedSnapshot) as PortfolioContent);
    setError("");
    setMessage("Unsaved changes discarded.");
  }

  const selectedDetails = sections.find((section) => section.key === selected);
  const selectedContactMessage = contactMessages.find((entry) => entry.id === selectedMessageId);

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/"><span>{content?.profile.name.split(/\s+/).map((part) => part[0] || "").join("").slice(0, 2).toUpperCase() || "PM"}</span><small>SITE CONTROL ROOM</small></Link>
        <p className="admin-side-label">CONTENT INDEX</p>
        <nav aria-label="Admin sections">
          <button type="button" className={selected === "overview" ? "selected" : ""} onClick={() => selectSection("overview")}><span>00</span>Overview</button>
          {sections.map((section) => (
            <button type="button" key={section.key} className={selected === section.key ? "selected" : ""} onClick={() => selectSection(section.key)}>
              <span>{section.number}</span>{section.label}
              {section.key === "projects" && content && <small>{content.projects.length}</small>}
            </button>
          ))}
          <button type="button" className={selected === "messages" ? "selected" : ""} onClick={() => selectSection("messages")}>
            <span>08</span>Messages
            {contactMessages.filter((entry) => entry.status === "new").length > 0 && <small>{contactMessages.filter((entry) => entry.status === "new").length}</small>}
          </button>
        </nav>
        <div className="admin-side-footer">
          <Link href="/" target="_blank" rel="noreferrer">↗ VIEW LIVE SITE</Link>
          <button type="button" onClick={logout}>SIGN OUT ↗</button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <span>{content?.profile.name.toUpperCase() || "PORTFOLIO"} / CONTENT OPERATIONS</span>
          <div className="admin-top-actions">
            <button type="button" className="admin-backup-button" onClick={downloadBackup} disabled={busy || dirty}>↓ BACKUP</button>
            <button type="button" className="admin-backup-button" onClick={() => backupInput.current?.click()} disabled={busy}>↑ RESTORE</button>
            <input ref={backupInput} className="admin-visually-hidden" type="file" accept="application/json,.json" onChange={restoreBackup} disabled={busy} aria-label="Restore portfolio backup" />
            <span className={`admin-save-indicator${dirty ? " is-dirty" : ""}`} role="status"><i />{dirty ? "UNSAVED CHANGES" : "ALL CHANGES SAVED"}</span>
          </div>
        </header>

        <div className="admin-content-wrap">
          {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
          {message && <div className="admin-alert admin-alert-success" role="status">{message}</div>}

          {selected === "overview" ? (
            <section className="admin-overview">
              <p className="admin-kicker">PRIVATE ADMIN / LIVE CONTENT</p>
              <h1>Make the site<br /><em>your own.</em></h1>
              <p className="admin-intro">One control room for the story, projects, and proof behind the portfolio. Edit, preview, publish, and keep a backup close.</p>
              {content ? (
                <>
                  <div className="admin-metrics">
                    <div><strong>{content.projects.length.toString().padStart(2, "0")}</strong><span>CASE FILES</span></div>
                    <div><strong>{content.experience.length.toString().padStart(2, "0")}</strong><span>ROLES</span></div>
                    <div><strong>{content.skillGroups.reduce((total, group) => total + group.skills.length, 0).toString().padStart(2, "0")}</strong><span>SKILLS INDEXED</span></div>
                    <div><strong>{placeholders.length.toString().padStart(2, "0")}</strong><span>OPEN EDITORIAL NOTES</span></div>
                  </div>
                  <div className="admin-overview-grid">
                    <section>
                      <div className="admin-section-heading"><span>01 / EDITORIAL CHECK</span><span>{placeholders.length ? "NEEDS ATTENTION" : "CLEAR"}</span></div>
                      <h2>{placeholders.length ? `${placeholders.length} notes to resolve` : "All clear."}</h2>
                      <p>Find leftover TODO markers before publishing. Your content is checked without sending it outside this site.</p>
                      {placeholders.slice(0, 8).map((path) => (
                        <button className="admin-audit-row" type="button" key={path} onClick={() => selectSection(path.startsWith("content.projects") ? "projects" : path.includes("experience") ? "experience" : "profile")}>
                          <span>TODO</span>{path}<b>→</b>
                        </button>
                      ))}
                      {placeholders.length > 8 && <small>+ {placeholders.length - 8} more notes</small>}
                    </section>
                    <section>
                      <div className="admin-section-heading"><span>02 / QUICK ACTIONS</span><span>CONTROL</span></div>
                      <button className="admin-quick-link" type="button" onClick={() => selectSection("profile")}>Update profile details <b>→</b></button>
                      <button className="admin-quick-link" type="button" onClick={() => selectSection("projects")}>Add or edit a case file <b>→</b></button>
                      <button className="admin-quick-link" type="button" onClick={downloadBackup}>Download full-site backup <b>↓</b></button>
                      <Link className="admin-quick-link" href="/" target="_blank" rel="noreferrer">Preview the live portfolio <b>↗</b></Link>
                    </section>
                  </div>
                </>
              ) : <p className="admin-loading">Loading your content…</p>}
            </section>
          ) : selected === "messages" ? (
            <section className="admin-editor-section">
              <p className="admin-kicker">08 / CONTACT DESK</p>
              <div className="admin-editor-title">
                <div><h1>Messages<em>.</em></h1><p>Contact form submissions, delivery status, and replies.</p></div>
                <button className="admin-backup-button" type="button" onClick={() => { setInboxLoading(true); setInboxRefresh((value) => value + 1); }}>↻ REFRESH INBOX</button>
              </div>
              <div className="admin-inbox">
                <aside className="admin-inbox-list" aria-label="Contact messages">
                  <div className="admin-section-heading"><span>INBOX</span><span>{contactMessages.length.toString().padStart(2, "0")} TOTAL</span></div>
                  {inboxLoading ? <p className="admin-loading">Loading messages…</p> : contactMessages.length === 0 ? (
                    <p className="admin-empty">No messages yet. New contact form submissions will appear here.</p>
                  ) : contactMessages.map((entry) => (
                    <button
                      type="button"
                      key={entry.id}
                      className={`admin-inbox-item${selectedMessageId === entry.id ? " selected" : ""}`}
                      onClick={() => void openContactMessage(entry)}
                    >
                      <span className="admin-inbox-item-top"><strong>{entry.name}</strong><small>{new Date(entry.receivedAt).toLocaleDateString()}</small></span>
                      <span>{entry.email}</span>
                      <span className="admin-inbox-preview">{entry.body}</span>
                      <span className={`admin-inbox-status is-${entry.status}`}>{entry.status.toUpperCase()}</span>
                    </button>
                  ))}
                </aside>
                <section className="admin-inbox-detail" aria-label="Selected message">
                  {selectedContactMessage ? (
                    <>
                      <div className="admin-inbox-message-head">
                        <div><span className="admin-resume-kicker">{new Date(selectedContactMessage.receivedAt).toLocaleString()}</span><h2>{selectedContactMessage.name}</h2><a href={`mailto:${selectedContactMessage.email}`}>{selectedContactMessage.email}</a></div>
                        <span className={`admin-inbox-status is-${selectedContactMessage.status}`}>{selectedContactMessage.status.toUpperCase()}</span>
                      </div>
                      <p className="admin-inbox-body">{selectedContactMessage.body}</p>
                      <p className="admin-inbox-delivery">
                        Owner notification: {selectedContactMessage.ownerNotified ? "sent" : "not delivered"} · Sender acknowledgment: {selectedContactMessage.senderAcknowledged ? "sent" : "not delivered"}
                      </p>
                      {selectedContactMessage.replies.map((reply, index) => (
                        <article className="admin-inbox-reply" key={`${reply.sentAt}-${index}`}>
                          <span>{new Date(reply.sentAt).toLocaleString()} / REPLY SENT</span>
                          <p>{reply.body}</p>
                        </article>
                      ))}
                      <form className="admin-reply-form" onSubmit={sendReply}>
                        <label htmlFor="admin-message-reply">REPLY / SENT WITH PORTFOLIO EMAIL</label>
                        <textarea id="admin-message-reply" value={replyText} onChange={(event) => setReplyText(event.target.value)} maxLength={4000} rows={6} placeholder="Write a thoughtful reply…" required />
                        <div><small>{replyText.length} / 4,000</small><button className="admin-save-button" type="submit" disabled={!replyText.trim() || replySending}>{replySending ? "SENDING…" : "SEND REPLY ↗"}</button></div>
                      </form>
                    </>
                  ) : <p className="admin-empty">Select a message to read it and reply.</p>}
                </section>
              </div>
            </section>
          ) : selectedDetails && content ? (
            <section className="admin-editor-section">
              <p className="admin-kicker">{selectedDetails.number} / CONTENT EDITOR</p>
              <div className="admin-editor-title">
                <div><h1>{selectedDetails.label}<em>.</em></h1><p>{selectedDetails.helper}</p></div>
                {content && Array.isArray(content[selected]) && (
                  <div className="admin-search-control">
                    <input
                      className="admin-search"
                      type="search"
                      value={sectionSearch}
                      onChange={(event) => setSectionSearch(event.target.value)}
                      placeholder={`Search ${selectedDetails.label.toLowerCase()}…`}
                      aria-label={`Search ${selectedDetails.label}`}
                    />
                    <small>
                      {content[selected].filter((entry) => !sectionSearch || JSON.stringify(entry).toLowerCase().includes(sectionSearch.toLowerCase())).length}
                      {" / "}{content[selected].length} ENTRIES
                    </small>
                  </div>
                )}
              </div>
              {selected === "projects" && <p className="admin-editor-tip">Project slugs become public URLs. Keep them lowercase, unique, and hyphen-separated. Use “confidential” to redact a client case study.</p>}
              {selected !== "profile" && <p className="admin-editor-tip">Reorder entries with the grip or arrow controls, and duplicate records as a starting point. Search only filters what is shown; it does not change saved content or the underlying order.</p>}
              {selected === "profile" && content && (
                <section className="admin-resume-manager" aria-labelledby="resume-manager-title">
              <div className="admin-resume-copy">
                <span className="admin-resume-kicker">PROFILE ASSET / PDF · 10 MB MAX</span>
                <h2 id="resume-manager-title">Résumé file</h2>
                <p>Upload replaces the existing résumé and updates the portfolio download link immediately.</p>
                <a href={content.profile.resume} target="_blank" rel="noreferrer">↗ VIEW CURRENT RÉSUMÉ</a>
              </div>
              <div
                className={`admin-resume-drop${resumeDragging ? " is-dragging" : ""}${uploadingResume ? " is-uploading" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!dirty && !uploadingResume) setResumeDragging(true);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setResumeDragging(false);
                }}
                onDrop={onResumeDrop}
              >
                <span className="admin-resume-icon" aria-hidden="true">PDF</span>
                <strong>{uploadingResume ? "UPLOADING RÉSUMÉ…" : resumeDragging ? "DROP TO REPLACE" : "DROP PDF HERE"}</strong>
                <span>or choose a file from your device</span>
                <button type="button" onClick={() => resumeInput.current?.click()} disabled={uploadingResume || dirty}>
                  {dirty ? "SAVE PROFILE FIRST" : "CHOOSE RÉSUMÉ"}
                </button>
                <input
                  ref={resumeInput}
                  className="admin-resume-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  aria-label="Upload a résumé PDF"
                  disabled={uploadingResume || dirty}
                  onChange={(event) => {
                    void uploadResume(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </div>
                </section>
              )}
              <form id="admin-editor-form" onSubmit={save}>
                <JsonField
              label={selectedDetails.label}
              value={content[selected]}
              filter={sectionSearch}
              reorderable={selected !== "profile"}
              onChange={(value) => updateSection(selected, value)}
                />
                <div className="admin-form-actions">
                  <span>{dirty ? "Changes are local until saved." : "This content is live and saved."}</span>
                  {dirty && <button className="admin-reset-button" type="button" onClick={resetSection}>DISCARD</button>}
                  <button className="admin-save-button" type="submit" disabled={!dirty || busy || uploadingResume}>{busy ? "SAVING…" : "SAVE CHANGES  ↗"}</button>
                </div>
              </form>
            </section>
          ) : (
            <p className="admin-loading">Loading your content…</p>
          )}
        </div>

        <footer className="admin-footer">
          <span>LOCAL JSON STORE · DOWNLOAD BACKUPS REGULARLY</span>
          <span>CTRL / ⌘ + S TO SAVE</span>
        </footer>
      </section>
    </main>
  );
}
