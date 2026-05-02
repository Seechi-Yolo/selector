import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();

async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), "utf8"));
}

async function main() {
  const packageJson = await readJson("package.json");
  const manifest = await readJson("manifest.json");

  if (packageJson.version !== manifest.version) {
    throw new Error(`Version mismatch: package.json=${packageJson.version}, manifest.json=${manifest.version}`);
  }

  console.log(`version-check: OK (${packageJson.version})`);
}

main().catch((error) => {
  console.error(`version-check: ${error.message}`);
  process.exit(1);
});
