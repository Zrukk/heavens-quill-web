import { Link } from 'react-router-dom'
import { PlayCircle, CheckCircle2, Languages } from 'lucide-react'

export default function NovelCard({ novel }) {
  const isOngoing = novel.status === 'ongoing'

  return (
    <Link
      to={`/novel/${novel.slug}`}
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
      <div style={{ minWidth: 0 }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: 6 }}>{novel.title}</h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: isOngoing ? 'var(--gold)' : 'var(--text-muted)',
            fontSize: '0.85rem',
            marginBottom: 8,
          }}
        >
          {isOngoing ? <PlayCircle size={14} /> : <CheckCircle2 size={14} />}
          <span>{isOngoing ? 'Berjalan' : 'Tamat'}</span>
          {novel.original_language && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
              <Languages size={13} />
              {novel.original_language}
            </span>
          )}
        </div>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
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
