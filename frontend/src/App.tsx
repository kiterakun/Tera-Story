import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WorldListPage from './pages/WorldListPage'
import WorldDetailPage from './pages/WorldDetailPage'
import PlaythroughPage from './pages/PlaythroughPage'
import StoryReaderPage from './pages/StoryReaderPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/worlds" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/worlds" element={<WorldListPage />} />
        <Route path="/worlds/:id" element={<WorldDetailPage />} />
        <Route path="/worlds/:worldId/playthroughs/:id" element={<PlaythroughPage />} />
        <Route path="/play/:playthroughId" element={<StoryReaderPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
