import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Heart } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function ChapterReader() {
  const { slug, number } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [novel, setNovel] = useState(null)
  const [chapter, setChapter] = useState(null)
  const [siblings, setSiblings] = useState([])
  const [loading, setLoading] = useState(true)

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

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

      const { data: allChapters } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('novel_id', novelData.id)
        .order('chapter_number', { ascending: true })
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

  // Hitung views sekali tiap chapter beda dimuat (gak ke-trigger ulang pas status login berubah)
  useEffect(() => {
    if (chapter?.id && novel?.id) {
      supabase.rpc('increment_chapter_views', {
        target_chapter_id: chapter.id,
        target_novel_id: novel.id,
      })
    }
  }, [chapter?.id])

  // Ambil jumlah like + status like user saat ini
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

  const nums = siblings.map((s) => s.chapter_number)
  const currentIndex = nums.indexOf(Number(number))
  const prevNum = currentIndex > 0 ? nums[currentIndex - 1] : null
  const nextNum = currentIndex < nums.length - 1 ? nums[currentIndex + 1] : null

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
