import sharp from 'sharp'

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Green background -->
  <rect width="512" height="512" rx="96" fill="#16a34a"/>

  <!-- Soccer ball (white pentagon pattern) -->
  <circle cx="256" cy="230" r="130" fill="white" stroke="#15803d" stroke-width="6"/>

  <!-- Pentagon center -->
  <polygon points="256,148 303,181 285,236 227,236 209,181"
    fill="#1a1a1a"/>

  <!-- Surrounding pentagons -->
  <polygon points="256,148 303,181 330,155 320,104 272,100"
    fill="#1a1a1a" opacity="0.15"/>
  <polygon points="303,181 330,155 360,175 355,225 320,240"
    fill="#1a1a1a" opacity="0.15"/>
  <polygon points="285,236 320,240 315,290 270,308 245,282"
    fill="#1a1a1a" opacity="0.15"/>
  <polygon points="227,236 245,282 200,308 170,285 182,240"
    fill="#1a1a1a" opacity="0.15"/>
  <polygon points="209,181 182,240 152,225 148,175 182,156"
    fill="#1a1a1a" opacity="0.15"/>
  <polygon points="256,148 209,181 182,156 192,108 240,100"
    fill="#1a1a1a" opacity="0.15"/>

  <!-- Trophy cup shape below ball -->
  <text x="256" y="420" font-family="system-ui,sans-serif" font-size="110"
    text-anchor="middle" fill="white" opacity="0.9">🏆</text>
</svg>
`

for (const size of [192, 512]) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(`public/icon-${size}.png`)
  console.log(`Generated icon-${size}.png`)
}

// Also update the favicon SVG
console.log('Done!')
