import { useEffect } from 'react'

/** OKLCH → #rrggbb, for the status-bar color (meta theme-color doesn't take oklch everywhere). */
export function oklchToHex(l: number, c: number, hDeg: number): string {
  const h = (hDeg * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
  return (
    '#' +
    lin
      .map((x) => {
        const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(x, 0), 1 / 2.4) - 0.055
        return Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')
      })
      .join('')
  )
}

/** Keeps the screen on while the app is in front, if the setting is on. Re-asks after the app comes back. */
export function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let alive = true
    const request = async () => {
      if (document.visibilityState !== 'visible' || lock) return
      try {
        lock = await navigator.wakeLock.request('screen')
        lock.addEventListener('release', () => { lock = null })
        if (!alive) lock.release()
      } catch {
        /* refused (low battery, not allowed): the screen just dims as usual */
      }
    }
    const onVis = () => { if (document.visibilityState === 'visible') request() }
    request()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVis)
      lock?.release()
    }
  }, [on])
}
