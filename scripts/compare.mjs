// Serves the old build and dist/ side by side, opens both in WebKit at iPhone size with the same progress,
// in dark mode like the phone (the old theme follows it), and saves the same screens from each: node scripts/compare.mjs <outDir>
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { readFileSync, mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { webkit, devices } from 'playwright'

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' }
const serve = (dir, port) => createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  try {
    const body = await readFile(join(new URL(dir, import.meta.url).pathname, path === '/' ? 'index.html' : path))
    res.writeHead(200, { 'content-type': types[extname(path) || '.html'] ?? 'application/octet-stream' })
    res.end(body)
  } catch { res.writeHead(404); res.end() }
}).listen(port)

const servers = [serve('../old/build/', 8791), serve('../dist/', 8792)]
const seed = { ...JSON.parse(readFileSync(new URL('../src/lib/old-fixture.json', import.meta.url))), lastDay: new Date().toDateString() }
const out = process.argv[2]
mkdirSync(out, { recursive: true })

// Scrolls whichever element actually holds the text.
const scrollTo = (page, to) => page.evaluate((to) => {
  const all = [document.scrollingElement, ...document.querySelectorAll('body *')].filter((e) => e && e.scrollHeight > e.clientHeight + 40 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY) || e === document.scrollingElement)
  const el = all.sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight))[0]
  el.scrollTop = to < 0 ? el.scrollHeight : to
  return { tag: el.tagName, cls: el.className, max: el.scrollHeight - el.clientHeight }
}, to)

const browser = await webkit.launch()
async function open(url, ready) {
  const ctx = await browser.newContext({ ...devices['iPhone 15'], serviceWorkers: 'block', colorScheme: 'dark' })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('pageerror', url, e.message))
  await page.goto(url)
  await page.evaluate((o) => { localStorage.clear(); for (const [k, v] of Object.entries(o)) localStorage.setItem(k, v) }, seed)
  await page.reload()
  await page.waitForSelector(ready)
  await page.waitForTimeout(1000)
  return page
}

const old = await open('http://localhost:8791/', '#next')
await old.screenshot({ path: `${out}/old-1-read.png` })
console.log('old scroll', await scrollTo(old, 500))
await old.waitForTimeout(400)
await old.screenshot({ path: `${out}/old-2-scrolled.png` })
await scrollTo(old, -1)
await old.waitForTimeout(400)
await old.screenshot({ path: `${out}/old-3-end.png` })
await scrollTo(old, 0)
await old.waitForTimeout(300)
await old.tap('#title')
await old.waitForTimeout(900)
await old.screenshot({ path: `${out}/old-4-chapters.png` })
console.log('old chapters open:', await old.evaluate(() => [...document.querySelectorAll('[role=dialog], .p-dialog, p-select, .p-select-overlay, .p-overlay, p-dropdown')].map((e) => e.tagName + '.' + e.className).join(' | ')))
await old.close()

const oldS = await open('http://localhost:8791/', '#next')
await oldS.tap('.pi-cog')
await oldS.waitForTimeout(900)
await oldS.screenshot({ path: `${out}/old-5-settings.png` })
await oldS.close()

const neu = await open('http://localhost:8792/', '.verses')
await neu.screenshot({ path: `${out}/new-1-read.png` })
console.log('new scroll', await scrollTo(neu, 500))
await neu.waitForTimeout(500)
await neu.screenshot({ path: `${out}/new-2-scrolled.png` })
await scrollTo(neu, -1)
await neu.waitForTimeout(500)
await neu.screenshot({ path: `${out}/new-3-end.png` })
await scrollTo(neu, 0)
await neu.waitForTimeout(400)
await neu.tap('.intro .ttl')
await neu.waitForTimeout(900)
await neu.screenshot({ path: `${out}/new-4-chapters.png` })
await neu.keyboard.press('Escape')
await neu.waitForTimeout(700)
await neu.tap('.bar [aria-label="הגדרות"]')
await neu.waitForTimeout(900)
await neu.screenshot({ path: `${out}/new-5-settings.png` })
await browser.close()
servers.forEach((s) => s.close())
