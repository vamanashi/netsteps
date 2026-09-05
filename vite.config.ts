import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: `/${(process.env.VITE_BASE_PATH ?? "").replace(/^\/+|\/+$/g, "")}`.replace(/\/$/, "") + "/",
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/")) return "vendor";
          const course = id.match(/\/content\/courses\/([^/]+)\.json$/);
          if (course) return `course-${course[1]}`;
          const workshop = id.match(/\/content\/workshops\/([^/]+)\.json$/);
          if (workshop) return `workshop-${workshop[1]}`;
          if (id.endsWith("/content/originals.json")) return "original-catalog";
        },
      },
    },
  },
});
