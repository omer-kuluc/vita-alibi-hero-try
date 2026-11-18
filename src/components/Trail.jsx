import { NOTES } from '../config'
import './Trail.css'

// lowercase: Cinzel Decorative keeps its plain capitals there
const NUMERALS = ['i', 'ii', 'iii', 'iv', 'v']

// Deckled left and right edges for a parchment sheet, as a clip-path polygon.
// Seeded, so every sheet is torn differently but identically on each load.
function deckle(seed) {
  let a = seed
  const rand = () => {
    a = (a * 1664525 + 1013904223) % 4294967296
    return a / 4294967296
  }
  const steps = 36
  const right = []
  const left = []
  for (let i = 0; i <= steps; i++) {
    const y = ((i / steps) * 100).toFixed(1)
    right.push(`${(100 - rand() * 1.5).toFixed(2)}% ${y}%`)
    left.push(`${(rand() * 1.5).toFixed(2)}% ${y}%`)
  }
  return `polygon(${[...right, ...left.reverse()].join(',')})`
}

const SHEETS = NOTES.map((_, i) => deckle(31 + i * 17))

// The ribbon the drop leaves behind, the notes at its bends, and the drop
// itself. All geometry is computed in src/animations/trail.js; this is only
// the markup it fills in.
export default function Trail() {
  return (
    <>
      <div className="notes">
        {NOTES.map((text, i) => (
          <article className="note" key={i}>
            <div className="note__body">
              <i className="note__shadow" />
              <div className="note__unroll">
                <div className="note__sheet">
                  <i className="note__paper" style={{ clipPath: SHEETS[i] }} />
                  <span className="note__index" aria-hidden="true">
                    {NUMERALS[i]}
                  </span>
                  <p className="note__text">{text}</p>
                </div>
              </div>
              <i className="note__roll note__roll--top" />
              <div className="note__rail">
                <i className="note__roll note__roll--bottom" />
              </div>
            </div>
          </article>
        ))}
      </div>

      <svg className="trail" aria-hidden="true">
        <defs>
          <linearGradient id="ribbon-front" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffa53a" />
            <stop offset="0.4" stopColor="#ff8a2b" />
            {/* flat from here on: this is the colour of the strap and watch */}
            <stop offset="0.74" stopColor="#f1652f" />
            <stop offset="1" stopColor="#f1652f" />
          </linearGradient>
          <linearGradient id="ribbon-back" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffe296" />
            <stop offset="0.5" stopColor="#ffcb68" />
            <stop offset="1" stopColor="#ffd98a" />
          </linearGradient>
        </defs>

        <path className="ribbon__shadow" />
        <path className="ribbon__spine" pathLength="1" />
        <path className="ribbon__back" fill="url(#ribbon-back)" />
        <path className="ribbon__front" fill="url(#ribbon-front)" />
      </svg>

      <div className="drop" aria-hidden="true">
        <div className="drop__reveal">
          <div className="drop__land">
            <svg viewBox="-32 -32 64 64">
              <defs>
                <radialGradient id="drop-halo">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.6" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="drop-body" cx="0.42" cy="0.66" r="0.62">
                  <stop offset="0" stopColor="#ffffff" />
                  <stop offset="0.45" stopColor="#ffe3ae" />
                  <stop offset="0.8" stopColor="#ff9a45" />
                  <stop offset="1" stopColor="#e9562f" />
                </radialGradient>
              </defs>
              <circle r="31" fill="url(#drop-halo)" />
              <path
                d="M0 -23 C4.5 -11 12.5 -3 12.5 7.5 A12.5 12.5 0 1 1 -12.5 7.5 C-12.5 -3 -4.5 -11 0 -23Z"
                fill="url(#drop-body)"
                stroke="#fff4dc"
                strokeOpacity="0.85"
                strokeWidth="0.9"
              />
              <ellipse cx="-4.6" cy="5" rx="2.4" ry="4.4" fill="#fff" fillOpacity="0.9" transform="rotate(24 -4.6 5)" />
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}
