import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function TopRated() {
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)

    // Fetch semua rating dari novel_reviews
    const { data: reviews } = await supabase
      .from('novel_reviews')
      .select('novel_id, rating')
      .not('rating', 'is', null)

    if (!reviews || reviews.length === 0) {
      setLoading(false)
      return
    }

    // Hitung rata-rata rating per novel
    const novelRatings = {}
    reviews.forEach((r) => {
      if (!novelRatings[r.novel_id]) {
        novelRatings[r.novel_id] = { sum: 0, count: 0 }
      }
      novelRatings[r.novel_id].sum += r.rating
      novelRatings[r.novel_id].count++
    })

    // Ambil top 5 novel berdasarkan rata-rata rating (minimal 1 rating)
    const sorted = Object.entries(novelRatings)
      .map(([novelId, data]) => ({
        novelId,
        avg: data.sum / data.count,
        count: data.count,
      }))
      .filter((n) => n.count >= 1)
      .sort((a, b) => b.avg - a.avg || b.count - a.count)
      .slice(0, 5)

    if (sorted.length === 0) {
      setLoading(false)
      return
    }

    // Fetch detail novel
    const novelIds = sorted.map((s) => s.novelId)
    const { data: novelsData } = await supabase
      .from('novels')
      .select('id, title, slug, cover_url, author, total_views')
      .in('id', novelIds)

    const novelsMap = {}
    ;(novelsData ?? []).forEach((n) => {
      novelsMap[n.id] = n
    })

    const merged = sorted
      .map((s) => ({
        ...novelsMap[s.novelId],
        avgRating: s.avg,
        ratingCount: s.count,
      }))
      .filter((n) => n.id)

    setNovels(merged)
    setLoading(false)
  }

  if (loading || novels.length === 0) return null

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Star size={22} color="var(--gold)" fill="var(--gold)" />
        <h2 className="gradient-text" style={{ fontSize: '1.5rem' }}>
          Rating Tertinggi
        </h2>
      </div>

      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
        {novels.map((n, i) => (
          <Link
            key={n.id}
            to={`/novel/${n.slug}`}
            className="card"
            style={{
              minWidth: 140,
              width: 140,
              flexShrink: 0,
              padding: 12,
              textDecoration: 'none',
              color: 'inherit',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                background: 'var(--gold)',
                color: '#1a1a1a',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 12,
                zIndex: 1,
              }}
            >
              #{i + 1}
            </div>

            <div
              style={{
                width: '100%',
                height: 180,
                background: n.cover_url
                  ? `url(${n.cover_url}) center/cover`
                  : 'var(--border)',
                borderRadius: 'var(--radius)',
                marginBottom: 10,
              }}
            />

            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                marginBottom: 6,
                minHeight: '2.4em',
              }}
            >
              {n.title}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.75rem',
                color: 'var(--gold)',
                marginBottom: 4,
              }}
            >
              <Star size={12} fill="var(--gold)" />
              {n.avgRating.toFixed(1)}
              <span style={{ color: 'var(--text-muted)' }}>({n.ratingCount})</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
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
