import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// The scroll position everything on the page is animated from.
//
// The browser rounds the real scroll position to whole device pixels. While a
// smooth scroll is easing to a stop it moves by a fraction of a pixel per
// frame, so the rounded position stands still for a few frames and then steps.
// Anything that turns a pixel of scroll into many pixels of movement (a circle
// growing to fill the screen) shows those steps as a shiver.
//
// Lenis knows the position before rounding, so that is what is read here.
//
// One thing is left to iron out. At the end of every scroll gesture Lenis
// stops easing and jumps the rest of the way: first to its target as soon as
// the two round to the same pixel, then to wherever the browser rounded that.
// Together that can be a full pixel in one frame, which the same circles show
// as a small hop just as the scroll comes to rest. So the position handed out
// here follows Lenis through a short ease, and is never allowed to trail it by
// more than a few pixels: in motion that is a constant offset nobody can see,
// and at rest it turns the jump into a glide. The ease is applied twice over,
// so the glide also starts gently instead of with a kick.

const SLACK = 1.5 // px, per stage
const FOLLOW = 0.12 // share of the remaining distance covered per 60fps frame

let lenis = null
let middle = 0
let smooth = 0

const follow = (from, to, share) => {
  const next = from + (to - from) * share
  return gsap.utils.clamp(to - SLACK, to + SLACK, next)
}
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

// Without Lenis (reduced motion) the browser's own position is all there is.
window.addEventListener(
  'scroll',
  () => {
    if (!lenis) emit()
  },
  { passive: true },
)

export const pageScroll = {
  /** Scroll position in px, including the fraction the browser rounds away. */
  get y() {
    return lenis ? smooth : window.scrollY
  },

  /** Read the position from this Lenis instance. Returns a function to undo it. */
  attach(instance) {
    lenis = instance
    middle = smooth = lenis.scroll
    emit()
    return () => {
      if (lenis === instance) lenis = null
    }
  },

  /** Once per frame, right after Lenis has moved: follow it and tell everyone. */
  tick() {
    if (!lenis) return
    const raw = lenis.scroll
    if (smooth === raw) return
    const share = 1 - Math.pow(1 - FOLLOW, gsap.ticker.deltaRatio(60))
    middle = follow(middle, raw, share)
    smooth = follow(smooth, middle, share)
    if (Math.abs(raw - smooth) < 0.005) middle = smooth = raw
    emit()
  },

  /** Call `fn` whenever the position changes. Returns a function to stop. */
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}

/**
 * Ties a paused timeline to the scroll: its progress runs 0..1 between the
 * start and end of a ScrollTrigger described by `vars`, with no smoothing or
 * lag of its own. Returns a function that undoes it.
 */
export function scrub(timeline, vars, { invalidateOnRefresh = false } = {}) {
  const trigger = ScrollTrigger.create(vars)

  const update = () => {
    const length = trigger.end - trigger.start
    const progress = length > 0 ? gsap.utils.clamp(0, 1, (pageScroll.y - trigger.start) / length) : 0
    timeline.progress(progress)
  }
  // Values given as functions are measured from the layout: take them again.
  const refresh = () => {
    if (invalidateOnRefresh) timeline.progress(0).invalidate()
    update()
  }

  const unsubscribe = pageScroll.subscribe(update)
  ScrollTrigger.addEventListener('refresh', refresh)
  update()

  return () => {
    unsubscribe()
    ScrollTrigger.removeEventListener('refresh', refresh)
    trigger.kill()
  }
}
