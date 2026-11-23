// Deploy rehearsal on localhost: the old Angular app (with its service worker) is installed first, then the
// site folder is swapped for dist/ the way the Pi deploy does it. Checks that the new app takes over,
// the old caches are gone, and the app opens offline with its font.
import { cpSync, rmSync, readdirSync } from 'node:fs'
import { chromium } from 'playwright'
const site = new URL('./out/site/', import.meta.url).pathname
const dist = new URL('../dist/', import.meta.url).pathname
const url = 'http://localhost:8790/'
const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
await page.goto(url)
await page.evaluate(() => navigator.serviceWorker.ready)
await page.reload()
await page.waitForTimeout(1500)
console.log('old caches', await page.evaluate(async () => (await caches.keys()).filter((k) => k.startsWith('ngsw:')).length))
await page.evaluate(() => localStorage.setItem('bookCount', '4'))

for (const f of readdirSync(site)) rmSync(site + f, { recursive: true })
cpSync(dist, site, { recursive: true })

let ok = false
// The old app checks for updates in the background (its worker only re-checks itself when the app asks,
// at most ~30s after opening, or on its own once a day), so give each open some time.
for (let i = 1; i <= 4 && !ok; i++) {
  await page.reload()
  await page.waitForTimeout(i === 1 ? 35000 : 3000)
  ok = !!(await page.$('.intro .nm'))
  console.log('reload', i, ok ? 'new app' : 'old app')
}
await page.waitForTimeout(1500)
console.log('ngsw caches left', await page.evaluate(async () => (await caches.keys()).filter((k) => k.startsWith('ngsw:')).length))
console.log('worker', await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.scriptURL))
console.log('books kept', await page.evaluate(() => JSON.parse(localStorage.getItem('tehilim') ?? '{}').progress?.books))
await page.reload()
await page.waitForTimeout(1200)
await ctx.setOffline(true)
await page.reload()
await page.waitForSelector('.verses', { timeout: 5000 })
await page.evaluate(() => document.fonts.ready)
console.log('offline ok, hadasim', await page.evaluate(() => document.fonts.check('30px Hadasim')), 'rubik', await page.evaluate(() => document.fonts.check('800 30px Rubik', 'א')))
await browser.close()
