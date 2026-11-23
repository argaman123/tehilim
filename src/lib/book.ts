import psalms from '@/data/psalms.json'

/** Each chapter's lines; Psalm 119 has empty lines between its 22 letter groups. */
export const PSALMS = psalms as unknown as Record<string, string[]>
export const CHAPTERS = 150

const LENGTHS: number[] = [0]
for (let c = 1; c <= CHAPTERS; c++) LENGTHS[c] = PSALMS[c].filter((l) => l.trim()).length
/** Verses in a chapter (letter-group breaks in 119 don't count). */
export const versesIn = (ch: number) => LENGTHS[ch]
export const TOTAL_VERSES = LENGTHS.reduce((a, b) => a + b, 0)
export const LONGEST = Math.max(...LENGTHS)

/**
 * Reading progress, kept per device. A round reads all 150 chapters in a shuffled order:
 * `order[0..cur)` are done, `order[cur]` is up next. Same model as the old app.
 */
export type Progress = {
  order: number[]
  cur: number
  /** Whole rounds of the book finished. */
  books: number
  /** Verses finished on `lastDay`. */
  daily: number
  /** `Date.toDateString()` of the day `daily` belongs to (the old app's format). */
  lastDay: string
  /** The round was just finished and the next one hasn't been started yet. */
  bookDone: boolean
}

export type Rand = () => number

export function shuffled(rand: Rand): number[] {
  const order = Array.from({ length: CHAPTERS }, (_, i) => i + 1)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

export function freshProgress(rand: Rand, now: Date): Progress {
  return { order: shuffled(rand), cur: 0, books: 0, daily: 0, lastDay: now.toDateString(), bookDone: false }
}

/** Today's verses; yesterday's count reads as 0. */
export const dailyOf = (p: Progress, now: Date) => (p.lastDay === now.toDateString() ? p.daily : 0)

export const isFinished = (p: Progress, ch: number) => p.order.indexOf(ch) < p.cur

/** The chapter the reader is on (after a finished round, the last one read). */
export const currentChapter = (p: Progress) => p.order[Math.min(p.cur, CHAPTERS - 1)]

export function versesRead(p: Progress): number {
  let sum = 0
  for (let i = 0; i < p.cur; i++) sum += versesIn(p.order[i])
  return sum
}

/**
 * Finish a chapter. A chapter picked from the list takes the current slot, so the round stays
 * 150 distinct chapters. Finishing the 150th marks the round done; `startNextBook` begins the next.
 */
export function finish(p: Progress, ch: number, now: Date): Progress {
  if (p.bookDone || isFinished(p, ch)) return p
  const order = [...p.order]
  const at = order.indexOf(ch)
  if (at !== p.cur) {
    order.splice(at, 1)
    order.splice(p.cur, 0, ch)
  }
  const cur = p.cur + 1
  const done = cur === CHAPTERS
  return {
    order,
    cur,
    books: done ? p.books + 1 : p.books,
    daily: dailyOf(p, now) + versesIn(ch),
    lastDay: now.toDateString(),
    bookDone: done,
  }
}

/** Another chapter now: swap the next one with a random later, unread one. */
export function skip(p: Progress, rand: Rand): Progress {
  if (p.bookDone || p.cur >= CHAPTERS - 1) return p
  const order = [...p.order]
  const j = p.cur + 1 + Math.floor(rand() * (CHAPTERS - p.cur - 1))
  ;[order[p.cur], order[j]] = [order[j], order[p.cur]]
  return { ...p, order }
}

export function startNextBook(p: Progress, rand: Rand): Progress {
  if (!p.bookDone) return p
  return { ...p, order: shuffled(rand), cur: 0, bookDone: false }
}

/**
 * Background hue: one full turn of the color wheel per round, by verses read. It never goes
 * backwards, so starting a new round continues around the wheel instead of spinning back.
 */
export function hueOf(p: Progress): number {
  const rounds = p.bookDone ? p.books - 1 : p.books
  return 25 + 360 * (rounds + versesRead(p) / TOTAL_VERSES)
}

// Where each length falls among all 150 chapters (0 = shortest, 1 = longest). Most chapters are
// 8–20 verses, so coloring by raw length left them all nearly the same green.
const SORTED = LENGTHS.slice(1).sort((a, b) => a - b)
const RANK = new Map<number, number>()
for (const n of new Set(SORTED)) RANK.set(n, (SORTED.indexOf(n) + SORTED.lastIndexOf(n)) / 2 / (CHAPTERS - 1))

/**
 * Chapter length → hue by rank: green through the short half, then yellow, orange, and red for the
 * longest. Bending the rank keeps the short chapters green instead of turning yellow at the median.
 */
export function lengthHue(verses: number): number {
  return 155 - 130 * (RANK.get(verses) ?? 1) ** 2.2
}
