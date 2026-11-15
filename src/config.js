// Facts about the hero video that layout and animation both depend on.
export const VIDEO = {
  // All-keyframe copy of public/images/hero-video.mp4 (npm run video:encode).
  src: '/images/hero-video-scrub.mp4',
  width: 576,
  height: 688,
  // Position (0..1 of the frame) of the drop in the final frame that the
  // scrolling drop takes over from.
  drop: { x: 0.412, y: 0.511 },
  // Share of the frame width, at each edge, that is stretched sideways to
  // fill the space beside the video on wide screens.
  edgeStrip: 0.05,
}
