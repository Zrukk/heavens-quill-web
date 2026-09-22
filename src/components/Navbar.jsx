import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Feather, ShieldCheck, UserCircle2, LogOut, LogIn, Coffee, Menu, X, Settings, Trophy } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import GlobalSearch from './GlobalSearch'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, isAdmin, signOut, displayName, avatarUrl } = useAuth()
  const navigate = useNavigate()
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

  // Klik logo → balik ke halaman novel terakhir
  function handleLogoClick(e) {
    e.preventDefault()
    const saved = localStorage.getItem('hq-last-page')
    const page = saved && saved !== '1' ? saved : null

    if (page) {
      navigate(`/?page=${page}`)
    } else {
      navigate('/')
    }
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
    <header
      className="navbar-header"
      style={{
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(12, 16, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="container navbar-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 24px',
        }}
      >
        {/* LOGO */}
        <a
          href="/"
          onClick={handleLogoClick}
          className="navbar-logo"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <img
            src="/heavens_quill_icon_dark.png"
            alt="Heaven's Quill"
            style={{
              width: 30,
              height: 30,
              objectFit: 'contain',
              borderRadius: 6,
            }}
          />
          <span
            className="navbar-logo-text"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Heaven's Quill
          </span>
        </a>

        {/* SEARCH — selalu terlihat */}
        <div className="navbar-search" style={{ flex: 1, maxWidth: 480, minWidth: 0 }}>
          <GlobalSearch />
        </div>

        {/* ICONS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {user && isAdmin && (
            <Link
              to="/admin"
              className="btn navbar-icon-btn"
              style={{ padding: '8px 10px', borderColor: 'var(--gold)', color: 'var(--gold)' }}
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
                className="btn navbar-icon-btn"
                style={{ padding: '8px 10px' }}
                title="Menu"
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: 'fixed',
                    top: 64,
                    right: 16,
                    width: 'min(260px, calc(100vw - 32px))',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    overflow: 'hidden',
                    zIndex: 999,
                  }}
                >
                  <div
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'linear-gradient(135deg, rgba(212, 175, 91, 0.08), transparent)',
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <UserCircle2 size={36} color="var(--text-muted)" />
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: '0.9rem',
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

                  <Link to="/leaderboard" style={menuItemStyle} onClick={() => setMenuOpen(false)}>
                    <Trophy size={16} color="var(--gold)" />
                    Wall of Fame
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
            <Link to="/login" className="btn btn--filled" style={{ whiteSpace: 'nowrap' }}>
              <LogIn size={16} />
              Masuk
            </Link>
          )}
        </div>
      </div>

      {/* CSS responsive */}
      <style>{`
        @media (max-width: 700px) {
          .navbar-logo-text {
            display: none;
          }
          .navbar-container {
            gap: 8px !important;
            padding: 10px 16px !important;
          }
        }
        @media (max-width: 400px) {
          .navbar-search {
            display: none !important;
          }
        }
      `}</style>
    </header>
  )
      }
