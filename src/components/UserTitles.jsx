import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function UserTitles({ userId, size = 'medium', editable = false }) {
  const { user } = useAuth()
  const [titles, setTitles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeKey, setActiveKey] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!userId) return
    loadTitles()
    loadActiveTitle()
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

  async function loadActiveTitle() {
    const { data } = await supabase
      .from('profiles')
      .select('active_title_key')
      .eq('id', userId)
      .maybeSingle()
    setActiveKey(data?.active_title_key || null)
  }

  async function handleSetActive(key) {
    if (!editable || !user || user.id !== userId) return
    setSaving(true)

    const newKey = activeKey === key ? null : key

    await supabase
      .from('profiles')
      .update({ active_title_key: newKey })
      .eq('id', userId)

    setActiveKey(newKey)
    setSaving(false)
    setShowPicker(false)
  }

  if (loading) return null
  if (titles.length === 0) return null

  const sizes = {
    small: { padding: '2px 8px', fontSize: '0.7rem', gap: 3 },
    medium: { padding: '4px 12px', fontSize: '0.8rem', gap: 5 },
    large: { padding: '6px 16px', fontSize: '0.9rem', gap: 6 },
  }
  const s = sizes[size] || sizes.medium

  // Kalau editable, cuma tampilin 1 title (yang aktif) + tombol "Ganti"
  if (editable) {
    const activeTitle = titles.find((t) => t.title_key === activeKey) || null

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        {/* Title aktif */}
        {activeTitle ? (
          <div
            title={`Diraih: ${new Date(activeTitle.awarded_at).toLocaleDateString('id-ID', {
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
            <span>{activeTitle.title_icon}</span>
            <span>{activeTitle.title_name}</span>
          </div>
        ) : (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: s.gap,
              padding: s.padding,
              fontSize: s.fontSize,
              fontWeight: 600,
              borderRadius: 20,
              border: '1px dashed var(--border)',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            Belum pilih title
          </div>
        )}

        {/* Tombol pilih title */}
        <button
          onClick={() => setShowPicker(true)}
          className="btn"
          style={{ fontSize: '0.75rem', padding: '4px 12px' }}
        >
          🎖️ Ganti Title
        </button>

        {/* Modal picker */}
        {showPicker && (
          <>
            <div
              onClick={() => setShowPicker(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 998,
              }}
            />
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(400px, calc(100vw - 32px))',
                maxHeight: '70vh',
                overflowY: 'auto',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                zIndex: 999,
                padding: 20,
              }}
            >
              <h3
                style={{
                  fontSize: '1.1rem',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                🎖️ Pilih Title Utama
              </h3>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  marginBottom: 16,
                }}
              >
                Pilih title yang mau dipajang di profil kamu.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {titles.map((t) => {
                  const isActive = activeKey === t.title_key
                  return (
                    <button
                      key={t.title_key}
                      onClick={() => handleSetActive(t.title_key)}
                      disabled={saving}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        padding: 12,
                        background: isActive ? 'rgba(212, 175, 91, 0.1)' : 'var(--bg)',
                        border: isActive ? '1px solid var(--gold)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'inherit',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.2rem' }}>{t.title_icon}</span>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                            {t.title_name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Diraih: {new Date(t.awarded_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                      {isActive && <Check size={18} color="var(--gold)" />}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setShowPicker(false)}
                className="btn"
                style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
              >
                Tutup
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // Mode read-only (untuk public profile)
  // Tampilkan title aktif aja, kalau ada
  const activeTitle = titles.find((t) => t.title_key === activeKey)
  const displayTitles = activeTitle ? [activeTitle] : titles.slice(0, 3)

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
      {displayTitles.map((t) => (
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
