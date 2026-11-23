import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import './index.css'
import App from './App.tsx'

// The old Angular app's service worker may still be installed on this address. Drop it and its caches,
// so it can't serve the old version (public/ngsw-worker.js also unregisters itself when it updates).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const r of regs) if (r.active?.scriptURL.includes('ngsw-worker')) r.unregister()
  }).catch(() => {})
}
if ('caches' in window) {
  caches.keys().then((keys) => keys.filter((k) => k.startsWith('ngsw:')).forEach((k) => caches.delete(k))).catch(() => {})
}

// Pinching the text resizes it (see usePinch); stop Safari from zooming the whole page instead.
document.addEventListener('gesturestart', (e) => e.preventDefault())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DirectionProvider direction="rtl">
      <App />
    </DirectionProvider>
  </StrictMode>,
)
