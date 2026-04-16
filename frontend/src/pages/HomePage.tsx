import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

const features = [
  {
    icon: '👤',
    title: 'Your Profile',
    description: 'Add your experience, education, skills, and projects — the AI reads this to build your resume.',
    badge: null,
    path: '/profile',
  },
  {
    icon: '🎯',
    title: 'Tailor to Job',
    description: 'Generate and manage AI-tailored resumes for every job you apply to.',
    badge: null,
    path: '/resumes',
  },
  {
    icon: '📋',
    title: 'Track Applications',
    description: "Keep track of every job you've applied to in one place.",
    badge: 'Coming soon',
    path: null,
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate('/login')
      else setUser(user)
    })
  }, [navigate])

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
      {/* Navbar */}
      <nav className="home-nav">
        <div className="nav-brand" onClick={() => navigate('/')}>
          <div className="brand-icon">R</div>
          <span className="brand-name">Resolve</span>
        </div>
        <div className="nav-user">
          <div className="user-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <span className="user-email">{user.email}</span>
          <button className="btn-secondary" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </nav>

      {/* Hero section */}
      <main className="home-main">
        <div className="home-hero">
          <div className="home-hero-badge">✨ Your AI Resume Assistant</div>
          <h1 className="home-title">
            Hey, {displayName}!<br />
            <span className="home-title-accent">Let's land you that job.</span>
          </h1>
          <p className="home-subtitle">
            Resolve helps you build tailored resumes, track applications, and stay on top of your job search — all in one place.
          </p>
        </div>

        {/* Feature cards */}
        <div className="feature-grid">
          {features.map((f) => (
            <div
              className={`feature-card${f.path ? ' feature-card-link' : ''}`}
              key={f.title}
              onClick={() => f.path && navigate(f.path)}
            >
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-content">
                <div className="feature-header">
                  <h3>{f.title}</h3>
                  {f.badge && <span className="feature-badge">{f.badge}</span>}
                </div>
                <p>{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
