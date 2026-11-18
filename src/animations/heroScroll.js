import gsap from 'gsap'
import { VIDEO } from '../config'
import { scrub } from '../lib/scroll'

// Share of the pinned scroll the video takes. The rest is the handover: the
// drop appears on the last frame and the light behind the door takes over.
const VIDEO_END = 0.86

/**
 * Everything that happens while the hero is pinned, driven 1:1 by scroll
 * position. Timeline positions are fractions of the pinned scroll distance.
 *
 * `onProgress(0..1)` reports how many video frames are decoded and ready.
 */
export function createHeroScroll({ q, onProgress }) {
  const playhead = { progress: 0 }

  // No smoothing of its own: the handover has to be finished at exactly the
  // scroll position where the hero is released. Lenis smooths the scroll
  // itself, the timeline follows its position to a fraction of a pixel (see
  // lib/scroll.js), and the frames are eased separately below.
  const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true })

  tl.to(playhead, { progress: 1, duration: VIDEO_END }, 0)

  // The type clears out as the camera starts moving towards the door.
  // Transforms and opacity only: these run on every scroll tick.
  tl.to(q('.tagline'), { opacity: 0, y: -24, duration: 0.09, ease: 'power1.in' }, 0.015)
    .to(
      q('.logo__word'),
      { yPercent: -70, opacity: 0, duration: 0.15, stagger: 0.025, ease: 'power1.in' },
      0.02,
    )
    .to(
      q('.escape__letter'),
      { xPercent: (i) => (i - 2.5) * 34, yPercent: -26, opacity: 0, duration: 0.2, ease: 'power1.in' },
      0.04,
    )

  // Handover. Our drop fades in over one drop of the final frame, at that
  // drop's size, then grows while the light spreads from the same point until
  // the whole hero is one colour.
  tl.fromTo(q('.drop__reveal'), { opacity: 0 }, { opacity: 1, duration: 0.03 }, VIDEO_END)
    .fromTo(q('.drop__reveal'), { scale: 0.3 }, { scale: 1, duration: 0.11, ease: 'power1.inOut' }, 0.885)
    // A gentle curve and no more growth than it takes to cover the screen:
    // the steeper this is, the further the edge of the light travels for each
    // pixel scrolled.
    .fromTo(q('.hero__bloom'), { scale: 0 }, { scale: 2.4, duration: 0.12, ease: 'power1.in' }, 0.875)
    .fromTo(q('.hero__wash'), { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.95)

  const unscrub = scrub(tl, { trigger: q('.hero-track')[0], start: 'top top', end: 'bottom bottom' })

  const disposeFrames = bindFrames({
    canvas: q('.hero__video')[0],
    ambient: q('.hero__ambient')[0],
    playhead,
    onProgress,
  })

  return () => {
    unscrub()
    disposeFrames()
  }
}

/**
 * Draws the video as a sequence of stills that are fully decoded before the
 * hero opens. Scrolling never asks the browser to decode anything; it only
 * picks a frame and paints it. Frames are never blended: where the camera
 * moves fast, a blend of two frames shows as a double image.
 */
function bindFrames({ canvas, ambient, playhead, onProgress }) {
  const ctx = canvas.getContext('2d')
  canvas.width = VIDEO.width
  canvas.height = VIDEO.height

  // A handful of pixels, stretched over the whole hero by CSS. The upscale
  // turns them into a soft wash of the video's edge colours.
  const ambientCtx = ambient.getContext('2d')
  ambient.width = 4
  ambient.height = 12
  ambientCtx.imageSmoothingQuality = 'high'

  // On screens wider than the video its sides fade into that wash. The fade is
  // painted into the canvas, which is far cheaper than a CSS mask on a layer
  // that changes every frame.
  const wide = window.matchMedia(`(min-aspect-ratio: ${VIDEO.width} / ${VIDEO.height})`)
  const feather = ctx.createLinearGradient(0, 0, VIDEO.width, 0)
  feather.addColorStop(0, 'rgba(0,0,0,0)')
  feather.addColorStop(0.18, '#000')
  feather.addColorStop(0.82, '#000')
  feather.addColorStop(1, 'rgba(0,0,0,0)')

  // Decoded frames cost memory (about 1.6 MB each). Phones and low-memory
  // devices keep every second one.
  const light = window.matchMedia('(max-width: 767px)').matches || (navigator.deviceMemory ?? 8) <= 4
  const step = light ? 2 : 1
  const sources = []
  for (let i = 0; i < VIDEO.frames; i += step) sources.push(VIDEO.frameSrc(i))
  const count = sources.length

  const frames = new Array(count).fill(null)
  let disposed = false
  let drawn = -1
  let dirty = true

  // The closest frame that is ready, in case one failed to load.
  const nearest = (index) => {
    for (let d = 0; d < count; d++) {
      if (index - d >= 0 && frames[index - d]) return frames[index - d]
      if (index + d < count && frames[index + d]) return frames[index + d]
    }
    return null
  }

  const paint = (index) => {
    const base = nearest(index)
    if (!base) return false
    const { width: w, height: h } = canvas

    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(base, 0, 0, w, h)
    if (wide.matches) {
      ctx.globalCompositeOperation = 'destination-in'
      ctx.fillStyle = feather
      ctx.fillRect(0, 0, w, h)
    }

    const strip = base.width * VIDEO.edgeStrip
    ambientCtx.drawImage(base, 0, 0, strip, base.height, 0, 0, 2, ambient.height)
    ambientCtx.drawImage(base, base.width - strip, 0, strip, base.height, 2, 0, 2, ambient.height)
    return true
  }

  // Ease towards the scroll position rather than jumping to it.
  let current = 0
  const tick = () => {
    const target = playhead.progress * (count - 1)
    current += (target - current) * (1 - Math.pow(0.75, gsap.ticker.deltaRatio(60)))
    if (Math.abs(target - current) < 0.01) current = target
    const index = Math.round(current)
    if (!dirty && index === drawn) return
    if (paint(index)) {
      drawn = index
      dirty = false
    }
  }
  gsap.ticker.add(tick)

  const invalidate = () => {
    dirty = true
  }
  wide.addEventListener('change', invalidate)

  // createImageBitmap hands back a bitmap that is ready to draw; the fallback
  // decodes an <img> explicitly.
  const decode = async (src) => {
    if ('createImageBitmap' in window) {
      const response = await fetch(src)
      if (!response.ok) throw new Error(`${src}: ${response.status}`)
      return createImageBitmap(await response.blob())
    }
    const image = new Image()
    image.src = src
    await image.decode()
    return image
  }

  // Fetch and decode a few at a time.
  let nextIndex = 0
  let done = 0
  const worker = async () => {
    while (!disposed && nextIndex < count) {
      const i = nextIndex++
      try {
        const frame = await decode(sources[i])
        if (disposed) {
          frame.close?.()
          return
        }
        frames[i] = frame
      } catch (error) {
        console.warn('Hero frame failed to load', error)
      }
      done++
      if (i === 0) dirty = true
      onProgress?.(done / count)
    }
  }
  for (let n = 0; n < 6; n++) worker()

  return () => {
    disposed = true
    gsap.ticker.remove(tick)
    wide.removeEventListener('change', invalidate)
    frames.forEach((frame) => frame?.close?.())
  }
}
