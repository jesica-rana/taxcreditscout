/**
 * Drop the Qdrant collection and recreate it at the configured EMBED_DIM.
 *
 * Use this when switching embedding providers (e.g. moving from a 1536-dim
 * collection to the 512-dim voyage-3-lite collection) so old vectors don't
 * collide with the new dimension.
 *
 *   npm run reset-qdrant
 */

import "./load-env";

import { qdrant, COLLECTION, ensureCollection } from "../lib/qdrant";
import { EMBED_DIM, EMBED_MODEL } from "../lib/openai";

async function main() {
  if (!process.env.QDRANT_URL) {
    console.error(
      "QDRANT_URL is not set. Check .env.local — value should look like https://xxxxx.cloud.qdrant.io"
    );
    process.exit(1);
  }

  console.log(`Connecting to ${process.env.QDRANT_URL}`);
  console.log(
    `Target: collection "${COLLECTION}" at ${EMBED_DIM}-dim (model: ${EMBED_MODEL})`
  );

  const exists = await qdrant
    .getCollection(COLLECTION)
    .then(() => true)
    .catch(() => false);

  if (exists) {
    console.log(`→ Deleting existing collection "${COLLECTION}"...`);
    await qdrant.deleteCollection(COLLECTION);
    console.log(`  ✓ Deleted`);
  } else {
    console.log(`→ Collection "${COLLECTION}" did not exist; creating fresh.`);
  }

  await ensureCollection(EMBED_DIM);
  console.log(`✓ Collection "${COLLECTION}" recreated at ${EMBED_DIM}-dim`);
  console.log(`\nNext: run \`npm run seed\` to load the sample credits.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
