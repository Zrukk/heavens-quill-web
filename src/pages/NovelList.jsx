import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import NovelCard from '../components/NovelCard'

export default function NovelList() {
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Daftar Novel</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
        Terjemahan novel Tionghoa, Jepang, dan Korea ke Bahasa Indonesia.
      </p>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>}
      {error && <p style={{ color: '#D46B5B' }}>Gagal memuat novel: {error}</p>}
      {!loading && !error && novels.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>Belum ada novel yang ditambahkan.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {novels.map((novel) => (
          <NovelCard key={novel.id} novel={novel} />
        ))}
      </div>
    </div>
  )
}
