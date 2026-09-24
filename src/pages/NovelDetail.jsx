import { useEffect, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { BookOpen, PlayCircle, CheckCircle2, Languages, Search, ArrowUpDown, ListOrdered, Eye, Star, ChevronDown, ChevronUp, Heart } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fetchAllChapterRows } from '../lib/fetchAllChapterRows'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import { useAuth } from '../lib/AuthContext'
import FavoriteButton from '../components/FavoriteButton'
import ReviewSection from '../components/ReviewSection'
import SimilarNovels from '../components/SimilarNovels'

const CHAPTERS_PREVIEW = 20

function slugify(name) {
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  // Kalau ada huruf latin, pakai slug biasa
  if (cleaned) return cleaned

  // Kalau gak ada (nama Hanzi/Karakter khusus), pakai hash
  let hash = 0
  const str = name.trim().toLowerCase()
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return `author-${Math.abs(hash).toString(36)}`
}

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
  const [avgRating, setAvgRating] = useState(0)
  const [showAllChapters, setShowAllChapters] = useState(false)

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

      // Fetch reviews (count + avg rating)
      const { data: reviewsData } = await supabase
        .from('novel_reviews')
        .select('rating')
        .eq('novel_id', novelData.id)
        .not('rating', 'is', null)

      setReviewCount(reviewsData?.length ?? 0)
      if (reviewsData && reviewsData.length > 0) {
        const sum = reviewsData.reduce((acc, r) => acc + r.rating, 0)
        setAvgRating(sum / reviewsData.length)
      }

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

  // Batasi tampilan kalau gak search & belum klik "Lihat Semua"
  const visibleChapters = searchQuery.trim()
    ? filteredChapters
    : showAllChapters
    ? filteredChapters
    : filteredChapters.slice(0, CHAPTERS_PREVIEW)

  const hasMoreChapters = !searchQuery.trim() && !showAllChapters && filteredChapters.length > CHAPTERS_PREVIEW

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 900 }}>
      {/* HEADER: Cover + Info */}
      <div
        className="novel-header"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 24,
          marginBottom: 32,
        }}
      >
        {/* Cover */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: 200,
              height: 280,
              background: novel.cover_url ? `url(${novel.cover_url}) center/cover` : 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          />
        </div>

        {/* Info */}
        <div>
          <h1
            className="gradient-text"
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
              marginBottom: 8,
              lineHeight: 1.2,
            }}
          >
            {novel.title}
          </h1>

          {novel.author && (
  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0 0 16px' }}>
    oleh{' '}
    <Link
      to={`/author/${slugify(novel.author)}`}
      style={{
        color: 'var(--gold)',
        fontWeight: 600,
        textDecoration: 'underline',
        textDecorationColor: 'rgba(212, 175, 91, 0.3)',
        textUnderlineOffset: 3,
      }}
    >
      {novel.author}
    </Link>
  </p>
)}

          {/* Rating & Stats */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 16,
              fontSize: '0.85rem',
            }}
          >
            {avgRating > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'var(--gold)',
                  fontWeight: 600,
                }}
              >
                <Star size={16} fill="var(--gold)" />
                {avgRating.toFixed(1)}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({reviewCount})
                </span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
              <Eye size={14} />
              {(novel.total_views ?? 0).toLocaleString('id-ID')} views
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
              <ListOrdered size={14} />
              {chapters.length} chapter
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: isOngoing ? 'var(--gold)' : 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              {isOngoing ? <PlayCircle size={14} /> : <CheckCircle2 size={14} />}
              {isOngoing ? 'Berjalan' : 'Tamat'}
            </div>
            {novel.original_language && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                <Languages size={14} />
                {novel.original_language}
              </div>
            )}
          </div>

          {/* Genre Tags */}
          {novel.genre && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {novel.genre.split(',').map((g) => g.trim()).filter(Boolean).map((g) => (
                <span
                  key={g}
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    padding: '3px 12px',
                  }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Tombol Aksi */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {chapters.length > 0 && resumeChapterNumber !== null && (
              <Link
                to={`/novel/${slug}/chapter/${resumeChapterNumber}`}
                className="btn btn--filled"
                style={{ padding: '12px 24px', fontSize: '0.95rem', fontWeight: 600 }}
              >
                <BookOpen size={18} />
                {bookmark?.last_chapter_read ? `Lanjut Chapter ${resumeChapterNumber}` : 'Mulai Baca'}
              </Link>
            )}
            <FavoriteButton novelId={novel.id} novelTitle={novel.title} />
          </div>
        </div>
      </div>

      {/* SINOPSIS */}
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 24,
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <h3
          style={{
            fontSize: '0.8rem',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 12,
          }}
        >
          Sinopsis
        </h3>
        <p
          style={{
            color: 'var(--text-muted)',
            margin: 0,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7,
            fontSize: '0.95rem',
            ...(novel.synopsis && novel.synopsis.length > 400 && !synopsisExpanded
              ? { display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
              : {}),
          }}
        >
          {novel.synopsis}
        </p>
        {novel.synopsis && novel.synopsis.length > 400 && (
          <button
            onClick={() => setSynopsisExpanded(!synopsisExpanded)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gold)',
              fontSize: '0.85rem',
              padding: 0,
              marginTop: 12,
              cursor: 'pointer',
            }}
          >
            {synopsisExpanded ? 'Sembunyikan' : 'Baca selengkapnya'}
          </button>
        )}
      </div>

      {/* REVIEW SECTION (collapsible) */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={() => setReviewOpen(!reviewOpen)}
          className="card"
          style={{
            width: '100%',
            padding: '16px 20px',
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
            <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>
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

      {/* DAFTAR CHAPTER */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <h2 style={{ fontSize: '1.3rem' }}>Daftar Chapter ({chapters.length})</h2>
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
          {visibleChapters.map((ch) => {
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {isRead && <CheckCircle2 size={14} color="var(--accent)" />}
                <span>
                  Chapter {ch.chapter_number}{ch.title ? ` — ${ch.title}` : ''}
                </span>
              </Link>
            )
          })}
        </div>

        {/* TOMBOL LIHAT SEMUA / SEMBUNYIKAN */}
        {(hasMoreChapters || showAllChapters) && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <button
              onClick={() => setShowAllChapters((v) => !v)}
              className="btn"
              style={{
                padding: '10px 20px',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {showAllChapters ? (
                <>
                  <ChevronUp size={16} />
                  Sembunyikan Chapter
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  Lihat Semua ({filteredChapters.length} Chapter)
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* NOVEL SERUPA */}
      <SimilarNovels novelId={novel.id} novelGenre={novel.genre} />

      {/* CSS responsive */}
      <style>{`
        @media (min-width: 700px) {
          .novel-header {
            grid-template-columns: 220px 1fr !important;
            align-items: start;
          }
        }
      `}</style>
    </div>
  )
}
