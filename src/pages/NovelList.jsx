import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import NovelCard from '../components/NovelCard'
import NovelPopulerSection from '../components/NovelPopulerSection'
import HeroSection from '../components/HeroSection'
import LatestUpdates from '../components/LatestUpdates'
import TopRated from '../components/TopRated'
import GenreExplore from '../components/GenreExplore'

const NOVELS_PER_PAGE = 10
const STORAGE_KEY = 'hq-last-page'

export default function NovelList() {
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [genreFilter, setGenreFilter] = useState('all')

  const [searchParams, setSearchParams] = useSearchParams()

  const pageFromUrl = parseInt(searchParams.get('page') || '0', 10)
  const pageFromStorage = parseInt(localStorage.getItem(STORAGE_KEY) || '1', 10)
  const currentPage = Math.max(1, pageFromUrl || pageFromStorage)

  useDocumentMeta(
    "Heaven's Quill — Baca Novel Terjemahan Gratis",
    "Terjemahan novel Tionghoa, Jepang, dan Korea ke Bahasa Indonesia. Baca gratis di Heaven's Quill.",
  )

  // Sync genre dari URL ke state
  useEffect(() => {
    const genreFromUrl = searchParams.get('genre')
    if (genreFromUrl && genreFromUrl !== genreFilter) {
      setGenreFilter(genreFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    async function loadNovels() {
      const { data, error } = await supabase.rpc('get_novels_with_rating')

      if (error) setError(error.message)
      else setNovels(data ?? [])
      setLoading(false)
    }
    loadNovels()
  }, [])

  useEffect(() => {
    if (currentPage > 1) {
      localStorage.setItem(STORAGE_KEY, String(currentPage))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [currentPage])

  useEffect(() => {
    setSearchParams({}, { replace: true })
    localStorage.removeItem(STORAGE_KEY)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, languageFilter, genreFilter])

  function goToPage(page) {
    if (page === 1) {
      setSearchParams({}, { replace: false })
      localStorage.removeItem(STORAGE_KEY)
    } else {
      setSearchParams({ page: String(page) }, { replace: false })
      localStorage.setItem(STORAGE_KEY, String(page))
    }
    document.getElementById('daftar-novel')?.scrollIntoView({ behavior: 'smooth' })
  }

  const languages = [...new Set(novels.map((n) => n.original_language).filter(Boolean))]

  const genres = [
    ...new Set(
      novels.flatMap((n) => (n.genre ? n.genre.split(',').map((g) => g.trim()).filter(Boolean) : [])),
    ),
  ].sort()

  const filteredNovels = novels.filter((n) => {
    if (statusFilter !== 'all' && n.status !== statusFilter) return false
    if (languageFilter !== 'all' && n.original_language !== languageFilter) return false
    if (genreFilter !== 'all') {
      const novelGenres = n.genre ? n.genre.split(',').map((g) => g.trim()) : []
      if (!novelGenres.includes(genreFilter)) return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      const matchesTitle = n.title?.toLowerCase().includes(q)
      const matchesAuthor = n.author?.toLowerCase().includes(q)
      if (!matchesTitle && !matchesAuthor) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredNovels.length / NOVELS_PER_PAGE))
  const paginatedNovels = filteredNovels.slice(
    (currentPage - 1) * NOVELS_PER_PAGE,
    currentPage * NOVELS_PER_PAGE,
  )

  const selectStyle = {
    padding: 10,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontFamily: 'inherit',
    flex: 1,
    minWidth: 130,
    fontSize: '0.9rem',
  }

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
      {/* HERO SECTION */}
      <HeroSection />

      {/* NOVEL POPULER */}
      {!loading && !error && novels.length > 0 && (
        <NovelPopulerSection dataNovel={novels} />
      )}

      {/* JELAJAHI GENRE */}
      <GenreExplore />

      {/* UPDATE TERBARU & RATING TERTINGGI - 2 KOLOM */}
<div className="homepage-duo">
  <div>
    <LatestUpdates />
  </div>
  <div>
    <TopRated />
  </div>
</div>

      {/* DAFTAR NOVEL */}
      <div id="daftar-novel" style={{ paddingTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <SlidersHorizontal size={22} color="var(--gold)" strokeWidth={1.75} />
          <h2 className="gradient-text" style={{ fontSize: '1.5rem' }}>
            Semua Novel
          </h2>
        </div>

        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Cari judul atau nama author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">Semua Status</option>
            <option value="ongoing">Berjalan</option>
            <option value="completed">Tamat</option>
          </select>
          <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} style={selectStyle}>
            <option value="all">Semua Bahasa</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} style={selectStyle}>
            <option value="all">Semua Genre</option>
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>}
        {error && <p style={{ color: '#D46B5B' }}>Gagal memuat novel: {error}</p>}
        {!loading && !error && novels.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>Belum ada novel yang ditambahkan.</p>
        )}
        {!loading && !error && novels.length > 0 && filteredNovels.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>Gak ada novel yang cocok sama pencarian/filter ini.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {paginatedNovels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>

        {filteredNovels.length > NOVELS_PER_PAGE && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 32 }}>
            <button
              className="btn"
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{ opacity: currentPage === 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={16} />
              Sebelumnya
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              className="btn"
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}
            >
              Berikutnya
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* CSS untuk layout 2 kolom di desktop */}
      <style>{`
        .homepage-duo {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        @media (min-width: 900px) {
          .homepage-duo {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            align-items: start;
          }
        }
      `}</style>
    </div>
  )
                                       }
