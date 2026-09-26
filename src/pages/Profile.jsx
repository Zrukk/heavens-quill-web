import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserCircle2, KeyRound, BookMarked, Save, Camera, Heart, BarChart3, BookOpen, MessageCircle, Star, Award, Crown } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import UserReviews from '../components/UserReviews'
import LevelBadge from '../components/LevelBadge'
import UserTitles from '../components/UserTitles'
import DailyStreakCard from '../components/DailyStreakCard'
import MemberBadge from '../components/MemberBadge'
import { useMembership } from '../lib/MembershipContext'

export default function Profile() {
  const { user, displayName, avatarUrl, loading, refreshProfile } = useAuth()
  const { isMember, membership } = useMembership()

  const [nameInput, setNameInput] = useState('')
  const [nameMessage, setNameMessage] = useState(null)
  const [savingName, setSavingName] = useState(false)

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarMessage, setAvatarMessage] = useState(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState(null)
  const [savingPassword, setSavingPassword] = useState(false)

  const [bookmarks, setBookmarks] = useState([])
  const [loadingBookmarks, setLoadingBookmarks] = useState(true)

  const [favorites, setFavorites] = useState([])
  const [loadingFavorites, setLoadingFavorites] = useState(true)

  const [stats, setStats] = useState({
    chaptersRead: 0,
    favorites: 0,
    comments: 0,
    ratings: 0,
    reviews: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    setNameInput(displayName || '')
  }, [displayName])

  useEffect(() => {
    if (!user) {
      setLoadingBookmarks(false)
      setLoadingFavorites(false)
      setLoadingStats(false)
      return
    }
    loadBookmarks()
    loadFavorites()
    loadStats()
  }, [user])

  async function loadBookmarks() {
    setLoadingBookmarks(true)
    const { data } = await supabase
      .from('bookmarks')
      .select('last_chapter_read, novels(id, title, slug, cover_url)')
      .eq('user_id', user.id)
    setBookmarks(data ?? [])
    setLoadingBookmarks(false)
  }

  async function loadFavorites() {
    setLoadingFavorites(true)
    const { data } = await supabase
      .from('favorites')
      .select('created_at, novels(id, title, slug, cover_url, author)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setFavorites(data ?? [])
    setLoadingFavorites(false)
  }

  async function loadStats() {
    setLoadingStats(true)

    const [chaptersRes, favoritesRes, commentsRes, ratingsRes, reviewsRes] = await Promise.all([
      supabase.from('chapter_reads').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('chapter_comments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('ratings').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('novel_reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
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

  async function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      setAvatarMessage('Ukuran gambar maksimal 3MB.')
      return
    }

    setUploadingAvatar(true)
    setAvatarMessage(null)

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
    if (uploadError) {
      setAvatarMessage('Gagal upload: ' + uploadError.message)
      setUploadingAvatar(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user.id)

    setUploadingAvatar(false)

    if (updateError) {
      setAvatarMessage('Gagal simpan: ' + updateError.message)
    } else {
      setAvatarMessage('Foto profil diperbarui.')
      refreshProfile()
    }
  }

  async function handleSaveName(e) {
    e.preventDefault()
    setNameMessage(null)
    setSavingName(true)
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: nameInput.trim() || null })
      .eq('id', user.id)
    setSavingName(false)
    if (error) setNameMessage('Gagal simpan: ' + error.message)
    else {
      setNameMessage('Nama disimpan.')
      refreshProfile()
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordMessage(null)

    if (newPassword.length < 6) {
      setPasswordMessage('Password minimal 6 karakter.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Konfirmasi password gak cocok.')
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)

    if (error) setPasswordMessage('Gagal ganti password: ' + error.message)
    else {
      setPasswordMessage('Password berhasil diganti.')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  if (loading) return <div className="container" style={{ paddingTop: 40 }}>Memuat...</div>
  if (!user) return <div className="container" style={{ paddingTop: 40 }}>Silakan masuk dulu.</div>

  const sectionHeading = (Icon, text) => (
    <h2
      style={{
        fontSize: '1.1rem',
        marginBottom: 12,
        marginTop: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Icon size={18} color="var(--gold)" />
      {text}
    </h2>
  )

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
            position: 'relative',
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
              background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'var(--surface)',
              border: isMember ? '4px solid var(--gold)' : '4px solid var(--bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              position: 'relative',
              boxShadow: isMember ? '0 0 24px rgba(212, 175, 91, 0.4)' : 'none',
            }}
          >
            {!avatarUrl && <UserCircle2 size={52} color="var(--text-muted)" />}

            <label
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: 'var(--gold)',
                color: '#1a1a1a',
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '3px solid var(--bg)',
              }}
              title="Ganti foto"
            >
              <Camera size={13} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
            <h1
              className="gradient-text"
              style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                margin: 0,
              }}
            >
              {displayName || 'Pembaca'}
            </h1>
            {isMember && <MemberBadge size="medium" />}
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 12px' }}>
            {user.email}
          </p>

          {avatarMessage && (
            <p style={{ color: 'var(--accent)', fontSize: '0.8rem', margin: '0 0 12px' }}>
              {avatarMessage}
            </p>
          )}

          {!loadingStats && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <LevelBadge totalChapters={stats.chaptersRead} size="large" showProgress />
              <UserTitles userId={user.id} size="medium" editable />
            </div>
          )}
        </div>
      </div>

      {/* MEMBER BANNER */}
      {isMember && membership && (
        <div
          className="card"
          style={{
            padding: 16,
            marginBottom: 16,
            background: 'linear-gradient(135deg, rgba(212, 175, 91, 0.15), rgba(212, 175, 91, 0.03))',
            border: '1px solid var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
              <Crown size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gold)' }}>
                Member Aktif 👑
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Berlaku sampai{' '}
                {new Date(membership.expires_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
          <Link
            to="/membership"
            className="btn btn--gold"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            Kelola
          </Link>
        </div>
      )}

      {/* DAILY STREAK */}
      <DailyStreakCard />

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

      {/* TOMBOL LIHAT GELAR */}
      <Link
        to="/gelar"
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          marginTop: 24,
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(212, 175, 91, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Award size={20} color="var(--gold)" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Lihat Semua Gelar</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Koleksi achievement kamu
            </div>
          </div>
        </div>
        <span style={{ color: 'var(--gold)', fontSize: '1.2rem' }}>→</span>
      </Link>

      {/* PENGATURAN AKUN */}
      {sectionHeading(UserCircle2, 'Pengaturan Akun')}

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <label
          style={{
            fontSize: '0.8rem',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 10,
            display: 'block',
            fontWeight: 600,
          }}
        >
          Nama Tampilan
        </label>
        <form onSubmit={handleSaveName} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Nama kamu"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn--gold" disabled={savingName}>
            <Save size={16} />
            {savingName ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>
        {nameMessage && (
          <p style={{ color: 'var(--accent)', fontSize: '0.85rem', margin: '8px 0 0' }}>
            {nameMessage}
          </p>
        )}
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <label
          style={{
            fontSize: '0.8rem',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 10,
            display: 'block',
            fontWeight: 600,
          }}
        >
          Ganti Password
        </label>
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="password"
            placeholder="Password baru"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Ulangi password baru"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button type="submit" className="btn btn--gold" disabled={savingPassword} style={{ alignSelf: 'flex-start' }}>
            <KeyRound size={16} />
            {savingPassword ? 'Menyimpan...' : 'Ganti Password'}
          </button>
          {passwordMessage && (
            <p style={{ color: 'var(--accent)', fontSize: '0.85rem', margin: 0 }}>{passwordMessage}</p>
          )}
        </form>
      </div>

      {/* REVIEW YANG DITULIS */}
      {sectionHeading(Star, 'Review yang Ditulis')}
      <UserReviews userId={user.id} />

      {/* NOVEL FAVORIT */}
      {sectionHeading(Heart, `Novel Favorit (${favorites.length})`)}
      {loadingFavorites && <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>}
      {!loadingFavorites && favorites.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
          Belum ada novel favorit. Klik ❤️ di halaman novel buat nambahin.
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

      {/* SEDANG DIBACA */}
      {sectionHeading(BookMarked, 'Sedang Dibaca')}
      {loadingBookmarks && <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>}
      {!loadingBookmarks && bookmarks.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Belum ada novel yang dibaca.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bookmarks.map((b) => b.novels && (
          <Link
            key={b.novels.id}
            to={`/novel/${b.novels.slug}`}
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
                background: b.novels.cover_url ? `url(${b.novels.cover_url}) center/cover` : 'var(--border)',
                borderRadius: 'var(--radius)',
              }}
            />
            <div>
              <div style={{ marginBottom: 4 }}>{b.novels.title}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Terakhir: Chapter {b.last_chapter_read}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
                                                  }
