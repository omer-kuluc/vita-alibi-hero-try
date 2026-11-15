// Re-encodes the hero video so every frame is a keyframe.
// Scroll scrubbing seeks backwards and forwards constantly; with the original
// file (6 keyframes in 125 frames) each seek has to decode up to a second of
// video. The original file is left untouched.
//
//   npm run video:encode
import { spawnSync } from 'node:child_process'
import { statSync } from 'node:fs'
import ffmpeg from 'ffmpeg-static'

const input = 'public/images/hero-video.mp4'
const output = 'public/images/hero-video-scrub.mp4'

const result = spawnSync(
  ffmpeg,
  [
    '-y',
    '-i', input,
    '-an',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '20',
    '-g', '1',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    output,
  ],
  { stdio: ['ignore', 'inherit', 'inherit'] },
)

if (result.status !== 0) process.exit(result.status ?? 1)

const mb = (path) => (statSync(path).size / 1024 / 1024).toFixed(1)
console.log(`\n${input}: ${mb(input)} MB  ->  ${output}: ${mb(output)} MB`)
