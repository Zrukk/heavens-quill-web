import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: '32px 0 20px',
        marginTop: 40,
        background: 'rgba(0, 0, 0, 0.15)',
      }}
    >
      <div className="container">
        {/* Grid 3 kolom */}
        <div
          className="footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 24,
            marginBottom: 24,
          }}
        >
          {/* Kolom 1: Branding */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <img
                src="/heavens_quill_icon_dark.png"
                alt="Heaven's Quill"
                style={{
                  width: 28,
                  height: 28,
                  objectFit: 'contain',
                  borderRadius: 6,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                }}
              >
                Heaven's Quill
              </span>
            </div>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                margin: 0,
                maxWidth: 280,
              }}
            >
              Baca novel terjemahan Tionghoa, Jepang, dan Korea dalam Bahasa Indonesia. Gratis, tanpa ribet.
            </p>
          </div>

          {/* Kolom 2: Navigasi */}
          <div>
            <h4
              style={{
                fontSize: '0.8rem',
                color: 'var(--gold)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              Navigasi
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Daftar Novel
              </Link>
              <Link to="/leaderboard" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Wall of Fame
              </Link>
              <Link to="/gelar" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Gelar
              </Link>
              <Link to="/pengaturan" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Pengaturan
              </Link>
            </div>
          </div>

          {/* Kolom 3: Legal & Sosial */}
          <div>
            <h4
              style={{
                fontSize: '0.8rem',
                color: 'var(--gold)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              Informasi
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/tentang" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Tentang Kami
              </Link>
              <Link to="/kontak" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Kontak
              </Link>
              <Link to="/peraturan" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Peraturan
              </Link>
              <Link to="/kebijakan-privasi" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Kebijakan Privasi
              </Link>
              <a
                href="https://discord.gg/EA7Tew7rut"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}
              >
                Discord
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 16,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              margin: 0,
            }}
          >
            © {new Date().getFullYear()} Heaven's Quill. Made with ❤️ for readers.
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 700px) {
          .footer-grid {
            grid-template-columns: 2fr 1fr 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </footer>
  )
}
