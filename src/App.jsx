import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import '@fontsource/cinzel-decorative/400.css'
import '@fontsource/cinzel-decorative/700.css'
import '@fontsource/cinzel-decorative/900.css'
import '@fontsource/sriracha/400.css'
import './App.css'
import Hero from './components/Hero'
import Journey from './components/Journey'
import Trail from './components/Trail'
import GridOverlay from './components/GridOverlay'
import { useLenis } from './hooks/useLenis'
import { createIntro } from './animations/intro'
import { createHeroScroll } from './animations/heroScroll'
import { createTrail } from './animations/trail'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)
ScrollTrigger.config({ ignoreMobileResize: true })

// The intro plays at the top of the page; don't let a reload land mid-scroll.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

function App() {
  const stage = useRef(null)

  useLenis()

  useGSAP(
    () => {
      const q = gsap.utils.selector(stage)
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      createIntro({ q, reduced })
      const disposeHero = createHeroScroll({ q })
      const disposeTrail = createTrail({ q, stage: stage.current, reduced })

      return () => {
        disposeHero()
        disposeTrail()
      }
    },
    { scope: stage },
  )

  return (
    <main className="stage" ref={stage}>
      <Hero />
      <Journey />
      <Trail />
      <GridOverlay />
    </main>
  )
}

export default App
