import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Star, Heart, MessageCircle, Reply, Send, Trash2, Pencil, Eye, EyeOff, X, Save, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import MemberBadge from './MemberBadge'
import { useMembershipList } from '../lib/useMembershipList'

export default function ReviewSection({ novelId, onCountChange, hideTitle = false }) {
  const { user, isAdmin } = useAuth()
  const { isMember } = useMembershipList()
  const navigate = useNavigate()

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formRating, setFormRating] = useState(0)
  const [formContent, setFormContent] = useState('')
  const [formSpoiler, setFormSpoiler] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formMessage, setFormMessage] = useState(null)

  const [revealedSpoilers, setRevealedSpoilers] = useState({})
  const [likes, setLikes] = useState({})

  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [postingReply, setPostingReply] = useState(false)

  const [replyingToReply, setReplyingToReply] = useState(null)
  const [nestedReplyText, setNestedReplyText] = useState('')
  const [postingNestedReply, setPostingNestedReply] = useState(false)

  useEffect(() => {
    if (novelId) loadReviews()
  }, [novelId])

  async function loadReviews() {
    setLoading(true)

    // Step 1: fetch review tanpa join
    const { data: reviewsData, error: reviewError } = await supabase
      .from('novel_reviews')
      .select('id, rating, content, has_spoiler, created_at, updated_at, user_id')
      .eq('novel_id', novelId)
      .order('created_at', { ascending: false })

    if (reviewError) {
      console.error('Error load reviews:', reviewError)
      setReviews([])
      setLoading(false)
      return
    }

    // Step 2: fetch profil user terpisah
    const userIds = [...new Set((reviewsData ?? []).map((r) => r.user_id))]
    let profilesMap = {}
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds)
      ;(profilesData ?? []).forEach((p) => {
        profilesMap[p.id] = p
      })
    }

    // Step 3: merge
    const merged = (reviewsData ?? []).map((r) => ({
      ...r,
      profiles: profilesMap[r.user_id] || { display_name: 'Pembaca', avatar_url: null },
    }))

    setReviews(merged)
    if (onCountChange) onCountChange(merged.length)

    // Load likes
    if (merged.length > 0) {
      const reviewIds = merged.map((r) => r.id)
      const { data: allLikes } = await supabase
        .from('review_likes')
        .select('review_id, user_id')
        .in('review_id', reviewIds)

      const likeMap = {}
      reviewIds.forEach((id) => {
        likeMap[id] = { count: 0, liked: false }
      })
      ;(allLikes ?? []).forEach((l) => {
        if (likeMap[l.review_id]) {
          likeMap[l.review_id].count++
          if (user && l.user_id === user.id) likeMap[l.review_id].liked = true
        }
      })
      setLikes(likeMap)
    }

    setLoading(false)
  }

  function startNewReview() {
    if (!user) {
      navigate('/login')
      return
    }
    setEditingId(null)
    setFormRating(0)
    setFormContent('')
    setFormSpoiler(false)
    setFormMessage(null)
    setShowForm(true)
  }

  function startEditReview(review) {
    setEditingId(review.id)
    setFormRating(review.rating || 0)
    setFormContent(review.content)
    setFormSpoiler(review.has_spoiler || false)
    setFormMessage(null)
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setFormRating(0)
    setFormContent('')
    setFormSpoiler(false)
  }

  async function handleSubmitReview(e) {
    e.preventDefault()
    setFormMessage(null)

    if (!formContent.trim() || formContent.trim().length < 20) {
      setFormMessage('Review minimal 20 karakter.')
      return
    }
    if (formRating < 1) {
      setFormMessage('Kasih rating bintang dulu (1-5).')
      return
    }

    setSubmitting(true)

    if (editingId) {
      const { error } = await supabase
        .from('novel_reviews')
        .update({
          rating: formRating,
          content: formContent.trim(),
          has_spoiler: formSpoiler,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId)
        .eq('user_id', user.id)

      setSubmitting(false)
      if (error) {
        setFormMessage('Gagal simpan: ' + error.message)
      } else {
        setShowForm(false)
        setEditingId(null)
        loadReviews()
      }
    } else {
      const { error } = await supabase
        .from('novel_reviews')
        .insert({
          novel_id: novelId,
          user_id: user.id,
          rating: formRating,
          content: formContent.trim(),
          has_spoiler: formSpoiler,
        })

      setSubmitting(false)
      if (error) {
        if (error.code === '23505') {
          setFormMessage('Kamu sudah pernah review novel ini. Edit aja review lamamu.')
        } else {
          setFormMessage('Gagal kirim: ' + error.message)
        }
      } else {
        setShowForm(false)
        setFormRating(0)
        setFormContent('')
        setFormSpoiler(false)
        loadReviews()
      }
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!confirm('Hapus review ini? Tindakan ini gak bisa dibatalin.')) return
    await supabase.from('novel_reviews').delete().eq('id', reviewId).eq('user_id', user.id)
    loadReviews()
  }

  async function handleToggleLike(reviewId) {
    if (!user) {
      navigate('/login')
      return
    }
    const current = likes[reviewId] || { count: 0, liked: false }
    if (current.liked) {
      await supabase.from('review_likes').delete().eq('review_id', reviewId).eq('user_id', user.id)
      setLikes((prev) => ({ ...prev, [reviewId]: { count: Math.max(0, current.count - 1), liked: false } }))
    } else {
      await supabase.from('review_likes').insert({ review_id: reviewId, user_id: user.id })
      setLikes((prev) => ({ ...prev, [reviewId]: { count: current.count + 1, liked: true } }))
    }
  }

  function toggleSpoiler(reviewId) {
    setRevealedSpoilers((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }))
  }

  async function loadRepliesForReview(reviewId) {
    const { data: repliesData, error: repliesError } = await supabase
      .from('review_replies')
      .select('id, content, created_at, user_id, parent_id')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true })

    if (repliesError || !repliesData || repliesData.length === 0) return []

    const userIds = [...new Set(repliesData.map((r) => r.user_id))]
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    const profilesMap = {}
    ;(profilesData ?? []).forEach((p) => {
      profilesMap[p.id] = p
    })

    return repliesData.map((r) => ({
      ...r,
      profiles: profilesMap[r.user_id] || { display_name: 'Pembaca', avatar_url: null },
    }))
  }

  async function handlePostReply(reviewId) {
    if (!user) {
      navigate('/login')
      return
    }
    if (!replyText.trim()) return

    setPostingReply(true)
    const { error } = await supabase.from('review_replies').insert({
      review_id: reviewId,
      user_id: user.id,
      content: replyText.trim(),
    })
    setPostingReply(false)

    if (!error) {
      setReplyText('')
      setReplyingTo(null)
      loadReviews()
    }
  }

  async function handlePostNestedReply(reviewId, parentReplyId) {
    if (!user) {
      navigate('/login')
      return
    }
    if (!nestedReplyText.trim()) return

    setPostingNestedReply(true)
    const { error } = await supabase.from('review_replies').insert({
      review_id: reviewId,
      user_id: user.id,
      parent_id: parentReplyId,
      content: nestedReplyText.trim(),
    })
    setPostingNestedReply(false)

    if (!error) {
      setNestedReplyText('')
      setReplyingToReply(null)
      loadReviews()
    }
  }

  async function handleDeleteReply(replyId) {
    if (!confirm('Hapus balasan ini?')) return
    await supabase.from('review_replies').delete().eq('id', replyId).eq('user_id', user.id)
    loadReviews()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        {hideTitle ? (
          <div />
        ) : (
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={20} color="var(--gold)" />
            Review Pembaca ({reviews.length})
          </h2>
        )}
        {!showForm && (
          <button onClick={startNewReview} className="btn btn--gold" style={{ fontSize: '0.85rem', padding: '8px 14px' }}>
            <Pencil size={14} />
            Tulis Review
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmitReview}
          className="card"
          style={{ padding: 16, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.95rem' }}>
              {editingId ? 'Edit Review' : 'Tulis Review Baru'}
            </strong>
            <button type="button" onClick={cancelForm} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Rating bintang
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFormRating(v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                >
                  <Star
                    size={22}
                    fill={v <= formRating ? 'var(--gold)' : 'none'}
                    color="var(--gold)"
                  />
                </button>
              ))}
            </div>
          </div>

          <textarea
            placeholder="Tulis review kamu... (min 20 karakter)"
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            rows={5}
            style={{
              padding: 10,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontFamily: 'inherit',
              width: '100%',
            }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formSpoiler}
              onChange={(e) => setFormSpoiler(e.target.checked)}
            />
            Review ini mengandung <strong>spoiler</strong> (bakal di-blur)
          </label>

          {formMessage && (
            <p style={{ color: '#D46B5B', fontSize: '0.85rem', margin: 0 }}>{formMessage}</p>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn--filled" disabled={submitting}>
              {submitting ? <Loader size={16} className="spin" /> : <Save size={16} />}
              {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Kirim Review'}
            </button>
            <button type="button" className="btn" onClick={cancelForm}>Batal</button>
          </div>
        </form>
      )}

      {loading && <p style={{ color: 'var(--text-muted)' }}>Memuat review...</p>}
      {!loading && reviews.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Belum ada review. Jadi yang pertama!
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {reviews.map((r) => (
          <ReviewCard
            key={r.id}
            review={r}
            user={user}
            isAdmin={isAdmin}
            likes={likes[r.id] || { count: 0, liked: false }}
            onToggleLike={() => handleToggleLike(r.id)}
            onEdit={() => startEditReview(r)}
            onDelete={() => handleDeleteReview(r.id)}
            revealedSpoilers={revealedSpoilers}
            toggleSpoiler={toggleSpoiler}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            replyText={replyText}
            setReplyText={setReplyText}
            handlePostReply={handlePostReply}
            postingReply={postingReply}
            replyingToReply={replyingToReply}
            setReplyingToReply={setReplyingToReply}
            nestedReplyText={nestedReplyText}
            setNestedReplyText={setNestedReplyText}
            handlePostNestedReply={handlePostNestedReply}
            postingNestedReply={postingNestedReply}
            handleDeleteReply={handleDeleteReply}
            loadRepliesForReview={loadRepliesForReview}
          />
        ))}
      </div>
    </div>
  )
}

function ReviewCard({
  review,
  user,
  isAdmin,
  likes,
  onToggleLike,
  onEdit,
  onDelete,
  revealedSpoilers,
  toggleSpoiler,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  handlePostReply,
  postingReply,
  replyingToReply,
  setReplyingToReply,
  nestedReplyText,
  setNestedReplyText,
  handlePostNestedReply,
  postingNestedReply,
  handleDeleteReply,
  loadRepliesForReview,
}) {
  const { isMember } = useMembershipList()
  const [replies, setReplies] = useState([])
  const [loadingReplies, setLoadingReplies] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoadingReplies(true)
      const data = await loadRepliesForReview(review.id)
      if (active) {
        setReplies(data)
        setLoadingReplies(false)
      }
    }
    load()
    return () => { active = false }
  }, [review.id, review.updated_at])

  const isOwner = user && user.id === review.user_id
  const isSpoilerRevealed = revealedSpoilers[review.id]
  const showSpoilerOverlay = review.has_spoiler && !isSpoilerRevealed

  const topLevelReplies = replies.filter((r) => !r.parent_id)
  const repliesFor = (parentId) => replies.filter((r) => r.parent_id === parentId)

  function renderReply(reply, depth = 0) {
    const indent = Math.min(depth, 5) * 20
    const children = repliesFor(reply.id)
    return (
      <div key={reply.id} id={`review-reply-${reply.id}`} style={{ marginLeft: indent, marginTop: 8 }}>
  <div
    className="card"
    style={{
      padding: 10,
      borderLeft: depth > 0 ? '2px solid var(--border)' : undefined,
    }}
  >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
            <Link to={`/pembaca/${reply.user_id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: reply.profiles?.avatar_url
                    ? `url(${reply.profiles.avatar_url}) center/cover`
                    : 'var(--border)',
                }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {reply.profiles?.display_name || 'Pembaca'}
              </span>
            </Link>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {new Date(reply.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{reply.content}</p>

          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            {(user?.id === reply.user_id || isAdmin) && (
              <button
                onClick={() => handleDeleteReply(reply.id)}
                style={{ background: 'none', border: 'none', color: '#D46B5B', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
              >
                Hapus
              </button>
            )}
            <button
              onClick={() => setReplyingToReply(replyingToReply === reply.id ? null : reply.id)}
              style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.7rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Reply size={11} />
              Balas
            </button>
          </div>

          {replyingToReply === reply.id && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <textarea
                placeholder={`Balas ke ${reply.profiles?.display_name || 'Pembaca'}...`}
                value={nestedReplyText}
                onChange={(e) => setNestedReplyText(e.target.value)}
                rows={2}
                style={{
                  padding: 8,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem',
                  width: '100%',
                }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => handlePostNestedReply(review.id, reply.id)}
                  className="btn btn--filled"
                  disabled={postingNestedReply || !nestedReplyText.trim()}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  <Send size={12} />
                  {postingNestedReply ? '...' : 'Kirim'}
                </button>
                <button
                  className="btn"
                  onClick={() => { setReplyingToReply(null); setNestedReplyText('') }}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
        {children.map((child) => renderReply(child, depth + 1))}
      </div>
    )
  }

  return (
  <div className="card" id={`review-${review.id}`} style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
        <Link to={`/pembaca/${review.user_id}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
  <div
    style={{
      width: 36,
      height: 36,
      borderRadius: '50%',
      flexShrink: 0,
      background: review.profiles?.avatar_url
        ? `url(${review.profiles.avatar_url}) center/cover`
        : 'var(--border)',
      border: isMember(review.user_id) ? '2px solid var(--gold)' : 'none',
    }}
  />
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span
        style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: isMember(review.user_id) ? 'var(--gold)' : 'var(--text)',
        }}
      >
        {review.profiles?.display_name || 'Pembaca'}
      </span>
      {isMember(review.user_id) && <MemberBadge size="small" />}
    </div>
            <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
              {[1, 2, 3, 4, 5].map((v) => (
                <Star
                  key={v}
                  size={12}
                  fill={v <= (review.rating || 0) ? 'var(--gold)' : 'none'}
                  color="var(--gold)"
                />
              ))}
            </div>
          </div>
        </Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {review.has_spoiler && (
            <span style={{ fontSize: '0.7rem', color: '#D46B5B', border: '1px solid #D46B5B', borderRadius: 12, padding: '2px 8px' }}>
              ⚠ Spoiler
            </span>
          )}
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.9rem',
            whiteSpace: 'pre-wrap',
            filter: showSpoilerOverlay ? 'blur(6px)' : 'none',
            userSelect: showSpoilerOverlay ? 'none' : 'auto',
            transition: 'filter 0.2s',
          }}
        >
          {review.content}
        </p>

        {showSpoilerOverlay && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
            onClick={() => toggleSpoiler(review.id)}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={14} />
              Klik buat tampilkan spoiler
            </span>
          </div>
        )}
      </div>

      {isSpoilerRevealed && review.has_spoiler && (
        <button
          onClick={() => toggleSpoiler(review.id)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', padding: 0, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <EyeOff size={11} />
          Sembunyikan lagi
        </button>
      )}

      <div style={{ display: 'flex', gap: 14, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={onToggleLike}
          style={{
            background: 'none',
            border: 'none',
            color: likes.liked ? '#D46B5B' : 'var(--text-muted)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Heart size={14} fill={likes.liked ? 'currentColor' : 'none'} />
          {likes.count > 0 ? likes.count : 'Suka'}
        </button>

        <button
          onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--gold)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <MessageCircle size={14} />
          {replies.length > 0 ? `${replies.length} Balasan` : 'Balas'}
        </button>

        {isOwner && (
          <>
            <button
              onClick={onEdit}
              style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.8rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Pencil size={12} />
              Edit
            </button>
            <button
              onClick={onDelete}
              style={{ background: 'none', border: 'none', color: '#D46B5B', fontSize: '0.8rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Trash2 size={12} />
              Hapus
            </button>
          </>
        )}

        {isAdmin && !isOwner && (
          <button
            onClick={onDelete}
            style={{ background: 'none', border: 'none', color: '#D46B5B', fontSize: '0.8rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Trash2 size={12} />
            Hapus (Admin)
          </button>
        )}
      </div>

      {replyingTo === review.id && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <textarea
            placeholder={`Balas review ${review.profiles?.display_name || 'Pembaca'}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            style={{
              padding: 8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              width: '100%',
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => handlePostReply(review.id)}
              className="btn btn--filled"
              disabled={postingReply || !replyText.trim()}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              <Send size={12} />
              {postingReply ? '...' : 'Kirim'}
            </button>
            <button
              className="btn"
              onClick={() => { setReplyingTo(null); setReplyText('') }}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {topLevelReplies.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          {topLevelReplies.map((r) => renderReply(r, 0))}
        </div>
      )}
    </div>
  )
          }
