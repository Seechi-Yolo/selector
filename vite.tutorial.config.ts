import { resolve } from "node:path";
import { defineConfig } from "vite";

/**
 * 追加构建扩展内同源页（与主入口分离，避免 content 被拆 chunk）。
 * - 使用教程：`src/pages/tutorial/tutorial.html`
 * - UI 沙盒：`src/pages/sandbox/sandbox.html`
 * - 默认设计系统：`src/pages/design-system/design-system.html`
 * - 教程与沙箱顶栏：`src/pages/help-hub/help-hub.html`
 */
export default defineConfig({
  base: "./",
  build: {
    emptyOutDir: false,
    minify: false,
    rollupOptions: {
      input: {
        tutorial: resolve(__dirname, "src/pages/tutorial/tutorial.html"),
        sandbox: resolve(__dirname, "src/pages/sandbox/sandbox.html"),
        designSystem: resolve(__dirname, "src/pages/design-system/design-system.html"),
        helpHub: resolve(__dirname, "src/pages/help-hub/help-hub.html"),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "sandbox") return "assets/sandbox-page.js";
          if (chunk.name === "tutorial") return "assets/tutorial-page.js";
          if (chunk.name === "designSystem") return "assets/design-system-page.js";
          if (chunk.name === "helpHub") return "assets/help-hub-page.js";
          return "assets/[name].js";
        },
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
