import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BookOpen, PlayCircle, CheckCircle2, Languages, Search, ArrowUpDown, ListOrdered } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function NovelDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const [novel, setNovel] = useState(null)
  const [chapters, setChapters] = useState([])
  const [bookmark, setBookmark] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')

  useEffect(() => {
    async function load() {
      const { data: novelData } = await supabase
        .from('novels')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!novelData) {
        setLoading(false)
        return
      }
      setNovel(novelData)

      const { data: chapterData } = await supabase
        .from('chapters')
        .select('id, chapter_number, title')
        .eq('novel_id', novelData.id)
        .order('chapter_number', { ascending: true })
      setChapters(chapterData ?? [])

      if (user) {
        const { data: bookmarkData } = await supabase
          .from('bookmarks')
          .select('last_chapter_read')
          .eq('novel_id', novelData.id)
          .eq('user_id', user.id)
          .maybeSingle()
        setBookmark(bookmarkData)
      }

      setLoading(false)
    }
    load()
  }, [slug, user])

  if (loading) return <div className="container" style={{ paddingTop: 40 }}>Memuat...</div>
  if (!novel) return <div className="container" style={{ paddingTop: 40 }}>Novel tidak ditemukan.</div>

  const isOngoing = novel.status === 'ongoing'
  const nextChapter = bookmark?.last_chapter_read ? bookmark.last_chapter_read + 1 : 1

  const filteredChapters = chapters
    .filter((ch) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.trim().toLowerCase()
      return (
        String(ch.chapter_number).includes(q) ||
        (ch.title && ch.title.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => (sortOrder === 'asc' ? a.chapter_number - b.chapter_number : b.chapter_number - a.chapter_number))

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
        <div
          style={{
            width: 140,
            height: 190,
            flexShrink: 0,
            background: novel.cover_url ? `url(${novel.cover_url}) center/cover` : 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}
        />
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: 10 }}>{novel.title}</h1>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: isOngoing ? 'var(--gold)' : 'var(--text-muted)',
              fontSize: '0.9rem',
              marginBottom: 14,
              flexWrap: 'wrap',
            }}
          >
            {isOngoing ? <PlayCircle size={15} /> : <CheckCircle2 size={15} />}
            <span>{isOngoing ? 'Berjalan' : 'Tamat'}</span>
            {novel.original_language && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                <Languages size={14} />
                {novel.original_language}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
              <ListOrdered size={14} />
              {chapters.length} chapter
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', maxWidth: 600 }}>{novel.synopsis}</p>

          {chapters.length > 0 && (
            <Link
              to={`/novel/${slug}/chapter/${Math.min(nextChapter, chapters[chapters.length - 1].chapter_number)}`}
              className="btn btn--filled"
              style={{ marginTop: 16 }}
            >
              <BookOpen size={16} />
              {bookmark?.last_chapter_read ? `Lanjut ke Chapter ${nextChapter}` : 'Mulai Baca'}
            </Link>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.3rem' }}>Daftar Chapter</h2>
        <button
          className="btn"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          style={{ fontSize: '0.85rem', padding: '6px 12px' }}
        >
          <ArrowUpDown size={14} />
          {sortOrder === 'asc' ? 'Terlama dulu' : 'Terbaru dulu'}
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Cari nomor atau judul chapter..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: 38 }}
        />
      </div>

      {filteredChapters.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gak ada chapter yang cocok.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filteredChapters.map((ch) => (
          <Link
            key={ch.id}
            to={`/novel/${slug}/chapter/${ch.chapter_number}`}
            className="card"
            style={{
              padding: '12px 16px',
              fontSize: '0.95rem',
            }}
          >
            Chapter {ch.chapter_number}{ch.title ? ` — ${ch.title}` : ''}
          </Link>
        ))}
      </div>
    </div>
  )
                          }
