import { useSyncExternalStore } from 'react'
import { CHAPTERS, finish, freshProgress, skip, startNextBook, type Progress } from './book'
import { parseHebNum } from './hebrew'

export type Settings = {
  /** Daily goal in verses. */
  goal: number
  fontSize: number
  dedication: string
  keepAwake: boolean
}

export type Saved = { v: 1; progress: Progress; settings: Settings }

export const KEY = 'tehilim'
export const DEFAULT_SETTINGS: Settings = { goal: 50, fontSize: 30, dedication: '', keepAwake: true }

type Storage = Pick<globalThis.Storage, 'getItem'>

const int = (s: string | null, fallback: number) => {
  const n = s == null ? NaN : parseInt(s, 10)
  return Number.isFinite(n) ? n : fallback
}

/**
 * Reads the old Angular app's keys (same origin, so each device keeps its progress). The old keys
 * are left in place. A chapter list that doesn't parse into 150 distinct chapters is replaced with
 * a fresh shuffle; everything else is kept.
 */
export function migrateOld(ls: Storage, rand: () => number, now: Date): Saved | null {
  const chapters = ls.getItem('chapters')
  const hasAny = ['chapters', 'current', 'bookCount', 'goal', 'fontSize', 'dedication', 'dailyProgress'].some((k) => ls.getItem(k) != null)
  if (!hasAny) return null

  let progress = freshProgress(rand, now)
  const order = chapters?.split(',').map(parseHebNum) ?? []
  const valid = order.length === CHAPTERS && new Set(order).size === CHAPTERS && order.every((c) => c >= 1 && c <= CHAPTERS)
  if (valid) progress = { ...progress, order, cur: Math.min(Math.max(int(ls.getItem('current'), 0), 0), CHAPTERS - 1) }
  progress.books = Math.max(0, int(ls.getItem('bookCount'), 0))
  progress.daily = Math.max(0, int(ls.getItem('dailyProgress'), 0))
  progress.lastDay = ls.getItem('lastDay') ?? (progress.daily ? now.toDateString() : progress.lastDay)

  return {
    v: 1,
    progress,
    settings: {
      ...DEFAULT_SETTINGS,
      goal: Math.max(0, int(ls.getItem('goal'), DEFAULT_SETTINGS.goal)),
      fontSize: Math.min(60, Math.max(12, int(ls.getItem('fontSize'), DEFAULT_SETTINGS.fontSize))),
      dedication: ls.getItem('dedication') ?? '',
    },
  }
}

export function load(ls: Storage, rand: () => number, now: Date): Saved {
  try {
    const raw = ls.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as Saved
      if (s?.v === 1 && Array.isArray(s.progress?.order) && s.progress.order.length === CHAPTERS)
        return { v: 1, progress: s.progress, settings: { ...DEFAULT_SETTINGS, ...s.settings } }
    }
  } catch {
    /* unreadable: fall through */
  }
  return migrateOld(ls, rand, now) ?? { v: 1, progress: freshProgress(rand, now), settings: { ...DEFAULT_SETTINGS } }
}

// ---------- live store ----------

type State = Saved & {
  /** A chapter opened from the list (not the one up next). Not saved. */
  viewing: number | null
  /** Bumped when the day may have changed (app comes back to the front), so "today" is recomputed. */
  tick: number
}

const safeStorage: Storage & { setItem(k: string, v: string): void } = {
  getItem: (k) => {
    try { return localStorage.getItem(k) } catch { return null }
  },
  setItem: (k, v) => {
    try { localStorage.setItem(k, v) } catch { /* private mode or full */ }
  },
}

let state: State = { ...load(safeStorage, Math.random, new Date()), viewing: null, tick: 0 }
const listeners = new Set<() => void>()

function set(next: Partial<State>, persist = true) {
  state = { ...state, ...next }
  if (persist) safeStorage.setItem(KEY, JSON.stringify({ v: 1, progress: state.progress, settings: state.settings } satisfies Saved))
  listeners.forEach((l) => l())
}
if (!safeStorage.getItem(KEY)) set({})

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') set({ tick: state.tick + 1 }, false)
  })
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const useStore = () => useSyncExternalStore(subscribe, () => state)

export const actions = {
  finish(ch: number) {
    set({ progress: finish(state.progress, ch, new Date()), viewing: null })
  },
  skip() {
    set({ progress: skip(state.progress, Math.random), viewing: null })
  },
  startNextBook() {
    set({ progress: startNextBook(state.progress, Math.random), viewing: null })
  },
  view(ch: number | null) {
    const next = state.progress.order[state.progress.cur]
    set({ viewing: ch === next ? null : ch }, false)
  },
  setBooks(books: number) {
    set({ progress: { ...state.progress, books: Math.max(0, books) } })
  },
  setSettings(patch: Partial<Settings>) {
    set({ settings: { ...state.settings, ...patch } })
  },
}
