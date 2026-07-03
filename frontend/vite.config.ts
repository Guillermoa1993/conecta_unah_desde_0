import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo-conecta-pumas.jpg"],
      manifestFilename: "manifest.json",
      devOptions: { enabled: true },
      manifest: {
        name: "Conecta Pumas",
        short_name: "ConectaPumas",
        description: "Gestión de eventos académicos UNAH",
        start_url: "/",
        display: "standalone",
        background_color: "#F4F6F8",
        theme_color: "#003366",
        orientation: "portrait",
        icons: [
          { src: "/logo-conecta-pumas.jpg", sizes: "192x192", type: "image/jpeg" },
          { src: "/logo-conecta-pumas.jpg", sizes: "512x512", type: "image/jpeg" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 604800 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: "::",
    port: 8080,
  },
});
