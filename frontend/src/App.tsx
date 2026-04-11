import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import './App.css'

function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token_hash = params.get('token_hash')
    const type = params.get('type')

    if (token_hash) {
      supabase.auth
        .verifyOtp({ token_hash, type: (type || 'email') as 'email' })
        .then(({ error }) => {
          if (error) {
            setError(error.message)
          } else {
            window.history.replaceState({}, document.title, '/')
            navigate('/')
          }
        })
    } else {
      // OAuth redirect — session is picked up automatically by onAuthStateChange
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) navigate('/')
        else navigate('/login')
      })
    }
  }, [navigate])

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="status-icon">⚠️</div>
          <h1>Authentication Failed</h1>
          <div className="error-message">{error}</div>
          <button
            className="btn-secondary"
            onClick={() => navigate('/login')}
            style={{ marginTop: 16 }}
          >
            ← Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="status-icon">🔐</div>
        <h1>Verifying</h1>
        <p className="status-text">Hang tight…</p>
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <span className="spinner" />
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [checked, setChecked] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session)
      setChecked(true)
      if (!session) navigate('/login', { replace: true })
    })
  }, [navigate])

  if (!checked) return null
  return authed ? <>{children}</> : null
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
