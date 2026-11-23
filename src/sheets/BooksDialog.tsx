import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { actions } from '@/lib/store'

export default function BooksDialog({ open, onClose, books }: { open: boolean; onClose: () => void; books: number }) {
  const [n, setN] = useState(books)
  useEffect(() => {
    if (open) setN(books)
  }, [open, books])
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="books-dlg z-[70] max-w-[calc(100%-4.5rem)] rounded-[22px] bg-(--sheet) p-0 ring-0 sm:max-w-xs">
        <DialogTitle render={<h2 />}>ספרים שהושלמו</DialogTitle>
        <div className="books-n">
          <button onClick={() => setN((x) => Math.max(0, x - 1))} aria-label="פחות">
            <Minus />
          </button>
          <output>{n}</output>
          <button onClick={() => setN((x) => x + 1)} aria-label="יותר">
            <Plus />
          </button>
        </div>
        <div className="dlg-actions">
          <button className="secondary" onClick={onClose}>
            ביטול
          </button>
          <button
            className="primary"
            onClick={() => {
              actions.setBooks(n)
              onClose()
            }}
          >
            שמירה
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
