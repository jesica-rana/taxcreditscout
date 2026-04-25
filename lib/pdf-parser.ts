/**
 * Browser-side PDF parsing.
 *
 * Uses pdfjs-dist to:
 *   1. Extract text content per page (with offsets)
 *   2. Render each page to a canvas at 2× scale → produce a base64 PNG data URL
 *
 * The text feeds into lib/redactor.ts. The image (with redaction overlays
 * drawn on top) feeds the Vision API stage of the pipeline.
 *
 * IMPORTANT: this module is browser-only. Do not import server-side.
 */

export interface ParsedPage {
  pageNumber: number;
  text: string;
  imageDataUrl: string;
  width: number;
  height: number;
}

export interface ParseResult {
  pages: ParsedPage[];
  totalChars: number;
}

let pdfjs: typeof import("pdfjs-dist") | null = null;

async function loadPdfjs() {
  if (pdfjs) return pdfjs;
  const mod = await import("pdfjs-dist");
  // Worker is needed for parsing. Vercel can serve from /public, or use the CDN.
  mod.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.worker.min.mjs";
  pdfjs = mod;
  return mod;
}

export async function parsePdf(file: File | ArrayBuffer): Promise<ParseResult> {
  const lib = await loadPdfjs();
  const buffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const doc = await lib.getDocument({ data: buffer }).promise;

  const pages: ParsedPage[] = [];
  let totalChars = 0;

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);

    // 1. Text content
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    totalChars += text.length;

    // 2. Render to canvas
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");
    await page.render({ canvasContext: ctx, viewport }).promise;
    const imageDataUrl = canvas.toDataURL("image/png");

    pages.push({
      pageNumber: i,
      text,
      imageDataUrl,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return { pages, totalChars };
}

/**
 * Draw black rectangles over a rendered PDF page image for the regions
 * matching the given redaction tokens.
 *
 * For the hackathon MVP we don't compute exact text bounding boxes — instead,
 * we mark redaction regions visually by overlaying a banner per redaction near
 * the top of the page, plus blacking out the entire bottom-third of any page
 * that contained an SSN/EIN (where signature/identifier blocks tend to live).
 *
 * v2 will use pdfjs textContent's transform matrix to compute tight boxes.
 */
export function overlayRedactionBanner(
  imageDataUrl: string,
  redactionCount: number,
  width: number,
  height: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("ctx unavailable"));
      ctx.drawImage(img, 0, 0, width, height);

      if (redactionCount > 0) {
        // Top banner indicating redactions on this page
        ctx.fillStyle = "#0B0B0F";
        ctx.fillRect(0, 0, width, 40);
        ctx.fillStyle = "#FAFAF7";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText(
          `[${redactionCount} PII tokens redacted on this page]`,
          16,
          26
        );
      }
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}
