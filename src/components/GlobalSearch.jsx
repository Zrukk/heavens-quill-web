import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef(null)

  // Debounce search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      const q = query.trim()
      const { data } = await supabase
        .from('novels')
        .select('id, title, slug, author, cover_url')
        .or(`title.ilike.%${q}%,author.ilike.%${q}%`)
        .limit(8)
      setResults(data ?? [])
      setOpen(true)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect() {
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 320 }}>
      <div style={{ position: 'relative' }}>
        <Search
          size={15}
          color="var(--text-muted)"
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          placeholder="Cari novel..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          style={{
            paddingLeft: 32,
            paddingRight: query ? 32 : 10,
            paddingTop: 8,
            paddingBottom: 8,
            fontSize: '0.85rem',
            width: '100%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setOpen(false)
            }}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            maxHeight: 400,
            overflowY: 'auto',
            zIndex: 100,
          }}
        >
          {loading && (
            <p style={{ padding: 12, color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Mencari...
            </p>
          )}
          {!loading && results.length === 0 && (
            <p style={{ padding: 12, color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Gak ada novel yang cocok.
            </p>
          )}
          {!loading && results.map((n) => (
            <Link
              key={n.id}
              to={`/novel/${n.slug}`}
              onClick={handleSelect}
              style={{
                display: 'flex',
                gap: 10,
                padding: 10,
                borderBottom: '1px solid var(--border)',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                style={{
                  width: 32,
                  height: 44,
                  flexShrink: 0,
                  background: n.cover_url ? `url(${n.cover_url}) center/cover` : 'var(--border)',
                  borderRadius: 4,
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {n.title}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {n.author || 'Tanpa author'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
        }
