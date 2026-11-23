import { useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Slider } from '@base-ui/react/slider'
import { Switch } from '@base-ui/react/switch'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { PSALMS, TOTAL_VERSES, dailyOf, versesRead } from '@/lib/book'
import { actions, useStore } from '@/lib/store'
import BooksDialog from './BooksDialog'

const PRESETS = [30, 50, 100]

export default function SettingsSheet({ open, onClose, ch }: { open: boolean; onClose: () => void; ch: number }) {
  const { progress: p, settings: s } = useStore()
  const [other, setOther] = useState(false)
  const [books, setBooks] = useState(false)
  const holdTimer = useRef(0)
  const isPreset = PRESETS.includes(s.goal)
  const showOther = other || !isPreset
  const preview = PSALMS[ch].filter((l) => l.trim()).slice(0, 2).join(' ')

  // The book count is a one-time correction, so it opens only on a long press.
  const hold = {
    onPointerDown: () => {
      holdTimer.current = window.setTimeout(() => setBooks(true), 550)
    },
    onPointerUp: () => clearTimeout(holdTimer.current),
    onPointerLeave: () => clearTimeout(holdTimer.current),
    onPointerCancel: () => clearTimeout(holdTimer.current),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} showSwipeHandle>
      <DrawerContent className="sheet">
        <div className="sh-hd">
          <DrawerTitle render={<h2 />}>הגדרות</DrawerTitle>
        </div>
        <div className="sheet-body">
          <div className="stats">
            <div>
              <b>{Math.round((versesRead(p) / TOTAL_VERSES) * 100)}%</b>
              <span>מהספר</span>
            </div>
            <div>
              <b dir="ltr">
                {dailyOf(p, new Date())}/{s.goal}
              </b>
              <span>היום</span>
            </div>
            <div className="hold" {...hold} aria-label={`${p.books} ספרים, לחיצה ארוכה לשינוי`}>
              <b>{p.books}</b>
              <span>ספרים</span>
            </div>
          </div>

          <div className="preview" aria-hidden="true">{preview}</div>
          <div className="size-row">
            <span className="a1" aria-hidden="true">א</span>
            <Slider.Root
              className="slider"
              value={s.fontSize}
              min={16}
              max={56}
              step={1}
              onValueChange={(v) => actions.setSettings({ fontSize: v as number })}
              aria-label="גודל טקסט"
            >
              <Slider.Control className="slider-control">
                <Slider.Track className="slider-track">
                  <Slider.Indicator className="slider-indicator" />
                  <Slider.Thumb className="slider-thumb" aria-label="גודל טקסט" />
                </Slider.Track>
              </Slider.Control>
            </Slider.Root>
            <span className="a2" aria-hidden="true">א</span>
          </div>

          <div className="sub">יעד יומי · פסוקים</div>
          <div className="presets">
            {PRESETS.map((g) => (
              <button
                key={g}
                aria-pressed={s.goal === g && !showOther}
                onClick={() => {
                  setOther(false)
                  actions.setSettings({ goal: g })
                }}
              >
                {g}
              </button>
            ))}
            <button aria-pressed={showOther} onClick={() => setOther(true)}>
              {isPreset ? 'אחר' : s.goal}
            </button>
          </div>
          {showOther && (
            <div className="group">
              <div className="row">
                <label>יעד אחר</label>
                <div className="step">
                  <button onClick={() => actions.setSettings({ goal: Math.max(10, s.goal - 10) })} aria-label="פחות">
                    <Minus />
                  </button>
                  <output>{s.goal}</output>
                  <button onClick={() => actions.setSettings({ goal: s.goal + 10 })} aria-label="יותר">
                    <Plus />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="group">
            <div className="row">
              <label htmlFor="awake">מסך דולק בזמן קריאה</label>
              <Switch.Root id="awake" className="switch" checked={s.keepAwake} onCheckedChange={(v) => actions.setSettings({ keepAwake: v })}>
                <Switch.Thumb className="switch-thumb" />
              </Switch.Root>
            </div>
          </div>
        </div>
        <BooksDialog open={books} onClose={() => setBooks(false)} books={p.books} />
      </DrawerContent>
    </Drawer>
  )
}
