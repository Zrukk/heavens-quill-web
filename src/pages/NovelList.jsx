import { useEffect, useState } from 'react'
import { Library, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import NovelCard from '../components/NovelCard'

export default function NovelList() {
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [genreFilter, setGenreFilter] = useState('all')

  useDocumentMeta(
    'Heaven\'s Quill — Daftar Novel',
    'Terjemahan novel Tionghoa, Jepang, dan Korea ke Bahasa Indonesia. Baca gratis di Heaven\'s Quill.',
  )

  useEffect(() => {
    async function loadNovels() {
      const { data, error } = await supabase
        .from('novels')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) setError(error.message)
      else setNovels(data)
      setLoading(false)
    }
    loadNovels()
  }, [])

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

  const selectStyle = {
    padding: 10,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontFamily: 'inherit',
    flex: 1,
    minWidth: 130,
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Library size={26} color="var(--gold)" strokeWidth={1.75} />
        <h1 className="gradient-text" style={{ fontSize: '2rem' }}>Daftar Novel</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        Terjemahan novel Tionghoa, Jepang, dan Korea ke Bahasa Indonesia.
      </p>

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
        {filteredNovels.map((novel) => (
          <NovelCard key={novel.id} novel={novel} />
        ))}
      </div>
    </div>
  )
      }
