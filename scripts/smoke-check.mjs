import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "dist/manifest.json",
  "dist/assets/content.js",
  "dist/assets/service-worker.js",
  "dist/src/pages/tutorial/tutorial.html",
  "dist/src/pages/sandbox/sandbox.html",
  "dist/assets/tutorial-page.js",
  "dist/assets/sandbox-page.js",
  "dist/assets/extension-page-shell.js",
];

async function assertFile(path) {
  try {
    await access(join(root, path));
  } catch {
    throw new Error(`Missing required build artifact: ${path}`);
  }
}

async function main() {
  for (const file of requiredFiles) await assertFile(file);

  const manifest = JSON.parse(await readFile(join(root, "dist/manifest.json"), "utf8"));
  if (manifest.manifest_version !== 3) throw new Error("dist/manifest.json must be MV3");
  if (manifest.background?.service_worker !== "assets/service-worker.js") {
    throw new Error("manifest background service worker must point to assets/service-worker.js");
  }
  if (!manifest.action) throw new Error("manifest must define an action entry");

  console.log("smoke-check: OK");
}

main().catch((error) => {
  console.error(`smoke-check: ${error.message}`);
  process.exit(1);
});
