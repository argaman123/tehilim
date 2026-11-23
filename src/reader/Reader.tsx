import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { ArrowUp, Check, ChevronRight, Settings, Shuffle } from 'lucide-react'
import { TOTAL_VERSES, currentChapter, dailyOf, isFinished, versesIn } from '@/lib/book'
import { actions, useStore } from '@/lib/store'
import ChapterSheet from '@/sheets/ChapterSheet'
import SettingsSheet from '@/sheets/SettingsSheet'
import { BookLine, Dedication, Heading, Title, Verses } from './parts'
import { usePinch } from './usePinch'

export default function Reader() {
  const { progress: p, settings, viewing } = useStore()
  const ch = viewing ?? currentChapter(p)
  const [scrolled, setScrolled] = useState(false)
  const [sheet, setSheet] = useState<'chapters' | 'settings' | null>(null)
  const scroller = useRef<HTMLElement>(null)
  const intro = useRef<HTMLDivElement>(null)

  const bar = useRef<HTMLDivElement>(null)

  // The bar fills in once the big chapter letter has scrolled up past it, out of sight.
  const onScroll = useCallback(() => {
    const letter = intro.current?.querySelector('.nm')
    if (letter && bar.current) setScrolled(letter.getBoundingClientRect().bottom < bar.current.getBoundingClientRect().top)
  }, [])

  // A new chapter starts at the top.
  useLayoutEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
    onScroll()
  }, [ch, onScroll])

  const saveSize = useCallback((px: number) => actions.setSettings({ fontSize: px }), [])
  usePinch(scroller, settings.fontSize, saveSize)

  const openChapters = () => setSheet('chapters')
  const toTop = () =>
    scroller.current?.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })

  return (
    <>
      <div className={'shade' + (scrolled ? ' on' : '')} aria-hidden="true" />
      <div className={'bar' + (scrolled ? ' on' : '')} ref={bar}>
        {viewing != null ? (
          <button className="ib side" onClick={() => actions.view(null)} tabIndex={scrolled ? 0 : -1} aria-label="חזרה לפרק הבא">
            <ChevronRight />
          </button>
        ) : (
          <button className="ib side" onClick={toTop} tabIndex={scrolled ? 0 : -1} aria-label="לראש הפרק">
            <ArrowUp />
          </button>
        )}
        <div className="mid">
          <Title ch={ch} onOpen={openChapters} tabIndex={scrolled ? 0 : -1} />
          <BookLine p={p} goal={settings.goal} daily />
        </div>
        <div className="btns">
          {viewing == null && (
            <button className="ib shuf" onClick={actions.skip} disabled={p.bookDone} tabIndex={scrolled ? -1 : 0} aria-label="פרק אחר">
              <Shuffle />
            </button>
          )}
          <button className="ib" onClick={() => setSheet('settings')} aria-label="הגדרות">
            <Settings />
          </button>
        </div>
      </div>

      <main className="txt" ref={scroller} onScroll={onScroll}>
        <div className="col">
          <div className="intro" ref={intro}>
            <div className="head">
              {viewing != null && (
                <button className="ib" onClick={() => actions.view(null)} tabIndex={scrolled ? -1 : 0} aria-label="חזרה לפרק הבא">
                  <ChevronRight />
                </button>
              )}
              <Heading ch={ch} p={p} goal={settings.goal} onOpen={openChapters} />
            </div>
            <Dedication text={settings.dedication} />
            <BookLine p={p} goal={settings.goal} />
          </div>
          <Verses key={ch} ch={ch} />
          <div className="end">
            <EndOfChapter ch={ch} isNext={viewing == null} />
          </div>
        </div>
      </main>

      <ChapterSheet open={sheet === 'chapters'} onClose={() => setSheet(null)} current={ch} />
      <SettingsSheet open={sheet === 'settings'} onClose={() => setSheet(null)} ch={ch} />
    </>
  )
}

function EndOfChapter({ ch, isNext }: { ch: number; isNext: boolean }) {
  const { progress: p, settings } = useStore()
  if (isNext && p.bookDone) {
    return (
      <div className="done-card">
        <div className="num">{p.books}</div>
        <div className="t1">סיימת את ספר התהילים</div>
        <div className="t2">
          <span dir="ltr">{TOTAL_VERSES.toLocaleString('en-US')}</span> פסוקים · 150 פרקים
        </div>
        <button className="fin" onClick={actions.startNextBook}>
          <b>להתחיל ספר {p.books + 1}</b>
        </button>
      </div>
    )
  }
  if (isFinished(p, ch)) {
    return (
      <div className="read-chip">
        <Check />
        <span>נקרא</span>
      </div>
    )
  }
  const left = settings.goal - dailyOf(p, new Date()) - versesIn(ch)
  return (
    <button className={'fin' + (left <= 0 ? ' met' : '')} onClick={() => actions.finish(ch)}>
      <b>סיימתי את הפרק</b>
      <span>{left <= 0 ? 'היעד היומי הושלם' : `נותרו ${left} פסוקים ליעד היומי`}</span>
    </button>
  )
}
