import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Heart, MessageCircle, Send, Reply } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fetchAllChapterRows } from '../lib/fetchAllChapterRows'
import { useAuth } from '../lib/AuthContext'

export default function ChapterReader() {
  const { slug, number } = useParams()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [novel, setNovel] = useState(null)
  const [chapter, setChapter] = useState(null)
  const [siblings, setSiblings] = useState([])
  const [loading, setLoading] = useState(true)

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)

  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [postingReply, setPostingReply] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: novelData } = await supabase
        .from('novels')
        .select('id, title, slug')
        .eq('slug', slug)
        .single()

      if (!novelData) {
        setLoading(false)
        return
      }
      setNovel(novelData)

      const { data: chapterData } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', novelData.id)
        .eq('chapter_number', number)
        .single()
      setChapter(chapterData)

      const allChapters = await fetchAllChapterRows(novelData.id, 'chapter_number')
      setSiblings(allChapters ?? [])
      
      if (user && chapterData) {
        await supabase.from('bookmarks').upsert(
          {
            user_id: user.id,
            novel_id: novelData.id,
            last_chapter_read: Number(number),
          },
          { onConflict: 'user_id,novel_id' },
        )
      }

      setLoading(false)
    }
    load()
  }, [slug, number, user])

useEffect(() => {
    if (chapter?.id && novel?.id) {
      supabase
        .rpc('increment_chapter_views', {
          target_chapter_id: chapter.id,
          target_novel_id: novel.id,
        })
        .then(({ error }) => {
          if (!error) {
            setChapter((prev) => (prev ? { ...prev, views: (prev.views ?? 0) + 1 } : prev))
          }
        })
    }
  }, [chapter?.id])

  useEffect(() => {
    async function loadLikes() {
      if (!chapter?.id) return

      const { count } = await supabase
        .from('chapter_likes')
        .select('*', { count: 'exact', head: true })
        .eq('chapter_id', chapter.id)
      setLikeCount(count ?? 0)

      if (user) {
        const { data } = await supabase
          .from('chapter_likes')
          .select('id')
          .eq('chapter_id', chapter.id)
          .eq('user_id', user.id)
          .maybeSingle()
        setLiked(!!data)
      } else {
        setLiked(false)
      }
    }
    loadLikes()
  }, [chapter?.id, user])

  useEffect(() => {
    if (chapter?.id) loadComments()
  }, [chapter?.id])

  async function loadComments() {
    setLoadingComments(true)
    const { data } = await supabase
      .from('chapter_comments')
      .select('id, content, created_at, user_id, parent_id, profiles(display_name)')
      .eq('chapter_id', chapter.id)
      .order('created_at', { ascending: false })
    setComments(data ?? [])
    setLoadingComments(false)
  }

  async function handlePostComment(e) {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    if (!newComment.trim()) return

    setPostingComment(true)
    const { error } = await supabase.from('chapter_comments').insert({
      chapter_id: chapter.id,
      user_id: user.id,
      content: newComment.trim(),
    })
    setPostingComment(false)

    if (!error) {
      setNewComment('')
      loadComments()
    }
  }

  async function handlePostReply(parentId) {
    if (!user) {
      navigate('/login')
      return
    }
    if (!replyText.trim()) return

    setPostingReply(true)
    const { error } = await supabase.from('chapter_comments').insert({
      chapter_id: chapter.id,
      user_id: user.id,
      content: replyText.trim(),
      parent_id: parentId,
    })
    setPostingReply(false)

    if (!error) {
      setReplyText('')
      setReplyingTo(null)
      loadComments()
    }
  }

  async function handleDeleteComment(id) {
    if (!confirm('Hapus komentar ini?')) return
    await supabase.from('chapter_comments').delete().eq('id', id)
    loadComments()
        }
  async function handleToggleLike() {
    if (!user) {
      navigate('/login')
      return
    }
    if (liked) {
      await supabase.from('chapter_likes').delete().eq('chapter_id', chapter.id).eq('user_id', user.id)
      setLiked(false)
      setLikeCount((c) => Math.max(0, c - 1))
    } else {
      await supabase.from('chapter_likes').insert({ chapter_id: chapter.id, user_id: user.id })
      setLiked(true)
      setLikeCount((c) => c + 1)
    }
  }

  if (loading) return <div className="container" style={{ paddingTop: 40 }}>Memuat...</div>
  if (!chapter) return <div className="container" style={{ paddingTop: 40 }}>Chapter tidak ditemukan.</div>

  const nums = siblings.map((s) => Number(s.chapter_number))
  const currentIndex = nums.indexOf(Number(number))
  const currentIndex = nums.indexOf(Number(number))
  const prevNum = currentIndex > 0 ? nums[currentIndex - 1] : null
  const nextNum = currentIndex < nums.length - 1 ? nums[currentIndex + 1] : null

  const topLevelComments = comments.filter((c) => !c.parent_id)
  const repliesFor = (id) =>
    comments
      .filter((c) => c.parent_id === id)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  function renderCommentCard(c, isReply) {
    return (
      <div key={c.id} className="card" style={{ padding: 12, marginLeft: isReply ? 24 : 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{c.profiles?.display_name || 'Pembaca'}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
            {new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{c.content}</p>
        <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
          {(user?.id === c.user_id || isAdmin) && (
            <button
              onClick={() => handleDeleteComment(c.id)}
              style={{ background: 'none', border: 'none', color: '#D46B5B', fontSize: '0.75rem', padding: 0, cursor: 'pointer' }}
            >
              Hapus
            </button>
          )}
          {!isReply && (
            <button
              onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
              style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.75rem', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Reply size={12} />
              Balas
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 700 }}>
      <Link
        to={`/novel/${slug}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.9rem' }}
      >
        <ArrowLeft size={15} />
        {novel.title}
      </Link>

      <h1 style={{ fontSize: '1.6rem', marginTop: 20, marginBottom: 10 }}>
        Chapter {chapter.chapter_number}{chapter.title ? ` — ${chapter.title}` : ''}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 32 }}>
        <Eye size={14} />
        {(chapter.views ?? 0).toLocaleString('id-ID')} views
      </div>

      <div
        className="chapter-content"
        style={{ fontSize: '1.05rem' }}
        dangerouslySetInnerHTML={{ __html: chapter.content }}
      />

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <button
          onClick={handleToggleLike}
          className={liked ? 'btn btn--gold' : 'btn'}
          style={{ borderColor: 'var(--gold)', color: liked ? undefined : 'var(--gold)' }}
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          {liked ? 'Disukai' : 'Suka'} · {likeCount.toLocaleString('id-ID')}
        </button>
      </div>

      <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageCircle size={18} color="var(--gold)" />
          Komentar ({comments.length})
        </h2>

        {user ? (
          <form onSubmit={handlePostComment} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            <textarea
              placeholder="Tulis komentar..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              style={{
                padding: 10,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontFamily: 'inherit',
                width: '100%',
              }}
            />
            <button
              type="submit"
              className="btn btn--filled"
              disabled={postingComment || !newComment.trim()}
              style={{ alignSelf: 'flex-start' }}
            >
              <Send size={16} />
              {postingComment ? 'Mengirim...' : 'Kirim'}
            </button>
          </form>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
            <Link to="/login" style={{ color: 'var(--gold)' }}>Masuk</Link> dulu buat kasih komentar.
          </p>
        )}

        {loadingComments && <p style={{ color: 'var(--text-muted)' }}>Memuat komentar...</p>}
        {!loadingComments && comments.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Belum ada komentar. Jadi yang pertama!</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {topLevelComments.map((c) => (
            <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {renderCommentCard(c, false)}

              {replyingTo === c.id && (
                <div style={{ marginLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea
                    placeholder={`Balas ke ${c.profiles?.display_name || 'Pembaca'}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                    style={{
                      padding: 10,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      fontFamily: 'inherit',
                      width: '100%',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn--filled"
                      onClick={() => handlePostReply(c.id)}
                      disabled={postingReply || !replyText.trim()}
                      style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                    >
                      <Send size={14} />
                      {postingReply ? 'Mengirim...' : 'Kirim Balasan'}
                    </button>
                    <button
                      className="btn"
                      onClick={() => { setReplyingTo(null); setReplyText('') }}
                      style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {repliesFor(c.id).map((r) => renderCommentCard(r, true))}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 32,
          paddingTop: 24,
          borderTop: '1px solid var(--border)',
        }}
      >
        {prevNum ? (
          <Link to={`/novel/${slug}/chapter/${prevNum}`} className="btn">
            <ChevronLeft size={16} />
            Chapter {prevNum}
          </Link>
        ) : <span />}
        {nextNum ? (
          <Link to={`/novel/${slug}/chapter/${nextNum}`} className="btn btn--filled">
            Chapter {nextNum}
            <ChevronRight size={16} />
          </Link>
        ) : <span />}
      </div>
    </div>
  )
            }
