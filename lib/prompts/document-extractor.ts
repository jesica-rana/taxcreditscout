/**
 * Stage 1a (PDF path): Vision extraction of a structured RawIntake from the
 * redacted page images and redacted text.
 *
 * The vision call uses Claude (multimodal) so it can read tax-form structure
 * (line numbers, boxes, totals) even on scanned PDFs that have no text layer.
 * It cannot read PII because PII has been replaced with `[REDACTED:TYPE]`
 * markers in the text and (in v2) blacked out in the image.
 */

import { z } from "zod/v4";
import { jsonCompletion, type UserContentBlock } from "../openai";
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

If the document is illegible or clearly not a tax document, return your best guess and set free_text to "Document unclear; user should consider the form-based path."`;

const DocumentExtractSchema = z.object({
  business_description: z.string(),
  state: z.string().length(2),
  city: z.string().nullable(),
  employee_count: z.number().int().min(0).max(100000),
  revenue_band: z.enum([
    "under_500k",
    "500k_2m",
    "2m_10m",
    "10m_50m",
    "over_50m",
  ]),
  activities: z.array(
    z.enum([
      "hired_recently",
      "bought_equipment",
      "built_software",
      "renewable_energy",
      "employee_health",
      "paid_leave",
      "hired_disadvantaged",
      "in_oz",
      "started_retirement",
    ])
  ),
  free_text: z.string().nullable(),
});

export interface DocumentExtractInput {
  pages: { redactedText: string; redactedImageDataUrl: string }[];
  userHint?: { state?: string; city?: string | null };
}

/**
 * Convert a `data:image/png;base64,XXX` URL into an Anthropic image content block.
 */
function dataUrlToImageBlock(dataUrl: string): UserContentBlock {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error(`Invalid data URL (expected base64-encoded image)`);
  }
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: match[1],
      data: match[2],
    },
  };
}

export async function extractFromDocument(
  input: DocumentExtractInput
): Promise<RawIntake> {
  const blocks: UserContentBlock[] = [
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
    blocks.push(dataUrlToImageBlock(page.redactedImageDataUrl));
    blocks.push({
      type: "text",
      text: `Redacted text from this page:\n${page.redactedText.slice(0, 8000)}`,
    });
  }

  blocks.push({
    type: "text",
    text: `Now extract the structured business profile.`,
  });

  const parsed = await jsonCompletion({
    system: SYSTEM,
    user: blocks,
    schema: DocumentExtractSchema,
    schemaName: "document_extract",
  });

  // PII-safe: email is always null on the PDF path
  return {
    ...parsed,
    email: null,
  };
}
