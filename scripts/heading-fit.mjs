// Checks that the heading (the widest chapter name + daily square) clears the buttons at common phone
// widths, on the current chapter and on a picked one (with the back arrow): node scripts/heading-fit.mjs [shotDir]
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { webkit, devices } from 'playwright'
const shots = process.argv[2]
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2' }
const s = createServer(async (q, r) => { const p = decodeURIComponent(new URL(q.url, 'http://x').pathname); try { const b = await readFile(join(process.cwd(), 'dist', p === '/' ? 'index.html' : p)); r.writeHead(200, { 'content-type': types[extname(p) || '.html'] ?? 'application/octet-stream' }); r.end(b) } catch { r.writeHead(404); r.end() } }).listen(8800)
const fx = JSON.parse(readFileSync('src/lib/old-fixture.json'))
const b = await webkit.launch()
let bad = 0
for (const w of [430, 393, 375, 360, 320]) {
  const g = await (await b.newContext({ ...devices['iPhone 15'], viewport: { width: w, height: 760 }, serviceWorkers: 'block', colorScheme: 'dark' })).newPage()
  await g.goto('http://localhost:8800/')
  await g.evaluate((o) => { localStorage.clear(); for (const [k, v] of Object.entries(o)) localStorage.setItem(k, v) }, { ...fx, current: '0', dailyProgress: '10', lastDay: new Date().toDateString() })
  await g.reload(); await g.waitForSelector('.verses'); await g.waitForTimeout(900)
  const measure = () => g.evaluate(() => {
    const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'], tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ']
    const heb = (n) => { const h = n >= 100 ? 'ק' : ''; n %= 100; if (n === 15) return h + 'טו'; if (n === 16) return h + 'טז'; return h + tens[Math.floor(n / 10)] + ones[n % 10] }
    const nm = document.querySelector('.intro .nm'), head = document.querySelector('.intro .head'), btns = document.querySelector('.bar .btns')
    const orig = nm.textContent
    let worst = { gap: 1e9 }
    for (let c = 1; c <= 150; c++) {
      nm.textContent = heb(c)
      const left = Math.min(...[...head.children].map((e) => e.getBoundingClientRect().left))
      const gap = left - btns.getBoundingClientRect().right
      if (gap < worst.gap) worst = { gap: Math.round(gap), name: heb(c), size: Math.round(parseFloat(getComputedStyle(nm).fontSize)) }
    }
    nm.textContent = orig
    return worst
  })
  const rest = await measure()
  if (shots && w === 393) await g.screenshot({ path: `${shots}/g-rest.png`, clip: { x: 0, y: 0, width: w, height: 200 } })
  await g.tap('.intro .ttl'); await g.waitForTimeout(900)
  await g.locator('.cell').nth(147).tap(); await g.waitForTimeout(900)
  const picked = await measure()
  if (shots && w === 375) {
    await g.evaluate(() => { document.querySelector('.intro .nm').textContent = 'קמח' })
    await g.screenshot({ path: `${shots}/g-picked-375.png`, clip: { x: 0, y: 0, width: w, height: 200 } })
  }
  if (Math.min(rest.gap, picked.gap) < 6) bad++
  console.log(w, 'current:', rest, ' picked:', picked)
}
await b.close(); s.close()
process.exit(bad ? 1 : 0)
