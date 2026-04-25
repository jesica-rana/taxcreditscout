/**
 * Stage 1a (PDF path): Vision API extracts a structured RawIntake from the
 * redacted page images and redacted text.
 *
 * The Vision call uses GPT-4o (multimodal) so it can read tax-form structure
 * (line numbers, boxes, totals) even on scanned PDFs that have no text layer.
 * It cannot read PII because PII has been replaced with `[REDACTED:TYPE]`
 * markers in the text and (in v2) blacked out in the image.
 */

import { openai, LLM_MODEL } from "../openai";
import type { RawIntake } from "../types";

const SYSTEM = `You are a tax-document analysis assistant. You will be given (1) one or more page images from a redacted tax document where personally identifiable information has been removed, and (2) the redacted text content of those pages. Your job is to extract a structured business profile that downstream tax-credit search will consume.

The document may be a Form 1040 Schedule C, 1120, 1120-S, 1065, or a profit-and-loss statement. It may be a scanned image with no text layer. Extract whatever is legible.

Inferences:
- business_description: 1-2 sentence neutral description (e.g., "Manufacturing business with mixed equipment investment and R&D activity"). Do NOT include any company or person names — those are redacted for a reason.
- state: 2-letter postal code if visible on the document (NOT from a redacted address — only if the state appears in non-redacted form, e.g., on a state schedule).
- city: only if explicitly visible and not redacted; otherwise null.
- employee_count: from W-2 / 941 totals or compensation line items. Best estimate.
- revenue_band: from gross receipts. Pick the closest band.
- activities: pick from the allowed checklist based on the line items you see.
- free_text: a short paragraph noting anything credit-relevant (e.g., "large equipment purchases on line 13", "employer-paid health insurance line 14", "R&D expenditures noted").
- email: ALWAYS null (PII).

If the document is illegible or clearly not a tax document, return your best guess and set free_text to "Document unclear; user should consider the form-based path."`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    business_description: { type: "string" },
    state: { type: "string", minLength: 2, maxLength: 2 },
    city: { type: ["string", "null"] },
    employee_count: { type: "integer", minimum: 0, maximum: 100000 },
    revenue_band: {
      type: "string",
      enum: ["under_500k", "500k_2m", "2m_10m", "10m_50m", "over_50m"],
    },
    activities: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "hired_recently",
          "bought_equipment",
          "built_software",
          "renewable_energy",
          "employee_health",
          "paid_leave",
          "hired_disadvantaged",
          "in_oz",
          "started_retirement",
        ],
      },
    },
    free_text: { type: ["string", "null"] },
  },
  required: [
    "business_description",
    "state",
    "city",
    "employee_count",
    "revenue_band",
    "activities",
    "free_text",
  ],
} as const;

export interface DocumentExtractInput {
  pages: { redactedText: string; redactedImageDataUrl: string }[];
  userHint?: { state?: string; city?: string };
}

export async function extractFromDocument(
  input: DocumentExtractInput
): Promise<RawIntake> {
  const userContent: any[] = [
    {
      type: "text",
      text: `Redacted document contents follow. ${
        input.userHint?.state ? `User-provided state: ${input.userHint.state}.` : ""
      } ${
        input.userHint?.city ? `User-provided city: ${input.userHint.city}.` : ""
      }`,
    },
  ];

  for (const page of input.pages) {
    userContent.push({ type: "image_url", image_url: { url: page.redactedImageDataUrl } });
    userContent.push({
      type: "text",
      text: `Redacted text from this page:\n${page.redactedText.slice(0, 8000)}`,
    });
  }

  userContent.push({
    type: "text",
    text: `Now extract the structured business profile. Output JSON matching the schema.`,
  });

  const res = await openai.chat.completions.create({
    model: LLM_MODEL,
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userContent },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "document_extract",
        schema: SCHEMA,
        strict: true,
      },
    },
  });

  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error("Vision returned empty content");
  const parsed = JSON.parse(content) as Omit<RawIntake, "email">;

  // PII-safe: email is always null on the PDF path
  return {
    ...parsed,
    email: null,
  };
}
