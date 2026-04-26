/**
 * Browser-side PDF parsing using pdfjs-dist.
 *
 *   1. Extract text content per page
 *   2. Render each page to a canvas at 2× scale → base64 PNG data URL
 *
 * Text → redactor.js. Image (with redaction overlays) → Vision API stage of the
 * pipeline (or stays local in offline mode).
 *
 * Browser-only — never import server-side.
 *
 * Ported from taxcreditscout/lib/pdf-parser.ts (Jesica's pivot 3ef68f0).
 */

let pdfjs = null

async function loadPdfjs() {
  if (pdfjs) return pdfjs
  const mod = await import('pdfjs-dist')
  mod.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.version}/pdf.worker.min.mjs`
  pdfjs = mod
  return mod
}

export async function parsePdf(file) {
  const lib = await loadPdfjs()
  const buffer = file instanceof ArrayBuffer ? file : await file.arrayBuffer()
  const doc = await lib.getDocument({ data: buffer }).promise

  const pages = []
  let totalChars = 0

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)

    const textContent = await page.getTextContent()
    const text = textContent.items.map((item) => ('str' in item ? item.str : '')).join(' ')
    totalChars += text.length

    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas 2d context unavailable')
    await page.render({ canvasContext: ctx, viewport }).promise
    const imageDataUrl = canvas.toDataURL('image/png')

    pages.push({
      pageNumber: i,
      text,
      imageDataUrl,
      width: viewport.width,
      height: viewport.height,
    })
  }

  return { pages, totalChars }
}

/**
 * Draw a redaction banner on top of a page image. The MVP doesn't compute exact
 * text bounding boxes — we mark "this page had N PII tokens redacted" via a top
 * banner. v2 will use pdfjs textContent transforms to draw tight boxes per token.
 */
export function overlayRedactionBanner(imageDataUrl, redactionCount, width, height) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('ctx unavailable'))
      ctx.drawImage(img, 0, 0, width, height)

      if (redactionCount > 0) {
        ctx.fillStyle = '#0a0a0b'
        ctx.fillRect(0, 0, width, 40)
        ctx.fillStyle = '#fafafa'
        ctx.font = 'bold 18px sans-serif'
        ctx.fillText(`[${redactionCount} PII tokens redacted on this page]`, 16, 26)
      }
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = imageDataUrl
  })
}
