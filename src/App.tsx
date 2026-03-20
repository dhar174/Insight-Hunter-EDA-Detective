import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { CampaignPage } from './components/CampaignPage'
import { MissionPage } from './components/MissionPage'
import { ProgressPage } from './components/ProgressPage'
import { ProgressProvider } from './context/progress'
import { installRenderStateBridge } from './lib/renderState'
import { MissionRuntimeProvider } from './runtime/context'
import { useEffect } from 'react'

function AppChrome() {
  useEffect(() => {
    installRenderStateBridge()
  }, [])

  return (
    <BrowserRouter>
      <div className="app-frame">
        <header className="topbar">
          <Link className="brand-mark" to="/">
            <span>Join Quest</span>
            <small>Real joins. Real questions. Real pandas.</small>
          </Link>
          <nav className="topbar-nav">
            <Link to="/">Campaign</Link>
            <Link to="/progress">Progress</Link>
          </nav>
        </header>

        <main className="main-shell">
          <Routes>
            <Route path="/" element={<CampaignPage />} />
            <Route path="/missions/:missionId" element={<MissionPage />} />
            <Route path="/progress" element={<ProgressPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <MissionRuntimeProvider>
      <ProgressProvider>
        <AppChrome />
      </ProgressProvider>
    </MissionRuntimeProvider>
  )
}
