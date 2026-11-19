import { ImageResponse } from "next/og";
import { readPortfolioContent } from "@/lib/content-store";

export const alt = "Portfolio profile cover image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function OpenGraphImage() {
  const { profile } = await readPortfolioContent();
  const nameParts = profile.name.trim().split(/\s+/);
  const firstName = nameParts.shift() || profile.name;
  const otherNames = nameParts.join(" ");
  const initials = profile.name.split(/\s+/).map((part) => part[0] || "").join("").slice(0, 2).toUpperCase();
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundColor: "#f1eee4",
          color: "#111110",
          fontFamily: "sans-serif",
          border: "2px solid #111110",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#77766f", fontFamily: "monospace", fontSize: 20 }}>
          <span style={{ color: "#111110", fontSize: 28, fontWeight: 800 }}>{initials}® / ENGINEER&apos;S LOGBOOK</span>
          <span>{profile.coordinates.replace(/\n/g, " / ")}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          <div style={{ display: "flex", flexDirection: "column", color: "#111110", fontSize: 105, fontWeight: 800, letterSpacing: "-8px", lineHeight: 0.9 }}>
            <span>{firstName.toUpperCase()}</span>
            <span style={{ display: "flex" }}>{otherNames.toUpperCase()}<span style={{ color: "#ff4f1f" }}>®</span></span>
          </div>
          <div style={{ color: "#ff4f1f", fontFamily: "monospace", fontSize: 24 }}>{profile.title.toUpperCase()}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#77766f", fontFamily: "monospace", fontSize: 17 }}>
          <span>WEB / MOBILE / SYSTEMS</span>
          <span>{profile.location.toUpperCase()}</span>
        </div>
      </div>
    ),
    size,
  );
}
