import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import EntityLinks from './EntityLinks'

interface Achievement {
  id: string
  title: string
  description: string
  issuer: string
  date: string
  bullets: string[]
}

type Feedback = { type: 'success' | 'error'; msg: string }

export default function AchievementsSection() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({})

  useEffect(() => { loadAchievements() }, [])

  const loadAchievements = async () => {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('date', { ascending: false })
    if (!error && data) setAchievements(data as Achievement[])
    setLoading(false)
  }

  // ── Local edit helpers ───────────────────────────────────────────────
  const updateAchievement = (id: string, field: keyof Achievement, value: unknown) => {
    setAchievements(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }

  const updateBullet = (achievementId: string, idx: number, value: string) => {
    setAchievements(prev => prev.map(a => {
      if (a.id !== achievementId) return a
      const bullets = [...a.bullets]
      bullets[idx] = value
      return { ...a, bullets }
    }))
  }

  const addBullet = (achievementId: string) => {
    setAchievements(prev => prev.map(a =>
      a.id === achievementId ? { ...a, bullets: [...a.bullets, ''] } : a
    ))
  }

  const removeBullet = (achievementId: string, idx: number) => {
    setAchievements(prev => prev.map(a => {
      if (a.id !== achievementId) return a
      return { ...a, bullets: a.bullets.filter((_, i) => i !== idx) }
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
      .from('achievements')
      .insert({ title: '', description: '', issuer: '', date: '', bullets: [] })
      .select()
      .single()
    if (!error && data) {
      setAchievements(prev => [data as Achievement, ...prev])
      setExpandedId(data.id)
    }
    setAdding(false)
  }

  const handleSave = async (achievement: Achievement) => {
    setSavingId(achievement.id)
    setFeedbackFor(achievement.id, null)
    const { error } = await supabase
      .from('achievements')
      .update({
        title: achievement.title,
        description: achievement.description,
        issuer: achievement.issuer,
        date: achievement.date,
        bullets: achievement.bullets,
      })
      .eq('id', achievement.id)
    setFeedbackFor(achievement.id, error
      ? { type: 'error', msg: error.message }
      : { type: 'success', msg: 'Saved!' }
    )
    setSavingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this achievement?')) return
    setDeletingId(id)

    // Delete associated links first
    await supabase.from('links').delete().eq('entity_type', 'achievement').eq('entity_id', id)

    const { error } = await supabase.from('achievements').delete().eq('id', id)
    if (!error) setAchievements(prev => prev.filter(a => a.id !== id))
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
      {achievements.length === 0 && (
        <div className="exp-empty">
          <span className="exp-empty-icon">🏆</span>
          <p>No achievements added yet.</p>
          <p className="exp-empty-sub">Click "Add Achievement" below to get started.</p>
        </div>
      )}

      {achievements.map(achievement => {
        const isExpanded = expandedId === achievement.id
        const isSaving = savingId === achievement.id
        const isDeleting = deletingId === achievement.id
        const fb = feedback[achievement.id]

        return (
          <div key={achievement.id} className={`exp-card ${isExpanded ? 'expanded' : ''}`}>
            {/* ── Card header (collapsed view) ── */}
            <button
              className="exp-card-header"
              onClick={() => setExpandedId(prev => prev === achievement.id ? null : achievement.id)}
              aria-expanded={isExpanded}
            >
              <div className="exp-card-summary">
                <span className="exp-company">{achievement.title || 'New Achievement'}</span>
                <span className="exp-meta">
                  {achievement.issuer}
                  {achievement.issuer && achievement.date ? ' · ' : ''}
                  {achievement.date}
                </span>
              </div>
              <span className={`exp-chevron ${isExpanded ? 'open' : ''}`}>›</span>
            </button>

            {/* ── Card body (expanded view) ── */}
            {isExpanded && (
              <div className="exp-card-body">
                {/* Title */}
                <div className="profile-field-row">
                  <div className="profile-field">
                    <label htmlFor={`title-${achievement.id}`}>Achievement / Award Title</label>
                    <input
                      id={`title-${achievement.id}`}
                      type="text"
                      placeholder="e.g. 1st Place Hackathon"
                      value={achievement.title}
                      onChange={e => updateAchievement(achievement.id, 'title', e.target.value)}
                    />
                  </div>
                  <div className="profile-field">
                    <label htmlFor={`issuer-${achievement.id}`}>Issuer / Organization</label>
                    <input
                      id={`issuer-${achievement.id}`}
                      type="text"
                      placeholder="e.g. Major League Hacking"
                      value={achievement.issuer}
                      onChange={e => updateAchievement(achievement.id, 'issuer', e.target.value)}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="profile-field">
                  <label htmlFor={`description-${achievement.id}`}>Description</label>
                  <textarea
                    id={`description-${achievement.id}`}
                    rows={3}
                    placeholder="Brief overview of the achievement…"
                    value={achievement.description}
                    onChange={e => updateAchievement(achievement.id, 'description', e.target.value)}
                  />
                </div>

                {/* Date */}
                <div className="profile-field">
                  <label htmlFor={`date-${achievement.id}`}>Date</label>
                  <input
                    id={`date-${achievement.id}`}
                    type="date"
                    value={achievement.date}
                    onChange={e => updateAchievement(achievement.id, 'date', e.target.value)}
                  />
                </div>

                {/* Bullets */}
                <div className="profile-field">
                  <label>Description (Bullet Points)</label>
                  <div className="bullets-list">
                    {achievement.bullets.map((bullet, idx) => (
                      <div key={idx} className="bullet-row">
                        <span className="bullet-dot">•</span>
                        <input
                          type="text"
                          placeholder={`Describe the achievement or criteria…`}
                          value={bullet}
                          onChange={e => updateBullet(achievement.id, idx, e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-icon-danger"
                          onClick={() => removeBullet(achievement.id, idx)}
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
                      onClick={() => addBullet(achievement.id)}
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

                <EntityLinks entityType="achievement" entityId={achievement.id} />

                {/* Actions */}
                <div className="exp-card-actions">
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={isDeleting}
                    onClick={() => handleDelete(achievement.id)}
                  >
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={isSaving}
                    onClick={() => handleSave(achievement)}
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
        {adding ? <><span className="spinner" /> Adding…</> : '+ Add Achievement'}
      </button>
    </div>
  )
}
