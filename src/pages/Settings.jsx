import { useEffect, useState } from 'react'
import { Settings as SettingsIcon, Palette, Type, AlignLeft, RotateCcw, Check, Bell, Trash2, Loader } from 'lucide-react'
import { useSettings } from '../lib/SettingsContext'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const { settings, updateSetting, resetSettings } = useSettings()
  const { user } = useAuth()

  const [notifReplies, setNotifReplies] = useState(true)
  const [notifNewChapters, setNotifNewChapters] = useState(true)
  const [notifAllComments, setNotifAllComments] = useState(false)
  const [savingNotif, setSavingNotif] = useState(false)
  const [notifMessage, setNotifMessage] = useState(null)

  const [resetting, setResetting] = useState(false)
  const [resetMessage, setResetMessage] = useState(null)

  useEffect(() => {
    if (!user) return
    async function loadNotifPrefs() {
      const { data } = await supabase
        .from('profiles')
        .select('notif_replies, notif_new_chapters, notif_all_comments')
        .eq('id', user.id)
        .maybeSingle()
      if (data) {
        setNotifReplies(data.notif_replies ?? true)
        setNotifNewChapters(data.notif_new_chapters ?? true)
        setNotifAllComments(data.notif_all_comments ?? false)
      }
    }
    loadNotifPrefs()
  }, [user])

  async function saveNotifPref(key, value) {
    if (!user) return
    setSavingNotif(true)
    setNotifMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({ [key]: value })
      .eq('id', user.id)

    setSavingNotif(false)
    if (error) {
      setNotifMessage('Gagal simpan: ' + error.message)
    } else {
      setNotifMessage('Tersimpan.')
      setTimeout(() => setNotifMessage(null), 2000)
    }
  }

  async function handleResetProgress() {
    if (!user) return
    if (!confirm('Hapus semua riwayat bacaan? Tindakan ini gak bisa dibatalin.')) return

    setResetting(true)
    setResetMessage(null)

    const { error: err1 } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)

    const { error: err2 } = await supabase
      .from('chapter_reads')
      .delete()
      .eq('user_id', user.id)

    setResetting(false)

    if (err1 || err2) {
      setResetMessage('Gagal reset: ' + (err1?.message || err2?.message))
    } else {
      setResetMessage('Riwayat bacaan berhasil dihapus.')
    }
  }

  const sectionHeading = (Icon, text) => (
    <h2 style={{ fontSize: '1.1rem', marginBottom: 12, marginTop: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon size={18} color="var(--gold)" />
      {text}
    </h2>
  )

  const OptionButton = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={active ? 'btn btn--gold' : 'btn'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        justifyContent: 'center',
        flex: '1 1 100px',
        padding: '10px 14px',
      }}
    >
      {active && <Check size={14} />}
      {children}
    </button>
  )

  const Toggle = ({ checked, onChange, disabled }) => (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        background: checked ? 'var(--gold)' : 'var(--border)',
        position: 'relative',
        transition: 'background 0.2s',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          transition: 'left 0.2s',
        }}
      />
    </button>
  )

  const notifRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid var(--border)',
    gap: 12,
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <SettingsIcon size={26} color="var(--gold)" strokeWidth={1.75} />
        <h1 className="gradient-text" style={{ fontSize: '1.8rem' }}>Pengaturan</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
        Sesuaikan tampilan & preferensi Heaven's Quill sesuai keinginan kamu.
      </p>

      {sectionHeading(Palette, 'Tema Warna')}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <OptionButton active={settings.theme === 'dark'} onClick={() => updateSetting('theme', 'dark')}>
          🌙 Gelap
        </OptionButton>
        <OptionButton active={settings.theme === 'light'} onClick={() => updateSetting('theme', 'light')}>
          ☀️ Terang
        </OptionButton>
      </div>

      {sectionHeading(Palette, 'Warna Aksen')}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { id: 'blue', name: 'Biru', color: '#5BA8D4' },
          { id: 'gold', name: 'Emas', color: '#D4AF5B' },
          { id: 'green', name: 'Hijau', color: '#5BBF8A' },
          { id: 'purple', name: 'Ungu', color: '#A67BD4' },
          { id: 'red', name: 'Merah', color: '#D46B7B' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => updateSetting('accentColor', c.id)}
            className={settings.accentColor === c.id ? 'btn btn--gold' : 'btn'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: 'flex-start',
              flex: '1 1 100px',
              padding: '10px 14px',
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: c.color,
                flexShrink: 0,
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            />
            {c.name}
          </button>
        ))}
      </div>

      {sectionHeading(Type, 'Ukuran Font (Halaman Baca)')}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <OptionButton active={settings.fontSize === 'small'} onClick={() => updateSetting('fontSize', 'small')}>
          Kecil
        </OptionButton>
        <OptionButton active={settings.fontSize === 'medium'} onClick={() => updateSetting('fontSize', 'medium')}>
          Sedang
        </OptionButton>
        <OptionButton active={settings.fontSize === 'large'} onClick={() => updateSetting('fontSize', 'large')}>
          Besar
        </OptionButton>
      </div>

      {sectionHeading(Type, 'Jenis Font (Halaman Baca)')}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <OptionButton active={settings.fontFamily === 'default'} onClick={() => updateSetting('fontFamily', 'default')}>
          Default
        </OptionButton>
        <OptionButton active={settings.fontFamily === 'serif'} onClick={() => updateSetting('fontFamily', 'serif')}>
          Serif
        </OptionButton>
        <OptionButton active={settings.fontFamily === 'sans'} onClick={() => updateSetting('fontFamily', 'sans')}>
          Sans
        </OptionButton>
      </div>

      {sectionHeading(AlignLeft, 'Lebar Konten Baca')}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <OptionButton active={settings.contentWidth === 'normal'} onClick={() => updateSetting('contentWidth', 'normal')}>
          Normal
        </OptionButton>
        <OptionButton active={settings.contentWidth === 'wide'} onClick={() => updateSetting('contentWidth', 'wide')}>
          Lebar
        </OptionButton>
      </div>

      {user && (
        <>
          {sectionHeading(Bell, 'Preferensi Notifikasi')}
          {notifMessage && (
            <p style={{ color: 'var(--accent)', fontSize: '0.85rem', marginBottom: 12 }}>{notifMessage}</p>
          )}

          <div style={notifRowStyle}>
            <div>
              <div style={{ fontSize: '0.9rem', marginBottom: 2 }}>Balasan komentar</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Notif kalau ada yang balas komentarmu
              </div>
            </div>
            <Toggle
              checked={notifReplies}
              onChange={(val) => {
                setNotifReplies(val)
                saveNotifPref('notif_replies', val)
              }}
              disabled={savingNotif}
            />
          </div>

          <div style={notifRowStyle}>
            <div>
              <div style={{ fontSize: '0.9rem', marginBottom: 2 }}>Chapter baru novel favorit</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Notif kalau novel yang kamu favoritkan ada chapter baru
              </div>
            </div>
            <Toggle
              checked={notifNewChapters}
              onChange={(val) => {
                setNotifNewChapters(val)
                saveNotifPref('notif_new_chapters', val)
              }}
              disabled={savingNotif}
            />
          </div>

          <div style={{ ...notifRowStyle, borderBottom: 'none' }}>
            <div>
              <div style={{ fontSize: '0.9rem', marginBottom: 2 }}>Semua komentar di chapter</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Notif setiap ada komentar baru di chapter (bisa spam)
              </div>
            </div>
            <Toggle
              checked={notifAllComments}
              onChange={(val) => {
                setNotifAllComments(val)
                saveNotifPref('notif_all_comments', val)
              }}
              disabled={savingNotif}
            />
          </div>
        </>
      )}

      {user && (
        <>
          {sectionHeading(Trash2, 'Reset Progress Bacaan')}
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
            Hapus semua riwayat bacaan & bookmark kamu. Tindakan ini gak bisa dibatalin.
          </p>
          <button
            onClick={handleResetProgress}
            className="btn"
            disabled={resetting}
            style={{ color: '#D46B5B', borderColor: '#D46B5B', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {resetting ? <Loader size={16} className="spin" /> : <Trash2 size={16} />}
            {resetting ? 'Menghapus...' : 'Hapus Semua Riwayat Bacaan'}
          </button>
          {resetMessage && (
            <p style={{ color: 'var(--accent)', fontSize: '0.85rem', marginTop: 8 }}>{resetMessage}</p>
          )}
        </>
      )}

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <button
          onClick={resetSettings}
          className="btn"
          style={{ color: '#D46B5B', borderColor: '#D46B5B' }}
        >
          <RotateCcw size={16} />
          Reset Tampilan ke Default
        </button>
      </div>
    </div>
  )
                   }
