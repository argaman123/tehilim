// WebKit at iPhone size: seeds the old app's localStorage (src/lib/old-fixture.json), opens the app,
// and saves screenshots of the reading screen, the scrolled bar, and both sheets.
import { readFileSync } from 'node:fs'
import { webkit, devices } from 'playwright'
const url = process.argv[2] ?? 'http://localhost:5190/'
const old = JSON.parse(readFileSync(new URL('../src/lib/old-fixture.json', import.meta.url)))
const out = new URL('./out/', import.meta.url).pathname
const browser = await webkit.launch()
const ctx = await browser.newContext({ ...devices['iPhone 15'] })
const page = await ctx.newPage()
await page.goto(url)
await page.evaluate((o) => { localStorage.clear(); for (const [k, v] of Object.entries(o)) localStorage.setItem(k, v) }, old)
await page.reload()
await page.waitForSelector('.verses')
await page.waitForTimeout(800)
const title = await page.textContent('.intro .nm')
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('tehilim')))
console.log('title', title, 'cur', stored.progress.cur, 'books', stored.progress.books, 'goal', stored.settings.goal, 'font', stored.settings.fontSize, 'ded', stored.settings.dedication)
await page.screenshot({ path: out + '1-read.png' })
await page.evaluate(() => { document.querySelector('.txt').scrollTop = 600 })
await page.waitForTimeout(500)
await page.screenshot({ path: out + '2-scrolled.png' })
await page.evaluate(() => { document.querySelector('.txt').scrollTop = 0 })
await page.tap('.intro .ttl')
await page.waitForTimeout(900)
await page.screenshot({ path: out + '3-chapters.png' })
await page.keyboard.press('Escape')
await page.waitForTimeout(700)
await page.tap('.bar [aria-label="הגדרות"]')
await page.waitForTimeout(900)
await page.screenshot({ path: out + '4-settings.png' })
await browser.close()
