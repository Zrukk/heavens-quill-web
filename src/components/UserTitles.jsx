import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function UserTitles({ userId, size = 'medium' }) {
  const [titles, setTitles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    loadTitles()
  }, [userId])

  async function loadTitles() {
    setLoading(true)
    const { data } = await supabase
      .from('user_titles')
      .select('title_key, title_name, title_icon, awarded_at')
      .eq('user_id', userId)
      .order('awarded_at', { ascending: true })
    setTitles(data ?? [])
    setLoading(false)
  }

  if (loading) return null
  if (titles.length === 0) return null

  const sizes = {
    small: { padding: '2px 8px', fontSize: '0.7rem', gap: 3 },
    medium: { padding: '4px 12px', fontSize: '0.8rem', gap: 5 },
    large: { padding: '6px 16px', fontSize: '0.9rem', gap: 6 },
  }
  const s = sizes[size] || sizes.medium

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {titles.map((t) => (
        <div
          key={t.title_key}
          title={`Diraih: ${new Date(t.awarded_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: s.gap,
            padding: s.padding,
            fontSize: s.fontSize,
            fontWeight: 600,
            borderRadius: 20,
            border: '1px solid var(--gold)',
            color: 'var(--gold)',
            background: 'rgba(212, 175, 91, 0.08)',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{t.title_icon}</span>
          <span>{t.title_name}</span>
        </div>
      ))}
    </div>
  )
      }
