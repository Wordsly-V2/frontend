import type { MetadataRoute } from "next";

/**
 * PWA web app manifest (Next metadata route → /manifest.webmanifest).
 * Colors mirror the Aurora brand palette (--brand-primary purple + the light
 * near-white background from app/globals.css); keep them in sync if the theme
 * hex values change.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    // A stable id keeps the install identity fixed even if start_url changes.
    id: "/",
    name: "Wordsly — Learn English vocabulary",
    short_name: "Wordsly",
    description:
      "Practice English vocabulary with spaced repetition. Short daily sessions, streaks, and offline practice.",
    lang: "en",
    dir: "ltr",
    display: "standalone",
    // Fall back gracefully where standalone isn't honoured.
    display_override: ["standalone", "minimal-ui", "browser"],
    categories: ["education", "productivity"],
    start_url: "/?source=pwa",
    scope: "/",
    background_color: "#faf8fc",
    theme_color: "#7c3aed",
    orientation: "portrait",
    // Long-press / right-click the installed icon to jump straight in.
    shortcuts: [
      {
        name: "Practice now",
        short_name: "Practice",
        url: "/learn",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "My progress",
        short_name: "Progress",
        url: "/progress",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
