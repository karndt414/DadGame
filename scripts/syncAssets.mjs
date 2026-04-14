import { access, cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const sourceDir = resolve(rootDir, "assets");
const publicDir = resolve(rootDir, "public");
const targetDir = resolve(publicDir, "assets");

async function main() {
  await mkdir(publicDir, { recursive: true });

  try {
    await access(sourceDir);
  } catch {
    console.warn(`Skipped asset sync: source folder not found at ${sourceDir}`);
    return;
  }

  await rm(targetDir, { recursive: true, force: true });
  await cp(sourceDir, targetDir, { recursive: true });
  console.log(`Synced assets: ${sourceDir} -> ${targetDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});