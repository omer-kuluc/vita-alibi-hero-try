import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { VIDEO } from '../config'
import { scrub } from '../lib/scroll'

/**
 * The watch scene, driven 1:1 by scroll while it is pinned. Timeline positions
 * are fractions of the pinned scroll distance:
 *
 *   0.00  the dial turns out of the drop to face the viewer, the strap grows
 *   0.12  ticks, Roman numerals and hands appear: an ordinary watch, its
 *         hands running at their own steady pace (not tied to the scroll)
 *   0.42  the numerals leave
 *   0.55  the view goes into the dial until its face is the whole screen;
 *         the hands are still turning as they fade
 *   0.68  six lines run out from the centre to six words
 *   0.84  CHOOSE is set at the centre
 *
 * Everything that moves is a layer of its own (will-change in Choose.css) and
 * is only ever transformed or faded, so nothing is redrawn while scrolling.
 */
export function createWatch({ q }) {
  const scene = q('.choose')[0]
  const dial = q('.watch__dial')[0]
  const flood = q('.watch__flood')[0]
  const frame = q('.watch__frame')[0]
  const hour = q('.watch__hand--hour')[0]
  const minute = q('.watch__hand--minute')[0]
  const numerals = q('.watch__numeral')
  const lines = q('.choose__line')
  const labels = q('.choose__label-text')
  const wordText = q('.choose__word-text')[0]
  const word = SplitText.create(wordText, { type: 'chars', charsClass: 'choose__char' })

  // Each line runs from the edge of the CHOOSE lettering to just short of
  // its word, as measured on the page.
  function layout() {
    const width = scene.clientWidth
    const height = scene.offsetHeight
    if (!width || !height) return
    const cx = width / 2
    const cy = VIDEO.drop.y * height

    const svg = lines[0].ownerSVGElement
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)

    const wordSize = parseFloat(getComputedStyle(wordText).fontSize)
    const halfW = wordText.offsetWidth / 2 + wordSize * 0.12
    const halfH = wordSize * 0.72

    labels.forEach((label, i) => {
      const row = label.closest('.choose__row')
      const size = parseFloat(getComputedStyle(label).fontSize)
      const top = row.offsetTop + label.offsetTop
      const x = label.offsetLeft + label.offsetWidth / 2
      const above = i < 3
      const y = above ? top + label.offsetHeight + size * 0.9 : top - size * 0.9

      // Where the ray from the centre to the word leaves the lettering's box.
      const dx = x - cx
      const dy = y - cy
      const t = Math.min(halfW / Math.max(1, Math.abs(dx)), halfH / Math.max(1, Math.abs(dy)))

      const line = lines[i]
      line.setAttribute('x1', cx + dx * t)
      line.setAttribute('y1', cy + dy * t)
      line.setAttribute('x2', x)
      line.setAttribute('y2', y)
    })
  }

  // Staggered tweens only take up their start values as the playhead reaches
  // them, so everything that enters later is hidden up front.
  gsap.set([numerals, labels, word.chars], { opacity: 0 })
  gsap.set(numerals, { xPercent: -50, yPercent: -50 })

  // Follows the scroll to a fraction of a pixel (see lib/scroll.js): the
  // growing dial and disc turn every pixel scrolled into several on screen.
  const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true })

  // --- the watch forms ----------------------------------------------
  // An even ease, so the dial grows by about the same amount for every step
  // of the scroll instead of doing most of its growing in the first few.
  tl.fromTo(
    dial,
    { rotationX: 82, scale: 0.08, transformPerspective: 900 },
    { rotationX: 0, scale: 1, duration: 0.16, ease: 'sine.inOut', force3D: true },
    0,
  )
    .fromTo(dial, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0)
    .fromTo(q('.strap__bottom'), { scaleY: 0 }, { scaleY: 1, duration: 0.13, ease: 'power1.out' }, 0.03)
    // the drop settles as the pin the hands turn on
    .fromTo(q('.drop__land'), { scale: 1 }, { scale: 0.5, duration: 0.08 }, 0.05)
    .fromTo(q('.watch__ticks'), { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.12)
    .fromTo(
      numerals,
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 0.05, stagger: 0.006, ease: 'power2.out' },
      0.13,
    )
    .fromTo([hour, minute], { scale: 0 }, { scale: 1, duration: 0.06, ease: 'back.out(1.6)' }, 0.15)

  // --- time comes loose ---------------------------------------------
  tl.to(numerals, { opacity: 0, scale: 1.5, duration: 0.05, stagger: 0.007, ease: 'power1.in' }, 0.42)
    .to(q('.watch__ticks'), { opacity: 0, duration: 0.06 }, 0.5)

  // --- into the dial -------------------------------------------------
  // The flat disc starts exactly over the face (80% of the frame's width) and
  // the dial grows with it on the same curve, so the two stay locked together
  // all the way: one move into the dial, not two shapes growing apart.
  const faceScale = () => (frame.offsetWidth * 0.8) / flood.offsetWidth
  const zoom = { duration: 0.13, ease: 'power1.in', force3D: true }
  tl.fromTo(flood, { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0.54)
    .fromTo(flood, { scale: faceScale }, { scale: 1.5, ...zoom }, 0.55)
    .to(dial, { scale: () => 1.5 / faceScale(), ...zoom }, 0.55)
    .to(dial, { autoAlpha: 0, duration: 0.08, ease: 'power1.in' }, 0.56)
    .to(q('.drop__land'), { opacity: 0, duration: 0.04 }, 0.56)
    .fromTo(q('.choose__grain'), { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.66)

  // --- CHOOSE ---------------------------------------------------------
  tl.fromTo(
    lines,
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: 0.1, stagger: 0.012, ease: 'power2.out' },
    0.68,
  )
    .fromTo(
      labels,
      { opacity: 0, y: (i) => (i < 3 ? 12 : -12) },
      { opacity: 1, y: 0, duration: 0.06, stagger: 0.012, ease: 'power2.out', force3D: true },
      0.75,
    )
    .fromTo(
      word.chars,
      { opacity: 0, yPercent: 45 },
      { opacity: 1, yPercent: 0, duration: 0.07, stagger: 0.012, ease: 'power2.out', force3D: true },
      0.84,
    )
    // hold the finished screen for the last stretch of scroll
    .set({}, {}, 1)

  const unscrub = scrub(
    tl,
    { trigger: q('.choose-track')[0], start: 'top top', end: 'bottom bottom' },
    { invalidateOnRefresh: true },
  )

  // --- the hands ------------------------------------------------------
  // They run by the clock, not by the scroll: always forwards, at one steady
  // speed, whichever way and however fast the page is scrolled. Only their
  // appearing and fading belongs to the scroll (above, with the dial).
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const setMinute = gsap.quickSetter(minute, 'rotation', 'deg')
  const setHour = gsap.quickSetter(hour, 'rotation', 'deg')
  // Degrees per second: the minute hand goes round in ten seconds, the hour
  // hand at a twelfth of that, as on any watch.
  const SPEED = { minute: 36, hour: 3 }
  const angle = { minute: 60, hour: 305 }
  setMinute(angle.minute)
  setHour(angle.hour)

  const tick = (time, delta) => {
    // Only while the dial is on screen.
    const progress = tl.progress()
    if (still || progress <= 0 || progress >= 0.66) return
    // A long gap between frames (a hidden tab) is not time on the dial.
    const seconds = Math.min(delta, 50) / 1000
    angle.minute = (angle.minute + seconds * SPEED.minute) % 360
    angle.hour = (angle.hour + seconds * SPEED.hour) % 360
    setMinute(angle.minute)
    setHour(angle.hour)
  }
  gsap.ticker.add(tick)

  layout()
  ScrollTrigger.addEventListener('refresh', layout)

  return () => {
    unscrub()
    gsap.ticker.remove(tick)
    ScrollTrigger.removeEventListener('refresh', layout)
  }
}
