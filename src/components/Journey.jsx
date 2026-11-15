import './Journey.css'

// Small deterministic PRNG, so the stars sit in the same place on every load.
function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(7)

// Stars thicken towards the dusk at the bottom of the section.
const STARS = Array.from({ length: 70 }, (_, i) => {
  const depth = Math.sqrt(rand())
  return {
    id: i,
    left: `${(rand() * 100).toFixed(2)}%`,
    top: `${(38 + depth * 60).toFixed(2)}%`,
    size: `${(1 + rand() * 2.2).toFixed(1)}px`,
    delay: `${(-rand() * 6).toFixed(2)}s`,
    sparkle: rand() > 0.84,
  }
})

export default function Journey() {
  return (
    <section className="journey" aria-hidden="true">
      <div className="journey__cloud journey__cloud--a" />
      <div className="journey__cloud journey__cloud--b" />
      <div className="journey__cloud journey__cloud--c" />
      {STARS.map((star) => (
        <i
          key={star.id}
          className={star.sparkle ? 'journey__star journey__star--sparkle' : 'journey__star'}
          style={{
            left: star.left,
            top: star.top,
            '--size': star.size,
            animationDelay: star.delay,
          }}
        />
      ))}
    </section>
  )
}
