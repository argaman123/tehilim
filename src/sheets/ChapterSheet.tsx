import { Check } from 'lucide-react'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { CHAPTERS, currentChapter, isFinished, lengthHue, versesIn } from '@/lib/book'
import { hebNum } from '@/lib/hebrew'
import { actions, useStore } from '@/lib/store'

/** All 150: unread ones tinted by length (green short → red long), read ones faded, the next one white. */
export default function ChapterSheet({ open, onClose, current }: { open: boolean; onClose: () => void; current: number }) {
  const { progress: p } = useStore()
  const next = currentChapter(p)
  const pick = (c: number) => {
    onClose()
    actions.view(c)
  }
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} showSwipeHandle>
      <DrawerContent className="sheet">
        <div className="sh-hd">
          <DrawerTitle render={<h2 />}>פרקים</DrawerTitle>
          <span dir="ltr">{p.cur}/150</span>
        </div>
        <div className="sheet-body">
          <div className="grid">
            {Array.from({ length: CHAPTERS }, (_, i) => i + 1).map((c) => {
              const read = isFinished(p, c)
              const isNext = c === next && !p.bookDone
              const h = lengthHue(versesIn(c))
              return (
                <button
                  key={c}
                  className={'cell' + (isNext ? ' next' : read ? ' read' : '')}
                  style={isNext || read ? undefined : { background: `oklch(0.78 0.16 ${h} / 0.3)`, color: `oklch(0.86 0.15 ${h})` }}
                  onClick={() => pick(c)}
                  aria-current={c === current ? 'true' : undefined}
                  aria-label={`פרק ${hebNum(c)}, ${versesIn(c)} פסוקים${read ? ', נקרא' : ''}`}
                >
                  <span className="l">{hebNum(c)}</span>
                  {read && <Check />}
                </button>
              )
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
