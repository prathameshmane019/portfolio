import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <p>ENTRY / ERROR 404</p>
      <h1>ENTRY<br /><em>NOT FOUND.</em></h1>
      <span>The requested logbook page is not in this archive.</span>
      <Link href="/">← RETURN TO INDEX</Link>
    </main>
  );
}
