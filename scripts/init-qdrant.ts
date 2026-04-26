import "./load-env";

import { ensureCollection, COLLECTION } from "../lib/qdrant";
import { EMBED_DIM, EMBED_MODEL } from "../lib/openai";

async function main() {
  await ensureCollection(EMBED_DIM);
  console.log(
    `✓ Qdrant collection "${COLLECTION}" ready (${EMBED_DIM}-dim, embed model: ${EMBED_MODEL})`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
