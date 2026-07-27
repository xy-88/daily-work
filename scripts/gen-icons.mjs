import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const svg = readFileSync(new URL('../public/icon.svg', import.meta.url))

const targets = [
  { size: 192, file: 'public/pwa-192.png' },
  { size: 512, file: 'public/pwa-512.png' },
  { size: 180, file: 'public/apple-touch-icon.png' },
  { size: 32, file: 'public/favicon-32.png' },
]

for (const t of targets) {
  await sharp(svg, { density: 384 })
    .resize(t.size, t.size)
    .png()
    .toFile(t.file)
  console.log('generated', t.file, t.size + 'x' + t.size)
}
console.log('done')
