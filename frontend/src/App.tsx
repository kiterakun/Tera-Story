import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WorldListPage from './pages/WorldListPage'
import WorldDetailPage from './pages/WorldDetailPage'
import PlaythroughPage from './pages/PlaythroughPage'
import StoryReaderPage from './pages/StoryReaderPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  const loadUser = useAuthStore(s => s.loadUser)

  useEffect(() => {
    loadUser()
  }, [loadUser])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/worlds" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected Routes */}
        <Route path="/worlds" element={<ProtectedRoute><WorldListPage /></ProtectedRoute>} />
        <Route path="/worlds/:id" element={<ProtectedRoute><WorldDetailPage /></ProtectedRoute>} />
        <Route path="/worlds/:worldId/playthroughs/:id" element={<ProtectedRoute><PlaythroughPage /></ProtectedRoute>} />
        <Route path="/play/:playthroughId" element={<ProtectedRoute><StoryReaderPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
