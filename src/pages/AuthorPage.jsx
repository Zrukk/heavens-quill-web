import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import NovelCard from '../components/NovelCard'

// Bikin slug dari nama author
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function AuthorPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [authorName, setAuthorName] = useState('')
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalNovels: 0, totalChapters: 0, totalViews: 0 })

  useDocumentMeta(
    authorName ? `${authorName} - Author | Heaven's Quill` : "Author | Heaven's Quill",
    authorName ? `Daftar novel karya ${authorName} di Heaven's Quill.` : undefined,
  )

  useEffect(() => {
    load()
  }, [slug])

  async function load() {
    setLoading(true)

    // Ambil semua novel yang punya author
    const { data: novelsData } = await supabase
      .from('novels')
      .select('*')
      .not('author', 'is', null)
      .order('created_at', { ascending: false })

    if (!novelsData || novelsData.length === 0) {
      setLoading(false)
      return
    }

    // Filter novel yang author-nya cocok dengan slug di URL
    const matched = novelsData.filter(
      (n) => n.author && slugify(n.author) === slug
    )

    if (matched.length === 0) {
      setLoading(false)
      return
    }

    setAuthorName(matched[0].author)
    setNovels(matched)

    // Hitung total chapters & views
    const novelIds = matched.map((n) => n.id)
    const { count: chapterCount } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .in('novel_id', novelIds)

    const totalViews = matched.reduce((sum, n) => sum + (n.total_views || 0), 0)

    setStats({
      totalNovels: matched.length,
      totalChapters: chapterCount ?? 0,
      totalViews,
    })

    setLoading(false)
  }

  if (loading) {
    return <div className="container" style={{ paddingTop: 40 }}>Memuat...</div>
  }

  if (!authorName) {
    return (
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 700 }}>
        <Link
          to="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}
        >
          <ArrowLeft size={15} />
          Kembali ke Beranda
        </Link>
        <p style={{ color: 'var(--text-muted)' }}>Author gak ketemu.</p>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 60, maxWidth: 900 }}>
      {/* Tombol kembali */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text)',
          marginBottom: 24,
        }}
        title="Kembali"
      >
        <ArrowLeft size={18} />
      </button>

      {/* HEADER AUTHOR */}
      <div
        className="card"
        style={{
          padding: 0,
          marginBottom: 32,
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        {/* Banner gradient */}
        <div
          style={{
            height: 120,
            background: 'linear-gradient(135deg, rgba(91, 168, 212, 0.25), rgba(212, 175, 91, 0.15), transparent)',
          }}
        />

        <div
          style={{
            padding: '0 24px 24px',
            marginTop: -50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--gold))',
              border: '4px solid var(--bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              fontSize: '2.5rem',
              color: '#1a1a1a',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
            }}
          >
            {authorName.charAt(0).toUpperCase()}
          </div>

          <h1
            className="gradient-text"
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              marginBottom: 4,
            }}
          >
            {authorName}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Author di Heaven's Quill
          </p>
        </div>
      </div>

      {/* STATISTIK */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: 12,
          marginBottom: 32,
        }}
      >
        <StatCard icon={<BookOpen size={18} />} value={stats.totalNovels} label="Novel" color="var(--gold)" />
        <StatCard icon={<BookOpen size={18} />} value={stats.totalChapters} label="Chapter" color="var(--accent)" />
        <StatCard icon={<Eye size={18} />} value={stats.totalViews} label="Views" color="#5BBF8A" />
      </div>

      {/* DAFTAR NOVEL */}
      <div>
        <h2
          style={{
            fontSize: '1.2rem',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <BookOpen size={20} color="var(--gold)" />
          Novel karya {authorName} ({novels.length})
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {novels.map((n) => (
            <NovelCard key={n.id} novel={n} />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, color }) {
  return (
    <div
      className="card"
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        textAlign: 'center',
      }}
    >
      <span style={{ color: color || 'var(--gold)', marginBottom: 4 }}>{icon}</span>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: color || 'var(--gold)' }}>
        {value.toLocaleString('id-ID')}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}
