import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          borderRadius: 38,
          background: "#171715",
          color: "#f5f2ea",
          fontFamily: "Arial, sans-serif",
          fontSize: 102,
          fontWeight: 800,
          letterSpacing: "-10px",
        }}
      >
        PM
        <div
          style={{
            position: "absolute",
            top: 31,
            right: 31,
            width: 18,
            height: 18,
            background: "#e74316",
          }}
        />
      </div>
    ),
    size,
  );
}
