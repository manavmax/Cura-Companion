import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./components/ui/theme-provider"
import { Toaster } from "./components/ui/toaster"
import { AuthProvider } from "./contexts/AuthContext"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Layout } from "./components/Layout"
import { BlankPage } from "./pages/BlankPage"
import { Dashboard } from "./pages/Dashboard"
import { ChatTherapy } from "./pages/ChatTherapy"
import { ChatHistory } from "./pages/ChatHistory"
import { ChatSessionView } from "./pages/ChatSessionView"
import { MoodTracking } from "./pages/MoodTracking"
import { Journal } from "./pages/Journal"
import { Resources } from "./pages/Resources"
import { Settings } from "./pages/Settings"
import { Onboarding } from "./pages/Onboarding"
import { useEffect, useState } from "react"

function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
  <AuthProvider>
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      {isOffline && (
        <div style={{ zIndex: 1000 }} className="fixed top-0 left-0 w-full bg-blue-100 text-blue-800 text-center py-2 shadow-md">
          <span>You are offline. Core features remain available. Changes will sync when you reconnect.</span>
          {/* TODO: Full offline/PWA support with service worker and local cache */}
        </div>
      )}
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="chat" element={<ChatTherapy />} />
            <Route path="chat/history" element={<ChatHistory />} />
            <Route path="chat/:sessionId" element={<ChatSessionView />} />
            <Route path="mood" element={<MoodTracking />} />
            <Route path="journal" element={<Journal />} />
            <Route path="resources" element={<Resources />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<BlankPage />} />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  </AuthProvider>
  )
}

export default App