import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import NovelCard from '../components/NovelCard'
import NovelPopulerSection from '../components/NovelPopulerSection'
import HeroSection from '../components/HeroSection'
import LatestUpdates from '../components/LatestUpdates'
import TopRated from '../components/TopRated'
import GenreExplore from '../components/GenreExplore'
import MembershipCTA from '../components/MembershipCTA'
import ContinueReading from '../components/ContinueReading'

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
  const pageFromStorage = parseInt(
    localStorage.getItem(STORAGE_KEY) || '1',
    10,
  )
  const currentPage = Math.max(1, pageFromUrl || pageFromStorage)

  useDocumentMeta(
    "Heaven's Quill — Baca Novel Terjemahan Gratis",
    "Terjemahan novel Tionghoa, Jepang, dan Korea ke Bahasa Indonesia. Baca gratis di Heaven's Quill.",
  )

  // Sinkronkan genre dari URL ke state.
  useEffect(() => {
    const genreFromUrl = searchParams.get('genre')

    if (genreFromUrl && genreFromUrl !== genreFilter) {
      setGenreFilter(genreFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Muat daftar novel.
  useEffect(() => {
    let active = true

    async function loadNovels() {
      try {
        const { data, error: fetchError } = await supabase.rpc(
          'get_novels_with_rating',
        )

        if (!active) return

        if (fetchError) {
          setError(fetchError.message)
        } else {
          setNovels(data ?? [])
        }
      } catch (err) {
        if (active) {
          setError(err?.message || 'Terjadi kesalahan saat memuat novel.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadNovels()

    return () => {
      active = false
    }
  }, [])

  // Simpan halaman daftar novel.
  useEffect(() => {
    if (currentPage > 1) {
      localStorage.setItem(STORAGE_KEY, String(currentPage))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [currentPage])

  // Reset halaman saat pencarian atau filter berubah.
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

    document
      .getElementById('daftar-novel')
      ?.scrollIntoView({ behavior: 'smooth' })
  }

  const languages = [
    ...new Set(novels.map((novel) => novel.original_language).filter(Boolean)),
  ]

  const genres = [
    ...new Set(
      novels.flatMap((novel) =>
        novel.genre
          ? novel.genre.split(',').map((genre) => genre.trim()).filter(Boolean)
          : [],
      ),
    ),
  ].sort()

  const filteredNovels = novels.filter((novel) => {
    if (statusFilter !== 'all' && novel.status !== statusFilter) {
      return false
    }

    if (
      languageFilter !== 'all' &&
      novel.original_language !== languageFilter
    ) {
      return false
    }

    if (genreFilter !== 'all') {
      const novelGenres = novel.genre
        ? novel.genre.split(',').map((genre) => genre.trim())
        : []

      if (!novelGenres.includes(genreFilter)) return false
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      const matchesTitle = novel.title?.toLowerCase().includes(query)
      const matchesAuthor = novel.author?.toLowerCase().includes(query)

      if (!matchesTitle && !matchesAuthor) return false
    }

    return true
  })

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNovels.length / NOVELS_PER_PAGE),
  )

  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedNovels = filteredNovels.slice(
    (safeCurrentPage - 1) * NOVELS_PER_PAGE,
    safeCurrentPage * NOVELS_PER_PAGE,
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
    <div
      className="container"
      style={{ paddingTop: 24, paddingBottom: 60 }}
    >
      {/* HERO SECTION */}
      <HeroSection />

      {/* LANJUTKAN MEMBACA */}
      <ContinueReading novels={novels} />

      {/* NOVEL POPULER */}
      {!loading && !error && novels.length > 0 && (
        <NovelPopulerSection dataNovel={novels} />
      )}

      {/* JELAJAHI GENRE */}
      <GenreExplore />

      {/* MEMBERSHIP CTA */}
      <MembershipCTA />

      {/* UPDATE TERBARU DAN RATING TERTINGGI */}
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <SlidersHorizontal
            size={22}
            color="var(--gold)"
            strokeWidth={1.75}
          />

          <h2
            className="gradient-text"
            style={{ fontSize: '1.5rem' }}
          >
            Semua Novel
          </h2>
        </div>

        {/* PENCARIAN */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />

          <input
            type="text"
            placeholder="Cari judul atau nama author..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>

        {/* FILTER */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 32,
            flexWrap: 'wrap',
          }}
        >
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={selectStyle}
          >
            <option value="all">Semua Status</option>
            <option value="ongoing">Berjalan</option>
            <option value="completed">Tamat</option>
          </select>

          <select
            value={languageFilter}
            onChange={(event) => setLanguageFilter(event.target.value)}
            style={selectStyle}
          >
            <option value="all">Semua Bahasa</option>

            {languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>

          <select
            value={genreFilter}
            onChange={(event) => setGenreFilter(event.target.value)}
            style={selectStyle}
          >
            <option value="all">Semua Genre</option>

            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        {/* STATUS */}
        {loading && (
          <p style={{ color: 'var(--text-muted)' }}>
            Memuat...
          </p>
        )}

        {error && (
          <p style={{ color: '#D46B5B' }}>
            Gagal memuat novel: {error}
          </p>
        )}

        {!loading && !error && novels.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>
            Belum ada novel yang ditambahkan.
          </p>
        )}

        {!loading &&
          !error &&
          novels.length > 0 &&
          filteredNovels.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>
              Tidak ada novel yang cocok dengan pencarian atau filter ini.
            </p>
          )}

        {/* KARTU NOVEL */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {paginatedNovels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>

        {/* PAGINASI */}
        {filteredNovels.length > NOVELS_PER_PAGE && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 16,
              marginTop: 32,
              flexWrap: 'wrap',
            }}
          >
            <button
              className="btn"
              onClick={() =>
                goToPage(Math.max(1, safeCurrentPage - 1))
              }
              disabled={safeCurrentPage === 1}
              style={{
                opacity: safeCurrentPage === 1 ? 0.4 : 1,
              }}
            >
              <ChevronLeft size={16} />
              Sebelumnya
            </button>

            <span
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
              }}
            >
              Halaman {safeCurrentPage} dari {totalPages}
            </span>

            <button
              className="btn"
              onClick={() =>
                goToPage(Math.min(totalPages, safeCurrentPage + 1))
              }
              disabled={safeCurrentPage === totalPages}
              style={{
                opacity: safeCurrentPage === totalPages ? 0.4 : 1,
              }}
            >
              Berikutnya
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* RESPONSIVE LAYOUT */}
      <style>{`
        .homepage-duo {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        @media (min-width: 900px) {
          .homepage-duo {
            display: grid;
            grid-template-columns: 1.4fr 1fr;
            gap: 24px;
            align-items: start;
          }
        }
      `}</style>
    </div>
  )
        }
        
