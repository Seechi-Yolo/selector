import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** 主选取内容脚本：须为 IIFE 单文件，供 executeScript 注入（非 module）。 */
export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false,
    minify: false,
    outDir: "dist",
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/app/content/index.ts"),
      },
      output: {
        format: "iife",
        name: "selectorContentBoot",
        inlineDynamicImports: true,
        entryFileNames: "assets/[name].js",
      },
    },
  },
});
