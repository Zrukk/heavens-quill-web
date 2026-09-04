import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function Admin() {
  const { user, isAdmin, loading } = useAuth()
  const [novels, setNovels] = useState([])
  const [tab, setTab] = useState('novel')
  const [message, setMessage] = useState(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [language, setLanguage] = useState('')
  const [status, setStatus] = useState('ongoing')

  const [selectedNovel, setSelectedNovel] = useState('')
  const [chapterNumber, setChapterNumber] = useState('')
  const [chapterTitle, setChapterTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    loadNovels()
  }, [])

  async function loadNovels() {
    const { data } = await supabase.from('novels').select('*').order('title')
    setNovels(data ?? [])
  }

  async function handleAddNovel(e) {
    e.preventDefault()
    setMessage(null)
    const { error } = await supabase.from('novels').insert({
      title, slug, synopsis, cover_url: coverUrl || null, original_language: language, status,
    })
    if (error) setMessage(error.message)
    else {
      setMessage('Novel ditambahkan.')
      setTitle(''); setSlug(''); setSynopsis(''); setCoverUrl(''); setLanguage('')
      loadNovels()
    }
  }

  async function handleAddChapter(e) {
    e.preventDefault()
    setMessage(null)
    const { error } = await supabase.from('chapters').insert({
      novel_id: selectedNovel,
      chapter_number: Number(chapterNumber),
      title: chapterTitle || null,
      content,
    })
    if (error) setMessage(error.message)
    else {
      setMessage('Chapter ditambahkan.')
      setChapterNumber(''); setChapterTitle(''); setContent('')
    }
  }

  async function handleDeleteNovel(id) {
    if (!confirm('Hapus novel ini beserta semua chapternya?')) return
    await supabase.from('novels').delete().eq('id', id)
    loadNovels()
  }

  if (loading) return <div className="container" style={{ paddingTop: 40 }}>Memuat...</div>
  if (!user) return <div className="container" style={{ paddingTop: 40 }}>Silakan masuk dulu.</div>
  if (!isAdmin) return <div className="container" style={{ paddingTop: 40 }}>Akun ini bukan admin.</div>

  const inputStyle = {
    padding: 10,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 2,
    fontFamily: 'inherit',
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 600 }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: 24 }}>Admin</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className={tab === 'novel' ? 'btn btn--filled' : 'btn'} onClick={() => setTab('novel')}>Tambah Novel</button>
        <button className={tab === 'chapter' ? 'btn btn--filled' : 'btn'} onClick={() => setTab('chapter')}>Tambah Chapter</button>
      </div>

      {message && <p style={{ color: 'var(--accent)', marginBottom: 16 }}>{message}</p>}

      {tab === 'novel' && (
        <form onSubmit={handleAddNovel} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="text" placeholder="Judul novel" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <input type="text" placeholder="Slug (contoh: sword-of-coming)" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          <textarea placeholder="Sinopsis" value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={4} style={inputStyle} />
          <input type="text" placeholder="URL cover (opsional)" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
          <input type="text" placeholder="Bahasa asli (contoh: Chinese)" value={language} onChange={(e) => setLanguage(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
            <option value="ongoing">Berjalan</option>
            <option value="completed">Tamat</option>
          </select>
          <button type="submit" className="btn btn--filled">Simpan Novel</button>
        </form>
      )}

      {tab === 'chapter' && (
        <form onSubmit={handleAddChapter} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select value={selectedNovel} onChange={(e) => setSelectedNovel(e.target.value)} required style={inputStyle}>
            <option value="">Pilih novel</option>
            {novels.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
          </select>
          <input type="number" placeholder="Nomor chapter" value={chapterNumber} onChange={(e) => setChapterNumber(e.target.value)} required />
          <input type="text" placeholder="Judul chapter (opsional)" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} />
          <textarea placeholder="Isi chapter" value={content} onChange={(e) => setContent(e.target.value)} rows={12} required style={inputStyle} />
          <button type="submit" className="btn btn--filled">Simpan Chapter</button>
        </form>
      )}

      <h2 style={{ fontSize: '1.2rem', marginTop: 40, marginBottom: 16 }}>Novel Terdaftar</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {novels.map((n) => (
          <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2 }}>
            <span>{n.title}</span>
            <button className="btn" onClick={() => handleDeleteNovel(n.id)} style={{ borderColor: '#D46B5B', color: '#D46B5B' }}>Hapus</button>
          </div>
        ))}
      </div>
    </div>
  )
    }
