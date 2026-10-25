import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (reg) setInterval(() => reg.update(), 60 * 60 * 1000)
    },
  })

  if (!needRefresh) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'var(--surface, #171a1e)',
        color: 'var(--text, #e6e6e6)',
        border: '1px solid var(--gold, #d4af5b)',
        borderRadius: 'var(--radius, 8px)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        fontSize: '0.85rem',
      }}
    >
      <span>Versi baru tersedia.</span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: 'var(--gold, #d4af5b)',
          color: '#000',
          border: 'none',
          borderRadius: 6,
          padding: '4px 10px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Perbarui
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        aria-label="Tutup"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted, #999)',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
      >
        ✕
      </button>
    </div>
  )
      }
