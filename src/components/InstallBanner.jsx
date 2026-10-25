import { useEffect, useState } from 'react'

export default function InstallBanner() {
  const [deferred, setDeferred] = useState(null)
  const [hidden, setHidden] = useState(
    () => localStorage.getItem('hq-install-dismissed') === '1',
  )

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferred(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferred || hidden) return null

  async function install() {
    deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  function dismiss() {
    localStorage.setItem('hq-install-dismissed', '1')
    setHidden(true)
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        left: 16,
        right: 16,
        maxWidth: 380,
        margin: '0 auto',
        zIndex: 90,
        background: 'var(--surface, #171a1e)',
        color: 'var(--text, #e6e6e6)',
        border: '1px solid var(--border, #2a2f36)',
        borderRadius: 'var(--radius, 10px)',
        padding: '12px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <p style={{ margin: '0 0 10px', fontSize: '0.85rem' }}>
        Install <strong>Heaven's Quill</strong> ke layar utama untuk baca offline.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={install}
          style={{
            flex: 1,
            background: 'var(--gold, #d4af5b)',
            color: '#000',
            border: 'none',
            borderRadius: 6,
            padding: '6px 10px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Install
        </button>
        <button
          onClick={dismiss}
          style={{
            background: 'none',
            border: '1px solid var(--border, #2a2f36)',
            color: 'var(--text-muted, #999)',
            borderRadius: 6,
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          Nanti
        </button>
      </div>
    </div>
  )
      }
