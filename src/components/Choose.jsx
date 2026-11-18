import './Choose.css'

// Case is deliberate throughout: Cinzel Decorative keeps its swash capitals in
// the uppercase slots and plain capitals in the lowercase ones.
const NUMERALS = ['xii', 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi']
const TOP = ['job', 'career', 'life']
const BOTTOM = ['future', 'friend', 'family']
const SIDES = ['left', 'mid', 'right']

const polar = (radius, degrees) => {
  const a = (degrees * Math.PI) / 180
  return [radius * Math.sin(a), -radius * Math.cos(a)]
}

const TICKS = Array.from({ length: 60 }, (_, i) => {
  const hour = i % 5 === 0
  const [x1, y1] = polar(hour ? 79 : 81.5, i * 6)
  const [x2, y2] = polar(84.5, i * 6)
  return { i, hour, x1, y1, x2, y2 }
})

// Faint horizontal fibres, the same texture as the parchment notes.
const FIBRES = Array.from({ length: 44 }, (_, i) => -86 + i * 4)

/**
 * The scene the ribbon ends in. The ribbon becomes the strap of a wristwatch;
 * the watch turns to face the viewer, its numerals give way to six lines, and
 * the dial grows into the whole screen with CHOOSE at its centre.
 * Geometry and motion live in src/animations/trail.js and watch.js.
 */
export default function Choose() {
  return (
    <div className="choose-track">
      <section className="choose">
        {/* Strap: a copy of the ribbon's tail above the dial, a plain band below. */}
        <svg className="strap" aria-hidden="true">
          <g className="strap__ribbon" visibility="hidden">
            <path className="strap__shadow" />
            <path className="strap__band" />
          </g>
        </svg>
        <i className="strap__bottom" aria-hidden="true" />

        <div className="watch" aria-hidden="true">
          <i className="watch__flood" />
          <div className="watch__frame">
            {/* Everything that moves is its own layer over a static drawing, so
                turning the hands never repaints the dial. */}
            <div className="watch__dial">
              <svg className="watch__layer" viewBox="-110 -110 220 220">
                <defs>
                  <clipPath id="watch-face">
                    <circle r="88" />
                  </clipPath>
                </defs>
                <circle className="watch__shadow" cx="6" cy="9" r="98" />
                <rect className="watch__crown" x="95" y="-7.5" width="12" height="15" rx="3" />
                <circle className="watch__bezel" r="98" />
                <circle className="watch__ring" r="91.5" />
                <circle className="watch__face" r="88" />
                <g className="watch__fibres" clipPath="url(#watch-face)">
                  {FIBRES.map((y) => (
                    <line key={y} x1="-90" x2="90" y1={y} y2={y} />
                  ))}
                </g>
              </svg>

              <svg className="watch__layer watch__ticks" viewBox="-110 -110 220 220">
                {TICKS.map((t) => (
                  <line
                    key={t.i}
                    className={t.hour ? 'watch__tick watch__tick--hour' : 'watch__tick'}
                    x1={t.x1}
                    y1={t.y1}
                    x2={t.x2}
                    y2={t.y2}
                  />
                ))}
              </svg>

              {NUMERALS.map((numeral, i) => {
                const [x, y] = polar(67, i * 30)
                return (
                  <span key={numeral} className="watch__numeral" style={{ '--x': x, '--y': y }}>
                    {numeral}
                  </span>
                )
              })}

              <i className="watch__hand watch__hand--hour" />
              <i className="watch__hand watch__hand--minute" />
              <i className="watch__hub" />
            </div>
          </div>
        </div>

        <i className="choose__grain" aria-hidden="true" />

        <svg className="choose__lines" aria-hidden="true">
          {[...TOP, ...BOTTOM].map((label) => (
            <line key={label} className="choose__line" pathLength="1" />
          ))}
        </svg>

        <ul className="choose__row choose__row--top grid">
          {TOP.map((label, i) => (
            <li key={label} className={`choose__label choose__label--${SIDES[i]}`}>
              <span className="choose__label-text">{label}</span>
            </li>
          ))}
        </ul>

        <h2 className="choose__word">
          <span className="choose__word-text">CHOOSE</span>
        </h2>

        <ul className="choose__row choose__row--bottom grid">
          {BOTTOM.map((label, i) => (
            <li key={label} className={`choose__label choose__label--${SIDES[i]}`}>
              <span className="choose__label-text">{label}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
