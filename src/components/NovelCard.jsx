import { Link, useLocation } from 'react-router-dom'
import { PlayCircle, CheckCircle2, Languages, Eye, Star } from 'lucide-react'

export default function NovelCard({ novel }) {
  const location = useLocation()
  const isOngoing = novel.status === 'ongoing'
  const genres = novel.genre ? novel.genre.split(',').map((g) => g.trim()).filter(Boolean) : []

  return (
    <Link
      to={`/novel/${novel.slug}`}
      state={{ from: location.pathname + location.search }}
      className="card"
      style={{
        display: 'flex',
        gap: 16,
        padding: 16,
      }}
    >
      <div
        style={{
          width: 72,
          height: 100,
          flexShrink: 0,
          background: novel.cover_url ? `url(${novel.cover_url}) center/cover` : 'var(--border)',
          borderRadius: 'var(--radius)',
        }}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: 4 }}>{novel.title}</h3>
        {novel.author && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 6px' }}>
            oleh {novel.author}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: isOngoing ? 'var(--gold)' : 'var(--text-muted)',
            fontSize: '0.8rem',
            marginBottom: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isOngoing ? <PlayCircle size={13} /> : <CheckCircle2 size={13} />}
            {isOngoing ? 'Berjalan' : 'Tamat'}
          </span>
          {novel.original_language && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
              <Languages size={13} />
              {novel.original_language}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
            <Eye size={13} />
            {(novel.total_views ?? 0).toLocaleString('id-ID')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold)' }}>
            <Star size={13} fill="var(--gold)" />
            4.5
          </span>
        </div>
        {genres.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {genres.slice(0, 4).map((g) => (
              <span
                key={g}
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  padding: '2px 8px',
                }}
              >
                {g}
              </span>
            ))}
          </div>
        )}
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            margin: 0,
          }}
        >
          {novel.synopsis}
        </p>
      </div>
    </Link>
  )
}
