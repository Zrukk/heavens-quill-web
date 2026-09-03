import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function ChapterReader() {
  const { slug, number } = useParams()
  const { user } = useAuth()
  const [novel, setNovel] = useState(null)
  const [chapter, setChapter] = useState(null)
  const [siblings, setSiblings] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div className="container" style={{ paddingTop: 40 }}>Memuat...</div>
  if (!chapter) return <div className="container" style={{ paddingTop: 40 }}>Chapter tidak ditemukan.</div>

  const nums = siblings.map((s) => s.chapter_number)
  const currentIndex = nums.indexOf(Number(number))
  const prevNum = currentIndex > 0 ? nums[currentIndex - 1] : null
  const nextNum = currentIndex < nums.length - 1 ? nums[currentIndex + 1] : null

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 700 }}>
      <Link to={`/novel/${slug}`} style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        ← {novel.title}
      </Link>

      <h1 style={{ fontSize: '1.6rem', marginTop: 20, marginBottom: 32 }}>
        Chapter {chapter.chapter_number}{chapter.title ? ` — ${chapter.title}` : ''}
      </h1>

      <div style={{ fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
        {chapter.content}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 48,
          paddingTop: 24,
          borderTop: '1px solid var(--border)',
        }}
      >
        {prevNum ? (
          <Link to={`/novel/${slug}/chapter/${prevNum}`} className="btn">← Chapter {prevNum}</Link>
        ) : <span />}
        {nextNum ? (
          <Link to={`/novel/${slug}/chapter/${nextNum}`} className="btn btn--filled">Chapter {nextNum} →</Link>
        ) : <span />}
      </div>
    </div>
  )
                                      }
