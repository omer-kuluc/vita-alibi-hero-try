import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { pageScroll } from '../lib/scroll'

/** Smooth scrolling, driven by GSAP's ticker so it shares a frame with ScrollTrigger. */
export function useLenis() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 })
    // The animations read their position from Lenis (see lib/scroll.js), in
    // the same frame and after it has moved.
    const raf = (time) => {
      lenis.raf(time * 1000)
      pageScroll.tick()
    }

    // Hold still until the opening sequence has finished.
    const release = () => lenis.start()
    if (document.documentElement.classList.contains('is-loading')) lenis.stop()
    window.addEventListener('loader:done', release)

    lenis.on('scroll', ScrollTrigger.update)
    const detach = pageScroll.attach(lenis)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      detach()
      window.removeEventListener('loader:done', release)
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])
}
