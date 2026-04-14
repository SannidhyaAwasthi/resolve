import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface EntityLink {
  id: string
  entity_type: string
  entity_id: string
  label: string
  url: string
}

interface Props {
  entityType: string
  entityId: string
}

export default function EntityLinks({ entityType, entityId }: Props) {
  const [links, setLinks] = useState<EntityLink[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadLinks()
  }, [entityType, entityId])

  const loadLinks = async () => {
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: true }) // assuming there's a created_at or it doesn't matter
    if (!error && data) {
      setLinks(data as EntityLink[])
    }
    setLoading(false)
  }

  const handleAdd = async () => {
    setAdding(true)
    const { data, error } = await supabase
      .from('links')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        label: '',
        url: ''
      })
      .select()
      .single()
    if (!error && data) {
      setLinks(prev => [...prev, data as EntityLink])
    }
    setAdding(false)
  }

  const updateLocal = (id: string, field: keyof EntityLink, value: string) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
  }

  const handleSave = async (link: EntityLink) => {
    setSavingId(link.id)
    await supabase
      .from('links')
      .update({ label: link.label, url: link.url })
      .eq('id', link.id)
    setSavingId(null)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const { error } = await supabase.from('links').delete().eq('id', id)
    if (!error) {
      setLinks(prev => prev.filter(l => l.id !== id))
    }
    setDeletingId(null)
  }

  if (loading) return null // Hide while loading

  return (
    <div className="profile-field" style={{ marginTop: '8px' }}>
      <label>Attached Links</label>
      <div className="bullets-list">
        {links.map(link => (
          <div key={link.id} className="bullet-row" style={{ alignItems: 'center' }}>
            <span className="bullet-dot">🔗</span>
            <input
              type="text"
              placeholder="Label (e.g. Certificate)"
              value={link.label}
              onChange={e => updateLocal(link.id, 'label', e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="text"
              placeholder="URL (https://...)"
              value={link.url}
              onChange={e => updateLocal(link.id, 'url', e.target.value)}
              style={{ flex: 2 }}
            />
            <button
              type="button"
              className="btn-ghost"
              disabled={savingId === link.id}
              onClick={() => handleSave(link)}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              {savingId === link.id ? '...' : 'Save'}
            </button>
            <button
              type="button"
              className="btn-icon-danger"
              disabled={deletingId === link.id}
              onClick={() => handleDelete(link.id)}
              title="Remove link"
              aria-label="Remove link"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn-add-bullet"
          onClick={handleAdd}
          disabled={adding}
        >
          {adding ? 'Adding...' : '+ Add Link'}
        </button>
      </div>
    </div>
  )
}
