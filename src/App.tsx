import { useEffect, useLayoutEffect } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './store'
import { useT } from './i18n'
import { Icon } from './components/Icon'
import { QuickAdd } from './components/QuickAdd'
import { Assistant } from './components/Assistant'
import { useOverlay } from './components/ui'
import { useCloudSync } from './lib/sync'
import Today from './screens/Today'
import Calendar from './screens/Calendar'
import Finance from './screens/Finance'
import Sport from './screens/Sport'
import Growth from './screens/Growth'
import Stats from './screens/Stats'
import Summary from './screens/Summary'
import Settings from './screens/Settings'
import Session from './screens/Session'

const TABS = [
  { to: '/', icon: 'trophy', key: 'tab.today' },
  { to: '/calendar', icon: 'cal', key: 'tab.calendar' },
  { to: '/finance', icon: 'wallet', key: 'tab.finance' },
  { to: '/sport', icon: 'activity', key: 'tab.sport' },
  { to: '/growth', icon: 'compass', key: 'tab.growth' },
]

function useTheme() {
  const theme = useStore((s) => s.theme)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const apply = () => {
      const resolved = theme === 'system' ? (mq.matches ? 'light' : 'dark') : theme
      document.documentElement.dataset.theme = resolved
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'light' ? '#f4f4f5' : '#000000')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}

/** refresh USD→GEL/RUB rates once a day (free, keyless API) */
function useRates() {
  useEffect(() => {
    const { rates, set } = useStore.getState()
    const age = rates.updatedAt ? Date.now() - new Date(rates.updatedAt).getTime() : Infinity
    if (age < 20 * 3600 * 1000) return
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((r) => r.json())
      .then((j) => {
        if (j?.rates?.GEL && j?.rates?.RUB) set('rates', { GEL: j.rates.GEL, RUB: j.rates.RUB, updatedAt: new Date().toISOString() })
      })
      .catch(() => {})
  }, [])
}

export default function App() {
  const t = useT()
  const lang = useStore((s) => s.lang)
  useTheme()
  useRates()
  useCloudSync()
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  useEffect(() => {
    const run = () => useStore.getState().runProgression()
    run()
    const onVis = () => document.visibilityState === 'visible' && run()
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const { pathname } = useLocation()
  const overlay = useOverlay((o) => o.count > 0)
  const inSession = pathname.startsWith('/session')
  // every screen opens at the top (before paint, so nothing jumps)
  useLayoutEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  // while a sheet is open, freeze the page behind it (iOS ignores overflow:hidden on body)
  useEffect(() => {
    if (!overlay) return
    const y = window.scrollY
    const b = document.body.style
    Object.assign(b, { position: 'fixed', top: `-${y}px`, left: '0', right: '0', width: '100%' })
    return () => {
      Object.assign(b, { position: '', top: '', left: '', right: '', width: '' })
      window.scrollTo(0, y)
    }
  }, [overlay])

  return (
    <>
      <main className="app">
        <div className="page" key={pathname}>
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/sport" element={<Sport />} />
          <Route path="/growth" element={<Growth />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/summary/:month" element={<Summary />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/session/:kind" element={<Session />} />
        </Routes>
        </div>
      </main>
      <nav className={`tabbar ${overlay || inSession ? 'hide' : ''}`}>
        {TABS.map((x) => (
          <NavLink
            key={x.to}
            to={x.to}
            end={x.to === '/'}
            onClick={() => { if (pathname === x.to) window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          >
            <Icon n={x.icon} />
            {t(x.key)}
          </NavLink>
        ))}
      </nav>
      <QuickAdd />
      {!inSession && <Assistant />}
    </>
  )
}
