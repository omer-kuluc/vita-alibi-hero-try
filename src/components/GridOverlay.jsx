import { useEffect, useState } from 'react'

// Review aid: press "G" to see the 4 / 8 / 12 column grid over the page.
export default function GridOverlay() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onKey = (event) => {
      if (event.key.toLowerCase() !== 'g' || event.ctrlKey || event.metaKey || event.altKey) return
      setVisible((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!visible) return null

  return (
    <div className="grid-overlay grid" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  )
}
