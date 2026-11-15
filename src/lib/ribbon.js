// Geometry for the S-shaped ribbon.
//
// The centreline is a meander that only ever moves down the page, so "how far
// the page has scrolled" maps directly to "how far along the ribbon we are".
// The ribbon itself is drawn like a broad-nib pen stroke: both edges are the
// centreline shifted along a fixed nib direction. That gives the thick/thin
// rhythm of a written S, and where the path runs parallel to the nib the
// ribbon turns edge-on and shows its other face, like a ribbon twisting.

const NIB_ANGLE = (-45 * Math.PI) / 180
const SAMPLES = 640
const STEP_EVERY = 3

const clamp = (min, max, v) => Math.min(max, Math.max(min, v))
const smooth = (a, b, v) => {
  const t = clamp(0, 1, (v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const fmt = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`

/**
 * @param {object} o
 * @param {number} o.x0     start x (where the drop sits in the hero)
 * @param {number} o.y0     start y
 * @param {number} o.width  available width
 * @param {number} o.span   vertical distance the ribbon covers
 * @param {number} o.ribbonWidth  width of the nib
 */
export function buildRibbon({ x0, y0, width, span, ribbonWidth }) {
  const narrow = width < 768
  const amplitude = width * (narrow ? 0.3 : 0.25)
  // Steepest sideways slope (dx/dy) the meander may reach. It decides how many
  // bends fit, and it has to exceed 1 for the ribbon to twist at all.
  const maxSlope = narrow ? 1.3 : 1.9
  const wavelength = (2 * Math.PI * amplitude) / maxSlope
  const waves = clamp(1.5, 4, Math.round((span / wavelength) * 2) / 2)
  const centre = width / 2

  // --- centreline ---------------------------------------------------
  const px = new Float64Array(SAMPLES + 1)
  const py = new Float64Array(SAMPLES + 1)
  for (let i = 0; i <= SAMPLES; i++) {
    const v = i / SAMPLES
    // Swing in gently, then settle back to the centre before landing.
    const envelope = smooth(0, 0.22, v) * (1 - smooth(0.86, 1, v))
    const axis = x0 + (centre - x0) * smooth(0, 0.4, v)
    px[i] = axis + amplitude * envelope * Math.sin(2 * Math.PI * waves * v)
    py[i] = y0 + v * span
  }
  const pointAt = (k) => {
    const i = Math.min(SAMPLES - 1, Math.floor(k))
    const f = k - i
    return [px[i] + (px[i + 1] - px[i]) * f, py[i] + (py[i + 1] - py[i]) * f]
  }

  // --- edges --------------------------------------------------------
  const nx = (Math.cos(NIB_ANGLE) * ribbonWidth) / 2
  const ny = (Math.sin(NIB_ANGLE) * ribbonWidth) / 2

  // The ribbon grows out of a point at its start, and narrows to a point
  // again at its head, where the drop is. `taper` is that length in samples.
  const taper = Math.max(6, Math.round((ribbonWidth * 1.25) / (span / SAMPLES)))
  const startWidth = (i) => Math.sin((clamp(0, 1, i / taper) * Math.PI) / 2)
  const headWidth = (i, k) => Math.sin((clamp(0, 1, (k - i) / taper) * Math.PI) / 2)

  const left = []
  const right = []
  for (let i = 0; i <= SAMPLES; i++) {
    const w = startWidth(i)
    left.push(fmt(px[i] + nx * w, py[i] + ny * w))
    right.push(fmt(px[i] - nx * w, py[i] - ny * w))
  }
  // Edge point inside the head taper, which changes with every frame.
  const taperedEdge = (i, side, k) => {
    const [x, y] = pointAt(i)
    const w = side * startWidth(i) * headWidth(i, k)
    return fmt(x + nx * w, y + ny * w)
  }

  // Which face each segment shows: the sign of tangent x nib.
  const sign = new Int8Array(SAMPLES)
  let positive = 0
  for (let i = 0; i < SAMPLES; i++) {
    const cross = (px[i + 1] - px[i]) * ny - (py[i + 1] - py[i]) * nx
    sign[i] = cross >= 0 ? 1 : -1
    if (sign[i] > 0) positive++
  }
  const frontSign = positive * 2 >= SAMPLES ? 1 : -1

  // Consecutive segments showing the same face form one polygon.
  const runs = []
  for (let i = 0; i < SAMPLES; i++) {
    const last = runs[runs.length - 1]
    if (last && last.sign === sign[i]) last.end = i + 1
    else runs.push({ start: i, end: i + 1, sign: sign[i], full: null })
  }

  const runPath = (run, k) => {
    // Samples up to `solid` are at full width and can use the cached strings.
    const solid = k - taper
    if (run.end <= solid && run.full) return run.full

    const end = Math.min(run.end, k)
    const last = Math.floor(end)
    let d = `M${left[run.start]}`
    for (let i = run.start + 1; i <= last; i++) {
      d += `L${i <= solid ? left[i] : taperedEdge(i, 1, k)}`
    }
    if (end > last) d += `L${taperedEdge(end, 1, k)}L${taperedEdge(end, -1, k)}`
    for (let i = last; i >= run.start; i--) {
      d += `L${i <= solid ? right[i] : taperedEdge(i, -1, k)}`
    }
    d += 'Z'
    if (run.end <= solid) run.full = d
    return d
  }

  // --- static strokes, revealed with a dash offset --------------------
  // Their reveal is measured in arc length, while the head moves by sample
  // index, so keep a cumulative length per sample for each.
  const stroke = (side) => {
    const xs = new Float64Array(SAMPLES + 1)
    const ys = new Float64Array(SAMPLES + 1)
    const length = new Float64Array(SAMPLES + 1)
    let d = ''
    for (let i = 0; i <= SAMPLES; i++) {
      const w = side * startWidth(i)
      xs[i] = px[i] + nx * w
      ys[i] = py[i] + ny * w
      if (i) length[i] = length[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1])
      d += `${i ? 'L' : 'M'}${fmt(xs[i], ys[i])}`
    }
    return { d, length }
  }
  const spine = stroke(0)
  const edge = stroke(1)
  const fractionAt = (length, k) => {
    k = clamp(0, SAMPLES, k)
    const i = Math.min(SAMPLES - 1, Math.floor(k))
    const at = length[i] + (length[i + 1] - length[i]) * (k - i)
    return at / length[SAMPLES]
  }

  // Cross lines along the nib, like the steps in the reference.
  const steps = []
  for (let i = STEP_EVERY; i < SAMPLES; i += STEP_EVERY) steps.push(`M${left[i]}L${right[i]}`)

  return {
    count: SAMPLES,
    waves,
    spineD: spine.d,
    edgeD: edge.d,
    end: { x: px[SAMPLES], y: py[SAMPLES] },

    /** Everything needed to draw the ribbon up to sample `k` (may be fractional). */
    at(k) {
      k = clamp(0, SAMPLES, k)
      let front = ''
      let back = ''
      for (const run of runs) {
        if (run.start >= k) break
        const d = runPath(run, k)
        if (run.sign === frontSign) front += d
        else back += d
      }

      const [x, y] = pointAt(k)
      const i = Math.min(SAMPLES - 1, Math.floor(k))
      const a = Math.max(0, i - 4)
      const b = Math.min(SAMPLES, i + 5)
      const solid = Math.max(0, k - taper)

      return {
        front,
        back,
        steps: steps.slice(0, Math.floor(solid / STEP_EVERY)).join(''),
        spine: fractionAt(spine.length, k),
        edge: fractionAt(edge.length, solid),
        x,
        y,
        // direction of travel, in degrees clockwise from straight down
        angle: (Math.atan2(py[b] - py[a], px[b] - px[a]) * 180) / Math.PI - 90,
      }
    },
  }
}
