import { VIDEO } from '../config'
import './Hero.css'

// Cinzel Decorative keeps its swash capitals in the uppercase slots and plain
// capitals in the lowercase ones, so the case of each word below is a design
// choice: uppercase = swashes, lowercase = plain.
const ESCAPE = 'escape'.split('')

export default function Hero() {
  return (
    <div className="hero-track">
      <section className="hero">
        <div className="hero__media" aria-hidden="true">
          <canvas className="hero__ambient" />
          <video
            className="hero__video"
            src={VIDEO.src}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
          />
          <div className="hero__shade" />
        </div>

        <div className="hero__content grid">
          <h1 className="logo">
            <span className="logo__word logo__word--vita">VITA</span>
            <span className="logo__word logo__word--alibi">ALIBI</span>
          </h1>

          <p className="tagline tagline--left">
            from <strong>REALITY</strong>
          </p>
          <p className="tagline tagline--right">
            with <strong>VACATION</strong>
          </p>

          <p className="escape" aria-label="Escape">
            {ESCAPE.map((letter, i) => (
              <span className="escape__letter" key={i} aria-hidden="true">
                <span className="escape__glyph">{letter}</span>
              </span>
            ))}
          </p>
        </div>

        <div className="hero__bloom" aria-hidden="true" />
        <div className="hero__wash" aria-hidden="true" />

        <div className="scroll-cue" aria-hidden="true">
          <div className="scroll-cue__inner">
            <span>scroll</span>
            <i className="scroll-cue__line" />
          </div>
        </div>
      </section>
    </div>
  )
}
