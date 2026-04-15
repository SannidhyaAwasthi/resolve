import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function GeneratePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/login'); return }
      setUser(user)
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setHasProfile(!!data?.full_name))
    })
  }, [navigate])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobDescription.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/resume/generate`,
        { jobDescription },
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      )
      const latexCode: string = response.data.latexCode

      // Save to generated_resumes so it appears in the Resumes page
      await supabase.from('generated_resumes').insert({ job_description: jobDescription, latex_code: latexCode })

      navigate('/editor', { state: { latexCode } })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to generate resume. The backend may not be running yet.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!user) return null

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="home-layout">
      <nav className="home-nav">
        <div className="nav-brand">
          <div className="brand-icon">R</div>
          <span className="brand-name">Resolve</span>
        </div>
        <div className="nav-user">
          <div className="user-avatar">
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" />
              : <span>{initials}</span>
            }
          </div>
          <span className="user-email">{user.email}</span>
          <button className="btn-secondary" onClick={handleSignOut}>Sign out</button>
        </div>
      </nav>

      <main className="generate-main">
        <div className="generate-header">
          <button className="btn-ghost" onClick={() => navigate('/')}>← Back</button>
          <h1 className="generate-title">Generate Resume</h1>
          <p className="generate-subtitle">
            Paste a job description and we'll tailor your resume to it using AI.
          </p>
        </div>

        {hasProfile === false && (
          <div className="generate-warning">
            <span className="generate-warning-icon">⚠</span>
            <p>
              Your profile is incomplete — the AI needs your experience, skills, and education to
              generate a resume.{' '}
              <button className="btn-text" onClick={() => navigate('/profile')}>
                Complete your profile →
              </button>
            </p>
          </div>
        )}

        <form className="generate-form" onSubmit={handleGenerate}>
          <div className="generate-field">
            <label htmlFor="job-description">Job Description</label>
            <textarea
              id="job-description"
              placeholder="Paste the full job description here — include the role, responsibilities, requirements, and any other details…"
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              required
              disabled={loading}
            />
            <span className="generate-field-hint">
              The more complete the description, the better the tailoring.
            </span>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            className="btn-primary"
            type="submit"
            disabled={loading || !jobDescription.trim()}
          >
            {loading
              ? <><span className="spinner" /> Generating your resume… this takes 10–15 seconds</>
              : 'Generate Resume'
            }
          </button>
        </form>
      </main>
    </div>
  )
}
