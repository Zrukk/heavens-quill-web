import { useEffect, useRef, useState } from 'react'
import { Bell, MessageCircle, Star } from 'lucide-react'
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
        () => {
          loadNotifications()
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
        actor_id, chapter_id, novel_id, comment_id, review_id, review_reply_id,
        chapter:chapters(chapter_number, novel:novels(title, slug))
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!data) {
      setNotifications([])
      setLoading(false)
      return
    }

    // Fetch profil actor terpisah
    const actorIds = [...new Set(data.map((n) => n.actor_id).filter(Boolean))]
    let profilesMap = {}
    if (actorIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', actorIds)
      ;(profilesData ?? []).forEach((p) => {
        profilesMap[p.id] = p
      })
    }

    // Fetch novel info untuk review notif
    const novelIds = [...new Set(data.filter((n) => n.review_id || n.review_reply_id).map((n) => n.novel_id).filter(Boolean))]
    let novelsMap = {}
    if (novelIds.length > 0) {
      const { data: novelsData } = await supabase
        .from('novels')
        .select('id, title, slug')
        .in('id', novelIds)
      ;(novelsData ?? []).forEach((n) => {
        novelsMap[n.id] = n
      })
    }

    const merged = data.map((n) => ({
      ...n,
      actor: profilesMap[n.actor_id] || null,
      novelInfo: novelsMap[n.novel_id] || null,
    }))

    setNotifications(merged)
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
      setTimeout(() => markAllAsRead(), 800)
    }
  }

  function getNotifContent(n) {
    const actorName = n.actor?.display_name || 'Seseorang'

    if (n.type === 'comment_reply') {
      const novelTitle = n.chapter?.novel?.title
      const chapterNumber = n.chapter?.chapter_number
      return {
        icon: <MessageCircle size={16} />,
        color: 'var(--gold)',
        colorText: '#1a1a1a',
        text: (
          <>
            <strong>{actorName}</strong> membalas komentarmu
          </>
        ),
        subtext: novelTitle ? `${novelTitle} · Chapter ${chapterNumber}` : null,
        url: novelTitle && n.chapter?.novel?.slug && chapterNumber
          ? `/novel/${n.chapter.novel.slug}/chapter/${chapterNumber}`
          : '#',
      }
    }

    if (n.type === 'review_reply') {
      const novelTitle = n.novelInfo?.title
      const novelSlug = n.novelInfo?.slug
      return {
        icon: <Star size={16} />,
        color: 'var(--accent)',
        colorText: '#fff',
        text: (
          <>
            <strong>{actorName}</strong> membalas review/balasanmu
          </>
        ),
        subtext: novelTitle ? `di "${novelTitle}"` : null,
        url: novelSlug ? `/novel/${novelSlug}` : '#',
      }
    }

    if (n.type === 'new_chapter') {
      const novelTitle = n.chapter?.novel?.title
      const chapterNumber = n.chapter?.chapter_number
      return {
        icon: <Star size={16} />,
        color: 'var(--accent)',
        colorText: '#fff',
        text: (
          <>
            <strong>{novelTitle || 'Novel'}</strong> — Chapter {chapterNumber} baru!
          </>
        ),
        subtext: null,
        url: novelTitle && n.chapter?.novel?.slug && chapterNumber
          ? `/novel/${n.chapter.novel.slug}/chapter/${chapterNumber}`
          : '#',
      }
    }

    return {
      icon: <Bell size={16} />,
      color: 'var(--border)',
      colorText: 'var(--text)',
      text: n.message || 'Notifikasi',
      subtext: null,
      url: '#',
    }
  }

  if (!user) return null

  return (
    <div ref={wrapperRef} style={{ position: 'relative', zIndex: 200 }}>
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
            position: 'fixed',
            top: 'auto',
            right: 16,
            left: 16,
            marginTop: 8,
            maxWidth: 360,
            marginLeft: 'auto',
            maxHeight: '60vh',
            overflowY: 'auto',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 999,
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
              zIndex: 1,
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
            const c = getNotifContent(n)
            return (
              <Link
                key={n.id}
                to={c.url}
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
                    background: c.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: c.colorText,
                  }}
                >
                  {c.icon}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', marginBottom: 2 }}>
                    {c.text}
                  </div>
                  {c.subtext && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {c.subtext}
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
