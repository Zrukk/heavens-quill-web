import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('error')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else {
        navigate('/')
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage(error.message)
        setMessageType('error')
      } else {
        setMessage('Cek email kamu buat konfirmasi akun.')
        setMessageType('success')
      }
    }
    setLoading(false)
  }

  return (
    <div className="login-wrapper">
      {/* PANEL KIRI: BRANDING */}
      <div className="login-branding">
        <div className="login-branding-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <img
              src="/heavens_quill_icon_dark.png"
              alt="Heaven's Quill"
              style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 10 }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.8rem',
                fontWeight: 600,
              }}
            >
              Heaven's Quill
            </span>
          </div>

          <h1
            className="gradient-text"
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
              lineHeight: 1.2,
              marginBottom: 16,
            }}
          >
            Baca Novel Terjemahan Berkualitas
          </h1>

          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '1rem',
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            Gratis, tanpa ribet. Tionghoa, Jepang, dan Korea — semua dalam Bahasa Indonesia.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Feature icon="📚" text="Ribuan chapter dari novel populer" />
            <Feature icon="⚡" text="Update chapter secara berkala" />
            <Feature icon="💬" text="Diskusi & review dengan pembaca lain" />
            <Feature icon="🏆" text="Kumpulkan gelar dan naik level" />
          </div>
        </div>
      </div>

      {/* PANEL KANAN: FORM */}
      <div className="login-form-panel">
        <div className="login-form-content">
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: 8 }}>
              {mode === 'signin' ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              {mode === 'signin'
                ? 'Masuk untuk lanjut baca novel favoritmu.'
                : 'Daftar gratis dan mulai baca sekarang.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                color="var(--text-muted)"
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  paddingLeft: 42,
                  paddingTop: 12,
                  paddingBottom: 12,
                }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                color="var(--text-muted)"
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  paddingLeft: 42,
                  paddingTop: 12,
                  paddingBottom: 12,
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn--filled"
              disabled={loading}
              style={{
                justifyContent: 'center',
                padding: '12px 20px',
                fontSize: '0.95rem',
                fontWeight: 600,
                marginTop: 8,
              }}
            >
              {mode === 'signin' ? <LogIn size={16} /> : <UserPlus size={16} />}
              {loading ? 'Memproses...' : mode === 'signin' ? 'Masuk' : 'Daftar'}
            </button>
          </form>

          {message && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 'var(--radius)',
                fontSize: '0.85rem',
                background: messageType === 'error' ? 'rgba(212, 107, 91, 0.1)' : 'rgba(91, 191, 138, 0.1)',
                border: messageType === 'error' ? '1px solid #D46B5B' : '1px solid #5BBF8A',
                color: messageType === 'error' ? '#D46B5B' : '#5BBF8A',
              }}
            >
              {message}
            </div>
          )}

          <div
            style={{
              marginTop: 24,
              textAlign: 'center',
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
            }}
          >
            {mode === 'signin' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setMessage(null)
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gold)',
                cursor: 'pointer',
                padding: 0,
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              {mode === 'signin' ? 'Daftar' : 'Masuk'}
            </button>
          </div>

          <p
            style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: 24,
              lineHeight: 1.5,
            }}
          >
            Dengan masuk, kamu menyetujui{' '}
            <Link to="/peraturan" style={{ color: 'var(--gold)' }}>
              Peraturan
            </Link>{' '}
            dan{' '}
            <Link to="/kebijakan-privasi" style={{ color: 'var(--gold)' }}>
              Kebijakan Privasi
            </Link>{' '}
            kami.
          </p>
        </div>
      </div>

      {/* CSS */}
      <style>{`
        .login-wrapper {
          display: flex;
          min-height: calc(100vh - 60px);
        }
        .login-branding {
          flex: 1;
          display: none;
          background: linear-gradient(135deg, rgba(212, 175, 91, 0.12), rgba(91, 168, 212, 0.08));
          border-right: 1px solid var(--border);
          position: relative;
          overflow: hidden;
        }
        .login-branding::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212, 175, 91, 0.15), transparent 70%);
          pointer-events: none;
        }
        .login-branding::after {
          content: '';
          position: absolute;
          bottom: -120px;
          left: -120px;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(91, 168, 212, 0.12), transparent 70%);
          pointer-events: none;
        }
        .login-branding-content {
          position: relative;
          z-index: 1;
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 100%;
        }
        .login-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
        }
        .login-form-content {
          width: 100%;
          max-width: 400px;
        }
        @media (min-width: 900px) {
          .login-branding {
            display: flex;
          }
        }
      `}</style>
    </div>
  )
}

function Feature({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: '1.3rem' }}>{icon}</span>
      <span style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{text}</span>
    </div>
  )
        }
