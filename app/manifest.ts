import type { MetadataRoute } from "next";

/**
 * PWA web app manifest.
 *
 * Friends Who Run is a mobile app — this manifest lets iOS/Android
 * users "Add to Home Screen" and launch it like a native app, with
 * the orange brand color as the theme and a standalone display mode.
 *
 * Icons are not yet generated (Phase 1A has no asset pipeline); when
 * they are, drop them in /public/icons/ and reference them here.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Friends Who Run",
    short_name: "FWR",
    description: "Your crew. Your miles. Your race.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF8",
    theme_color: "#FF6B35",
    orientation: "portrait",
    categories: ["fitness", "sports", "social"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/api/icon?size=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
