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
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 72,
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="diamond" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600 }}>
            Heaven's Quill
          </span>
        </Link>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {isAdmin && (
              <Link to="/admin" style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>Admin</Link>
            )}
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user.email}</span>
            <button className="btn" onClick={signOut}>Keluar</button>
          </div>
        ) : (
          <Link to="/login" className="btn">Masuk</Link>
        )}
      </div>
    </header>
  )
}
