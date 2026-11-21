import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import interLatin from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url'
import { useStore } from './store'

// Digits (and %) render in Inter everywhere; letters keep Geist / Geist Mono.
try {
  const digits = new FontFace('LI Digits', `url(${interLatin}) format('woff2')`, { unicodeRange: 'U+0030-0039, U+0025', weight: '100 900' })
  document.fonts.add(digits)
  digits.load().catch(() => {})
} catch { /* old browser: falls back to Geist digits */ }

// apply auto-growing targets before the first paint so the list doesn't shift under a finger
useStore.getState().runProgression()
import App from './App'
import { registerSW } from 'virtual:pwa-register'

// Auto-update: check for a new version on launch, whenever the app comes to the foreground,
// and hourly; the page reloads itself once the new version is installed.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return
    const check = () => reg.update().catch(() => {})
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
    setInterval(check, 60 * 60 * 1000)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
