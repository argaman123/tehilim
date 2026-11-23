import { useEffect, useLayoutEffect, useRef } from 'react'
import { hueOf } from '@/lib/book'
import { oklchToHex, useWakeLock } from '@/lib/device'
import { useStore } from '@/lib/store'
import Reader from '@/reader/Reader'

export default function App() {
  const s = useStore()
  const hue = hueOf(s.progress)
  const lastHue = useRef(hue)

  useLayoutEffect(() => {
    const root = document.documentElement
    // A finished chapter moves the color a little and animates. A big jump (books changed by hand) would
    // spin through the whole color wheel, so it switches at once instead.
    const jump = Math.abs(hue - lastHue.current) > 90 && root.classList.contains('ready')
    lastHue.current = hue
    if (jump) root.classList.remove('ready')
    root.style.setProperty('--h', String(hue))
    if (jump) {
      getComputedStyle(root).getPropertyValue('--h') // apply the new color before turning transitions back on
      requestAnimationFrame(() => root.classList.add('ready'))
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', oklchToHex(0.3, 0.1, hue % 360))
  }, [hue])

  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--fs', s.settings.fontSize + 'px')
  }, [s.settings.fontSize])

  // Color changes animate only after the first paint.
  useEffect(() => {
    const id = requestAnimationFrame(() => document.documentElement.classList.add('ready'))
    return () => cancelAnimationFrame(id)
  }, [])

  useWakeLock(s.settings.keepAwake)

  return <Reader />
}
