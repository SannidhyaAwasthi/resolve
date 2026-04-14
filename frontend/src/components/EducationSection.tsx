import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import EntityLinks from './EntityLinks'

interface Education {
  id: string
  institution: string
  degree: string
  field: string
  start_date: string
  end_date: string
  gpa: string
  coursework: string[]
}

type Feedback = { type: 'success' | 'error'; msg: string }

export default function EducationSection() {
  const [educations, setEducations] = useState<Education[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({})

  useEffect(() => { loadEducations() }, [])

  const loadEducations = async () => {
    const { data, error } = await supabase
      .from('education')
      .select('*')
      .order('start_date', { ascending: false })
    if (!error && data) setEducations(data as Education[])
    setLoading(false)
  }

  // ── Local edit helpers ───────────────────────────────────────────────
  const updateEdu = (id: string, field: keyof Education, value: unknown) => {
    setEducations(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const updateCoursework = (eduId: string, idx: number, value: string) => {
    setEducations(prev => prev.map(e => {
      if (e.id !== eduId) return e
      const coursework = [...e.coursework]
      coursework[idx] = value
      return { ...e, coursework }
    }))
  }

  const addCoursework = (eduId: string) => {
    setEducations(prev => prev.map(e =>
      e.id === eduId ? { ...e, coursework: [...e.coursework, ''] } : e
    ))
  }

  const removeCoursework = (eduId: string, idx: number) => {
    setEducations(prev => prev.map(e => {
      if (e.id !== eduId) return e
      return { ...e, coursework: e.coursework.filter((_, i) => i !== idx) }
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
      .from('education')
      .insert({ institution: '', degree: '', field: '', start_date: '', end_date: '', gpa: '', coursework: [] })
      .select()
      .single()
    if (!error && data) {
      setEducations(prev => [data as Education, ...prev])
      setExpandedId(data.id)
    }
    setAdding(false)
  }

  const handleSave = async (edu: Education) => {
    setSavingId(edu.id)
    setFeedbackFor(edu.id, null)
    const { error } = await supabase
      .from('education')
      .update({
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        start_date: edu.start_date,
        end_date: edu.end_date,
        gpa: edu.gpa,
        coursework: edu.coursework,
      })
      .eq('id', edu.id)
    setFeedbackFor(edu.id, error
      ? { type: 'error', msg: error.message }
      : { type: 'success', msg: 'Saved!' }
    )
    setSavingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this education entry?')) return
    setDeletingId(id)

    // Delete associated links first
    await supabase.from('links').delete().eq('entity_type', 'education').eq('entity_id', id)

    const { error } = await supabase.from('education').delete().eq('id', id)
    if (!error) setEducations(prev => prev.filter(e => e.id !== id))
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
      {educations.length === 0 && (
        <div className="exp-empty">
          <span className="exp-empty-icon">🎓</span>
          <p>No education added yet.</p>
          <p className="exp-empty-sub">Click "Add Education" below to get started.</p>
        </div>
      )}

      {educations.map(edu => {
        const isExpanded = expandedId === edu.id
        const isSaving = savingId === edu.id
        const isDeleting = deletingId === edu.id
        const fb = feedback[edu.id]

        return (
          <div key={edu.id} className={`exp-card ${isExpanded ? 'expanded' : ''}`}>
            {/* ── Card header (collapsed view) ── */}
            <button
              className="exp-card-header"
              onClick={() => setExpandedId(prev => prev === edu.id ? null : edu.id)}
              aria-expanded={isExpanded}
            >
              <div className="exp-card-summary">
                <span className="exp-company">{edu.institution || 'New Education'}</span>
                <span className="exp-meta">
                  {edu.degree} {edu.degree && edu.field ? ' in ' : ''} {edu.field}
                  {edu.degree && (edu.start_date || edu.end_date) ? ' · ' : ''}
                  {edu.start_date}
                  {edu.start_date && edu.end_date ? ' – ' : ''}
                  {edu.end_date}
                </span>
              </div>
              <span className={`exp-chevron ${isExpanded ? 'open' : ''}`}>›</span>
            </button>

            {/* ── Card body (expanded view) ── */}
            {isExpanded && (
              <div className="exp-card-body">
                {/* Institution */}
                <div className="profile-field">
                  <label htmlFor={`institution-${edu.id}`}>Institution</label>
                  <input
                    id={`institution-${edu.id}`}
                    type="text"
                    placeholder="University of Example"
                    value={edu.institution}
                    onChange={e => updateEdu(edu.id, 'institution', e.target.value)}
                  />
                </div>

                {/* Degree + Field */}
                <div className="profile-field-row">
                  <div className="profile-field">
                    <label htmlFor={`degree-${edu.id}`}>Degree</label>
                    <input
                      id={`degree-${edu.id}`}
                      type="text"
                      placeholder="Bachelor of Science"
                      value={edu.degree}
                      onChange={e => updateEdu(edu.id, 'degree', e.target.value)}
                    />
                  </div>
                  <div className="profile-field">
                    <label htmlFor={`field-${edu.id}`}>Field of Study</label>
                    <input
                      id={`field-${edu.id}`}
                      type="text"
                      placeholder="Computer Science"
                      value={edu.field}
                      onChange={e => updateEdu(edu.id, 'field', e.target.value)}
                    />
                  </div>
                </div>

                {/* Dates + GPA */}
                <div className="profile-field-row">
                  <div className="profile-field-row" style={{ gap: 10 }}>
                    <div className="profile-field">
                      <label htmlFor={`start-${edu.id}`}>Start</label>
                      <input
                        id={`start-${edu.id}`}
                        type="date"
                        value={edu.start_date}
                        onChange={e => updateEdu(edu.id, 'start_date', e.target.value)}
                      />
                    </div>
                    <div className="profile-field">
                      <label htmlFor={`end-${edu.id}`}>End</label>
                      <input
                        id={`end-${edu.id}`}
                        type="date"
                        value={edu.end_date === 'Present' ? '' : edu.end_date}
                        disabled={edu.end_date === 'Present'}
                        onChange={e => updateEdu(edu.id, 'end_date', e.target.value)}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        <input
                          type="checkbox"
                          id={`current-${edu.id}`}
                          checked={edu.end_date === 'Present'}
                          onChange={e => updateEdu(edu.id, 'end_date', e.target.checked ? 'Present' : '')}
                          style={{ width: 'auto' }}
                        />
                        <label htmlFor={`current-${edu.id}`} style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Present</label>
                      </div>
                    </div>
                  </div>
                  <div className="profile-field">
                    <label htmlFor={`gpa-${edu.id}`}>GPA</label>
                    <input
                      id={`gpa-${edu.id}`}
                      type="text"
                      placeholder="3.8/4.0"
                      value={edu.gpa}
                      onChange={e => updateEdu(edu.id, 'gpa', e.target.value)}
                    />
                  </div>
                </div>

                {/* Coursework */}
                <div className="profile-field">
                  <label>Relevant Coursework (Bullet Points)</label>
                  <div className="bullets-list">
                    {edu.coursework.map((course, idx) => (
                      <div key={idx} className="bullet-row">
                        <span className="bullet-dot">•</span>
                        <input
                          type="text"
                          placeholder={`Data Structures, Algorithms…`}
                          value={course}
                          onChange={e => updateCoursework(edu.id, idx, e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-icon-danger"
                          onClick={() => removeCoursework(edu.id, idx)}
                          title="Remove coursework"
                          aria-label="Remove coursework"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-add-bullet"
                      onClick={() => addCoursework(edu.id)}
                    >
                      + Add Coursework
                    </button>
                  </div>
                </div>

                {/* Feedback */}
                {fb && (
                  fb.type === 'success'
                    ? <div className="profile-success">{fb.msg}</div>
                    : <div className="error-message">{fb.msg}</div>
                )}

                <EntityLinks entityType="education" entityId={edu.id} />

                {/* Actions */}
                <div className="exp-card-actions">
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={isDeleting}
                    onClick={() => handleDelete(edu.id)}
                  >
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={isSaving}
                    onClick={() => handleSave(edu)}
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
        {adding ? <><span className="spinner" /> Adding…</> : '+ Add Education'}
      </button>
    </div>
  )
}
