import { useEffect, useRef, type CSSProperties } from 'react'
import { PSALMS, TOTAL_VERSES, dailyOf, isFinished, lengthHue, versesIn, versesRead, type Progress } from '@/lib/book'
import { hebNum } from '@/lib/hebrew'
import { actions } from '@/lib/store'

/**
 * The chapter's verse count inside a rounded square that traces today's goal: what was already read
 * today, then what finishing this chapter adds, in its length color (green short → red long).
 */
function DailySquare({ ch, p, goal }: { ch: number; p: Progress; goal: number }) {
  const n = versesIn(ch)
  const today = dailyOf(p, new Date())
  const done = Math.min(100, (today / Math.max(1, goal)) * 100)
  const add = isFinished(p, ch) ? 0 : Math.min(100 - done, (n / Math.max(1, goal)) * 100)
  const shape = { x: 2, y: 2, width: 36, height: 36, rx: 11.5, pathLength: 100 }
  // A small gap keeps the two parts apart; a part too small to draw is left out.
  const part = (size: number, start: number, className: string) =>
    size > 1.2 && <rect {...shape} className={className} strokeDasharray={`${size - 1.2} 100`} strokeDashoffset={-start - 0.6} />
  return (
    <span className="daily" style={{ '--lh': lengthHue(n) } as CSSProperties} aria-label={`${n} פסוקים, ${today} מתוך ${goal} היום`}>
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <rect {...shape} className="track" />
        {part(done, 0, 'done')}
        {part(add, done, 'add')}
      </svg>
      <b>{n}</b>
    </span>
  )
}

/** The chapter at the top of the text: the big letter and today's goal. Opens the chapter list. */
export function Heading({ ch, p, goal, onOpen }: { ch: number; p: Progress; goal: number; onOpen: () => void }) {
  return (
    <button className="ttl" onClick={onOpen} aria-label={`פרק ${hebNum(ch)}, כל הפרקים`}>
      <span className="nm">{hebNum(ch)}</span>
      <DailySquare ch={ch} p={p} goal={goal} />
    </button>
  )
}

/** The chapter in the scrolled bar. */
export function Title({ ch, onOpen, tabIndex }: { ch: number; onOpen: () => void; tabIndex?: number }) {
  return (
    <button className="ttl" onClick={onOpen} tabIndex={tabIndex} aria-label={`פרק ${hebNum(ch)}, כל הפרקים`}>
      <span className="pk">פרק</span>
      <span className="nm">{hebNum(ch)}</span>
    </button>
  )
}

/** The book in verses. With `daily`: read before today · read today · still to go for today's goal. */
export function BookLine({ p, goal, daily }: { p: Progress; goal: number; daily?: boolean }) {
  const read = versesRead(p)
  const today = daily ? Math.min(dailyOf(p, new Date()), read) : 0
  const left = daily ? Math.max(0, goal - today) : 0
  const pct = (x: number) => `${(x / TOTAL_VERSES) * 100}%`
  return (
    <div className="hair" aria-hidden="true">
      <i className="s1" style={{ width: pct(read - today) }} />
      <i className="s2" style={{ width: pct(today) }} />
      <i className="s3" style={{ width: pct(left) }} />
    </div>
  )
}

/** Edited in place; several lines allowed. Not re-rendered while typing, so the caret stays put. */
export function Dedication({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el && document.activeElement !== el && el.innerText !== text) el.innerText = text
  }, [text])
  return (
    <div
      ref={ref}
      className="ded"
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="הקדשה"
      data-ph="הקדשה"
      onInput={(e) => {
        const el = e.currentTarget
        const value = el.innerText.replace(/\n+$/, '')
        if (!value.trim() && el.innerHTML !== '') el.innerHTML = '' // let the faint placeholder come back
        actions.setSettings({ dedication: value })
      }}
    />
  )
}

export function Verses({ ch }: { ch: number }) {
  let n = 0
  return (
    <div className="verses">
      {PSALMS[ch].map((line, i) => {
        if (!line.trim()) return <div key={i} className="gap" />
        n++
        return (
          <p key={i} className="v">
            <span className="vn">{hebNum(n)}</span>
            {line}
          </p>
        )
      })}
    </div>
  )
}
