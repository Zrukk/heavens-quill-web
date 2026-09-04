import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()

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
          <span className="diamond" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600 }}>
            Heaven's Quill
          </span>
        </Link>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {isAdmin && (
              <Link to="/admin" className="btn" style={{ borderColor: 'var(--accent)' }}>Admin</Link>
            )}
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
              {user.email}
            </span>
            <button className="btn" onClick={signOut}>Keluar</button>
          </div>
        ) : (
          <Link to="/login" className="btn">Masuk</Link>
        )}
      </div>
    </header>
  )
}
