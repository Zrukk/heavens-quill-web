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

    // Fetch rating dari novel_reviews
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

    // Top 10
    const sorted = Object.entries(novelRatings)
      .map(([novelId, data]) => ({
        novelId,
        avg: data.sum / data.count,
        count: data.count,
      }))
      .filter((n) => n.count >= 1)
      .sort((a, b) => b.avg - a.avg || b.count - a.count)
      .slice(0, 10)

    if (sorted.length === 0) {
      setLoading(false)
      return
    }

    // Fetch novel info
    const novelIds = sorted.map((s) => s.novelId)
    const { data: novelsData } = await supabase
      .from('novels')
      .select('id, title, slug, cover_url, total_views')
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

  const top1 = novels[0]
  const rest = novels.slice(1, 10)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Star size={22} color="var(--gold)" fill="var(--gold)" />
        <h2 className="gradient-text" style={{ fontSize: '1.5rem' }}>
          Rating Tertinggi
        </h2>
      </div>

      {/* #1 Featured */}
      {top1 && (
        <Link
          to={`/novel/${top1.slug}`}
          className="card"
          style={{
            display: 'block',
            position: 'relative',
            height: 220,
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            marginBottom: 12,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          {/* Background cover */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: top1.cover_url
                ? `url(${top1.cover_url}) center/cover`
                : 'var(--surface)',
            }}
          />
          {/* Gradient overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(12, 16, 20, 0.95) 0%, rgba(12, 16, 20, 0.3) 60%, transparent 100%)',
            }}
          />
          {/* Content */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
            }}
          >
            <div
              style={{
                display: 'inline-block',
                background: 'var(--gold)',
                color: '#1a1a1a',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 10px',
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              🏆 #1 Top Rated
            </div>
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 6,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {top1.title}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: '0.8rem',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold)' }}>
                <Star size={13} fill="var(--gold)" />
                {top1.avgRating.toFixed(1)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.7)' }}>
                <Eye size={12} />
                {(top1.total_views || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* Rank 2-10 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rest.map((n, i) => (
          <Link
            key={n.id}
            to={`/novel/${n.slug}`}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 10,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            {/* Rank */}
            <div
              style={{
                width: 22,
                textAlign: 'center',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              {i + 2}
            </div>

            {/* Cover */}
            <div
              style={{
                width: 36,
                height: 48,
                flexShrink: 0,
                background: n.cover_url
                  ? `url(${n.cover_url}) center/cover`
                  : 'var(--border)',
                borderRadius: 4,
              }}
            />

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: 3,
                }}
              >
                {n.title}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--gold)' }}>
                  <Star size={10} fill="var(--gold)" />
                  {n.avgRating.toFixed(1)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Eye size={10} />
                  {(n.total_views || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
      }
