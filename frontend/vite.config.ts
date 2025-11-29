import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      {
        find: "next/navigation",
        replacement: path.resolve(__dirname, "src/shims/next-navigation.ts"),
      },
      {
        find: "next-themes",
        replacement: path.resolve(__dirname, "src/shims/next-themes.ts"),
      },
      {
        find: "next/dynamic",
        replacement: path.resolve(__dirname, "src/shims/next-dynamic.ts"),
      },
      {
        find: "next/link",
        replacement: path.resolve(__dirname, "src/shims/next-link.tsx"),
      },
    ],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
