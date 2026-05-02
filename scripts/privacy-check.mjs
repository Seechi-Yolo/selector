import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const srcDir = join(root, "src");
const forbiddenPatterns = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /\bEventSource\b/,
  /\bsendBeacon\b/,
  /\bchrome\.identity\b/,
  /\bchrome\.storage\.sync\b/,
  /\banalytics\b/i,
  /\btelemetry\b/i,
  /\btracking\b/i,
  /https?:\/\//,
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) files.push(path);
  }

  return files;
}

async function main() {
  const violations = [];
  const files = await walk(srcDir);

  for (const file of files) {
    const content = await readFile(file, "utf8");
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        violations.push(`${relative(root, file)} matches ${pattern}`);
      }
    }
  }

  if (violations.length) {
    throw new Error(`Potential local-only privacy violations:\n${violations.join("\n")}`);
  }

  console.log("privacy-check: OK");
}

main().catch((error) => {
  console.error(`privacy-check: ${error.message}`);
  process.exit(1);
});
