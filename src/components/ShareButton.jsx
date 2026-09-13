import { useState } from 'react'
import { Share2, Link as LinkIcon, Check, X } from 'lucide-react'

export default function ShareButton({ url, title }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = encodeURIComponent(url)
  const shareTitle = encodeURIComponent(title)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('Gagal copy, coba manual ya')
    }
  }

  const platforms = [
    {
      name: 'WhatsApp',
      emoji: '💬',
      href: `https://wa.me/?text=${shareTitle}%20${shareUrl}`,
    },
    {
      name: 'Telegram',
      emoji: '✈️',
      href: `https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`,
    },
    {
      name: 'Twitter / X',
      emoji: '🐦',
      href: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
    },
    {
      name: 'Facebook',
      emoji: '📘',
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    },
  ]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <Share2 size={16} />
        Bagikan
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              maxWidth: 360,
              width: '100%',
              padding: 20,
              position: 'relative',
            }}
          >
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <h3 style={{ marginBottom: 16, fontSize: '1.1rem' }}>Bagikan</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={handleCopy}
                className="btn"
                style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start' }}
              >
                {copied ? <Check size={16} color="var(--gold)" /> : <LinkIcon size={16} />}
                {copied ? 'Tersalin!' : 'Salin Link'}
              </button>

              {platforms.map((p) => (
                <a
                  key={p.name}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    justifyContent: 'flex-start',
                    textDecoration: 'none',
                  }}
                >
                  <span>{p.emoji}</span>
                  {p.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
      }
