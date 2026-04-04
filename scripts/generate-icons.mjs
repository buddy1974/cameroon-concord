import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
for (const size of sizes) {
  await sharp('public/logo.png')
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(`public/icons/icon-${size}x${size}.png`)
  console.log(`Generated icon-${size}x${size}.png`)
}

// Apple touch icon — 180x180
await sharp('public/logo.png')
  .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
  .png()
  .toFile('public/icons/apple-touch-icon.png')

console.log('All icons generated.')
