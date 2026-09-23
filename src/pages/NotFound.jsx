import { Link } from 'react-router-dom'
import { Home, Search, BookOpen } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="container"
      style={{
        paddingTop: 60,
        paddingBottom: 80,
        maxWidth: 600,
        textAlign: 'center',
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Glow decoration */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 91, 0.15), transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Icon besar */}
        <div
          style={{
            fontSize: 'clamp(5rem, 15vw, 8rem)',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            lineHeight: 1,
            marginBottom: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--gold))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            animation: 'float404 3s ease-in-out infinite',
          }}
        >
          404
        </div>

        {/* Emoji */}
        <div style={{ fontSize: '2.5rem', marginBottom: 20 }}>🪶</div>

        {/* Judul */}
        <h1
          style={{
            fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
            marginBottom: 12,
          }}
        >
          Halaman Gak Ketemu
        </h1>

        {/* Deskripsi */}
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            marginBottom: 32,
            maxWidth: 420,
            margin: '0 auto 32px',
          }}
        >
          Sepertinya halaman yang kamu cari udah pindah, dihapus, atau gak pernah ada.
          Coba cek URL-nya lagi, atau balik ke beranda.
        </p>

        {/* Tombol aksi */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Link
            to="/"
            className="btn btn--gold"
            style={{
              padding: '12px 24px',
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            <Home size={18} />
            Kembali ke Beranda
          </Link>
          <Link
            to="/?focusSearch=1"
            className="btn"
            style={{
              padding: '12px 24px',
              fontSize: '0.95rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Search size={18} />
            Cari Novel
          </Link>
        </div>

        {/* Rekomendasi */}
        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid var(--border)',
          }}
        >
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Mungkin kamu tertarik sama ini
          </p>
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Link to="/leaderboard" className="btn" style={{ fontSize: '0.85rem' }}>
              🏆 Wall of Fame
            </Link>
            <Link to="/gelar" className="btn" style={{ fontSize: '0.85rem' }}>
              🎖️ Gelar
            </Link>
            <Link to="/tentang" className="btn" style={{ fontSize: '0.85rem' }}>
              ℹ️ Tentang Kami
            </Link>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes float404 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
          }
