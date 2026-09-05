import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserCircle2, KeyRound, BookMarked, Save } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function Profile() {
  const { user, displayName, loading, refreshProfile } = useAuth()
  const [nameInput, setNameInput] = useState('')
  const [nameMessage, setNameMessage] = useState(null)
  const [savingName, setSavingName] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState(null)
  const [savingPassword, setSavingPassword] = useState(false)

  const [bookmarks, setBookmarks] = useState([])
  const [loadingBookmarks, setLoadingBookmarks] = useState(true)

  useEffect(() => {
    setNameInput(displayName || '')
  }, [displayName])

  useEffect(() => {
    if (!user) {
      setLoadingBookmarks(false)
      return
    }
    loadBookmarks()
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
    <h2 style={{ fontSize: '1.1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon size={18} color="var(--gold)" />
      {text}
    </h2>
  )

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <UserCircle2 size={26} color="var(--gold)" strokeWidth={1.75} />
        <h1 className="gradient-text" style={{ fontSize: '1.8rem' }}>Profil</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.9rem' }}>{user.email}</p>

      {sectionHeading(UserCircle2, 'Nama Tampilan')}
      <form onSubmit={handleSaveName} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
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
      {nameMessage && <p style={{ color: 'var(--accent)', fontSize: '0.85rem', marginBottom: 24 }}>{nameMessage}</p>}
      {!nameMessage && <div style={{ marginBottom: 24 }} />}

      {sectionHeading(KeyRound, 'Ganti Password')}
      <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
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
        {passwordMessage && <p style={{ color: 'var(--accent)', fontSize: '0.85rem', margin: 0 }}>{passwordMessage}</p>}
      </form>

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
