// Renders the app icon (mock 11, option A: a red book seen at an angle on leather brown, bound on the
// right like a Hebrew book, with a thin cream ribbon) to PNGs with WebKit.
import { webkit } from 'playwright'
const BG = '#3a2416'
const svg = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <defs><linearGradient id="cover" x1="0" x2="1"><stop offset="0" stop-color="#b52a24"/><stop offset="1" stop-color="#8a1a1a"/></linearGradient></defs>
  <rect width="120" height="120" fill="${BG}"/>
  <g transform="translate(60 61) scale(${1.02 * scale}) translate(-60 -61)">
    <ellipse cx="60" cy="98" rx="31" ry="3.2" fill="#000" opacity="0.28"/>
    <!-- page edges -->
    <path d="M30 31L41 25V91L30 96Z" fill="#f1e9dc"/>
    <path d="M32.75 30.3V93.95M35.5 28.8V92.7M38.25 27.3V91.45" stroke="#cbbca6" stroke-width="0.6"/>
    <!-- cover, spine and its ridges -->
    <path d="M41 25L89 31V95L41 91Z" fill="url(#cover)"/>
    <path d="M82 30.1L89 31V95L82 94.4Z" fill="#6e1414"/>
    <path d="M82 38.2L89 39.1M82 41L89 41.9M82 85.6L89 86.2M82 88.4L89 89" stroke="#000" stroke-opacity="0.3" stroke-width="0.9"/>
    <!-- ribbon -->
    <path d="M71.8 93.25h4.4v12.5l-2.2 -2.6l-2.2 2.6z" fill="#f1e9dc"/>
    <path d="M74 93.25h2.2v12.5l-2.2 -2.6z" fill="#cbbca6"/>
  </g></svg>`
const out = new URL('../public/', import.meta.url).pathname
const browser = await webkit.launch()
const page = await browser.newPage()
// Maskable icons may be cropped to a circle, so their mark stays inside the middle 80%.
for (const [name, size, scale] of [['icon-512.png', 512, 1], ['icon-192.png', 192, 1], ['apple-touch-icon.png', 180, 1], ['icon-maskable-512.png', 512, 0.8]]) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<style>html,body{margin:0;background:${BG}}svg{display:block;width:${size}px;height:${size}px}</style>${svg(scale)}`)
  await page.screenshot({ path: out + name })
}
await browser.close()
console.log('icons written')
