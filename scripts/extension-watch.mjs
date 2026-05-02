#!/usr/bin/env node
/**
 * 本地开发：先完整 build（content + SW + 教程/沙盒页），再并行 watch
 * - 主 vite：由 SELECTOR_EXTENSION_WATCH=1 关闭 emptyOutDir，避免冲掉教程产物
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

const main = runWatch(["build", "--watch"]);
const pages = runWatch(["build", "--config", "vite.tutorial.config.ts", "--watch"]);

function shutdown(signal) {
  main.kill(signal);
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

main.on("exit", (code) => onExit("main vite", code));
pages.on("exit", (code) => onExit("tutorial vite", code));
