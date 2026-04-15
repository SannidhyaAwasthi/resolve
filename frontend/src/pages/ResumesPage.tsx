import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface SavedResume {
  id: string
  job_description: string
  latex_code: string
  created_at: string
}

export default function ResumesPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [resumes, setResumes] = useState<SavedResume[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/login'); return }
      setUser(user)
      supabase
        .from('generated_resumes')
        .select('id, job_description, latex_code, created_at')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setResumes(data as SavedResume[])
          setLoading(false)
        })
    })
  }, [navigate])

  const handleOpen = (resume: SavedResume) => {
    navigate('/editor', { state: { latexCode: resume.latex_code } })
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!window.confirm('Delete this resume?')) return
    setDeletingId(id)
    const { error } = await supabase.from('generated_resumes').delete().eq('id', id)
    if (!error) setResumes(prev => prev.filter(r => r.id !== id))
    setDeletingId(null)
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

      <main className="resumes-main">
        <div className="resumes-header">
          <div>
            <button className="btn-ghost" onClick={() => navigate('/')}>← Back</button>
            <h1 className="resumes-title">My Resumes</h1>
            <p className="resumes-subtitle">Your previously generated tailored resumes.</p>
          </div>
          <button className="btn-primary resumes-new-btn" onClick={() => navigate('/generate')}>
            + Generate New Resume
          </button>
        </div>

        {loading && (
          <div className="section-loading">
            <span className="spinner spinner-muted" /> Loading…
          </div>
        )}

        {!loading && resumes.length === 0 && (
          <div className="resumes-empty">
            <span className="resumes-empty-icon">📄</span>
            <p>No resumes generated yet.</p>
            <p className="resumes-empty-sub">
              Click <strong>Generate New Resume</strong> to tailor your first resume to a job.
            </p>
          </div>
        )}

        {!loading && resumes.length > 0 && (
          <div className="resumes-table-wrap">
            <table className="resumes-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Job Description</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {resumes.map(resume => (
                  <tr
                    key={resume.id}
                    className="resumes-row"
                    onClick={() => handleOpen(resume)}
                  >
                    <td className="resumes-date">
                      {new Date(resume.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="resumes-description">
                      {resume.job_description.slice(0, 120)}
                      {resume.job_description.length > 120 ? '…' : ''}
                    </td>
                    <td className="resumes-actions" onClick={e => e.stopPropagation()}>
                      <button
                        className="btn-secondary resumes-open-btn"
                        onClick={() => handleOpen(resume)}
                      >
                        Open
                      </button>
                      <button
                        className="btn-icon-danger"
                        disabled={deletingId === resume.id}
                        onClick={e => handleDelete(e, resume.id)}
                        title="Delete resume"
                        aria-label="Delete resume"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
