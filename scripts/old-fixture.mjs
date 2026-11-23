// Drives the old Angular app (served from old/build on :8790): finishes 3 chapters, sets settings, dumps localStorage.
import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage()
await p.goto('http://localhost:8790/')
await p.waitForSelector('#next')
for (let i = 0; i < 3; i++) { await p.click('#next'); await p.waitForTimeout(300) }
await p.evaluate(() => { localStorage.setItem('goal', '70'); localStorage.setItem('fontSize', '35'); localStorage.setItem('dedication', 'לרפואת שרה בת רחל'); localStorage.setItem('bookCount', '4') })
const dump = await p.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])))
console.log(JSON.stringify(dump))
await b.close()
