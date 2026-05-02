import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

/** `make dev` / `npm run dev` 在并行 watch 教程页时设为 1，避免主构建清空已生成的 `dist/src/pages/**` */
const extensionWatch = process.env.SELECTOR_EXTENSION_WATCH === "1";

function copyManifest(): Plugin {
  return {
    name: "copy-manifest",
    closeBundle() {
      const distDir = resolve(__dirname, "dist");
      mkdirSync(distDir, { recursive: true });
      copyFileSync(resolve(__dirname, "manifest.json"), resolve(distDir, "manifest.json"));
    },
  };
}

/** 服务工作线程（默认可为无顶层 import 的 ESM 兼容打包）。内容脚本见 `vite.config.content*.ts`。 */
export default defineConfig({
  plugins: [copyManifest()],
  build: {
    emptyOutDir: !extensionWatch,
    minify: false,
    outDir: "dist",
    rollupOptions: {
      input: {
        "service-worker": resolve(__dirname, "src/app/service-worker/index.ts"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
