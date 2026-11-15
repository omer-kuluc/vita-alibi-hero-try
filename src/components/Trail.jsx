import './Trail.css'

// The ribbon the drop leaves behind, and the drop itself. All geometry is
// computed in src/animations/trail.js; this is only the markup it fills in.
export default function Trail() {
  return (
    <>
      <svg className="trail" aria-hidden="true">
        <defs>
          <linearGradient id="ribbon-front" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffa53a" />
            <stop offset="0.3" stopColor="#ff8a2b" />
            <stop offset="0.6" stopColor="#f1652f" />
            <stop offset="0.86" stopColor="#ff9438" />
            <stop offset="1" stopColor="#ffc462" />
          </linearGradient>
          <linearGradient id="ribbon-back" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffe296" />
            <stop offset="0.5" stopColor="#ffcb68" />
            <stop offset="1" stopColor="#ffe9ad" />
          </linearGradient>
          <radialGradient id="ripple-glow">
            <stop offset="0" stopColor="#fff1cf" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff1cf" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path className="ribbon__shadow" />
        <path className="ribbon__spine" pathLength="1" />
        <path className="ribbon__back" fill="url(#ribbon-back)" />
        <path className="ribbon__front" fill="url(#ribbon-front)" />
        <path className="ribbon__steps" />
        <path className="ribbon__edge" pathLength="1" />

        <g className="ripples">
          <ellipse className="ripples__glow" rx="150" ry="46" fill="url(#ripple-glow)" />
          <ellipse className="ripples__ring" rx="100" ry="30" />
          <ellipse className="ripples__ring" rx="100" ry="30" />
          <ellipse className="ripples__ring" rx="100" ry="30" />
        </g>
      </svg>

      <div className="drop" aria-hidden="true">
        <i className="drop__ring" />
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
