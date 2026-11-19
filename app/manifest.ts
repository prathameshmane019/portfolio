import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prathamesh Mane | Engineer's Logbook",
    short_name: "Prathamesh",
    description: "Portfolio, projects, and engineering logbook of Prathamesh Mane.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1eee4",
    theme_color: "#171715",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
