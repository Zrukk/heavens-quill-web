import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function SimilarNovels({ novelId, novelGenre }) {
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (novelId && novelGenre) loadSimilar()
    else setLoading(false)
  }, [novelId, novelGenre])

  async function loadSimilar() {
    setLoading(true)

    // Parse genre novel ini
    const targetGenres = novelGenre
      .split(',')
      .map((g) => g.trim().toLowerCase())
      .filter(Boolean)

    if (targetGenres.length === 0) {
      setLoading(false)
      return
    }

    // Fetch semua novel (kecuali yang sekarang) + rating dari novel_reviews
    const { data: novelsData } = await supabase
      .from('novels')
      .select('id, title, slug, cover_url, genre, total_views, original_language, status')
      .neq('id', novelId)

    if (!novelsData || novelsData.length === 0) {
      setLoading(false)
      return
    }

    // Hitung skor kecocokan genre
    const scored = novelsData
      .map((n) => {
        const genres = (n.genre || '')
          .split(',')
          .map((g) => g.trim().toLowerCase())
          .filter(Boolean)
        const matched = genres.filter((g) => targetGenres.includes(g)).length
        return { ...n, matchScore: matched }
      })
      .filter((n) => n.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore || (b.total_views || 0) - (a.total_views || 0))
      .slice(0, 6)

    setNovels(scored)
    setLoading(false)
  }

  if (loading) return null
  if (novels.length === 0) return null

  return (
    <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 20,
        }}
      >
        <Sparkles size={20} color="var(--gold)" />
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
          Novel Serupa
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 4 }}>
          (genre mirip)
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 12,
        }}
      >
        {novels.map((n) => (
          <Link
            key={n.id}
            to={`/novel/${n.slug}`}
            className="card"
            style={{
              padding: 10,
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Cover */}
            <div
              style={{
                width: '100%',
                height: 160,
                background: n.cover_url
                  ? `url(${n.cover_url}) center/cover`
                  : 'var(--border)',
                borderRadius: 'var(--radius)',
                marginBottom: 8,
                position: 'relative',
              }}
            >
              {n.original_language && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    fontSize: '0.6rem',
                    color: 'var(--gold)',
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: '1px solid var(--gold)',
                    borderRadius: 8,
                    padding: '1px 6px',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {n.original_language}
                </span>
              )}
            </div>

            {/* Judul */}
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                marginBottom: 6,
                minHeight: '2.4em',
                lineHeight: 1.3,
              }}
            >
              {n.title}
            </div>

            {/* Views */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                marginTop: 'auto',
              }}
            >
              <Eye size={11} />
              {(n.total_views || 0).toLocaleString('id-ID')}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
  }
