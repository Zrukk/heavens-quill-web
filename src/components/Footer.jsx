import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: '24px 0',
        marginTop: 40,
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src="/heavens_quill_icon_dark.png"
            alt="Heaven's Quill"
            style={{
              width: 24,
              height: 24,
              objectFit: 'contain',
              borderRadius: 4,
            }}
          />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600 }}>
            Heaven's Quill
          </span>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/tentang" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Tentang Kami
          </Link>
          <Link to="/kontak" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Kontak
          </Link>
          <Link to="/kebijakan-privasi" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Kebijakan Privasi
          </Link>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
          © {new Date().getFullYear()} Heaven's Quill. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
