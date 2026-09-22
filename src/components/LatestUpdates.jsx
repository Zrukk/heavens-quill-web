import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function LatestUpdates() {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUpdates()
  }, [])

  async function loadUpdates() {
    setLoading(true)

    // Fetch 20 chapter terbaru
    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, chapter_number, title, created_at, novel_id')
      .order('created_at', { ascending: false })
      .limit(30)

    if (!chapters || chapters.length === 0) {
      setLoading(false)
      return
    }

    // Fetch novel info
    const novelIds = [...new Set(chapters.map((c) => c.novel_id))]
    const { data: novelsData } = await supabase
      .from('novels')
      .select('id, title, slug, cover_url, status, original_language')
      .in('id', novelIds)

    const novelsMap = {}
    ;(novelsData ?? []).forEach((n) => {
      novelsMap[n.id] = n
    })

    // Grup chapter per novel (max 4 chapter terbaru per novel)
    const grouped = {}
    chapters.forEach((c) => {
      if (!grouped[c.novel_id]) {
        grouped[c.novel_id] = []
      }
      if (grouped[c.novel_id].length < 4) {
        grouped[c.novel_id].push(c)
      }
    })

    // Convert ke array, ambil 6 novel terbaru
    const result = Object.entries(grouped)
      .map(([novelId, chaps]) => ({
        novel: novelsMap[novelId],
        chapters: chaps,
      }))
      .filter((item) => item.novel)
      .slice(0, 6)

    setUpdates(result)
    setLoading(false)
  }

  function formatTimeAgo(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'baru aja'
    if (diffHours < 24) return `${diffHours} jam lalu`
    if (diffDays < 7) return `${diffDays} hari lalu`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  if (loading || updates.length === 0) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Clock size={22} color="var(--gold)" />
        <h2 className="gradient-text" style={{ fontSize: '1.5rem' }}>
          Update Terbaru
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {updates.map((item) => (
          <div
            key={item.novel.id}
            className="card"
            style={{
              padding: 14,
              display: 'flex',
              gap: 12,
            }}
          >
            {/* Cover */}
            <Link
              to={`/novel/${item.novel.slug}`}
              style={{
                width: 60,
                height: 82,
                flexShrink: 0,
                background: item.novel.cover_url
                  ? `url(${item.novel.cover_url}) center/cover`
                  : 'var(--border)',
                borderRadius: 4,
              }}
            />

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Judul novel + badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                  flexWrap: 'wrap',
                }}
              >
                <Link
                  to={`/novel/${item.novel.slug}`}
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}
                >
                  {item.novel.title}
                </Link>
                {item.novel.original_language && (
                  <span
                    style={{
                      fontSize: '0.6rem',
                      color: 'var(--gold)',
                      border: '1px solid var(--gold)',
                      borderRadius: 8,
                      padding: '1px 6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.novel.original_language}
                  </span>
                )}
              </div>

              {/* Status */}
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                }}
              >
                {item.novel.status === 'ongoing' ? 'Berjalan' : 'Tamat'}
              </div>

              {/* Chapter list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {item.chapters.map((ch) => (
                  <Link
                    key={ch.id}
                    to={`/novel/${item.novel.slug}/chapter/${ch.chapter_number}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      padding: '2px 0',
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--accent)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      Ch.{ch.chapter_number}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ch.title || 'Tanpa judul'}
                    </span>
                    <Lock size={11} style={{ flexShrink: 0, opacity: 0.4 }} />
                    <span
                      style={{
                        fontSize: '0.7rem',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatTimeAgo(ch.created_at)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
              }
