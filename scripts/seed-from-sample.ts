/**
 * Seed Qdrant from the hand-coded sample credits in data/seed/sample-credits.json.
 * This is the fastest way to bootstrap a working app while the scraper runs.
 *
 *   npm run seed
 */

import { spawn } from "node:child_process";

const child = spawn(
  "tsx",
  ["scripts/embed-credits.ts", "--file=data/seed/sample-credits.json"],
  { stdio: "inherit" }
);

child.on("exit", (code) => process.exit(code ?? 0));
