import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, UserCircle2, BookOpen, Heart, MessageCircle, Star, BarChart3, Flame } from 'lucide-react'
import { supabase } from '../lib/supabase'
import UserReviews from '../components/UserReviews'
import LevelBadge from '../components/LevelBadge'
import UserTitles from '../components/UserTitles'
import MemberBadge from '../components/MemberBadge'
import { useMembershipList } from '../lib/useMembershipList'

export default function PublicProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { isMember } = useMembershipList()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    chaptersRead: 0,
    favorites: 0,
    comments: 0,
    ratings: 0,
    reviews: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [favorites, setFavorites] = useState([])
  const [loadingFavorites, setLoadingFavorites] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', userId)
        .maybeSingle()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [userId])

  useEffect(() => {
    if (!userId) return
    loadStats()
    loadFavorites()
  }, [userId])

  async function loadStats() {
    setLoadingStats(true)

    const [chaptersRes, favoritesRes, commentsRes, ratingsRes, reviewsRes] = await Promise.all([
      supabase.from('chapter_reads').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('chapter_comments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('ratings').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('novel_reviews').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ])

    setStats({
      chaptersRead: chaptersRes.count ?? 0,
      favorites: favoritesRes.count ?? 0,
      comments: commentsRes.count ?? 0,
      ratings: ratingsRes.count ?? 0,
      reviews: reviewsRes.count ?? 0,
    })
    setLoadingStats(false)
  }

  async function loadFavorites() {
    setLoadingFavorites(true)
    const { data } = await supabase
      .from('favorites')
      .select('created_at, novels(id, title, slug, cover_url, author)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    setFavorites(data ?? [])
    setLoadingFavorites(false)
  }

  const StatCard = ({ icon, value, label, color }) => (
    <div
      className="card"
      style={{
        padding: 14,
        flex: '1 1 100px',
        minWidth: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.5rem', marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: color || 'var(--gold)' }}>
        {value.toLocaleString('id-ID')}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 60, maxWidth: 700 }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text)',
          marginBottom: 24,
        }}
        title="Kembali"
      >
        <ArrowLeft size={18} />
      </button>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>}
      {!loading && !profile && (
        <p style={{ color: 'var(--text-muted)' }}>Pengguna tidak ditemukan.</p>
      )}

      {!loading && profile && (
        <>
          {/* HEADER PROFIL */}
          <div
            className="card"
            style={{
              padding: 0,
              marginBottom: 24,
              overflow: 'hidden',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                height: 120,
                background: 'linear-gradient(135deg, rgba(212, 175, 91, 0.25), rgba(91, 168, 212, 0.15), transparent)',
              }}
            />

            <div
              style={{
                padding: '0 24px 20px',
                marginTop: -50,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : 'var(--surface)',
                  border: isMember(userId) ? '4px solid var(--gold)' : '4px solid var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                  boxShadow: isMember(userId) ? '0 0 24px rgba(212, 175, 91, 0.4)' : 'none',
                }}
              >
                {!profile.avatar_url && <UserCircle2 size={52} color="var(--text-muted)" />}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <h1
                  className="gradient-text"
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {profile.display_name || 'Pembaca'}
                </h1>
                {isMember(userId) && <MemberBadge size="medium" />}
              </div>

              {!loadingStats && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <LevelBadge totalChapters={stats.chaptersRead} size="medium" />
                  <UserTitles userId={userId} size="medium" />
                </div>
              )}
            </div>
          </div>

          {/* DAILY STREAK (read-only) */}
          <StreakDisplay userId={userId} />

          {/* STATISTIK */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <BarChart3 size={18} color="var(--gold)" />
              <h2 style={{ fontSize: '1.1rem' }}>Statistik</h2>
            </div>

            {loadingStats ? (
              <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>
            ) : (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <StatCard icon="📖" value={stats.chaptersRead} label="Chapter Dibaca" color="var(--accent)" />
                <StatCard icon="❤️" value={stats.favorites} label="Novel Favorit" color="#D46B7B" />
                <StatCard icon="💬" value={stats.comments} label="Komentar" color="#5BBF8A" />
                <StatCard icon="⭐" value={stats.reviews} label="Review Ditulis" color="var(--gold)" />
              </div>
            )}
          </div>

          {/* REVIEW YANG DITULIS */}
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Star size={18} color="var(--gold)" />
              <h2 style={{ fontSize: '1.1rem' }}>Review yang Ditulis</h2>
            </div>
            <UserReviews userId={userId} />
          </div>

          {/* NOVEL FAVORIT */}
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Heart size={18} color="var(--gold)" />
              <h2 style={{ fontSize: '1.1rem' }}>Novel Favorit</h2>
            </div>

            {loadingFavorites && <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>}
            {!loadingFavorites && favorites.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Belum ada novel favorit.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {favorites.map((f) => f.novels && (
                <Link
                  key={f.novels.id}
                  to={`/novel/${f.novels.slug}`}
                  className="card"
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 66,
                      flexShrink: 0,
                      background: f.novels.cover_url ? `url(${f.novels.cover_url}) center/cover` : 'var(--border)',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <div>
                    <div style={{ marginBottom: 4 }}>{f.novels.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {f.novels.author || 'Tanpa author'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* === Komponen kecil: Streak read-only untuk PublicProfile === */
function StreakDisplay({ userId }) {
  const [streak, setStreak] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('daily_streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', userId)
        .maybeSingle()
      setStreak(data)
      setLoading(false)
    }
    if (userId) load()
  }, [userId])

  if (loading || !streak || streak.current_streak === 0) return null

  return (
    <div
      className="card"
      style={{
        padding: 12,
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(212, 175, 91, 0.1), rgba(212, 175, 91, 0.03))',
        border: '1px solid var(--gold)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'var(--gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1a1a1a',
          flexShrink: 0,
        }}
      >
        <Flame size={20} />
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily Streak</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold)' }}>
          {streak.current_streak} hari
        </div>
        {streak.longest_streak > 0 && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Terlama: {streak.longest_streak} hari
          </div>
        )}
      </div>
    </div>
  )
        }
