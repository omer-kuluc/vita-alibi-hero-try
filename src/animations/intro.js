import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

const FONT = '"Cinzel Decorative"'

// Resolves once the three weights the hero uses are ready, or after a short
// grace period, so a slow font can never leave the hero blank.
export function fontsReady() {
  if (!document.fonts?.load) return Promise.resolve()
  const loads = [400, 700, 900].map((weight) => document.fonts.load(`${weight} 1em ${FONT}`))
  loads.push(document.fonts.load('400 1em Sriracha', 'ğşıİ'))
  const timeout = new Promise((resolve) => setTimeout(resolve, 1800))
  return Promise.race([Promise.all(loads), timeout]).catch(() => {})
}

/**
 * Entrance of the hero type. It only animates the innermost elements
 * (characters, words, glyphs); the scroll timeline moves their wrappers, so
 * scrolling during the intro never fights it.
 *
 * Returns a function that starts it; the loader calls that as it opens.
 */
export function createIntro({ q, reduced }) {
  const content = q('.hero__content')

  if (reduced) {
    gsap.set(content, { autoAlpha: 1 })
    return () => {}
  }

  const vita = SplitText.create(q('.logo__word--vita'), { type: 'chars', charsClass: 'logo__char' })
  const alibi = SplitText.create(q('.logo__word--alibi'), { type: 'chars', charsClass: 'logo__char' })
  const taglines = SplitText.create(q('.tagline'), { type: 'words' })

  const rise = {
    yPercent: 55,
    opacity: 0,
    rotation: 7,
    filter: 'blur(14px)',
    duration: 1.5,
    stagger: 0.09,
    clearProps: 'filter',
  }

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })

  tl.set(content, { autoAlpha: 1 })
    .from(q('.hero__media'), { scale: 1.12, duration: 3, ease: 'power2.out' }, 0)
    .from(vita.chars, rise, 0.35)
    .from(alibi.chars, rise, 0.6)
    .from(
      q('.escape__glyph'),
      { yPercent: 112, duration: 1.6, stagger: { each: 0.085, from: 'center' } },
      0.95,
    )
    .from(
      taglines.words,
      {
        opacity: 0,
        y: 14,
        filter: 'blur(8px)',
        duration: 1.1,
        stagger: 0.09,
        ease: 'power3.out',
        clearProps: 'filter',
      },
      1.55,
    )
    .from(q('.scroll-cue__inner'), { opacity: 0, y: 10, duration: 1, ease: 'power2.out' }, 2.2)

  return () => tl.play()
}
