import { getLevelInfo } from '../lib/levelSystem'

export default function LevelBadge({ totalChapters, size = 'medium', showProgress = false }) {
  const info = getLevelInfo(totalChapters)

  const sizes = {
    small: { padding: '2px 8px', fontSize: '0.7rem' },
    medium: { padding: '4px 12px', fontSize: '0.8rem' },
    large: { padding: '6px 16px', fontSize: '0.9rem' },
  }

  const s = sizes[size] || sizes.medium

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: s.padding,
          fontSize: s.fontSize,
          fontWeight: 600,
          borderRadius: 20,
          border: `1px solid ${info.color}`,
          color: info.color,
          background: `${info.color}15`,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontWeight: 700 }}>Lv.{info.level}</span>
        <span>·</span>
        <span>{info.title}</span>
      </div>

      {showProgress && info.nextLevel && (
        <div style={{ width: 180 }}>
          <div
            style={{
              height: 4,
              background: 'var(--border)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${info.progress}%`,
                background: info.color,
                transition: 'width 0.4s',
              }}
            />
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {info.needed} chapter lagi ke Lv.{info.nextLevel}
          </p>
        </div>
      )}
    </div>
  )
          }
