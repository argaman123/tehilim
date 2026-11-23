import { describe, expect, it } from 'vitest'
import { CHAPTERS, LONGEST, TOTAL_VERSES, currentChapter, dailyOf, finish, freshProgress, hueOf, isFinished, skip, startNextBook, versesIn, versesRead } from './book'
import { hebNum, parseHebNum } from './hebrew'
import { load, migrateOld } from './store'
import oldDump from './old-fixture.json'

const seq = (...xs: number[]) => { let i = 0; return () => xs[i++ % xs.length] }
const rnd = () => { let a = 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647) }
const day1 = new Date(2026, 10, 1, 9)
const day2 = new Date(2026, 10, 2, 9)
const mapStore = (o: Record<string, string>) => ({ getItem: (k: string) => o[k] ?? null })

describe('numbers', () => {
  it('writes and reads Hebrew numerals', () => {
    expect([1, 15, 16, 23, 91, 100, 115, 116, 119, 150].map(hebNum)).toEqual(['א', 'טו', 'טז', 'כג', 'צא', 'ק', 'קטו', 'קטז', 'קיט', 'קנ'])
    for (let n = 1; n <= 150; n++) expect(parseHebNum('פרק ' + hebNum(n))).toBe(n)
    expect(parseHebNum('פרק קיה')).toBe(115) // the old app's spelling
    expect(parseHebNum('פרק קיו')).toBe(116)
    expect(parseHebNum('x')).toBeNaN()
  })
  it('counts verses without 119’s letter-group breaks', () => {
    expect(versesIn(23)).toBe(6)
    expect(versesIn(119)).toBe(176)
    expect(LONGEST).toBe(176)
    expect(TOTAL_VERSES).toBe(2527)
  })
})

describe('reading', () => {
  it('shuffles all 150', () => {
    const p = freshProgress(rnd(), day1)
    expect(new Set(p.order).size).toBe(CHAPTERS)
  })
  it('finishes the next chapter and counts today', () => {
    let p = freshProgress(rnd(), day1)
    const ch = currentChapter(p)
    p = finish(p, ch, day1)
    expect(p.cur).toBe(1)
    expect(isFinished(p, ch)).toBe(true)
    expect(dailyOf(p, day1)).toBe(versesIn(ch))
    expect(dailyOf(p, day2)).toBe(0)
    const ch2 = currentChapter(p)
    p = finish(p, ch2, day2)
    expect(p.daily).toBe(versesIn(ch2)) // yesterday's count doesn't carry over
  })
  it('a chapter picked from the list takes the current slot', () => {
    let p = freshProgress(rnd(), day1)
    const picked = p.order[100]
    const next = p.order[0]
    p = finish(p, picked, day1)
    expect(p.order[0]).toBe(picked)
    expect(p.order[1]).toBe(next)
    expect(new Set(p.order).size).toBe(CHAPTERS)
    expect(finish(p, picked, day1)).toBe(p) // already read: no change
  })
  it('skip swaps with a later unread chapter only', () => {
    let p = freshProgress(rnd(), day1)
    p = finish(p, currentChapter(p), day1)
    const done = p.order[0]
    const q = skip(p, seq(0.5))
    expect(q.order[0]).toBe(done)
    expect(q.order[1]).not.toBe(p.order[1])
    expect(new Set(q.order).size).toBe(CHAPTERS)
  })
  it('finishing the round shows it done, then the next round continues the colors', () => {
    let p = freshProgress(rnd(), day1)
    for (let i = 0; i < CHAPTERS - 1; i++) p = finish(p, currentChapter(p), day1)
    const before = hueOf(p)
    const last = currentChapter(p)
    p = finish(p, last, day1)
    expect(p.bookDone).toBe(true)
    expect(p.books).toBe(1)
    expect(currentChapter(p)).toBe(last)
    expect(versesRead(p)).toBe(TOTAL_VERSES)
    expect(hueOf(p)).toBeGreaterThan(before)
    expect(hueOf(p)).toBe(25 + 360)
    expect(skip(p, rnd())).toBe(p)
    const n = startNextBook(p, rnd())
    expect(n.cur).toBe(0)
    expect(n.bookDone).toBe(false)
    expect(n.books).toBe(1)
    expect(hueOf(n)).toBe(hueOf(p))
  })
})

describe('moving over from the old app', () => {
  it('reads a real old-app dump', () => {
    const s = migrateOld(mapStore(oldDump), rnd(), day1)!
    expect(s.progress.cur).toBe(3)
    expect(s.progress.books).toBe(4)
    expect(s.progress.daily).toBe(44)
    expect(s.progress.lastDay).toBe('Sun Nov 01 2026')
    expect(s.progress.order.slice(0, 3)).toEqual([50, 30, 121])
    expect(new Set(s.progress.order).size).toBe(150)
    expect(s.settings).toMatchObject({ goal: 70, fontSize: 35, dedication: 'לרפואת שרה בת רחל' })
  })
  it('keeps the numbers when the chapter list is broken', () => {
    const s = migrateOld(mapStore({ ...oldDump, chapters: 'פרק א,פרק ב' }), rnd(), day1)!
    expect(s.progress.cur).toBe(0)
    expect(s.progress.books).toBe(4)
    expect(s.settings.goal).toBe(70)
  })
  it('starts fresh with no old data, and prefers new data once saved', () => {
    expect(migrateOld(mapStore({}), rnd(), day1)).toBeNull()
    const fresh = load(mapStore({}), rnd(), day1)
    expect(fresh.progress.cur).toBe(0)
    const saved = load(mapStore({ ...oldDump, tehilim: JSON.stringify({ ...fresh, progress: { ...fresh.progress, cur: 9 } }) }), rnd(), day1)
    expect(saved.progress.cur).toBe(9)
  })
})
