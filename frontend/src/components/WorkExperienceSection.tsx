import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import EntityLinks from './EntityLinks'

interface Experience {
  id: string
  company: string
  title: string
  location: string
  start_date: string
  end_date: string
  bullets: string[]
}

type Feedback = { type: 'success' | 'error'; msg: string }

export default function WorkExperienceSection() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({})

  useEffect(() => { loadExperiences() }, [])

  const loadExperiences = async () => {
    const { data, error } = await supabase
      .from('experiences')
      .select('*')
      .order('start_date', { ascending: false })
    if (!error && data) setExperiences(data as Experience[])
    setLoading(false)
  }

  // ── Local edit helpers ───────────────────────────────────────────────
  const updateExp = (id: string, field: keyof Experience, value: unknown) => {
    setExperiences(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const updateBullet = (expId: string, idx: number, value: string) => {
    setExperiences(prev => prev.map(e => {
      if (e.id !== expId) return e
      const bullets = [...e.bullets]
      bullets[idx] = value
      return { ...e, bullets }
    }))
  }

  const addBullet = (expId: string) => {
    setExperiences(prev => prev.map(e =>
      e.id === expId ? { ...e, bullets: [...e.bullets, ''] } : e
    ))
  }

  const removeBullet = (expId: string, idx: number) => {
    setExperiences(prev => prev.map(e => {
      if (e.id !== expId) return e
      return { ...e, bullets: e.bullets.filter((_, i) => i !== idx) }
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
      .from('experiences')
      .insert({ company: '', title: '', location: '', start_date: '', end_date: '', bullets: [] })
      .select()
      .single()
    if (!error && data) {
      setExperiences(prev => [data as Experience, ...prev])
      setExpandedId(data.id)
    }
    setAdding(false)
  }

  const handleSave = async (exp: Experience) => {
    setSavingId(exp.id)
    setFeedbackFor(exp.id, null)
    const { error } = await supabase
      .from('experiences')
      .update({
        company: exp.company,
        title: exp.title,
        location: exp.location,
        start_date: exp.start_date,
        end_date: exp.end_date,
        bullets: exp.bullets,
      })
      .eq('id', exp.id)
    setFeedbackFor(exp.id, error
      ? { type: 'error', msg: error.message }
      : { type: 'success', msg: 'Saved!' }
    )
    setSavingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this experience entry?')) return
    setDeletingId(id)

    // Delete associated links first
    await supabase.from('links').delete().eq('entity_type', 'experience').eq('entity_id', id)

    const { error } = await supabase.from('experiences').delete().eq('id', id)
    if (!error) setExperiences(prev => prev.filter(e => e.id !== id))
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
      {experiences.length === 0 && (
        <div className="exp-empty">
          <span className="exp-empty-icon">💼</span>
          <p>No work experience added yet.</p>
          <p className="exp-empty-sub">Click "Add Experience" below to get started.</p>
        </div>
      )}

      {experiences.map(exp => {
        const isExpanded = expandedId === exp.id
        const isSaving = savingId === exp.id
        const isDeleting = deletingId === exp.id
        const fb = feedback[exp.id]

        return (
          <div key={exp.id} className={`exp-card ${isExpanded ? 'expanded' : ''}`}>
            {/* ── Card header (collapsed view) ── */}
            <button
              className="exp-card-header"
              onClick={() => setExpandedId(prev => prev === exp.id ? null : exp.id)}
              aria-expanded={isExpanded}
            >
              <div className="exp-card-summary">
                <span className="exp-company">{exp.company || 'New Experience'}</span>
                <span className="exp-meta">
                  {exp.title}
                  {exp.title && (exp.start_date || exp.end_date) ? ' · ' : ''}
                  {exp.start_date}
                  {exp.start_date && exp.end_date ? ' – ' : ''}
                  {exp.end_date}
                </span>
              </div>
              <span className={`exp-chevron ${isExpanded ? 'open' : ''}`}>›</span>
            </button>

            {/* ── Card body (expanded view) ── */}
            {isExpanded && (
              <div className="exp-card-body">
                {/* Company + Title */}
                <div className="profile-field-row">
                  <div className="profile-field">
                    <label htmlFor={`company-${exp.id}`}>Company</label>
                    <input
                      id={`company-${exp.id}`}
                      type="text"
                      placeholder="Acme Corp"
                      value={exp.company}
                      onChange={e => updateExp(exp.id, 'company', e.target.value)}
                    />
                  </div>
                  <div className="profile-field">
                    <label htmlFor={`title-${exp.id}`}>Job Title</label>
                    <input
                      id={`title-${exp.id}`}
                      type="text"
                      placeholder="Software Engineer"
                      value={exp.title}
                      onChange={e => updateExp(exp.id, 'title', e.target.value)}
                    />
                  </div>
                </div>

                {/* Location + Dates */}
                <div className="profile-field-row">
                  <div className="profile-field">
                    <label htmlFor={`location-${exp.id}`}>Location</label>
                    <input
                      id={`location-${exp.id}`}
                      type="text"
                      placeholder="San Francisco, CA"
                      value={exp.location}
                      onChange={e => updateExp(exp.id, 'location', e.target.value)}
                    />
                  </div>
                  <div className="profile-field-row" style={{ gap: 10 }}>
                    <div className="profile-field">
                      <label htmlFor={`start-${exp.id}`}>Start</label>
                      <input
                        id={`start-${exp.id}`}
                        type="date"
                        value={exp.start_date}
                        onChange={e => updateExp(exp.id, 'start_date', e.target.value)}
                      />
                    </div>
                    <div className="profile-field">
                      <label htmlFor={`end-${exp.id}`}>End</label>
                      <input
                        id={`end-${exp.id}`}
                        type="date"
                        value={exp.end_date === 'Present' ? '' : exp.end_date}
                        disabled={exp.end_date === 'Present'}
                        onChange={e => updateExp(exp.id, 'end_date', e.target.value)}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        <input
                          type="checkbox"
                          id={`current-${exp.id}`}
                          checked={exp.end_date === 'Present'}
                          onChange={e => updateExp(exp.id, 'end_date', e.target.checked ? 'Present' : '')}
                          style={{ width: 'auto' }}
                        />
                        <label htmlFor={`current-${exp.id}`} style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Present</label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bullets */}
                <div className="profile-field">
                  <label>Bullet Points</label>
                  <div className="bullets-list">
                    {exp.bullets.map((bullet, idx) => (
                      <div key={idx} className="bullet-row">
                        <span className="bullet-dot">•</span>
                        <input
                          type="text"
                          placeholder={`Describe an achievement or responsibility…`}
                          value={bullet}
                          onChange={e => updateBullet(exp.id, idx, e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-icon-danger"
                          onClick={() => removeBullet(exp.id, idx)}
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
                      onClick={() => addBullet(exp.id)}
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

                <EntityLinks entityType="experience" entityId={exp.id} />

                {/* Actions */}
                <div className="exp-card-actions">
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={isDeleting}
                    onClick={() => handleDelete(exp.id)}
                  >
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={isSaving}
                    onClick={() => handleSave(exp)}
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
        {adding ? <><span className="spinner" /> Adding…</> : '+ Add Experience'}
      </button>
    </div>
  )
}
