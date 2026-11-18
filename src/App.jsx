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
import Choose from './components/Choose'
import GridOverlay from './components/GridOverlay'
import Loader from './components/Loader'
import { useLenis } from './hooks/useLenis'
import { createIntro } from './animations/intro'
import { createLoader } from './animations/loader'
import { createHeroScroll } from './animations/heroScroll'
import { createTrail } from './animations/trail'
import { createWatch } from './animations/watch'

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

      const playIntro = createIntro({ q, reduced })
      const loader = createLoader({ q, reduced, onOpen: playIntro })
      const disposeHero = createHeroScroll({ q, onProgress: loader.setProgress })
      const disposeTrail = createTrail({ q, stage: stage.current, reduced })
      const disposeWatch = createWatch({ q })

      return () => {
        loader.dispose()
        disposeHero()
        disposeTrail()
        disposeWatch()
      }
    },
    { scope: stage },
  )

  return (
    <main className="stage" ref={stage}>
      <Hero />
      <Journey />
      <Choose />
      <Trail />
      <Loader />
      <GridOverlay />
    </main>
  )
}

export default App
