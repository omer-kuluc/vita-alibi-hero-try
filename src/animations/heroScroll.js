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
  const video = q('.hero__video')[0]
  const ambient = q('.hero__ambient')[0]
  const playhead = { progress: 0 }

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: q('.hero-track')[0],
      start: 'top top',
      end: 'bottom bottom',
      // No extra smoothing here: the handover has to be finished at exactly
      // the scroll position where the hero is released. Lenis smooths the
      // scroll itself, and the video is eased separately below.
      scrub: true,
    },
  })

  tl.to(playhead, { progress: 1, duration: VIDEO_END }, 0)

  // The type clears out as the camera starts moving towards the door.
  tl.to(q('.scroll-cue'), { opacity: 0, duration: 0.03 }, 0)
    .to(q('.tagline'), { opacity: 0, y: -24, duration: 0.09, ease: 'power1.in' }, 0.015)
    .to(
      q('.logo__word'),
      { yPercent: -70, opacity: 0, filter: 'blur(10px)', duration: 0.15, stagger: 0.025, ease: 'power1.in' },
      0.02,
    )
    .to(
      q('.escape__letter'),
      {
        xPercent: (i) => (i - 2.5) * 34,
        yPercent: -26,
        opacity: 0,
        filter: 'blur(12px)',
        duration: 0.2,
        ease: 'power1.in',
      },
      0.04,
    )

  // Handover. A glint marks one drop in the final frame, ours grows out of it,
  // then the light spreads from that point until the whole hero is one colour.
  tl.fromTo(
    q('.drop__ring'),
    { scale: 0.2, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.02, ease: 'power2.out' },
    VIDEO_END - 0.005,
  )
    .to(q('.drop__ring'), { scale: 2.6, opacity: 0, duration: 0.05 }, VIDEO_END + 0.015)
    .fromTo(
      q('.drop__reveal'),
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.05, ease: 'back.out(2)' },
      VIDEO_END,
    )
    .fromTo(q('.hero__bloom'), { scale: 0 }, { scale: 16, duration: 0.115, ease: 'power2.in' }, 0.88)
    .fromTo(q('.hero__wash'), { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.95)

  return bindVideo(video, ambient, playhead)
}

/** Keeps the video (and the stretched edges beside it) on the playhead. */
function bindVideo(video, ambient, playhead) {
  const ctx = ambient.getContext('2d')
  ambient.width = 4
  ambient.height = 172
  ctx.imageSmoothingQuality = 'high'

  // Left half of the canvas is the video's left edge, right half its right
  // edge; CSS stretches the canvas across the whole hero.
  const paint = () => {
    if (video.readyState < 2) return
    const { videoWidth: w, videoHeight: h } = video
    const strip = Math.max(1, w * VIDEO.edgeStrip)
    ctx.drawImage(video, 0, 0, strip, h, 0, 0, 2, ambient.height)
    ctx.drawImage(video, w - strip, 0, strip, h, 2, 0, 2, ambient.height)
  }

  // Ease towards the scroll position instead of jumping to it, and never
  // queue a seek while one is still in flight.
  let current = 0
  const tick = () => {
    if (!video.duration) return
    const target = playhead.progress * (video.duration - 0.04)
    current += (target - current) * 0.2
    if (Math.abs(target - current) < 0.002) current = target
    if (!video.seeking && Math.abs(video.currentTime - current) > 0.008) {
      video.currentTime = current
    }
  }
  gsap.ticker.add(tick)

  let frameCallback = 0
  const hasFrameCallback = 'requestVideoFrameCallback' in video
  if (hasFrameCallback) {
    const onFrame = () => {
      paint()
      frameCallback = video.requestVideoFrameCallback(onFrame)
    }
    frameCallback = video.requestVideoFrameCallback(onFrame)
  }
  video.addEventListener('seeked', paint)
  video.addEventListener('loadeddata', paint)
  paint()

  // iOS only allows seeking a video after it has been played once.
  const prime = () => {
    const attempt = video.play()
    if (attempt) attempt.then(() => video.pause()).catch(() => {})
  }
  prime()
  window.addEventListener('touchstart', prime, { once: true, passive: true })

  return () => {
    gsap.ticker.remove(tick)
    if (hasFrameCallback) video.cancelVideoFrameCallback(frameCallback)
    video.removeEventListener('seeked', paint)
    video.removeEventListener('loadeddata', paint)
    window.removeEventListener('touchstart', prime)
  }
}
