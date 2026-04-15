import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import EntityLinks from './EntityLinks'

interface Project {
  id: string
  name: string
  tech_stack: string
  url: string
  start_date: string
  end_date: string
  bullets: string[]
}

type Feedback = { type: 'success' | 'error'; msg: string }

export default function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({})

  useEffect(() => { loadProjects() }, [])

  const loadProjects = async () => {
    // There isn't typically a date field in projects to order by, so we just select them all
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('name', { ascending: true })
    if (!error && data) setProjects(data as Project[])
    setLoading(false)
  }

  // ── Local edit helpers ───────────────────────────────────────────────
  const updateProject = (id: string, field: keyof Project, value: unknown) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const updateBullet = (projectId: string, idx: number, value: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p
      const bullets = [...p.bullets]
      bullets[idx] = value
      return { ...p, bullets }
    }))
  }

  const addBullet = (projectId: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, bullets: [...p.bullets, ''] } : p
    ))
  }

  const removeBullet = (projectId: string, idx: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p
      return { ...p, bullets: p.bullets.filter((_, i) => i !== idx) }
    }))
  }

  const setFeedbackFor = (id: string, fb: Feedback | null) => {
    setFeedback(prev => {
      if (fb === null) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: fb }
    })
  }

  // ── CRUD ─────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    setAdding(true)
    const { data, error } = await supabase
      .from('projects')
      .insert({ name: '', tech_stack: '', url: '', start_date: '', end_date: '', bullets: [] })
      .select()
      .single()
    if (!error && data) {
      setProjects(prev => [data as Project, ...prev])
      setExpandedId(data.id)
    }
    setAdding(false)
  }

  const handleSave = async (project: Project) => {
    setSavingId(project.id)
    setFeedbackFor(project.id, null)
    const { error } = await supabase
      .from('projects')
      .update({
        name: project.name,
        tech_stack: project.tech_stack,
        url: project.url,
        start_date: project.start_date,
        end_date: project.end_date,
        bullets: project.bullets,
      })
      .eq('id', project.id)
    setFeedbackFor(project.id, error
      ? { type: 'error', msg: error.message }
      : { type: 'success', msg: 'Saved!' }
    )
    setSavingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this project?')) return
    setDeletingId(id)

    // Delete associated links first
    await supabase.from('links').delete().eq('entity_type', 'project').eq('entity_id', id)

    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) setProjects(prev => prev.filter(p => p.id !== id))
    else setFeedbackFor(id, { type: 'error', msg: error.message })
    setDeletingId(null)
  }

  // ── Render ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="section-loading">
      <span className="spinner" /> Loading…
    </div>
  )

  return (
    <div className="exp-section">
      {projects.length === 0 && (
        <div className="exp-empty">
          <span className="exp-empty-icon">📂</span>
          <p>No projects added yet.</p>
          <p className="exp-empty-sub">Click "Add Project" below to get started.</p>
        </div>
      )}

      {projects.map(project => {
        const isExpanded = expandedId === project.id
        const isSaving = savingId === project.id
        const isDeleting = deletingId === project.id
        const fb = feedback[project.id]

        return (
          <div key={project.id} className={`exp-card ${isExpanded ? 'expanded' : ''}`}>
            {/* ── Card header (collapsed view) ── */}
            <button
              className="exp-card-header"
              onClick={() => setExpandedId(prev => prev === project.id ? null : project.id)}
              aria-expanded={isExpanded}
            >
              <div className="exp-card-summary">
                <span className="exp-company">{project.name || 'New Project'}</span>
                <span className="exp-meta">
                  {project.tech_stack}
                  {project.tech_stack && (project.start_date || project.url) ? ' · ' : ''}
                  {project.start_date}
                  {project.start_date && project.end_date ? ' – ' : ''}
                  {project.end_date}
                  {(project.start_date || project.end_date) && project.url ? ' · ' : ''}
                  {project.url}
                </span>
              </div>
              <span className={`exp-chevron ${isExpanded ? 'open' : ''}`}>›</span>
            </button>

            {/* ── Card body (expanded view) ── */}
            {isExpanded && (
              <div className="exp-card-body">
                {/* Name */}
                <div className="profile-field-row">
                  <div className="profile-field">
                    <label htmlFor={`name-${project.id}`}>Project Name</label>
                    <input
                      id={`name-${project.id}`}
                      type="text"
                      placeholder="Resume Builder"
                      value={project.name}
                      onChange={e => updateProject(project.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="profile-field">
                    <label htmlFor={`tech_stack-${project.id}`}>Tech Stack</label>
                    <input
                      id={`tech_stack-${project.id}`}
                      type="text"
                      placeholder="React, Node.js, Supabase"
                      value={project.tech_stack}
                      onChange={e => updateProject(project.id, 'tech_stack', e.target.value)}
                    />
                  </div>
                </div>

                {/* URL + Dates */}
                <div className="profile-field-row">
                  <div className="profile-field">
                    <label htmlFor={`url-${project.id}`}>URL</label>
                    <input
                      id={`url-${project.id}`}
                      type="text"
                      placeholder="https://myproject.com"
                      value={project.url}
                      onChange={e => updateProject(project.id, 'url', e.target.value)}
                    />
                  </div>
                  <div className="profile-field-row" style={{ gap: 10 }}>
                    <div className="profile-field">
                      <label htmlFor={`start-${project.id}`}>Start</label>
                      <input
                        id={`start-${project.id}`}
                        type="date"
                        value={project.start_date}
                        onChange={e => updateProject(project.id, 'start_date', e.target.value)}
                      />
                    </div>
                    <div className="profile-field">
                      <label htmlFor={`end-${project.id}`}>End</label>
                      <input
                        id={`end-${project.id}`}
                        type="date"
                        value={project.end_date === 'Present' ? '' : project.end_date}
                        disabled={project.end_date === 'Present'}
                        onChange={e => updateProject(project.id, 'end_date', e.target.value)}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        <input
                          type="checkbox"
                          id={`current-${project.id}`}
                          checked={project.end_date === 'Present'}
                          onChange={e => updateProject(project.id, 'end_date', e.target.checked ? 'Present' : '')}
                          style={{ width: 'auto' }}
                        />
                        <label htmlFor={`current-${project.id}`} style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ongoing</label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bullets */}
                <div className="profile-field">
                  <label>Features & Achievements (Bullet Points)</label>
                  <div className="bullets-list">
                    {project.bullets.map((bullet, idx) => (
                      <div key={idx} className="bullet-row">
                        <span className="bullet-dot">•</span>
                        <input
                          type="text"
                          placeholder={`Describe a feature or achievement…`}
                          value={bullet}
                          onChange={e => updateBullet(project.id, idx, e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-icon-danger"
                          onClick={() => removeBullet(project.id, idx)}
                          title="Remove bullet"
                          aria-label="Remove bullet"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-add-bullet"
                      onClick={() => addBullet(project.id)}
                    >
                      + Add Bullet
                    </button>
                  </div>
                </div>

                {/* Feedback */}
                {fb && (
                  fb.type === 'success'
                    ? <div className="profile-success">{fb.msg}</div>
                    : <div className="error-message">{fb.msg}</div>
                )}

                <EntityLinks entityType="project" entityId={project.id} />

                {/* Actions */}
                <div className="exp-card-actions">
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={isDeleting}
                    onClick={() => handleDelete(project.id)}
                  >
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={isSaving}
                    onClick={() => handleSave(project)}
                  >
                    {isSaving ? <><span className="spinner" /> Saving…</> : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Add button */}
      <button
        type="button"
        className="btn-add-exp"
        disabled={adding}
        onClick={handleAdd}
      >
        {adding ? <><span className="spinner" /> Adding…</> : '+ Add Project'}
      </button>
    </div>
  )
}
