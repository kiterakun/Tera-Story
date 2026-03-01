import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useUIStore } from './stores/uiStore'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WorldListPage from './pages/WorldListPage'
import WorldDetailPage from './pages/WorldDetailPage'
import WorldCreatePage from './pages/WorldCreatePage'
import PlaythroughPage from './pages/PlaythroughPage'
import CharacterCreatePage from './pages/CharacterCreatePage'
import StoryReaderPage from './pages/StoryReaderPage'
import SettingsPage from './pages/SettingsPage'
import { Layout } from './components/Layout'

function App() {
  const loadUser = useAuthStore(s => s.loadUser)
  const theme = useUIStore(s => s.theme)

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Sync theme class with uiStore
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/worlds" replace />} />
              
              {/* Protected Routes */}
              <Route path="/worlds" element={<ProtectedRoute><WorldListPage /></ProtectedRoute>} />
              <Route path="/worlds/create" element={<ProtectedRoute><WorldCreatePage /></ProtectedRoute>} />
              <Route path="/worlds/:id" element={<ProtectedRoute><WorldDetailPage /></ProtectedRoute>} />
              <Route path="/worlds/:worldId/playthroughs/:id" element={<ProtectedRoute><PlaythroughPage /></ProtectedRoute>} />
              <Route path="/play/:playthroughId" element={<ProtectedRoute><StoryReaderPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/worlds/:worldId/playthroughs/:playthroughId/characters/create" element={<ProtectedRoute><CharacterCreatePage /></ProtectedRoute>} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
