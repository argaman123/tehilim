// Screenshots for the README, from dist/ in WebKit at iPhone size: node scripts/readme-shots.mjs (writes docs/*.png)
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { webkit, devices } from 'playwright'
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }
const s = createServer(async (q, r) => { const p = decodeURIComponent(new URL(q.url, 'http://x').pathname); try { const b = await readFile(join(process.cwd(), 'dist', p === '/' ? 'index.html' : p)); r.writeHead(200, { 'content-type': types[extname(p) || '.html'] ?? 'application/octet-stream' }); r.end(b) } catch { r.writeHead(404); r.end() } }).listen(8799)
// Old-app progress (3 rounds done, a few chapters into this one), a 50-verse goal partly read today, no dedication.
const fx = JSON.parse(readFileSync('src/lib/old-fixture.json'))
const seed = { ...fx, current: '41', goal: '50', dedication: '', dailyProgress: '18', lastDay: new Date().toDateString() }
const b = await webkit.launch()
const g = await (await b.newContext({ ...devices['iPhone 15'], serviceWorkers: 'block', colorScheme: 'dark' })).newPage()
await g.goto('http://localhost:8799/')
await g.evaluate((o) => { localStorage.clear(); for (const [k, v] of Object.entries(o)) localStorage.setItem(k, v) }, seed)
await g.reload(); await g.waitForSelector('.verses'); await g.waitForTimeout(1000)
await g.screenshot({ path: 'docs/reading.png' })
await g.tap('.intro .ttl'); await g.waitForTimeout(1000)
await g.screenshot({ path: 'docs/chapters.png' })
await b.close(); s.close(); process.exit(0)
