import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const entitiesDir = join(root, "src/entities");
const forbiddenPatterns = [
  /\bdocument\b/,
  /\bwindow\b/,
  /\bchrome\b/,
  /\bnavigator\b/,
  /\bElement\b/,
  /\bHTMLElement\b/,
  /\bCSS\b/,
  /import\s+.*\.css/,
  /\?raw/,
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
  const files = await walk(entitiesDir);

  for (const file of files) {
    const content = await readFile(file, "utf8");
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        violations.push(`${relative(root, file)} matches ${pattern}`);
      }
    }
  }

  if (violations.length) {
    throw new Error(`Domain boundary violations:\n${violations.join("\n")}`);
  }

  console.log("arch-check: OK");
}

main().catch((error) => {
  console.error(`arch-check: ${error.message}`);
  process.exit(1);
});
