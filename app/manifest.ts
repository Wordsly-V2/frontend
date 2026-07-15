import type { MetadataRoute } from "next";

/**
 * PWA web app manifest (Next metadata route → /manifest.webmanifest).
 * Colors mirror the Aurora brand palette (--brand-primary purple + the light
 * near-white background from app/globals.css); keep them in sync if the theme
 * hex values change.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wordsly",
    short_name: "Wordsly",
    description: "Learn English vocabulary effectively with Wordsly",
    display: "standalone",
    start_url: "/",
    scope: "/",
    background_color: "#faf8fc",
    theme_color: "#7c3aed",
    orientation: "portrait",
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
