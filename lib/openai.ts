import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const LLM_MODEL = process.env.OPENAI_MODEL_LLM || "gpt-5";
export const EMBED_MODEL = process.env.OPENAI_MODEL_EMBED || "text-embedding-3-small";

export async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: text,
  });
  return res.data[0].embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

export async function jsonCompletion<T>(args: {
  system: string;
  user: string;
  schema: object;
  schemaName: string;
  temperature?: number;
}): Promise<T> {
  const res = await openai.chat.completions.create({
    model: LLM_MODEL,
    temperature: args.temperature ?? 0.2,
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: args.schemaName,
        schema: args.schema,
        strict: true,
      },
    },
  });
  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty content");
  return JSON.parse(content) as T;
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
