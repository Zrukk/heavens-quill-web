import { useEffect, useState } from 'react'
import { Library } from 'lucide-react'
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Library size={26} color="var(--gold)" strokeWidth={1.75} />
        <h1 className="gradient-text" style={{ fontSize: '2rem' }}>Daftar Novel</h1>
      </div>
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
