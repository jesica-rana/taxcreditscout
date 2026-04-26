/**
 * Side-effect module: loads .env.local into process.env BEFORE any other
 * imports run. Import this FIRST in every script that uses lib/qdrant or
 * lib/openai, otherwise the clients construct against an empty env (Qdrant
 * falls back to localhost:6333; Anthropic throws).
 *
 *   import "./load-env";
 *   import { qdrant } from "../lib/qdrant";  // now sees the env
 */

import * as dotenv from "dotenv";

// override:true matches Next.js dev mode, which always treats .env.local as
// the source of truth even if a shell-level env var is set (or set to empty).
dotenv.config({ path: ".env.local", override: true });
dotenv.config();
