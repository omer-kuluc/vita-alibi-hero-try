// Facts about the hero video that layout and animation both depend on.
export const VIDEO = {
  // Still frames of public/images/hero-video.mp4 (npm run video:encode).
  frames: 125,
  frameSrc: (index) => `/images/hero-frames/frame-${String(index + 1).padStart(3, '0')}.webp`,
  width: 576,
  height: 688,
  // Position (0..1 of the frame) of the drop in the final frame that the
  // scrolling drop takes over from.
  drop: { x: 0.412, y: 0.511 },
  // Share of the frame width, at each edge, that is stretched sideways to
  // fill the space beside the video on wide screens.
  edgeStrip: 0.05,
}

// One note per bend of the ribbon, in order.
export const NOTES = [
  'Vita Alibi, alternatif bir evrende sizlere tatil seçeneği sunan bir hizmet.',
  'Hayatlarımız sürekli ilerlemek zorunda kaldığımız yollardan oluşuyor.',
  'Ve bu yolların belirlediği rota, yol ayrımlarında yaptığımız seçimlerden oluşuyor.',
]
