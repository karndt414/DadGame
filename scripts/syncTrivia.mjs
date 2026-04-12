import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const from = resolve(root, "docs/03_trivia_questions_template.json");
const to = resolve(root, "src/data/triviaQuestions.json");

async function main() {
  await mkdir(dirname(to), { recursive: true });
  await copyFile(from, to);
  console.log(`Synced trivia data: ${from} -> ${to}`);
}

main().catch((error) => {
  console.error("Failed to sync trivia JSON", error);
  process.exit(1);
});
