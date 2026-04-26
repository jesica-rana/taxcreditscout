// Aurora background — slow-drifting radial gradient blobs.
// Pure CSS animation; respects prefers-reduced-motion (paused via global rule).
// Sits behind the hero content (z-index: 0) — content above must have its own
// stacking context (position: relative + z-index: 1).

function AuroraBackground() {
  return (
    <div className="aurora" aria-hidden="true">
      <span className="aurora-blob aurora-blob-1" />
      <span className="aurora-blob aurora-blob-2" />
      <span className="aurora-blob aurora-blob-3" />
      <span className="aurora-grid" />
    </div>
  )
}

export default AuroraBackground
