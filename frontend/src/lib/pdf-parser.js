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
    const viewport = page.getViewport({ scale: 2 })

    const textContent = await page.getTextContent()
    const itemTexts = textContent.items.map((it) => ('str' in it ? it.str : ''))
    const text = itemTexts.join(' ')
    totalChars += text.length

    // Build per-item char ranges and canvas-space bboxes so the image
    // redactor can blacken the exact rectangles holding PII.
    const items = []
    let cursor = 0
    for (let k = 0; k < textContent.items.length; k++) {
      const it = textContent.items[k]
      const str = itemTexts[k]
      if ('str' in it && str.length > 0) {
        const tx = lib.Util.transform(viewport.transform, it.transform)
        const fontHeight = Math.hypot(tx[2], tx[3])
        const widthPx = (it.width || 0) * viewport.scale
        items.push({
          charStart: cursor,
          charEnd: cursor + str.length,
          x: tx[4],
          y: tx[5] - fontHeight,
          width: widthPx,
          height: fontHeight,
        })
      }
      cursor += str.length + 1
    }

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
      items,
      imageDataUrl,
      width: viewport.width,
      height: viewport.height,
    })
  }

  return { pages, totalChars }
}

/**
 * Paint black rectangles over every text item that overlaps a PII token's char
 * range, then add a top banner with the redaction count. The result is what
 * gets shown to the user AND what gets sent to the vision API — no PII pixels
 * leave the browser.
 */
export function redactImage(imageDataUrl, tokens, items, width, height) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('ctx unavailable'))
      ctx.drawImage(img, 0, 0, width, height)

      ctx.fillStyle = '#000000'
      const pad = 2
      for (const token of tokens) {
        for (const item of items) {
          if (item.charEnd <= token.start || item.charStart >= token.end) continue
          ctx.fillRect(
            item.x - pad,
            item.y - pad,
            item.width + pad * 2,
            item.height + pad * 2
          )
        }
      }

      if (tokens.length > 0) {
        ctx.fillStyle = '#0a0a0b'
        ctx.fillRect(0, 0, width, 40)
        ctx.fillStyle = '#fafafa'
        ctx.font = 'bold 18px sans-serif'
        ctx.fillText(`[${tokens.length} PII tokens redacted on this page]`, 16, 26)
      }
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = imageDataUrl
  })
}
