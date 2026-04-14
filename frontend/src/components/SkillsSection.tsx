import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface SkillCategory {
  id: string
  category: string
  items: string[]
}

type Feedback = { type: 'success' | 'error'; msg: string }

export default function SkillsSection() {
  const [skillsCategories, setSkillsCategories] = useState<SkillCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({})

  useEffect(() => { loadSkills() }, [])

  const loadSkills = async () => {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('category', { ascending: true })
    if (!error && data) setSkillsCategories(data as SkillCategory[])
    setLoading(false)
  }

  // ── Local edit helpers ───────────────────────────────────────────────
  const updateCategory = (id: string, value: string) => {
    setSkillsCategories(prev => prev.map(s => s.id === id ? { ...s, category: value } : s))
  }

  const updateItem = (catId: string, idx: number, value: string) => {
    setSkillsCategories(prev => prev.map(s => {
      if (s.id !== catId) return s
      const items = [...s.items]
      items[idx] = value
      return { ...s, items }
    }))
  }

  const addItem = (catId: string) => {
    setSkillsCategories(prev => prev.map(s =>
      s.id === catId ? { ...s, items: [...s.items, ''] } : s
    ))
  }

  const removeItem = (catId: string, idx: number) => {
    setSkillsCategories(prev => prev.map(s => {
      if (s.id !== catId) return s
      return { ...s, items: s.items.filter((_, i) => i !== idx) }
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
      .from('skills')
      .insert({ category: '', items: [] })
      .select()
      .single()
    if (!error && data) {
      setSkillsCategories(prev => [data as SkillCategory, ...prev])
      setExpandedId(data.id)
    }
    setAdding(false)
  }

  const handleSave = async (skillCat: SkillCategory) => {
    setSavingId(skillCat.id)
    setFeedbackFor(skillCat.id, null)
    const { error } = await supabase
      .from('skills')
      .update({
        category: skillCat.category,
        items: skillCat.items,
      })
      .eq('id', skillCat.id)
    setFeedbackFor(skillCat.id, error
      ? { type: 'error', msg: error.message }
      : { type: 'success', msg: 'Saved!' }
    )
    setSavingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this skill category?')) return
    setDeletingId(id)
    const { error } = await supabase.from('skills').delete().eq('id', id)
    if (!error) setSkillsCategories(prev => prev.filter(s => s.id !== id))
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
      {skillsCategories.length === 0 && (
        <div className="exp-empty">
          <span className="exp-empty-icon">🛠️</span>
          <p>No skills added yet.</p>
          <p className="exp-empty-sub">Click "Add Skill Category" below to get started.</p>
        </div>
      )}

      {skillsCategories.map(skillCat => {
        const isExpanded = expandedId === skillCat.id
        const isSaving = savingId === skillCat.id
        const isDeleting = deletingId === skillCat.id
        const fb = feedback[skillCat.id]

        return (
          <div key={skillCat.id} className={`exp-card ${isExpanded ? 'expanded' : ''}`}>
            {/* ── Card header (collapsed view) ── */}
            <button
              className="exp-card-header"
              onClick={() => setExpandedId(prev => prev === skillCat.id ? null : skillCat.id)}
              aria-expanded={isExpanded}
            >
              <div className="exp-card-summary">
                <span className="exp-company">{skillCat.category || 'New Category'}</span>
                <span className="exp-meta">
                  {skillCat.items.length > 0
                    ? skillCat.items.filter(Boolean).join(', ') || 'No skills entered'
                    : 'No skills added'}
                </span>
              </div>
              <span className={`exp-chevron ${isExpanded ? 'open' : ''}`}>›</span>
            </button>

            {/* ── Card body (expanded view) ── */}
            {isExpanded && (
              <div className="exp-card-body">
                {/* Category */}
                <div className="profile-field">
                  <label htmlFor={`category-${skillCat.id}`}>Category Name</label>
                  <input
                    id={`category-${skillCat.id}`}
                    type="text"
                    placeholder="e.g. Languages, Frameworks, Tools"
                    value={skillCat.category}
                    onChange={e => updateCategory(skillCat.id, e.target.value)}
                  />
                </div>

                {/* Items */}
                <div className="profile-field">
                  <label>Skills in this Category</label>
                  <div className="bullets-list">
                    {skillCat.items.map((item, idx) => (
                      <div key={idx} className="bullet-row">
                        <span className="bullet-dot">•</span>
                        <input
                          type="text"
                          placeholder={`e.g. React, Java, AWS…`}
                          value={item}
                          onChange={e => updateItem(skillCat.id, idx, e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-icon-danger"
                          onClick={() => removeItem(skillCat.id, idx)}
                          title="Remove skill"
                          aria-label="Remove skill"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-add-bullet"
                      onClick={() => addItem(skillCat.id)}
                    >
                      + Add Item
                    </button>
                  </div>
                </div>

                {/* Feedback */}
                {fb && (
                  fb.type === 'success'
                    ? <div className="profile-success">{fb.msg}</div>
                    : <div className="error-message">{fb.msg}</div>
                )}

                {/* Actions */}
                <div className="exp-card-actions">
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={isDeleting}
                    onClick={() => handleDelete(skillCat.id)}
                  >
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={isSaving}
                    onClick={() => handleSave(skillCat)}
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
        {adding ? <><span className="spinner" /> Adding…</> : '+ Add Skill Category'}
      </button>
    </div>
  )
}
