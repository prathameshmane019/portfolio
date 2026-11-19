"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page-message" role="alert">
      <p>ENTRY / SYSTEM ERROR</p>
      <h1>LOG INTERRUPTED<br /><em>RETRY ENTRY.</em></h1>
      <p>The page encountered an unexpected error.</p>
      <button type="button" onClick={reset}>
        RETRY
      </button>
    </main>
  );
}
