import { Link } from 'react-router-dom'
import { Feather, ShieldCheck, UserCircle2, LogOut, LogIn } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function Navbar() {
  const { user, isAdmin, signOut, displayName } = useAuth()

  return (
    <header style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        className="container"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '14px 24px',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Feather size={22} color="var(--gold)" strokeWidth={1.75} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600 }}>
            Heaven's Quill
          </span>
        </Link>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {isAdmin && (
              <Link to="/admin" className="btn btn--outline-gold">
                <ShieldCheck size={16} />
                Admin
              </Link>
            )}
            <Link to="/profil" className="btn">
              <UserCircle2 size={16} />
              Profil
            </Link>
            <span
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                maxWidth: 140,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName || user.email}
            </span>
            <button className="btn" onClick={signOut}>
              <LogOut size={16} />
              Keluar
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn--filled">
            <LogIn size={16} />
            Masuk
          </Link>
        )}
      </div>
    </header>
  )
            }
