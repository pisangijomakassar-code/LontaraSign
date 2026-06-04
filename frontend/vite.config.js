import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "LontaraSign — Tanda Tangan Digital",
        short_name: "LontaraSign",
        description: "Review & tanda tangani dokumen dengan pengawal AI.",
        lang: "id",
        theme_color: "#2A3A7A",
        background_color: "#F5F1EA",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "/maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Cache aset build; navigasi tetap online (app butuh API internal).
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
      },
      // Service worker hanya aktif di production build (butuh HTTPS/secure context).
      devOptions: { enabled: false },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
