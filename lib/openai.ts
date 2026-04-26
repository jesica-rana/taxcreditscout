import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z, type ZodType } from "zod/v4";

export const anthropic = new Anthropic();

export const LLM_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";

// Voyage AI embeddings — Anthropic does not offer an embeddings API.
// voyage-3-lite: 512-dim, generous free tier. Set VOYAGE_MODEL to override.
export const EMBED_MODEL = process.env.VOYAGE_MODEL || "voyage-3-lite";
export const EMBED_DIM = Number(process.env.VOYAGE_EMBED_DIM || 512);

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";

export async function embed(text: string): Promise<number[]> {
  const [v] = await embedBatch([text], "query");
  return v;
}

export async function embedBatch(
  texts: string[],
  inputType: "document" | "query" = "document"
): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (!process.env.VOYAGE_API_KEY) {
    throw new Error("VOYAGE_API_KEY is not set");
  }
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: texts,
      model: EMBED_MODEL,
      input_type: inputType,
    }),
  });
  if (!res.ok) {
    throw new Error(`Voyage AI ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as {
    data: { embedding: number[]; index: number }[];
  };
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

export type UserContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    };

export interface JsonCompletionArgs<S extends ZodType> {
  system: string;
  user: string | UserContentBlock[];
  schema: S;
  schemaName?: string; // unused with Anthropic; kept so call sites compile unchanged
  temperature?: number; // unused on Opus 4.7 (parameter removed by Anthropic)
  cacheSystem?: boolean; // default true; harmless if prompt is below cache minimum
  maxTokens?: number;
  model?: string; // override LLM_MODEL per call (e.g., use sonnet for cheap enrichment)
}

export async function jsonCompletion<S extends ZodType>(
  args: JsonCompletionArgs<S>
): Promise<z.infer<S>> {
  const userContent =
    typeof args.user === "string"
      ? args.user
      : (args.user as Anthropic.ContentBlockParam[]);

  const system =
    args.cacheSystem === false
      ? args.system
      : [
          {
            type: "text" as const,
            text: args.system,
            cache_control: { type: "ephemeral" as const },
          },
        ];

  const response = await anthropic.messages.parse({
    model: args.model ?? LLM_MODEL,
    max_tokens: args.maxTokens ?? 16000,
    system,
    messages: [{ role: "user", content: userContent }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output_config: { format: zodOutputFormat(args.schema as any) },
  });

  if (!response.parsed_output) {
    throw new Error(
      `Claude returned unparseable response (stop_reason=${response.stop_reason}): ${JSON.stringify(
        response.content
      ).slice(0, 500)}`
    );
  }
  return response.parsed_output as z.infer<S>;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 800
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, i)));
      }
    }
  }
  throw lastErr;
}
