import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Lock, Check, Award, BookOpen, MessageCircle, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useDocumentMeta } from '../lib/useDocumentMeta'

const TITLES = [
  {
    key: 'heavenly_beauties',
    name: 'Venerable Enjoyer of Heavenly Beauties',
    icon: '🍃',
    description: 'Bagi mereka yang mengabdikan diri pada kisah-kisah cinta abadi dan harem yang legendaris.',
    requirement: 'Baca 500+ chapter dari novel bergenre Romance atau Harem',
    metric: 'romanceHaremChapters',
    target: 500,
    unit: 'chapter',
  },
  {
    key: 'web_cultivation',
    name: 'Supreme Sovereign of Web Cultivation',
    icon: '⚡',
    description: 'Penguasa jalan kultivasi dunia maya. Menaklukkan kisah xianxia, wuxia, dan fantasy.',
    requirement: 'Baca 500+ chapter dari novel bergenre Xianxia, Cultivation, Wuxia, atau Fantasy',
    metric: 'cultivationChapters',
    target: 500,
    unit: 'chapter',
  },
  {
    key: 'web_sect_grandmaster',
    name: 'Grandmaster of the Infinite Web-Sect',
    icon: '🔮',
    description: 'Grandmaster sekte maya yang tak terbatas. Telah menjelajahi ribuan chapter dari berbagai dunia.',
    requirement: 'Total 1000+ chapter dibaca (semua genre)',
    metric: 'totalChapters',
    target: 1000,
    unit: 'chapter',
  },
  {
    key: 'dao_sect_patriarch',
    name: 'Patriarch of the Digital Dao Sect',
    icon: '👁️',
    description: 'Patriarch tertinggi sekte Dao digital. Bukan hanya pembaca, tapi juga kontributor sejati.',
    requirement: 'Punya 1000+ chapter dibaca, 50+ review, dan 100+ komentar',
    metric: 'combined',
    target: 1000,
    unit: 'chapter',
  },
]

export default function Titles() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalChapters: 0,
    romanceHaremChapters: 0,
    cultivationChapters: 0,
    reviewCount: 0,
    commentCount: 0,
  })
  const [unlocked, setUnlocked] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useDocumentMeta(
    "Gelar — Heaven's Quill",
    "Koleksi gelar dan pencapaian di Heaven's Quill.",
  )

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    load()
  }, [user])

  async function load() {
    setLoading(true)

    // Fetch chapter_reads untuk hitung total & per-genre
    const { data: reads } = await supabase
      .from('chapter_reads')
      .select('chapter_id, novel_id')
      .eq('user_id', user.id)

    // Fetch novel genres
    const novelIds = [...new Set((reads ?? []).map((r) => r.novel_id).filter(Boolean))]
    let novelsMap = {}
    if (novelIds.length > 0) {
      const { data: novelsData } = await supabase
        .from('novels')
        .select('id, genre')
        .in('id', novelIds)
      ;(novelsData ?? []).forEach((n) => {
        novelsMap[n.id] = n.genre || ''
      })
    }

    // Hitung total chapter unik
    const uniqueChapters = new Set()
    let romanceHarem = 0
    let cultivation = 0
    ;(reads ?? []).forEach((r) => {
      if (uniqueChapters.has(r.chapter_id)) return
      uniqueChapters.add(r.chapter_id)
      const genre = (novelsMap[r.novel_id] || '').toLowerCase()
      if (genre.includes('romance') || genre.includes('harem')) romanceHarem++
      if (
        genre.includes('xianxia') ||
        genre.includes('cultivation') ||
        genre.includes('wuxia') ||
        genre.includes('fantasy')
      )
        cultivation++
    })

    // Fetch review & komentar count
    const [reviewsRes, commentsRes] = await Promise.all([
      supabase.from('novel_reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('chapter_comments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    setStats({
      totalChapters: uniqueChapters.size,
      romanceHaremChapters: romanceHarem,
      cultivationChapters: cultivation,
      reviewCount: reviewsRes.count ?? 0,
      commentCount: commentsRes.count ?? 0,
    })

    // Fetch title yang udah didapat
    const { data: titlesData } = await supabase
      .from('user_titles')
      .select('title_key')
      .eq('user_id', user.id)
    setUnlocked(new Set((titlesData ?? []).map((t) => t.title_key)))

    setLoading(false)
  }

  // Hitung progress untuk tiap title
  function getProgress(title) {
    if (title.metric === 'combined') {
      // Title 4: butuh 3 syarat
      const chaptersDone = Math.min(stats.totalChapters, 1000)
      const reviewsDone = Math.min(stats.reviewCount, 50)
      const commentsDone = Math.min(stats.commentCount, 100)
      const progress =
        (chaptersDone / 1000 + reviewsDone / 50 + commentsDone / 100) / 3 * 100
      return {
        progress: Math.round(progress),
        details: [
          { label: 'Chapter dibaca', value: stats.totalChapters, target: 1000, done: stats.totalChapters >= 1000 },
          { label: 'Review ditulis', value: stats.reviewCount, target: 50, done: stats.reviewCount >= 50 },
          { label: 'Komentar', value: stats.commentCount, target: 100, done: stats.commentCount >= 100 },
        ],
      }
    }

    const current = stats[title.metric] || 0
    return {
      progress: Math.min(100, Math.round((current / title.target) * 100)),
      details: [
        {
          label: title.requirement,
          value: current,
          target: title.target,
          done: current >= title.target,
        },
      ],
    }
  }

  if (!user) {
    return (
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 700 }}>
        <Link to="/profil" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
          <ArrowLeft size={15} />
          Kembali ke Profil
        </Link>
        <p style={{ color: 'var(--text-muted)' }}>Silakan masuk dulu.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 700 }}>
        <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 700 }}>
      <Link
        to="/profil"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}
      >
        <ArrowLeft size={15} />
        Kembali ke Profil
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Award size={26} color="var(--gold)" strokeWidth={1.75} />
        <h1 className="gradient-text" style={{ fontSize: '1.8rem' }}>Gelar</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
        Koleksi gelar bergengsi dari Heaven's Quill. Dapatkan dengan membaca dan berkontribusi.
      </p>
      <p style={{ color: 'var(--gold)', fontSize: '0.85rem', marginBottom: 24 }}>
        Kamu telah mengumpulkan {unlocked.size} dari {TITLES.length} gelar.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {TITLES.map((t) => {
          const isUnlocked = unlocked.has(t.key)
          const { progress, details } = getProgress(t)

          return (
            <div
              key={t.key}
              className="card"
              style={{
                padding: 20,
                border: isUnlocked ? '1px solid var(--gold)' : '1px solid var(--border)',
                background: isUnlocked ? 'rgba(212, 175, 91, 0.05)' : 'var(--surface)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Icon besar di background */}
              <div
                style={{
                  position: 'absolute',
                  right: -10,
                  top: -10,
                  fontSize: '6rem',
                  opacity: isUnlocked ? 0.08 : 0.03,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {t.icon}
              </div>

              <div style={{ position: 'relative' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                      background: isUnlocked ? 'var(--gold)' : 'var(--border)',
                      color: isUnlocked ? '#1a1a1a' : 'var(--text-muted)',
                      border: isUnlocked ? '2px solid var(--gold)' : '2px solid var(--border)',
                    }}
                  >
                    {t.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.05rem', margin: 0, color: isUnlocked ? 'var(--gold)' : 'var(--text)' }}>
                        {t.name}
                      </h3>
                      {isUnlocked ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: '0.65rem',
                            color: '#5BBF8A',
                            border: '1px solid #5BBF8A',
                            borderRadius: 12,
                            padding: '1px 6px',
                            fontWeight: 600,
                          }}
                        >
                          <Check size={10} />
                          Terbuka
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border)',
                            borderRadius: 12,
                            padding: '1px 6px',
                          }}
                        >
                          <Lock size={10} />
                          Terkunci
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                      {t.description}
                    </p>
                  </div>
                </div>

                {/* Syarat */}
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    background: 'var(--bg)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Syarat
                  </div>
                  <p style={{ fontSize: '0.85rem', margin: '0 0 10px', color: 'var(--text)' }}>
                    {t.requirement}
                  </p>

                  {/* Progress detail */}
                  {details.map((d, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          marginBottom: 4,
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span>{d.label}</span>
                        <span style={{ color: d.done ? '#5BBF8A' : 'var(--text-muted)', fontWeight: 600 }}>
                          {d.value.toLocaleString('id-ID')} / {d.target.toLocaleString('id-ID')}
                          {d.done && ' ✓'}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          background: 'var(--border)',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(100, (d.value / d.target) * 100)}%`,
                            background: d.done ? '#5BBF8A' : 'var(--gold)',
                            transition: 'width 0.4s',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
    }
