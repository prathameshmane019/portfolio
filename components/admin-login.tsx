"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Sign-in failed.");
      router.replace("/admin");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in failed.");
      setBusy(false);
    }
  }

  return (
    <main className="admin-auth">
      <Link className="admin-back-link" href="/">← BACK TO PORTFOLIO</Link>
      <section className="admin-auth-card">
        <p className="admin-kicker">PM / PRIVATE ACCESS · 001</p>
        <h1>Control<br /><em>room.</em></h1>
        <p className="admin-intro">Sign in to update the live portfolio, manage project files, and create backups.</p>
        <form onSubmit={submit}>
          <label>Email<input type="email" name="email" autoComplete="username" required maxLength={254} /></label>
          <label>Password<input type="password" name="password" autoComplete="current-password" required maxLength={256} /></label>
          <button type="submit" disabled={busy}>{busy ? "VERIFYING…" : "ENTER CONTROL ROOM →"}</button>
          <p className="admin-form-error" role="alert">{error}</p>
        </form>
        <p className="admin-auth-footnote">Private area · changes are written to the configured site JSON file.</p>
      </section>
    </main>
  );
}
