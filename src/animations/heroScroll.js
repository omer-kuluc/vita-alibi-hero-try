import gsap from 'gsap'
import { VIDEO } from '../config'

// Share of the pinned scroll the video takes. The rest is the handover: the
// drop appears on the last frame and the light behind the door takes over.
const VIDEO_END = 0.86

/**
 * Everything that happens while the hero is pinned, driven 1:1 by scroll
 * position. Timeline positions are fractions of the pinned scroll distance.
 */
export function createHeroScroll({ q }) {
  const playhead = { progress: 0 }

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: q('.hero-track')[0],
      start: 'top top',
      end: 'bottom bottom',
      // No extra smoothing here: the handover has to be finished at exactly
      // the scroll position where the hero is released. Lenis smooths the
      // scroll itself, and the frames are eased separately below.
      scrub: true,
    },
  })

  tl.to(playhead, { progress: 1, duration: VIDEO_END }, 0)

  // The type clears out as the camera starts moving towards the door.
  // Transforms and opacity only: these run on every scroll tick.
  tl.to(q('.scroll-cue'), { opacity: 0, duration: 0.03 }, 0)
    .to(q('.tagline'), { opacity: 0, y: -24, duration: 0.09, ease: 'power1.in' }, 0.015)
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
    .fromTo(q('.hero__bloom'), { scale: 0 }, { scale: 16, duration: 0.115, ease: 'power2.in' }, 0.88)
    .fromTo(q('.hero__wash'), { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.95)

  return bindFrames({
    canvas: q('.hero__video')[0],
    ambient: q('.hero__ambient')[0],
    loading: q('.hero__loading')[0],
    playhead,
  })
}

/**
 * Draws the video as a sequence of pre-decoded stills. Scrolling never asks
 * the browser to decode anything; it only picks a frame and paints it.
 */
function bindFrames({ canvas, ambient, loading, playhead }) {
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

  const frames = new Array(VIDEO.frames)
  const ready = new Uint8Array(VIDEO.frames)
  let loaded = 0
  let drawn = -1
  let dirty = true

  // The closest frame that has arrived, so scrolling works while loading.
  const nearestReady = (index) => {
    for (let d = 0; d < VIDEO.frames; d++) {
      if (index - d >= 0 && ready[index - d]) return index - d
      if (index + d < VIDEO.frames && ready[index + d]) return index + d
    }
    return -1
  }

  const paint = (index) => {
    const frame = frames[index]
    const { width: w, height: h } = canvas
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(frame, 0, 0, w, h)
    if (wide.matches) {
      ctx.globalCompositeOperation = 'destination-in'
      ctx.fillStyle = feather
      ctx.fillRect(0, 0, w, h)
    }

    const strip = frame.naturalWidth * VIDEO.edgeStrip
    const fh = frame.naturalHeight
    ambientCtx.drawImage(frame, 0, 0, strip, fh, 0, 0, 2, ambient.height)
    ambientCtx.drawImage(frame, frame.naturalWidth - strip, 0, strip, fh, 2, 0, 2, ambient.height)
  }

  // Ease towards the scroll position rather than jumping to it.
  let current = 0
  const tick = () => {
    const target = playhead.progress * (VIDEO.frames - 1)
    current += (target - current) * 0.25
    if (Math.abs(target - current) < 0.01) current = target
    const index = nearestReady(Math.round(current))
    if (index < 0 || (index === drawn && !dirty)) return
    paint(index)
    drawn = index
    dirty = false
  }
  gsap.ticker.add(tick)

  const onResize = () => {
    dirty = true
  }
  wide.addEventListener('change', onResize)

  for (let i = 0; i < VIDEO.frames; i++) {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      ready[i] = 1
      loaded++
      dirty = true
      loading.style.transform = `scaleX(${loaded / VIDEO.frames})`
      if (loaded === VIDEO.frames) loading.classList.add('is-done')
    }
    image.src = VIDEO.frameSrc(i)
    frames[i] = image
  }

  return () => {
    gsap.ticker.remove(tick)
    wide.removeEventListener('change', onResize)
    frames.forEach((image) => {
      image.onload = null
    })
  }
}
