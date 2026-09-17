import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, Send, Reply, Loader, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function ParagraphComments({
  chapterId,
  paragraphIndex,
  paragraphPreview,
  onClose,
  onCommentAdded,
}) {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)

  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [postingReply, setPostingReply] = useState(false)

  // Cek apakah layar kecil (mobile)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function checkSize() {
      setIsMobile(window.innerWidth < 640)
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  useEffect(() => {
    if (chapterId && paragraphIndex != null) loadComments()
  }, [chapterId, paragraphIndex])

  async function loadComments() {
    setLoading(true)
    const { data: commentsData } = await supabase
      .from('paragraph_comments')
      .select('id, content, created_at, user_id, parent_id')
      .eq('chapter_id', chapterId)
      .eq('paragraph_index', paragraphIndex)
      .order('created_at', { ascending: true })

    if (!commentsData || commentsData.length === 0) {
      setComments([])
      setLoading(false)
      return
    }

    const userIds = [...new Set(commentsData.map((c) => c.user_id))]
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    const profilesMap = {}
    ;(profilesData ?? []).forEach((p) => {
      profilesMap[p.id] = p
    })

    setComments(
      commentsData.map((c) => ({
        ...c,
        profiles: profilesMap[c.user_id] || { display_name: 'Pembaca', avatar_url: null },
      }))
    )
    setLoading(false)
  }

  async function handlePostComment(e) {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    if (!newComment.trim()) return

    setPosting(true)
    const { error } = await supabase.from('paragraph_comments').insert({
      chapter_id: chapterId,
      paragraph_index: paragraphIndex,
      user_id: user.id,
      content: newComment.trim(),
    })
    setPosting(false)

    if (!error) {
      setNewComment('')
      loadComments()
      if (onCommentAdded) onCommentAdded()
    }
  }

  async function handlePostReply(parentId) {
    if (!user) {
      navigate('/login')
      return
    }
    if (!replyText.trim()) return

    setPostingReply(true)
    const { error } = await supabase.from('paragraph_comments').insert({
      chapter_id: chapterId,
      paragraph_index: paragraphIndex,
      user_id: user.id,
      parent_id: parentId,
      content: replyText.trim(),
    })
    setPostingReply(false)

    if (!error) {
      setReplyText('')
      setReplyingTo(null)
      loadComments()
      if (onCommentAdded) onCommentAdded()
    }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus komentar ini?')) return
    await supabase.from('paragraph_comments').delete().eq('id', id).eq('user_id', user.id)
    loadComments()
  }

  const topLevel = comments.filter((c) => !c.parent_id)
  const repliesFor = (parentId) => comments.filter((c) => c.parent_id === parentId)

  function renderComment(c, depth = 0) {
    const indent = Math.min(depth, 3) * 16
    const replies = repliesFor(c.id)
    const isOwner = user && user.id === c.user_id

    return (
      <div key={c.id} style={{ marginLeft: indent, marginTop: 8 }}>
        <div
          style={{
            padding: 10,
            background: 'var(--bg)',
            borderRadius: 'var(--radius)',
            borderLeft: depth > 0 ? '2px solid var(--border)' : undefined,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4,
              gap: 8,
            }}
          >
            <Link
              to={`/pembaca/${c.user_id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: c.profiles?.avatar_url
                    ? `url(${c.profiles.avatar_url}) center/cover`
                    : 'var(--border)',
                }}
              />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                {c.profiles?.display_name || 'Pembaca'}
              </span>
            </Link>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {new Date(c.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{c.content}</p>

          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            {isOwner || isAdmin ? (
              <button
                onClick={() => handleDelete(c.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#D46B5B',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Hapus
              </button>
            ) : null}
            <button
              onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gold)',
                fontSize: '0.7rem',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Reply size={11} />
              Balas
            </button>
          </div>

          {replyingTo === c.id && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea
                placeholder="Tulis balasan..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                style={{
                  padding: 8,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'inherit',
                  fontSize: '0.8rem',
                  width: '100%',
                }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => handlePostReply(c.id)}
                  className="btn btn--filled"
                  disabled={postingReply || !replyText.trim()}
                  style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                >
                  <Send size={11} />
                  {postingReply ? '...' : 'Kirim'}
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyText('')
                  }}
                  style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {replies.map((r) => renderComment(r, depth + 1))}
      </div>
    )
  }

  // Style panel: bottom sheet di mobile, sidebar kanan di desktop
  const panelStyle = isMobile
    ? {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        top: '15%',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
      }
    : {
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: 'min(400px, 100%)',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
      }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 999,
        }}
      />

      {/* Panel */}
      <div style={panelStyle}>
        {/* Handle bar (khusus mobile) */}
        {isMobile && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: 8,
              paddingBottom: 4,
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: 'var(--border)',
              }}
            />
          </div>
        )}

        {/* Header */}
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <MessageCircle size={18} color="var(--gold)" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Komentar Paragraf {paragraphIndex + 1}
              </div>
              {paragraphPreview && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 280,
                  }}
                >
                  "{paragraphPreview}"
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loading && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Memuat...</p>
          )}
          {!loading && comments.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: 20 }}>
              Belum ada komentar di paragraf ini.
              <br />
              Jadi yang pertama!
            </p>
          )}
          {!loading && topLevel.map((c) => renderComment(c, 0))}
        </div>

        {/* Form komentar */}
        {user ? (
          <form
            onSubmit={handlePostComment}
            style={{
              padding: 12,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              background: 'var(--surface)',
            }}
          >
            <textarea
              placeholder="Tulis komentar di paragraf ini..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              style={{
                padding: 10,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                width: '100%',
                resize: 'none',
              }}
            />
            <button
              type="submit"
              className="btn btn--filled"
              disabled={posting || !newComment.trim()}
              style={{ alignSelf: 'flex-end', fontSize: '0.8rem', padding: '6px 14px' }}
            >
              {posting ? <Loader size={14} className="spin" /> : <Send size={14} />}
              {posting ? 'Mengirim...' : 'Kirim'}
            </button>
          </form>
        ) : (
          <div style={{ padding: 12, borderTop: '1px solid var(--border)', textAlign: 'center', background: 'var(--surface)' }}>
            <Link to="/login" style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>
              Masuk dulu buat komentar
            </Link>
          </div>
        )}
      </div>
    </>
  )
    }
