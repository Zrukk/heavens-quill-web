import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function LatestUpdates() {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUpdates()
  }, [])

  async function loadUpdates() {
    setLoading(true)

    // Fetch 5 chapter terbaru
    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, chapter_number, title, created_at, novel_id')
      .order('created_at', { ascending: false })
      .limit(6)

    if (!chapters || chapters.length === 0) {
      setLoading(false)
      return
    }

    // Fetch novel info
    const novelIds = [...new Set(chapters.map((c) => c.novel_id))]
    const { data: novelsData } = await supabase
      .from('novels')
      .select('id, title, slug, cover_url')
      .in('id', novelIds)

    const novelsMap = {}
    ;(novelsData ?? []).forEach((n) => {
      novelsMap[n.id] = n
    })

    const merged = chapters
      .map((c) => ({
        ...c,
        novel: novelsMap[c.novel_id],
      }))
      .filter((c) => c.novel)

    setUpdates(merged)
    setLoading(false)
  }

  if (loading || updates.length === 0) return null

  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={22} color="var(--gold)" />
          <h2 className="gradient-text" style={{ fontSize: '1.5rem' }}>
            Update Terbaru
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {updates.map((u) => (
          <Link
            key={u.id}
            to={`/novel/${u.novel.slug}/chapter/${u.chapter_number}`}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 10,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div
              style={{
                width: 40,
                height: 54,
                flexShrink: 0,
                background: u.novel.cover_url
                  ? `url(${u.novel.cover_url}) center/cover`
                  : 'var(--border)',
                borderRadius: 4,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: 2,
                }}
              >
                {u.novel.title}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Chapter {u.chapter_number}
                {u.title ? ` — ${u.title}` : ''}
              </div>
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                flexShrink: 0,
                textAlign: 'right',
              }}
            >
              {new Date(u.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
              })}
            </div>
            <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          </Link>
        ))}
      </div>
    </div>
  )
              }
