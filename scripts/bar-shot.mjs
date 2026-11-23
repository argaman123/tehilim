// Shoots the scrolled bar from dist/ in WebKit at iPhone size: node scripts/bar-shot.mjs <outPrefix> [current=0] [dailyProgress]
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { webkit, devices } from 'playwright'
const [out, cur = '0', daily] = process.argv.slice(2)
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2' }
const s = createServer(async (q, r) => { const p = decodeURIComponent(new URL(q.url, 'http://x').pathname); try { const b = await readFile(join(process.cwd(), 'dist', p === '/' ? 'index.html' : p)); r.writeHead(200, { 'content-type': types[extname(p) || '.html'] ?? 'application/octet-stream' }); r.end(b) } catch { r.writeHead(404); r.end() } }).listen(8796)
const fx = JSON.parse(readFileSync('src/lib/old-fixture.json'))
const seed = { ...fx, current: cur, lastDay: new Date().toDateString(), ...(daily ? { dailyProgress: daily } : {}) }
const b = await webkit.launch()
const g = await (await b.newContext({ ...devices['iPhone 15'], serviceWorkers: 'block', colorScheme: 'dark' })).newPage()
await g.goto('http://localhost:8796/')
await g.evaluate((o) => { localStorage.clear(); for (const [k, v] of Object.entries(o)) localStorage.setItem(k, v) }, seed)
await g.reload(); await g.waitForSelector('.verses'); await g.waitForTimeout(900)
await g.evaluate(() => { document.querySelector('.txt').scrollTop = 600 }); await g.waitForTimeout(600)
await g.screenshot({ path: out + '.png', clip: { x: 0, y: 0, width: 393, height: 120 } })
await b.close(); s.close(); process.exit(0)
