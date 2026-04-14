import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Profile {
  full_name: string
  email: string
  phone: string
  linkedin: string
  github: string
  portfolio: string
  bio: string
}

const empty: Profile = {
  full_name: '', email: '', phone: '',
  linkedin: '', github: '', portfolio: '', bio: '',
}

interface Props {
  userId: string
}

export default function PersonalInfoSection({ userId }: Props) {
  const [form, setForm] = useState<Profile>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('full_name, email, phone, linkedin, github, portfolio, bio')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (data) setForm({
          full_name: data.full_name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          linkedin: data.linkedin ?? '',
          github: data.github ?? '',
          portfolio: data.portfolio ?? '',
          bio: data.bio ?? '',
        })
        if (error) setError('Failed to load: ' + error.message)
        setLoading(false)
      })
  }, [userId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setSuccess(null)
    setError(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(null)
    setError(null)
    const { error } = await supabase.from('profiles').update(form).eq('id', userId)
    if (error) setError('Failed to save: ' + error.message)
    else setSuccess('Profile saved successfully!')
    setSaving(false)
  }

  if (loading) return (
    <div className="section-loading">
      <span className="spinner" /> Loading…
    </div>
  )

  return (
    <form className="profile-form" onSubmit={handleSave}>
      <div className="profile-field-row">
        <div className="profile-field">
          <label htmlFor="pf-full_name">Full Name</label>
          <input id="pf-full_name" name="full_name" type="text" placeholder="Jane Doe" value={form.full_name} onChange={handleChange} />
        </div>
        <div className="profile-field">
          <label htmlFor="pf-email">Email</label>
          <input id="pf-email" name="email" type="text" placeholder="jane@example.com" value={form.email} onChange={handleChange} />
        </div>
      </div>

      <div className="profile-field">
        <label htmlFor="pf-phone">Phone</label>
        <input id="pf-phone" name="phone" type="text" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} />
      </div>

      <div className="profile-field-row">
        <div className="profile-field">
          <label htmlFor="pf-linkedin">LinkedIn URL</label>
          <input id="pf-linkedin" name="linkedin" type="text" placeholder="https://linkedin.com/in/username" value={form.linkedin} onChange={handleChange} />
        </div>
        <div className="profile-field">
          <label htmlFor="pf-github">GitHub URL</label>
          <input id="pf-github" name="github" type="text" placeholder="https://github.com/username" value={form.github} onChange={handleChange} />
        </div>
      </div>

      <div className="profile-field">
        <label htmlFor="pf-portfolio">Portfolio URL</label>
        <input id="pf-portfolio" name="portfolio" type="text" placeholder="https://yourportfolio.com" value={form.portfolio} onChange={handleChange} />
      </div>

      <div className="profile-field">
        <label htmlFor="pf-bio">Bio / Summary</label>
        <textarea id="pf-bio" name="bio" rows={4} placeholder="A brief professional summary…" value={form.bio} onChange={handleChange} />
      </div>

      {success && <div className="profile-success">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="profile-actions">
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? <><span className="spinner" /> Saving…</> : 'Save'}
        </button>
      </div>
    </form>
  )
}
