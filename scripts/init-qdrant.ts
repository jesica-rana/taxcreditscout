import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { ensureCollection, COLLECTION } from "../lib/qdrant";

async function main() {
  await ensureCollection(1536);
  console.log(`✓ Qdrant collection "${COLLECTION}" ready`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
