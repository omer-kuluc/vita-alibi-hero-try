import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { VIDEO } from '../config'
import { buildRibbon } from '../lib/ribbon'

const clamp = (min, max, v) => Math.min(max, Math.max(min, v))

/**
 * The drop and the ribbon it draws.
 *
 * The drop is fixed to the viewport at the height of the video's drop. Once
 * the hero is released, every pixel scrolled moves the head of the ribbon one
 * pixel down the page, so the head stays exactly under the drop and the drop
 * only ever has to move sideways.
 */
export function createTrail({ q, stage }) {
  const hero = q('.hero')[0]
  const track = q('.hero-track')[0]
  const journey = q('.journey')[0]
  const svg = q('.trail')[0]
  const drop = q('.drop')[0]
  const el = {
    shadow: q('.ribbon__shadow')[0],
    spine: q('.ribbon__spine')[0],
    back: q('.ribbon__back')[0],
    front: q('.ribbon__front')[0],
    steps: q('.ribbon__steps')[0],
    edge: q('.ribbon__edge')[0],
    ripples: q('.ripples')[0],
    gradients: svg.querySelectorAll('linearGradient'),
  }

  // Landing: the drop sinks in and rings spread from where it lands.
  const landing = gsap
    .timeline({ paused: true })
    .to(q('.drop__land'), { scale: 0, duration: 0.3, ease: 'power2.in' }, 0)
    .fromTo(q('.ripples__glow'), { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.1)
    .fromTo(
      q('.ripples__ring'),
      { scale: 0, opacity: 0.95, transformOrigin: '50% 50%' },
      {
        scale: (i) => 0.75 + i * 0.6,
        opacity: (i) => 0.55 - i * 0.14,
        duration: 1.5,
        stagger: 0.16,
        ease: 'power2.out',
      },
      0.12,
    )

  let geo = null
  let ribbon = null
  let lastK = -1
  let landed = false

  function layout() {
    const width = stage.clientWidth
    const heroH = hero.offsetHeight
    const journeyH = journey.offsetHeight
    // Nothing to measure while the page is not laid out (e.g. a hidden tab).
    if (!width || !heroH || !journeyH) return
    // Scroll position at which the sticky hero is released.
    const trackEnd = track.offsetTop + track.offsetHeight - heroH

    // Where the chosen drop of the final video frame sits on screen.
    const videoW = heroH * (VIDEO.width / VIDEO.height)
    const x0 = clamp(width * 0.12, width * 0.88, (width - videoW) / 2 + VIDEO.drop.x * videoW)
    const y0 = VIDEO.drop.y * heroH

    // Stop a little short of the page end, so the landing is always reached
    // even when a mobile browser's toolbar changes the viewport height.
    const span = journeyH - heroH * 0.14
    const ribbonWidth = clamp(44, 170, width * 0.085)

    ribbon = buildRibbon({ x0, y0, width, span, ribbonWidth })
    geo = { trackEnd, span, x0, y0 }

    const height = heroH + journeyH
    svg.style.top = `${trackEnd}px`
    svg.setAttribute('width', width)
    svg.setAttribute('height', height)
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)

    el.gradients.forEach((gradient) => {
      gradient.setAttribute('y1', y0)
      gradient.setAttribute('y2', y0 + span)
    })
    el.spine.setAttribute('d', ribbon.spineD)
    el.spine.style.strokeWidth = `${Math.max(3, ribbonWidth * 0.07)}px`
    el.edge.setAttribute('d', ribbon.edgeD)
    el.shadow.setAttribute('transform', `translate(${ribbonWidth * 0.07} ${ribbonWidth * 0.11})`)
    el.ripples.setAttribute(
      'transform',
      `translate(${ribbon.end.x} ${ribbon.end.y}) scale(${ribbonWidth / 100})`,
    )

    // The light at the end of the hero spreads from the same point.
    hero.style.setProperty('--drop-x', `${x0}px`)
    hero.style.setProperty('--drop-y', `${y0}px`)

    lastK = -1
    update()
  }

  function update() {
    if (!geo) return
    const scrolled = window.scrollY - geo.trackEnd
    const k = clamp(0, 1, scrolled / geo.span) * ribbon.count

    if (k !== lastK) {
      lastK = k
      const head = ribbon.at(k)
      el.front.setAttribute('d', head.front)
      el.back.setAttribute('d', head.back)
      el.shadow.setAttribute('d', head.front + head.back)
      el.steps.setAttribute('d', head.steps)
      // pathLength is normalised to 1 on both strokes
      el.spine.style.strokeDasharray = `${head.spine} 2`
      el.edge.style.strokeDasharray = `${head.edge} 2`
      el.spine.style.visibility = el.edge.style.visibility = k > 0 ? 'visible' : 'hidden'
      gsap.set(drop, { x: head.x, rotation: head.angle * 0.7 })
    }

    // Past the end of the ribbon the drop stays with the page.
    gsap.set(drop, { y: geo.y0 - Math.max(0, scrolled - geo.span) })

    const isLanded = scrolled >= geo.span - 1
    if (isLanded !== landed) {
      landed = isLanded
      // Scrolling back up, the drop should be back before the ribbon retreats.
      if (landed) landing.timeScale(1).play()
      else landing.timeScale(4).reverse()
    }
  }

  layout()
  const trigger = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update })
  ScrollTrigger.addEventListener('refresh', layout)

  return () => {
    trigger.kill()
    landing.kill()
    ScrollTrigger.removeEventListener('refresh', layout)
  }
}
