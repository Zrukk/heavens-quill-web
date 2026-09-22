import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { supabase } from '../lib/supabase'

// Icon mapping untuk genre umum
const GENRE_ICONS = {
  action: '⚔️',
  adventure: '🗺️',
  comedy: '😂',
  drama: '🎭',
  fantasy: '🐉',
  horror: '👻',
  mystery: '🔍',
  psychological: '🧠',
  romance: '💕',
  'sci-fi': '🚀',
  supernatural: '✨',
  tragedy: '💔',
  xianxia: '🧘',
  wuxia: '⚡',
  cultivation: '🌀',
  isekai: '🌀',
  'slice of life': '🍵',
  harem: '💑',
  mature: '🔞',
  seinen: '📖',
  shounen: '🔥',
  'gender bender': '🔄',
  historical: '🏯',
  military: '🎖️',
}

function getGenreIcon(genre) {
  const lower = genre.toLowerCase()
  return GENRE_ICONS[lower] || '📚'
}

export default function GenreExplore() {
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGenres()
  }, [])

  async function loadGenres() {
    setLoading(true)

    // Fetch semua genre dari novels
    const { data } = await supabase.from('novels').select('genre')

    if (!data || data.length === 0) {
      setLoading(false)
      return
    }

    // Hitung jumlah novel per genre
    const genreCount = {}
    data.forEach((n) => {
      if (!n.genre) return
      const genres = n.genre.split(',').map((g) => g.trim()).filter(Boolean)
      genres.forEach((g) => {
        genreCount[g] = (genreCount[g] || 0) + 1
      })
    })

    // Sort by count desc, ambil top 12
    const sorted = Object.entries(genreCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)

    setGenres(sorted)
    setLoading(false)
  }

  if (loading || genres.length === 0) return null

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Compass size={22} color="var(--gold)" />
        <h2 className="gradient-text" style={{ fontSize: '1.5rem' }}>
          Jelajahi Genre
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 10,
        }}
      >
        {genres.map((g) => (
          <Link
            key={g.name}
            to={`/?genre=${encodeURIComponent(g.name)}#daftar-novel`}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: 14,
              textDecoration: 'none',
              color: 'inherit',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.8rem' }}>{getGenreIcon(g.name)}</div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {g.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {g.count} novel
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
