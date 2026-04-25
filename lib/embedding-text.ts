import type { Credit } from "./types";

/**
 * Build the text we embed for a credit. The richer this text, the better
 * the semantic match against user activity descriptions.
 *
 * The "Common scenarios" line is the highest-leverage piece — it lets
 * vector search match user inputs like "we hired three people who were
 * on food stamps" to credits whose formal eligibility text only mentions
 * "SNAP recipients" in legal language.
 */
export function buildEmbeddingText(c: Credit, scenarios: string[] = []): string {
  const loc = [c.state, c.city].filter(Boolean).join(", ");
  const lines = [
    c.name + ".",
    `${c.jurisdiction} credit${loc ? ` (${loc})` : ""}.`,
    `Industries: ${c.industries.join(", ")}.`,
    c.eligibility_text,
  ];
  if (scenarios.length) {
    lines.push(`Common scenarios: ${scenarios.join(" | ")}`);
  }
  return lines.join("\n");
}
