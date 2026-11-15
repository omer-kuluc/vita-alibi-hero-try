import { VIDEO } from '../config'
import './Loader.css'

// Opening sequence. One large RE is shared by two words: D·RE·AM on the top
// row and RE·ALITY on the bottom one. While the hero's frames load, the count
// climbs and the emphasis moves from REALITY to DREAM
// (see src/animations/loader.js).
//
// Case is deliberate: Cinzel Decorative has swash capitals in its uppercase
// slots and plain capitals in its lowercase ones.
export default function Loader() {
  return (
    <div className="loader" role="status" aria-label="Loading">
      {/* The hero's first frame, out of focus: the loader is the hero before
          it has come into view. */}
      <div className="loader__bg" style={{ backgroundImage: `url(${VIDEO.frameSrc(0)})` }} />

      <div className="loader__lockup" aria-hidden="true">
        <span className="loader__d">d</span>
        <span className="loader__percent">
          <span className="loader__num">0</span>
          <span className="loader__sign">%</span>
        </span>
        <span className="loader__re">RE</span>
        <span className="loader__am">am</span>
        <span className="loader__ality">ality</span>
      </div>
    </div>
  )
}
