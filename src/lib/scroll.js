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

let lenis = null
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
    return lenis ? lenis.scroll : window.scrollY
  },

  /** Read the position from this Lenis instance. Returns a function to undo it. */
  attach(instance) {
    lenis = instance
    lenis.on('scroll', emit)
    emit()
    return () => {
      instance.off('scroll', emit)
      if (lenis === instance) lenis = null
    }
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
