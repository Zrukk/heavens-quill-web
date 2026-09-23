import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Lock, Check, Award, BookOpen, Star, Flame } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useDocumentMeta } from '../lib/useDocumentMeta'

const TITLES = [
  // === STREAK ===
  {
    key: 'streak_1',
    name: 'First Step Cultivator',
    icon: '🌱',
    description: 'Langkah pertama di jalan kultivasi. Kamu udah mulai!',
    requirement: 'Login & check-in 1 hari berturut-turut',
    category: 'streak',
    metric: 'currentStreak',
    target: 1,
  },
  {
    key: 'streak_7',
    name: 'Weekly Dao Seeker',
    icon: '🔥',
    description: 'Seorang pencari Dao yang tekun. Seminggu berturut-turut, konsisten!',
    requirement: 'Login & check-in 7 hari berturut-turut',
    category: 'streak',
    metric: 'currentStreak',
    target: 7,
  },
  {
    key: 'streak_30',
    name: 'Monthly Ascendant',
    icon: '💎',
    description: 'Kamu udah naik ke level yang jarang dicapai. Sebulan penuh, luar biasa!',
    requirement: 'Login & check-in 30 hari berturut-turut',
    category: 'streak',
    metric: 'currentStreak',
    target: 30,
  },
  {
    key: 'streak_365',
    name: 'Eternal Heavenly Reader',
    icon: '🌌',
    description: "Setahun penuh tanpa putus. Kamu udah jadi bagian dari legenda Heaven's Quill.",
    requirement: 'Login & check-in 365 hari berturut-turut',
    category: 'streak',
    metric: 'currentStreak',
    target: 365,
  },

  // === GENRE ===
  {
    key: 'heavenly_beauties',
    name: 'Venerable Enjoyer of Heavenly Beauties',
    icon: '🍃',
    description: 'Bagi mereka yang mengabdikan diri pada kisah-kisah cinta abadi dan harem yang legendaris.',
    requirement: 'Baca 500+ chapter dari novel bergenre Romance atau Harem',
    category: 'genre',
    metric: 'romanceHaremChapters',
    target: 500,
  },
  {
    key: 'web_cultivation',
    name: 'Supreme Sovereign of Web Cultivation',
    icon: '⚡',
    description: 'Penguasa jalan kultivasi dunia maya. Menaklukkan kisah xianxia, wuxia, dan fantasy.',
    requirement: 'Baca 500+ chapter dari novel bergenre Xianxia, Cultivation, Wuxia, atau Fantasy',
    category: 'genre',
    metric: 'cultivationChapters',
    target: 500,
  },
  {
    key: 'web_sect_grandmaster',
    name: 'Grandmaster of the Infinite Web-Sect',
    icon: '🔮',
    description: 'Grandmaster sekte maya yang tak terbatas. Telah menjelajahi ribuan chapter dari berbagai dunia.',
    requirement: 'Total 1000+ chapter dibaca (semua genre)',
    category: 'genre',
    metric: 'totalChapters',
    target: 1000,
  },
  {
    key: 'dao_sect_patriarch',
    name: 'Patriarch of the Digital Dao Sect',
    icon: '👁️',
    description: 'Patriarch tertinggi sekte Dao digital. Bukan hanya pembaca, tapi juga kontributor sejati.',
    requirement: 'Punya 1000+ chapter dibaca, 50+ review, dan 100+ komentar',
    category: 'genre',
    metric: 'combined',
    target: 1000,
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
    currentStreak: 0,
    longestStreak: 0,
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

    const { data: reads } = await supabase
      .from('chapter_reads')
      .select('chapter_id, novel_id')
      .eq('user_id', user.id)

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

    const [reviewsRes, commentsRes] = await Promise.all([
      supabase.from('novel_reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('chapter_comments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    const { data: streakData } = await supabase
      .from('daily_streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', user.id)
      .maybeSingle()

    setStats({
      totalChapters: uniqueChapters.size,
      romanceHaremChapters: romanceHarem,
      cultivationChapters: cultivation,
      reviewCount: reviewsRes.count ?? 0,
      commentCount: commentsRes.count ?? 0,
      currentStreak: streakData?.current_streak ?? 0,
      longestStreak: streakData?.longest_streak ?? 0,
    })

    const { data: titlesData } = await supabase
      .from('user_titles')
      .select('title_key')
      .eq('user_id', user.id)
    setUnlocked(new Set((titlesData ?? []).map((t) => t.title_key)))

    setLoading(false)
  }

  function getProgress(title) {
    if (title.metric === 'combined') {
      const chaptersDone = Math.min(stats.totalChapters, 1000)
      const reviewsDone = Math.min(stats.reviewCount, 50)
      const commentsDone = Math.min(stats.commentCount, 100)
      const progress = ((chaptersDone / 1000 + reviewsDone / 50 + commentsDone / 100) / 3) * 100
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
        { label: title.requirement, value: current, target: title.target, done: current >= title.target },
      ],
    }
  }

  function renderTitleCard(t) {
    const isUnlocked = unlocked.has(t.key)
    const { details } = getProgress(t)

    return (
      <div
        key={t.key}
        className={`card title-card ${isUnlocked ? 'title-unlocked' : 'title-locked'}`}
        style={{
          padding: 20,
          border: isUnlocked ? '2px solid var(--gold)' : '1px solid var(--border)',
          background: isUnlocked
            ? 'linear-gradient(135deg, rgba(212, 175, 91, 0.1), rgba(212, 175, 91, 0.02))'
            : 'var(--surface)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        {isUnlocked && (
          <div
            style={{
              position: 'absolute',
              right: -20,
              top: -20,
              fontSize: '9rem',
              opacity: 0.06,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {t.icon}
          </div>
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          <div
            className={isUnlocked ? 'title-icon-unlocked' : ''}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              background: isUnlocked
                ? 'linear-gradient(135deg, var(--gold), var(--gold-hover))'
                : 'var(--border)',
              color: isUnlocked ? '#1a1a1a' : 'var(--text-muted)',
              border: isUnlocked ? '2px solid var(--gold)' : '2px solid var(--border)',
              boxShadow: isUnlocked ? '0 0 24px rgba(212, 175, 91, 0.4)' : 'none',
            }}
          >
            {t.icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1rem', margin: 0, color: isUnlocked ? 'var(--gold)' : 'var(--text)' }}>
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
                    padding: '2px 8px',
                    fontWeight: 600,
                    background: 'rgba(91, 191, 138, 0.1)',
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
                    padding: '2px 8px',
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

        {/* Progress */}
        <div
          style={{
            padding: 12,
            background: 'var(--bg)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Progress
          </div>

          {details.map((d, i) => (
            <div key={i} style={{ marginBottom: i < details.length - 1 ? 10 : 0 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  marginBottom: 4,
                  color: 'var(--text-muted)',
                  gap: 8,
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.label}
                </span>
                <span
                  style={{
                    color: d.done ? '#5BBF8A' : 'var(--text-muted)',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
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
    )
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

  const streakTitles = TITLES.filter((t) => t.category === 'streak')
  const genreTitles = TITLES.filter((t) => t.category === 'genre')

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 700 }}>
      <Link
        to="/profil"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}
      >
        <ArrowLeft size={15} />
        Kembali ke Profil
      </Link>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Award size={26} color="var(--gold)" strokeWidth={1.75} />
        <h1 className="gradient-text" style={{ fontSize: '1.8rem' }}>Gelar</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        Koleksi gelar bergengsi dari Heaven's Quill. Dapatkan dengan membaca, berkontribusi, dan login rutin.
      </p>

      {/* STATS BANNER */}
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 32,
          background: 'linear-gradient(135deg, rgba(212, 175, 91, 0.1), rgba(91, 168, 212, 0.05))',
          border: '1px solid var(--gold)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              🏆 Koleksi Gelar
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--gold)' }}>
              {unlocked.size} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>dari {TITLES.length}</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div
              style={{
                height: 8,
                background: 'var(--border)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(unlocked.size / TITLES.length) * 100}%`,
                  background: 'var(--gold)',
                  transition: 'width 0.5s',
                }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
              {Math.round((unlocked.size / TITLES.length) * 100)}% selesai
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: STREAK */}
      <h2 style={{ fontSize: '1.1rem', marginBottom: 12, marginTop: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Flame size={18} color="var(--gold)" />
        Login Beruntun (Streak)
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        {streakTitles.map((t) => renderTitleCard(t))}
      </div>

      {/* SECTION: GENRE */}
      <h2 style={{ fontSize: '1.1rem', marginBottom: 12, marginTop: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <BookOpen size={18} color="var(--gold)" />
        Pencapaian Genre & Aktivitas
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {genreTitles.map((t) => renderTitleCard(t))}
      </div>

      {/* CSS */}
      <style>{`
        .title-unlocked {
          animation: titleGlow 2s ease-in-out infinite;
        }
        @keyframes titleGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(212, 175, 91, 0.1); }
          50% { box-shadow: 0 0 32px rgba(212, 175, 91, 0.25); }
        }
        .title-icon-unlocked {
          animation: iconPulse 2s ease-in-out infinite;
        }
        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
    }
