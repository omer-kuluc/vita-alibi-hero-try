import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/** Smooth scrolling, driven by GSAP's ticker so it shares a frame with ScrollTrigger. */
export function useLenis() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 })
    const raf = (time) => lenis.raf(time * 1000)

    // Hold still until the opening sequence has finished.
    const release = () => lenis.start()
    if (document.documentElement.classList.contains('is-loading')) lenis.stop()
    window.addEventListener('loader:done', release)

    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      window.removeEventListener('loader:done', release)
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])
}
