import './App.css'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
)

export default function App() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [claims, setClaims] = useState<Record<string, unknown> | null>(null)

  // Check URL params on initial render
  const params = new URLSearchParams(window.location.search)
  const hasTokenHash = params.get('token_hash')

  const [verifying, setVerifying] = useState(!!hasTokenHash)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSuccess, setAuthSuccess] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token_hash = params.get('token_hash')
    const type = params.get('type')

    if (token_hash) {
      supabase.auth
        .verifyOtp({
          token_hash,
          type: (type || 'email') as 'email',
        })
        .then(({ error }) => {
          if (error) {
            setAuthError(error.message)
          } else {
            setAuthSuccess(true)
            window.history.replaceState({}, document.title, '/')
          }
          setVerifying(false)
        })
    }

    supabase.auth.getClaims().then(({ data: { claims } }) => {
      setClaims(claims)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      supabase.auth.getClaims().then(({ data: { claims } }) => {
        setClaims(claims)
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) {
      alert(error.message)
    } else {
      alert('Check your email for the login link!')
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setClaims(null)
  }

  // Show verification state
  if (verifying) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="status-icon">🔐</div>
          <h1>Verifying</h1>
          <p className="status-text">Confirming your magic link…</p>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <span className="spinner" />
          </div>
        </div>
      </div>
    )
  }

  // Show auth error
  if (authError) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="status-icon">⚠️</div>
          <h1>Authentication Failed</h1>
          <div className="error-message">{authError}</div>
          <button
            className="btn-secondary"
            onClick={() => {
              setAuthError(null)
              window.history.replaceState({}, document.title, '/')
            }}
          >
            ← Back to login
          </button>
        </div>
      </div>
    )
  }

  // Show auth success (briefly before claims load)
  if (authSuccess && !claims) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="status-icon">✅</div>
          <h1>You're in!</h1>
          <p className="status-text status-success">Authentication successful</p>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <span className="spinner" />
          </div>
        </div>
      </div>
    )
  }

  // If user is logged in, show welcome screen
  if (claims) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="status-icon">👋</div>
          <h1>Welcome back</h1>
          <div className="welcome-email">{claims.email as string}</div>
          <button className="btn-secondary" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>
    )
  }

  // Show login form
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Welcome</h1>
        <p className="subtitle">Sign in with a magic link sent to your email</p>
        <form className="auth-form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            required={true}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn-primary" disabled={loading}>
            {loading ? (
              <><span className="spinner" /> Sending…</>
            ) : (
              'Send magic link'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
