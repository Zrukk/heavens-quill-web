import { useEffect, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { BookOpen, PlayCircle, CheckCircle2, Languages, Search, ArrowUpDown, ListOrdered, Eye, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fetchAllChapterRows } from '../lib/fetchAllChapterRows'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import { useAuth } from '../lib/AuthContext'
import FavoriteButton from '../components/FavoriteButton'
import ReviewSection from '../components/ReviewSection'
import AdsterraAd from '../components/AdsterraAd'

async function fetchAllReadIds(novelId, userId) {
  const pageSize = 1000
  let allRows = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('chapter_reads')
      .select('chapter_id')
      .eq('novel_id', novelId)
      .eq('user_id', userId)
      .range(from, from + pageSize - 1)
    if (error || !data) break
    allRows = allRows.concat(data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return allRows
}

export default function NovelDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const location = useLocation()
  const [novel, setNovel] = useState(null)
  const [chapters, setChapters] = useState([])
  const [bookmark, setBookmark] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')
  const [synopsisExpanded, setSynopsisExpanded] = useState(false)
  const [readChapterIds, setReadChapterIds] = useState(new Set())
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewCount, setReviewCount] = useState(0)

  useEffect(() => {
    if (!location.hash.startsWith('#review-')) return

    setReviewOpen(true)

    const timer = setTimeout(() => {
      const id = location.hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.style.transition = 'background-color 0.3s'
        el.style.backgroundColor = 'rgba(212, 175, 91, 0.2)'
        setTimeout(() => {
          el.style.backgroundColor = ''
        }, 2000)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [location.hash])

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

      const chapterData = await fetchAllChapterRows(novelData.id, 'id, chapter_number, title')
      setChapters(chapterData ?? [])

      const { count } = await supabase
        .from('novel_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('novel_id', novelData.id)
      setReviewCount(count ?? 0)

      if (user) {
        const { data: bookmarkData } = await supabase
          .from('bookmarks')
          .select('last_chapter_read')
          .eq('novel_id', novelData.id)
          .eq('user_id', user.id)
          .maybeSingle()
        setBookmark(bookmarkData)

        const readsData = await fetchAllReadIds(novelData.id, user.id)
        setReadChapterIds(new Set(readsData.map((r) => r.chapter_id)))
      }

      setLoading(false)
    }
    load()
  }, [slug, user])

  useDocumentMeta(
    novel ? `${novel.title} - Heaven's Quill` : undefined,
    novel ? (novel.synopsis ? novel.synopsis.slice(0, 160) : `Baca ${novel.title} terjemahan Indonesia di Heaven's Quill.`) : undefined,
  )

  if (loading) return <div className="container" style={{ paddingTop: 40 }}>Memuat...</div>
  if (!novel) return <div className="container" style={{ paddingTop: 40 }}>Novel tidak ditemukan.</div>

  const isOngoing = novel.status === 'ongoing'

  const chapterNumbers = chapters.map((c) => Number(c.chapter_number))
  let resumeChapterNumber = chapterNumbers[0] ?? null
  if (bookmark?.last_chapter_read != null) {
    const idx = chapterNumbers.findIndex((n) => n === Number(bookmark.last_chapter_read))
    if (idx >= 0) {
      resumeChapterNumber = idx < chapterNumbers.length - 1 ? chapterNumbers[idx + 1] : chapterNumbers[idx]
    }
  }

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
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
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
          <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>{novel.title}</h1>
          {novel.author && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 10px' }}>
              oleh {novel.author}
            </p>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: isOngoing ? 'var(--gold)' : 'var(--text-muted)',
              fontSize: '0.9rem',
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
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
              <Eye size={14} />
              {(novel.total_views ?? 0).toLocaleString('id-ID')} views
            </span>
          </div>
          {novel.genre && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {novel.genre.split(',').map((g) => g.trim()).filter(Boolean).map((g) => (
                <span
                  key={g}
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    padding: '2px 10px',
                  }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <p
          style={{
            color: 'var(--text-muted)',
            margin: '0 0 6px',
            whiteSpace: 'pre-wrap',
            ...(novel.synopsis && novel.synopsis.length > 220 && !synopsisExpanded
              ? { display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
              : {}),
          }}
        >
          {novel.synopsis}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
          {novel.synopsis && novel.synopsis.length > 220 && (
            <button
              onClick={() => setSynopsisExpanded(!synopsisExpanded)}
              style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '0.85rem', padding: 0, cursor: 'pointer' }}
            >
              {synopsisExpanded ? 'Sembunyikan' : 'Baca selengkapnya'}
            </button>
          )}

          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
            {chapters.length > 0 && resumeChapterNumber !== null && (
              <Link
                to={`/novel/${slug}/chapter/${resumeChapterNumber}`}
                className="btn btn--filled"
              >
                <BookOpen size={16} />
                {bookmark?.last_chapter_read ? `Lanjut ke Chapter ${resumeChapterNumber}` : 'Mulai Baca'}
              </Link>
            )}
            <FavoriteButton novelId={novel.id} novelTitle={novel.title} />
          </div>
        </div>
      </div>

      {/* REVIEW SECTION (collapsible) */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={() => setReviewOpen(!reviewOpen)}
          className="card"
          style={{
            width: '100%',
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Star size={20} color="var(--gold)" />
            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              Review Pembaca ({reviewCount})
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem' }}>{reviewOpen ? 'Tutup' : 'Buka'}</span>
            {reviewOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {reviewOpen && (
          <div style={{ marginTop: 16 }}>
            <ReviewSection novelId={novel.id} onCountChange={setReviewCount} hideTitle />
          </div>
        )}
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
        {filteredChapters.map((ch) => {
          const isRead = readChapterIds.has(ch.id)
          return (
            <Link
              key={ch.id}
              to={`/novel/${slug}/chapter/${ch.chapter_number}`}
              className="card"
              style={{
                padding: '12px 16px',
                fontSize: '0.95rem',
                color: isRead ? 'var(--accent)' : 'var(--text-muted)',
                borderColor: isRead ? 'var(--accent)' : 'var(--border)',
              }}
            >
              Chapter {ch.chapter_number}{ch.title ? ` — ${ch.title}` : ''}
            </Link>
          )
        })}
      </div>

      {/* Banner 300x250 (native ganti ke banner statis) */}
<AdsterraAd type="banner" adKey="aa5ff47e024bb3150e2aff6aa97f2813" width={300} height={250} />

{/* Banner 728x90 (desktop) */}
<AdsterraAd type="banner" adKey="6d2dd4202a3e1bbbe07c44d9f64f390a" width={728} height={90} />
    </div>
  )
}
