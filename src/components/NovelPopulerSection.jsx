import React from 'react';
import { Link } from 'react-router-dom';

const PopularNovelCard = ({ novel }) => {
  return (
    <Link
      to={`/novel/${novel.slug}`}
      style={{
        minWidth: 140,
        width: 140,
        flexShrink: 0,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.2s',
        textDecoration: 'none',
        display: 'block',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--gold)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <img
        src={novel.cover_url || 'https://via.placeholder.com/150'}
        alt={novel.title}
        style={{ width: '100%', height: 190, objectFit: 'cover' }}
      />
      <div style={{ padding: 10 }}>
        <h3
          style={{
            color: 'var(--text)',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {novel.title}
        </h3>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {novel.author}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--gold)',
            fontSize: '0.75rem',
            marginTop: 6,
          }}
        >
          <span>👁️ {novel.total_views || 0}</span>
        </div>
      </div>
    </Link>
  );
};

export default function NovelPopulerSection({ dataNovel }) {
  const top5Novel = [...(dataNovel || [])]
    .sort((a, b) => (b.total_views || 0) - (a.total_views || 0))
    .slice(0, 5);

  if (top5Novel.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: 16 }}>
        🔥 Novel Populer
      </h2>

      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          gap: 12,
          paddingBottom: 8,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {top5Novel.map((novel) => (
          <PopularNovelCard key={novel.id} novel={novel} />
        ))}
      </div>
    </div>
  );
            }
