import { useEffect, type RefObject } from 'react'

const MIN = 16
const MAX = 56
const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v))

/**
 * Two fingers on the text (ctrl + scroll on a trackpad) resize it live through --fs, and the size
 * is saved when the gesture ends. The verse the reader is looking at stays in place while it grows.
 */
export function usePinch(ref: RefObject<HTMLElement | null>, fontSize: number, save: (px: number) => void) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const root = document.documentElement
    let live = fontSize
    let start = 0
    let from = fontSize
    let wheelTimer = 0

    const apply = (px: number) => {
      // Keep the same fraction of the text at the top of the screen.
      const frac = el.scrollTop / Math.max(1, el.scrollHeight)
      live = clamp(px)
      root.style.setProperty('--fs', live + 'px')
      el.scrollTop = frac * el.scrollHeight
    }
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        start = dist(e.touches)
        from = live
      }
    }
    const onMove = (e: TouchEvent) => {
      if (!start || e.touches.length !== 2) return
      e.preventDefault()
      apply(from * (dist(e.touches) / start))
    }
    const onEnd = (e: TouchEvent) => {
      if (start && e.touches.length < 2) {
        start = 0
        save(Math.round(live))
      }
    }
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      apply(live - e.deltaY * 0.15)
      clearTimeout(wheelTimer)
      wheelTimer = window.setTimeout(() => save(Math.round(live)), 300)
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      clearTimeout(wheelTimer)
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
      el.removeEventListener('wheel', onWheel)
    }
  }, [ref, fontSize, save])
}
