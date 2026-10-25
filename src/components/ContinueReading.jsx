import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ArrowRight, Clock3 } from 'lucide-react'

export default function ContinueReading({ novels = [] }) {
  const lastRead = useMemo(() => {
    try {
      let latest = null

      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i)

        if (!key?.startsWith('hq-progress-')) continue

        const slug = key.slice('hq-progress-'.length)
        const raw = localStorage.getItem(key)
        if (!raw) continue

        const progress = JSON.parse(raw)
        const chapter = Number(progress.chapter)
        const updatedAt = Number(progress.updatedAt)

        if (
          !slug ||
          !Number.isFinite(chapter) ||
          chapter < 1 ||
          !Number.isFinite(updatedAt)
        ) {
          continue
        }

        if (!latest || updatedAt > latest.updatedAt) {
          latest = {
            slug,
            chapter,
            updatedAt,
            percent: Math.min(
              100,
              Math.max(0, Number(progress.percent) || 0),
            ),
          }
        }
      }

      if (!latest) return null

      const novel = novels.find((item) => item.slug === latest.slug)
      if (!novel) return null

      return { ...latest, novel }
    } catch (error) {
      console.error('Gagal memuat riwayat bacaan:', error)
      return null
    }
  }, [novels])

  if (!lastRead) return null

  const { novel, chapter, percent } = lastRead

  return (
    <section
      aria-label="Lanjutkan membaca"
      className="card"
      style={{
        margin: '24px 0',
        padding: 20,
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        background:
          'linear-gradient(135deg, var(--surface), rgba(40, 65, 100, 0.18))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          color: 'var(--gold)',
        }}
      >
        <Clock3 size={19} />
        <h2 style={{ fontSize: '1.15rem', margin: 0 }}>
          Lanjutkan Membaca
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          aria-hidden="true"
          style={{
            width: 76,
            height: 104,
            flexShrink: 0,
            borderRadius: 'var(--radius)',
            background: novel.cover_url
              ? `url("${novel.cover_url}") center / cover no-repeat`
              : 'var(--border)',
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: '1.05rem',
              margin: '0 0 8px',
              overflowWrap: 'anywhere',
            }}
          >
            {novel.title}
          </h3>

          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              margin: '0 0 12px',
            }}
          >
            Chapter {chapter}
          </p>

          <div
            style={{
              height: 5,
              overflow: 'hidden',
              borderRadius: 10,
              background: 'var(--border)',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: '100%',
                background: 'var(--gold)',
                borderRadius: 10,
                transition: 'width 0.2s ease',
              }}
            />
          </div>

          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              margin: '0 0 12px',
            }}
          >
            Progres tersimpan: {Math.round(percent)}%
          </p>

          <Link
            to={`/novel/${encodeURIComponent(novel.slug)}/chapter/${chapter}`}
            className="btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              textDecoration: 'none',
              fontSize: '0.85rem',
            }}
          >
            <BookOpen size={16} />
            Lanjutkan Membaca
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
    }
      
