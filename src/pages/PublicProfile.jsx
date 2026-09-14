import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { X, UserCircle2, BookOpen, Heart, MessageCircle, Star, BarChart3 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function PublicProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    chaptersRead: 0,
    favorites: 0,
    comments: 0,
    ratings: 0,
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

    const [chaptersRes, favoritesRes, commentsRes, ratingsRes] = await Promise.all([
      supabase
        .from('chapter_reads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('chapter_comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('ratings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
    ])

    setStats({
      chaptersRead: chaptersRes.count ?? 0,
      favorites: favoritesRes.count ?? 0,
      comments: commentsRes.count ?? 0,
      ratings: ratingsRes.count ?? 0,
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

  const StatCard = ({ icon, value, label }) => (
    <div
      className="card"
      style={{
        padding: 12,
        flex: '1 1 100px',
        minWidth: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        textAlign: 'center',
      }}
    >
      <div style={{ color: 'var(--gold)', marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>
        {value.toLocaleString('id-ID')}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 60, maxWidth: 500 }}>
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
      >
        <X size={18} />
      </button>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>}
      {!loading && !profile && (
        <p style={{ color: 'var(--text-muted)' }}>Pengguna tidak ditemukan.</p>
      )}
      {!loading && profile && (
        <>
          {/* Header Profil */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', marginBottom: 32 }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : 'var(--bg)',
                border: '2px solid var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!profile.avatar_url && <UserCircle2 size={52} color="var(--text-muted)" />}
            </div>
            <h1 style={{ fontSize: '1.6rem' }}>{profile.display_name || 'Pembaca'}</h1>
          </div>

          {/* Statistik */}
          <h2 style={{ fontSize: '1.1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} color="var(--gold)" />
            Statistik
          </h2>
          {loadingStats ? (
            <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Memuat...</p>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
              <StatCard icon={<BookOpen size={18} />} value={stats.chaptersRead} label="Chapter Dibaca" />
              <StatCard icon={<Heart size={18} />} value={stats.favorites} label="Novel Favorit" />
              <StatCard icon={<MessageCircle size={18} />} value={stats.comments} label="Komentar" />
              <StatCard icon={<Star size={18} />} value={stats.ratings} label="Rating Diberikan" />
            </div>
          )}

          {/* Novel Favorit */}
          <h2 style={{ fontSize: '1.1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Heart size={18} color="var(--gold)" />
            Novel Favorit
          </h2>
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
        </>
      )}
    </div>
  )
      }
