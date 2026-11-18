import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { VIDEO } from '../config'
import { buildRibbon } from '../lib/ribbon'

const clamp = (min, max, v) => Math.min(max, Math.max(min, v))

// How far before the outermost point of a bend its note starts to unroll,
// as a share of the ribbon's length.
const NOTE_LEAD = 0.055

/**
 * The drop, the ribbon it draws, and the notes at the ribbon's bends.
 *
 * The drop is fixed to the viewport at the height of the video's drop. Once
 * the hero is released, every pixel scrolled moves the head of the ribbon one
 * pixel down the page, so the head stays exactly under the drop and the drop
 * only ever has to move sideways.
 */
export function createTrail({ q, stage, reduced }) {
  const hero = q('.hero')[0]
  const track = q('.hero-track')[0]
  const journey = q('.journey')[0]
  const svg = q('.trail')[0]
  const notesLayer = q('.notes')[0]
  const drop = q('.drop')[0]
  const el = {
    shadow: q('.ribbon__shadow')[0],
    spine: q('.ribbon__spine')[0],
    back: q('.ribbon__back')[0],
    front: q('.ribbon__front')[0],
    gradients: svg.querySelectorAll('linearGradient'),
  }

  // The watch scene that follows the journey. Its strap is a copy of the end
  // of the ribbon (see the handover in update()).
  const scene = q('.choose')[0]
  const strap = q('.strap__ribbon')[0]
  const strapPaths = q('.strap__ribbon path')

  // Each note unrolls like a scroll, then its words settle in.
  const notes = q('.note').map((note) => {
    const find = gsap.utils.selector(note)
    const split = SplitText.create(find('.note__text'), { type: 'words' })
    const tl = gsap.timeline({ paused: true })

    if (reduced) {
      tl.set(note, { autoAlpha: 1 })
    } else {
      tl.set(note, { autoAlpha: 1 })
        .fromTo(
          find('.note__unroll'),
          { clipPath: 'inset(0% 0% 100% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power3.out' },
          0,
        )
        .fromTo(find('.note__rail'), { yPercent: -100 }, { yPercent: 0, duration: 1, ease: 'power3.out' }, 0)
        .from(find('.note__index'), { opacity: 0, duration: 0.5 }, 0.3)
        .from(
          split.words,
          { opacity: 0, y: 10, duration: 0.6, stagger: 0.03, ease: 'power2.out' },
          0.35,
        )
    }
    return { el: note, tl, shown: false, at: Infinity }
  })

  let geo = null
  let ribbon = null
  let lastK = -1
  let handedOver = null

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

    // The ribbon ends at the centre of the watch, at the exact scroll position
    // where the watch scene pins: one hero height of scroll brings the scene
    // from the bottom of the screen to the top. Its last stretch runs
    // straight down, so it can turn into the strap.
    const span = heroH + journeyH
    const tail = heroH * 0.66
    const ribbonWidth = clamp(44, 170, width * 0.085)

    ribbon = buildRibbon({ x0, y0, width, span, tail, ribbonWidth })
    geo = { trackEnd, span, x0, y0 }

    const height = heroH + journeyH
    svg.style.top = notesLayer.style.top = `${trackEnd}px`
    notesLayer.style.height = `${height}px`
    svg.setAttribute('width', width)
    svg.setAttribute('height', height)
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)

    el.gradients.forEach((gradient) => {
      gradient.setAttribute('y1', y0)
      gradient.setAttribute('y2', y0 + span)
    })
    el.spine.setAttribute('d', ribbon.spineD)
    el.spine.style.strokeWidth = `${Math.max(3, ribbonWidth * 0.07)}px`
    el.shadow.setAttribute('transform', `translate(${ribbonWidth * 0.07} ${ribbonWidth * 0.11})`)

    // Strap: the same outline as the ribbon's tail, drawn in the pinned scene.
    // The scene's top edge is `span` below the top of the ribbon's overlay.
    const tailD = ribbon.tail(span - 60)
    strap.setAttribute('transform', `translate(0 ${-span})`)
    strapPaths.forEach((path) => path.setAttribute('d', tailD))
    strapPaths[0].setAttribute('transform', `translate(${ribbonWidth * 0.07} ${ribbonWidth * 0.11})`)
    scene.style.setProperty('--strap-w', `${ribbon.halfWidth * 2}px`)
    scene.style.setProperty('--ribbon-w', `${ribbonWidth}px`)
    scene.style.setProperty('--cy', `${y0}px`)

    // Each note sits level with its bend, on the side the ribbon leaves free.
    notes.forEach((note, i) => {
      const bend = ribbon.bends[i]
      if (!bend) return
      note.el.style.top = `${bend.y}px`
      note.el.classList.toggle('is-left', bend.side > 0)
      note.el.classList.toggle('is-right', bend.side < 0)
      note.at = bend.k - ribbon.count * NOTE_LEAD
    })

    // The light at the end of the hero spreads from the same point.
    hero.style.setProperty('--drop-x', `${x0}px`)
    hero.style.setProperty('--drop-y', `${y0}px`)

    lastK = -1
    handedOver = null
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
      // pathLength is normalised to 1
      el.spine.style.strokeDasharray = `${head.spine} 2`
      el.spine.style.visibility = k > 0 ? 'visible' : 'hidden'
      gsap.set(drop, { x: head.x, rotation: head.angle * 0.7 })

      notes.forEach((note) => {
        const show = k >= note.at
        if (show === note.shown) return
        note.shown = show
        // Roll back up faster than it unrolled.
        if (show) note.tl.timeScale(1).play()
        else note.tl.timeScale(2.2).reverse()
      })
    }

    gsap.set(drop, { y: geo.y0 })

    // Handover. Once the watch scene is pinned the ribbon scrolls away with
    // the page, so an identical copy of its tail takes over inside the scene.
    const pinned = scrolled >= geo.span
    if (pinned !== handedOver) {
      handedOver = pinned
      strap.style.visibility = pinned ? 'visible' : 'hidden'
      // Only the ribbon's straight tail is on screen at this point, and the
      // strap is drawn exactly over it. Hide the ribbon, or its shadow doubles
      // up under the strap and its tip slides away beneath it.
      svg.style.visibility = pinned ? 'hidden' : 'visible'
    }
  }

  layout()
  const trigger = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update })
  ScrollTrigger.addEventListener('refresh', layout)

  return () => {
    trigger.kill()
    notes.forEach((note) => note.tl.kill())
    ScrollTrigger.removeEventListener('refresh', layout)
  }
}
