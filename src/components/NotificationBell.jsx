import { useEffect, useRef, useState } from 'react'
import { Bell, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const wrapperRef = useRef(null)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  useEffect(() => {
    if (!user) return
    loadNotifications()

    // Subscribe realtime biar notif muncul tanpa refresh
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  async function loadNotifications() {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select(`
        id, type, is_read, created_at, message,
        actor:profiles!notifications_actor_id_fkey(display_name, avatar_url),
        chapter:chapters(chapter_number, novel:novels(title, slug))
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data ?? [])
    setLoading(false)
  }

  async function markAllAsRead() {
    if (unreadCount === 0) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleToggle() {
    setOpen((v) => !v)
    if (!open) {
      // Delay sedikit biar user lihat badge hilang
      setTimeout(() => markAllAsRead(), 800)
    }
  }

  if (!user) return null

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        className="btn"
        style={{ position: 'relative', padding: '8px 10px' }}
        title="Notifikasi"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#D46B5B',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 700,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 320,
            maxHeight: 400,
            overflowY: 'auto',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--border)',
              fontWeight: 600,
              fontSize: '0.9rem',
              position: 'sticky',
              top: 0,
              background: 'var(--surface)',
            }}
          >
            Notifikasi
          </div>

          {loading && (
            <p style={{ padding: 14, color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Memuat...
            </p>
          )}

          {!loading && notifications.length === 0 && (
            <p style={{ padding: 14, color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Belum ada notifikasi.
            </p>
          )}

          {!loading && notifications.map((n) => {
            const actorName = n.actor?.display_name || 'Seseorang'
            const novelTitle = n.chapter?.novel?.title
            const novelSlug = n.chapter?.novel?.slug
            const chapterNumber = n.chapter?.chapter_number
            const url = novelSlug && chapterNumber
              ? `/novel/${novelSlug}/chapter/${chapterNumber}`
              : '#'

            return (
              <Link
                key={n.id}
                to={url}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'inherit',
                  background: n.is_read ? 'transparent' : 'rgba(212, 175, 91, 0.06)',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    borderRadius: '50%',
                    background: 'var(--gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1a1a1a',
                  }}
                >
                  <MessageCircle size={16} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', marginBottom: 2 }}>
                    <strong>{actorName}</strong> membalas komentarmu
                  </div>
                  {novelTitle && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {novelTitle} · Chapter {chapterNumber}
                    </div>
                  )}
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(n.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
