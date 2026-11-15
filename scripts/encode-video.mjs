// Turns the hero video into a sequence of still frames.
// Seeking a <video> on every scroll tick makes the browser decode on demand,
// which stutters. Frames are decoded once, up front, and scrolling only has to
// draw one onto a canvas. The original video is left untouched.
//
//   npm run video:encode
import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import ffmpeg from 'ffmpeg-static'

const input = 'public/images/hero-video.mp4'
const outDir = 'public/images/hero-frames'

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

const result = spawnSync(
  ffmpeg,
  ['-y', '-i', input, '-an', '-c:v', 'libwebp', '-quality', '82', '-compression_level', '6', `${outDir}/frame-%03d.webp`],
  { stdio: ['ignore', 'inherit', 'inherit'] },
)

if (result.status !== 0) process.exit(result.status ?? 1)

const files = readdirSync(outDir)
const bytes = files.reduce((sum, file) => sum + statSync(`${outDir}/${file}`).size, 0)
console.log(`\n${files.length} frames, ${(bytes / 1024 / 1024).toFixed(1)} MB -> ${outDir}`)
console.log('If the frame count changed, update VIDEO.frames in src/config.js.')
