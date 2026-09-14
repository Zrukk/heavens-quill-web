import { Settings as SettingsIcon, Palette, Type, AlignLeft, RotateCcw, Check } from 'lucide-react'
import { useSettings } from '../lib/SettingsContext'

export default function Settings() {
  const { settings, updateSetting, resetSettings } = useSettings()

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

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <SettingsIcon size={26} color="var(--gold)" strokeWidth={1.75} />
        <h1 className="gradient-text" style={{ fontSize: '1.8rem' }}>Pengaturan</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
        Sesuaikan tampilan Heaven's Quill sesuai preferensi kamu. Pengaturan otomatis tersimpan.
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

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <button
          onClick={resetSettings}
          className="btn"
          style={{ color: '#D46B5B', borderColor: '#D46B5B' }}
        >
          <RotateCcw size={16} />
          Reset ke Default
        </button>
      </div>
    </div>
  )
      }
