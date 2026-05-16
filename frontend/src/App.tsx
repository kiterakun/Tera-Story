import React, { Suspense, useEffect } from 'react'
import { Toaster } from 'sonner'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useUIStore } from './stores/uiStore'
import { useSettingsStore } from './stores/settingsStore'
import { persistLanguage } from './i18n'
import type { AppTheme } from './stores/uiStore'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'

const LoginPage = React.lazy(() => import('./pages/LoginPage'))
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'))
const WorldListPage = React.lazy(() => import('./pages/WorldListPage'))
const WorldDetailPage = React.lazy(() => import('./pages/WorldDetailPage'))
const WorldCreatePage = React.lazy(() => import('./pages/WorldCreatePage'))
const PlaythroughPage = React.lazy(() => import('./pages/PlaythroughPage'))
const CharacterCreatePage = React.lazy(() => import('./pages/CharacterCreatePage'))
const StoryReaderPage = React.lazy(() => import('./pages/StoryReaderPage'))
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'))
const GalleryPage = React.lazy(() => import('./pages/GalleryPage'))
const AchievementsPage = React.lazy(() => import('./pages/AchievementsPage'))
const ChroniclePage = React.lazy(() => import('./pages/ChroniclePage'))
const FateThreadsPage = React.lazy(() => import('./pages/FateThreadsPage'))
const FriendsPage = React.lazy(() => import('./pages/FriendsPage'))
const MapPage = React.lazy(() => import('./pages/MapPage'))

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
      setTheme(serverTheme as AppTheme)
    }
  }, [serverLanguage, serverTheme, theme, setTheme])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>}>
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
                <Route path="/play/:playthroughId/threads" element={<ProtectedRoute><FateThreadsPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/gallery" element={<ProtectedRoute><GalleryPage /></ProtectedRoute>} />
                <Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
                <Route path="/chronicle/:playthroughId" element={<ProtectedRoute><ChroniclePage /></ProtectedRoute>} />
                <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
                <Route path="/worlds/:worldId/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
                <Route path="/playthroughs/:playthroughId/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
                <Route path="/worlds/:worldId/playthroughs/:playthroughId/characters/create" element={<ProtectedRoute><CharacterCreatePage /></ProtectedRoute>} />
              </Routes>
            </Layout>
          } />
          </Routes>
        </Suspense>
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
    </ErrorBoundary>
  )
}

export default App
