import { Link } from 'react-router-dom'
import { Flame, Star, Eye } from 'lucide-react'

export default function NovelPopulerSection({ dataNovel }) {
  const top5 = [...(dataNovel || [])]
    .sort((a, b) => (b.total_views || 0) - (a.total_views || 0))
    .slice(0, 5)

  if (top5.length === 0) return null

  const top3 = top5.slice(0, 3)
  const rest = top5.slice(3, 5)

  const rankColors = {
    1: { border: 'var(--gold)', bg: 'rgba(212, 175, 91, 0.08)' },
    2: { border: '#C0C0C0', bg: 'rgba(192, 192, 192, 0.06)' },
    3: { border: '#CD7F32', bg: 'rgba(205, 127, 50, 0.06)' },
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Flame size={22} color="var(--gold)" />
        <h2 className="gradient-text" style={{ fontSize: '1.5rem' }}>
          Novel Populer
        </h2>
      </div>

      {/* Top 3 Podium */}
      <div className="populer-grid">
        {top3.map((novel, i) => {
          const rank = i + 1
          const colors = rankColors[rank]
          const isChampion = rank === 1

          return (
            <Link
              key={novel.id}
              to={`/novel/${novel.slug}`}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: isChampion ? 16 : 14,
                border: `2px solid ${colors.border}`,
                background: colors.bg,
                textDecoration: 'none',
                color: 'inherit',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>
                #{rank} {isChampion && '👑'}
              </div>
              <div
                style={{
                  width: isChampion ? 90 : 76,
                  height: isChampion ? 120 : 100,
                  background: novel.cover_url ? `url(${novel.cover_url}) center/cover` : 'var(--border)',
                  borderRadius: 'var(--radius)',
                  marginBottom: 10,
                  border: `1px solid ${colors.border}`,
                }}
              />
              <div
                style={{
                  fontSize: isChampion ? '0.95rem' : '0.85rem',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  marginBottom: 6,
                  maxWidth: '100%',
                }}
              >
                {novel.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--gold)' }}>
                <Eye size={11} />
                {(novel.total_views || 0).toLocaleString('id-ID')}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Rank 4-5 */}
      {rest.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          {rest.map((novel, i) => (
            <Link
              key={novel.id}
              to={`/novel/${novel.slug}`}
              className="card"
              style={{
                display: 'flex',
                gap: 10,
                padding: 10,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 60,
                  flexShrink: 0,
                  background: novel.cover_url ? `url(${novel.cover_url}) center/cover` : 'var(--border)',
                  borderRadius: 4,
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                  #{i + 4}
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    marginBottom: 4,
                  }}
                >
                  {novel.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: 'var(--gold)' }}>
                  <Eye size={10} />
                  {(novel.total_views || 0).toLocaleString('id-ID')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .populer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 600px) {
          .populer-grid {
            grid-template-columns: repeat(3, 1fr);
            align-items: end;
          }
          .populer-grid > a:nth-child(2) {
            transform: translateY(-12px);
          }
        }
      `}</style>
    </div>
  )
                  }
