import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useUIStore } from './stores/uiStore'
import { useSettingsStore } from './stores/settingsStore'
import { persistLanguage } from './i18n'
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
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const theme = useUIStore(s => s.theme)
  const setTheme = useUIStore(s => s.setTheme)
  const fetchSettings = useSettingsStore(s => s.fetchSettings)
  const serverLanguage = useSettingsStore(s => s.settings?.language)
  const serverTheme = useSettingsStore(s => s.settings?.theme)

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Fetch settings from server as soon as user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings()
    }
  }, [isAuthenticated, fetchSettings])

  // Sync theme to DOM whenever it changes (zustand persist hydrates state but doesn't touch DOM)
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('theme-light', 'theme-dark', 'theme-cyberpunk', 'theme-sepia', 'theme-abyssal');
    html.classList.add(`theme-${theme}`);
    html.classList.toggle('dark', ['dark', 'cyberpunk', 'abyssal'].includes(theme));
  }, [theme])

  // Sync server settings → local stores once fetched
  useEffect(() => {
    if (serverLanguage) {
      persistLanguage(serverLanguage)
    }
    if (serverTheme && serverTheme !== theme) {
      setTheme(serverTheme as any)
    }
  }, [serverLanguage, serverTheme, theme, setTheme])

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
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        toastOptions={{
          className: 'font-sans',
          duration: 4000,
        }}
      />
    </BrowserRouter>
  )
}

export default App
