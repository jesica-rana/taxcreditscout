/**
 * Quick health check: count points in the Qdrant collection and show a sample.
 *
 *   npm run verify-qdrant
 */

import "./load-env";

import { qdrant, COLLECTION } from "../lib/qdrant";

async function main() {
  const info = await qdrant.getCollection(COLLECTION);
  const count = await qdrant.count(COLLECTION, { exact: true });

  console.log(`Collection: ${COLLECTION}`);
  console.log(`  status: ${info.status}`);
  console.log(`  points: ${count.count}`);
  console.log(`  vector dim: ${(info.config?.params?.vectors as any)?.size}`);

  if (count.count > 0) {
    const sample = await qdrant.scroll(COLLECTION, {
      limit: 3,
      with_payload: true,
      with_vector: false,
    });
    console.log(`\nSample (first 3):`);
    for (const p of sample.points) {
      const payload = p.payload as any;
      console.log(
        `  • ${payload.name} (${payload.jurisdiction}${
          payload.state ? "/" + payload.state : ""
        })`
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
