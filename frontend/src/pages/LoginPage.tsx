import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type AuthTab = 'signin' | 'signup'
type AuthMode = 'password' | 'magic'

export default function LoginPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<AuthTab>('signin')
  const [mode, setMode] = useState<AuthMode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const resetState = () => {
    setError(null)
    setSuccessMsg(null)
  }

  const handleTabChange = (newTab: AuthTab) => {
    setTab(newTab)
    setMode('password')
    resetState()
  }

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    resetState()

    if (tab === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccessMsg('Account created! Check your email to confirm your address.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        navigate('/')
      }
    }
    setLoading(false)
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    resetState()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
    } else {
      setSuccessMsg('Magic link sent! Check your inbox.')
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    resetState()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-split">
      {/* Left — branding panel */}
      <div className="auth-panel-left">
        <div className="auth-panel-brand">
          <div className="brand-mark">R</div>
          <span className="brand-name">Resolve</span>
        </div>

        <div className="auth-panel-body">
          <h2>Land your next role.</h2>
          <p>Paste a job description. Get a tailored resume in seconds.</p>
        </div>

        <p className="auth-panel-footer">Built for job seekers who move fast.</p>
      </div>

      {/* Right — form panel */}
      <div className="auth-panel-right">
        <div className="auth-form-wrap">
          {/* Tab switcher */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === 'signin' ? 'active' : ''}`}
              onClick={() => handleTabChange('signin')}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => handleTabChange('signup')}
            >
              Sign Up
            </button>
          </div>

          {/* Google OAuth */}
          {mode === 'password' && (
            <>
              <button
                className="btn-google"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="divider">
                <span>or</span>
              </div>
            </>
          )}

          {/* Error / Success messages */}
          {error && <div className="error-message">{error}</div>}
          {successMsg && <div className="success-message">{successMsg}</div>}

          {/* Password form */}
          {mode === 'password' && (
            <form className="auth-form" onSubmit={handlePasswordAuth}>
              <div className="input-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder={tab === 'signup' ? 'Create a password' : 'Your password'}
                  value={password}
                  required
                  minLength={tab === 'signup' ? 8 : 1}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button className="btn-primary" disabled={loading}>
                {loading ? (
                  <><span className="spinner" /> Processing…</>
                ) : tab === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Magic link form */}
          {mode === 'magic' && (
            <form className="auth-form" onSubmit={handleMagicLink}>
              <div className="input-group">
                <label htmlFor="email-magic">Email</label>
                <input
                  id="email-magic"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button className="btn-primary" disabled={loading}>
                {loading ? (
                  <><span className="spinner" /> Sending…</>
                ) : 'Send Magic Link'}
              </button>
            </form>
          )}

          {/* Toggle between password & magic link */}
          <div className="auth-alt-action">
            {mode === 'password' ? (
              <button
                className="btn-text"
                onClick={() => { setMode('magic'); resetState() }}
              >
                Sign in with magic link instead
              </button>
            ) : (
              <button
                className="btn-text"
                onClick={() => { setMode('password'); resetState() }}
              >
                ← Back to password sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
