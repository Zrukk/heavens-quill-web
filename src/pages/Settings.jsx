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

  const SectionCard = ({ icon, title, subtitle, children }) => (
    <div
      className="card"
      style={{
        padding: 20,
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(212, 175, 91, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 2 }}>{title}</h2>
          {subtitle && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
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
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 640 }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <SettingsIcon size={26} color="var(--gold)" strokeWidth={1.75} />
        <h1 className="gradient-text" style={{ fontSize: '1.8rem' }}>Pengaturan</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.9rem' }}>
        Sesuaikan tampilan & preferensi Heaven's Quill sesuai keinginan kamu.
      </p>

      {/* PREVIEW LANGSUNG */}
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(212, 175, 91, 0.08), rgba(91, 168, 212, 0.04))',
          border: '1px solid var(--gold)',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
          👁️ Preview Langsung
        </div>
        <div
          style={{
            padding: 16,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <h3
            style={{
              fontSize: '1.1rem',
              fontFamily: settings.fontFamily === 'serif' ? 'Georgia, serif' : settings.fontFamily === 'sans' ? '-apple-system, sans-serif' : 'inherit',
              marginBottom: 8,
            }}
          >
            Contoh Judul Novel
          </h3>
          <p
            style={{
              fontSize: settings.fontSize === 'small' ? '0.85rem' : settings.fontSize === 'large' ? '1.15rem' : '0.95rem',
              fontFamily: settings.fontFamily === 'serif' ? 'Georgia, serif' : settings.fontFamily === 'sans' ? '-apple-system, sans-serif' : 'inherit',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              margin: '0 0 12px',
            }}
          >
            Ini contoh tampilan teks di halaman baca. Coba ganti font & ukuran biar pas di mata kamu.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="btn btn--gold" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>Tombol Emas</span>
            <span className="btn" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>Tombol Biasa</span>
          </div>
        </div>
      </div>

      {/* TEMA */}
      <SectionCard
        icon={<Palette size={18} color="var(--gold)" />}
        title="Tema Warna"
        subtitle="Pilih mode gelap atau terang"
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <OptionButton active={settings.theme === 'dark'} onClick={() => updateSetting('theme', 'dark')}>
            🌙 Gelap
          </OptionButton>
          <OptionButton active={settings.theme === 'light'} onClick={() => updateSetting('theme', 'light')}>
            ☀️ Terang
          </OptionButton>
        </div>
      </SectionCard>

      {/* WARNA AKSEN */}
      <SectionCard
        icon={<Palette size={18} color="var(--gold)" />}
        title="Warna Aksen"
        subtitle="Warna utama untuk tombol & highlight"
      >
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
      </SectionCard>

      {/* UKURAN FONT */}
      <SectionCard
        icon={<Type size={18} color="var(--gold)" />}
        title="Ukuran Font"
        subtitle="Khusus halaman baca chapter"
      >
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
      </SectionCard>

      {/* JENIS FONT */}
      <SectionCard
        icon={<Type size={18} color="var(--gold)" />}
        title="Jenis Font"
        subtitle="Gaya tulisan di halaman baca"
      >
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
      </SectionCard>

      {/* LEBAR KONTEN */}
      <SectionCard
        icon={<AlignLeft size={18} color="var(--gold)" />}
        title="Lebar Konten Baca"
        subtitle="Atur seberapa lebar teks di halaman baca"
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <OptionButton active={settings.contentWidth === 'normal'} onClick={() => updateSetting('contentWidth', 'normal')}>
            Normal
          </OptionButton>
          <OptionButton active={settings.contentWidth === 'wide'} onClick={() => updateSetting('contentWidth', 'wide')}>
            Lebar
          </OptionButton>
        </div>
      </SectionCard>

      {/* NOTIFIKASI */}
      {user && (
        <SectionCard
          icon={<Bell size={18} color="var(--gold)" />}
          title="Preferensi Notifikasi"
          subtitle="Atur notif mana yang mau kamu terima"
        >
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

          <div style={{ ...notifRowStyle, borderBottom: 'none', paddingBottom: 0 }}>
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
        </SectionCard>
      )}

      {/* ZONA BAHAYA */}
      {user && (
        <SectionCard
          icon={<Trash2 size={18} color="#D46B5B" />}
          title="Zona Bahaya"
          subtitle="Tindakan di bawah ini gak bisa dibatalin"
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
            Hapus semua riwayat bacaan & bookmark kamu.
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
        </SectionCard>
      )}

      {/* RESET TAMPILAN */}
      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
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
