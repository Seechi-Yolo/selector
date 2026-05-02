#!/usr/bin/env node
/**
 * 本地开发：先完整 build（SW + 主内容脚本 IIFE + 教程/沙盒页），再并行 watch
 * - vite.config.ts / vite.config.content.ts：SELECTOR_EXTENSION_WATCH=1 时关闭 emptyOutDir，避免冲掉教程产物
 * - 教程 vite：独立 watch，改 tutorial/sandbox 源码会增量更新
 */
import { spawn, execSync } from "node:child_process";

execSync("npm run build", { stdio: "inherit" });

const env = { ...process.env, SELECTOR_EXTENSION_WATCH: "1" };

function runWatch(args) {
  return spawn("npx", ["vite", ...args], {
    stdio: "inherit",
    shell: true,
    env,
  });
}

const sw = runWatch(["build", "--watch"]);
const content = runWatch(["build", "--config", "vite.config.content.ts", "--watch"]);
const pages = runWatch(["build", "--config", "vite.tutorial.config.ts", "--watch"]);

function shutdown(signal) {
  sw.kill(signal);
  content.kill(signal);
  pages.kill(signal);
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown("SIGTERM");
  process.exit(0);
});

function onExit(name, code) {
  if (code === 0 || code === null) return;
  console.error(`extension-watch: ${name} exited with ${code}`);
  shutdown("SIGTERM");
  process.exit(code ?? 1);
}

sw.on("exit", (code) => onExit("vite (service-worker)", code));
content.on("exit", (code) => onExit("vite (content)", code));
pages.on("exit", (code) => onExit("vite (tutorial pages)", code));
