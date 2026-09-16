import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, UserCircle2, LogOut, LogIn, Coffee, Menu, X, Settings } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import GlobalSearch from './GlobalSearch'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, isAdmin, signOut, displayName, avatarUrl } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
  }

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    width: '100%',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text)',
    fontSize: '0.9rem',
    textDecoration: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  }

  return (
    <header style={{ borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 100 }}>
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
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <img
            src="/heavens_quill_icon_dark.png"
            alt="Heaven's Quill"
            style={{ width: 28, height: 28, objectFit: 'contain' }}
          />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600 }}>
            Heaven's Quill
          </span>
        </Link>

        <GlobalSearch />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user && isAdmin && (
            <Link
              to="/admin"
              className="btn btn--outline-gold"
              style={{ padding: '8px 10px' }}
              title="Admin Panel"
            >
              <ShieldCheck size={18} />
            </Link>
          )}

          {user && <NotificationBell />}

          {user ? (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="btn"
                style={{ padding: '8px 10px' }}
                title="Menu"
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: 'fixed',
                    top: 70,
                    right: 16,
                    width: 'min(240px, calc(100vw - 32px))',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    zIndex: 999,
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <UserCircle2 size={32} color="var(--text-muted)" />
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {displayName || 'Pembaca'}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <a
                    href="https://sociabuzz.com/heavensquill/tribe"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={menuItemStyle}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Coffee size={16} color="var(--gold)" />
                    Dukung
                  </a>

                  {isAdmin && (
                    <Link to="/admin" style={menuItemStyle} onClick={() => setMenuOpen(false)}>
                      <ShieldCheck size={16} color="var(--gold)" />
                      Admin
                    </Link>
                  )}

                  <Link to="/profil" style={menuItemStyle} onClick={() => setMenuOpen(false)}>
                    <UserCircle2 size={16} color="var(--gold)" />
                    Profil
                  </Link>

                  <Link to="/pengaturan" style={menuItemStyle} onClick={() => setMenuOpen(false)}>
                    <Settings size={16} color="var(--gold)" />
                    Pengaturan
                  </Link>

                  <button
                    onClick={handleSignOut}
                    style={{ ...menuItemStyle, borderBottom: 'none', color: '#D46B5B' }}
                  >
                    <LogOut size={16} />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn--filled">
              <LogIn size={16} />
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  )
                }
