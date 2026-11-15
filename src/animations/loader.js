import gsap from 'gsap'
import { fontsReady } from './intro'

// Even with every frame cached the sequence takes at least this long, so the
// REALITY -> DREAM turn is always readable.
const MIN_SECONDS = 3.6

const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * Opening sequence. `setProgress(0..1)` feeds it the loading state; once the
 * count reaches 100 the blurred backdrop dissolves into the hero and `onOpen`
 * fires.
 * Dispatches `loader:done` on window when scrolling may start.
 */
export function createLoader({ q, reduced, onOpen }) {
  const root = q('.loader')[0]
  const lockup = q('.loader__lockup')[0]
  const num = q('.loader__num')[0]
  const ality = q('.loader__ality')[0]
  const dream = [q('.loader__d')[0], q('.loader__am')[0]]
  const html = document.documentElement

  html.classList.add('is-loading')

  let actual = 0
  let shown = 0
  let startedAt = 0
  let lastPercent = -1

  const render = (v) => {
    const percent = Math.round(v * 100)
    if (percent !== lastPercent) {
      lastPercent = percent
      num.textContent = percent
    }
    // The emphasis moves from RE·ALITY to D·RE·AM as the count climbs.
    ality.style.opacity = 1 - smooth(0.3, 0.88, v)
    const rise = 0.16 + 0.84 * smooth(0.35, 0.92, v)
    dream[0].style.opacity = dream[1].style.opacity = rise
  }

  const finish = () => {
    root.style.display = 'none'
    html.classList.remove('is-loading')
    window.dispatchEvent(new Event('loader:done'))
  }

  const open = () => {
    if (reduced) {
      onOpen?.()
      gsap.to(root, { autoAlpha: 0, duration: 0.4, onComplete: finish })
      return
    }
    gsap
      .timeline({ onComplete: finish })
      .to(q('.loader__percent'), { opacity: 0, duration: 0.5, ease: 'power1.out' }, 0.1)
      // D and AM settle to the middle of RE: one word, on one line.
      .to(dream, { yPercent: 50, duration: 1.1, ease: 'power3.inOut' }, 0.25)
      // DREAM lifts away while the backdrop dissolves into the hero behind it.
      .to(lockup, { opacity: 0, y: -28, duration: 1.2, ease: 'power2.inOut' }, 1.9)
      .to(q('.loader__bg'), { opacity: 0, duration: 2, ease: 'power2.inOut' }, 2.1)
      .call(() => onOpen?.(), null, 2.1)
  }

  const tick = () => {
    const elapsed = (performance.now() - startedAt) / 1000
    const target = Math.min(actual, elapsed / MIN_SECONDS)
    shown += (target - shown) * 0.07
    if (target - shown < 0.003) shown = target
    render(shown)
    if (shown >= 1) {
      gsap.ticker.remove(tick)
      open()
    }
  }

  // Start counting once the lettering can be shown in its own face.
  fontsReady().then(() => {
    startedAt = performance.now()
    gsap.to(lockup, { opacity: 1, duration: 0.6, ease: 'power2.out' })
    gsap.ticker.add(tick)
  })

  return {
    setProgress(value) {
      actual = Math.max(actual, value)
    },
    dispose() {
      gsap.ticker.remove(tick)
      html.classList.remove('is-loading')
    },
  }
}
