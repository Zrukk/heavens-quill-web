import { Link } from 'react-router-dom'

export default function NovelCard({ novel }) {
  return (
    <Link
      to={`/novel/${novel.slug}`}
      style={{
        display: 'flex',
        gap: 16,
        padding: 16,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 2,
      }}
    >
      <div
        style={{
          width: 72,
          height: 100,
          flexShrink: 0,
          background: novel.cover_url ? `url(${novel.cover_url}) center/cover` : 'var(--border)',
          borderRadius: 2,
        }}
      />
      <div style={{ minWidth: 0 }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: 6 }}>{novel.title}</h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            marginBottom: 8,
          }}
        >
          <span className={`diamond ${novel.status === 'ongoing' ? '' : 'diamond--muted'}`} />
          <span>{novel.status === 'ongoing' ? 'Berjalan' : 'Tamat'}</span>
          {novel.original_language && <span>· {novel.original_language}</span>}
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
