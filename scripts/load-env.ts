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

dotenv.config({ path: ".env.local" });
dotenv.config();
