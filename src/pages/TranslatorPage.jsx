import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Eye, Pencil, Save, X, Camera, Loader, Globe } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import { useAuth } from '../lib/AuthContext'
import NovelCard from '../components/NovelCard'
import { uploadToBlob } from '../lib/upload'

function slugify(name) {
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (cleaned) return cleaned

  let hash = 0
  const str = name.trim().toLowerCase()
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return `translator-${Math.abs(hash).toString(36)}`
}

export default function TranslatorPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [translator, setTranslator] = useState(null)
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalNovels: 0, totalChapters: 0, totalViews: 0 })

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editSocial, setEditSocial] = useState('')
  const [editAvatarFile, setEditAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useDocumentMeta(
    translator ? `${translator.name} - Penerjemah | Heaven's Quill` : "Penerjemah | Heaven's Quill",
    translator ? (translator.bio ? translator.bio.slice(0, 160) : `Daftar novel terjemahan oleh ${translator.name}.`) : undefined,
  )

  useEffect(() => {
    load()
  }, [slug])

  async function load() {
    setLoading(true)

    // Fetch translator
    let { data: translatorData } = await supabase
      .from('translators')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    // Kalau gak ada, cek di novels — mungkin penerjemahnya ada di kolom translator
    if (!translatorData) {
      const { data: novelsData } = await supabase
        .from('novels')
        .select('translator')
        .not('translator', 'is', null)

      const matchedName = (novelsData ?? [])
        .map((n) => n.translator)
        .find((name) => name && slugify(name) === slug)

      if (matchedName) {
        // Auto-create translator
        const { data: newTranslator } = await supabase
          .from('translators')
          .insert({ name: matchedName, slug })
          .select()
          .single()
        translatorData = newTranslator
      }
    }

    if (!translatorData) {
      setLoading(false)
      return
    }

    setTranslator(translatorData)
    setEditName(translatorData.name || '')
    setEditBio(translatorData.bio || '')
    setEditSocial(translatorData.social_links || '')

    // Fetch novel yang diterjemahin
    const { data: novelsData } = await supabase
      .from('novels')
      .select('*')
      .eq('translator', translatorData.name)
      .order('created_at', { ascending: false })

    const matched = novelsData ?? []
    setNovels(matched)

    // Hitung stats
    if (matched.length > 0) {
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
    }

    setLoading(false)
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      setMessage('Ukuran gambar maksimal 3MB.')
      return
    }

    setEditAvatarFile(file)
  }

  async function handleSave() {
    if (!translator) return
    setSaving(true)
    setMessage(null)

    let avatarUrl = translator.avatar_url

    if (editAvatarFile) {
      try {
        avatarUrl = await uploadToBlob(editAvatarFile)
      } catch (err) {
        setMessage('Gagal upload gambar: ' + err.message)
        setSaving(false)
        return
      }
    }

    const oldName = translator.name
    const newName = editName.trim()

    const { error } = await supabase
      .from('translators')
      .update({
        name: newName,
        bio: editBio.trim() || null,
        social_links: editSocial.trim() || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', translator.id)

    // Kalau nama berubah, update semua novel yang pakai nama lama
    if (!error && oldName !== newName) {
      await supabase
        .from('novels')
        .update({ translator: newName })
        .eq('translator', oldName)
    }

    setSaving(false)

    if (error) {
      setMessage('Gagal simpan: ' + error.message)
    } else {
      setMessage('Translator berhasil diupdate!')
      setEditing(false)
      setEditAvatarFile(null)
      load()
    }
  }

  if (loading) {
    return <div className="container" style={{ paddingTop: 40 }}>Memuat...</div>
  }

  if (!translator) {
    return (
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 700 }}>
        <Link
          to="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}
        >
          <ArrowLeft size={15} />
          Kembali ke Beranda
        </Link>
        <p style={{ color: 'var(--text-muted)' }}>Penerjemah gak ketemu.</p>
      </div>
    )
  }

  const socials = translator.social_links
    ? translator.social_links.split('\n').map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 60, maxWidth: 900 }}>
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

      {/* HEADER TRANSLATOR */}
      <div
        className="card"
        style={{
          padding: 0,
          marginBottom: 32,
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
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
              background: translator.avatar_url
                ? `url(${translator.avatar_url}) center/cover`
                : 'linear-gradient(135deg, var(--accent), var(--gold))',
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
            {!translator.avatar_url && translator.name.charAt(0).toUpperCase()}
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(91, 168, 212, 0.15)',
              color: 'var(--accent)',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            🌐 PENERJEMAH
          </div>

          <h1
            className="gradient-text"
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              marginBottom: 8,
            }}
          >
            {translator.name}
          </h1>

          {/* Bio */}
          {translator.bio && !editing && (
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                maxWidth: 600,
                margin: '0 0 16px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {translator.bio}
            </p>
          )}

          {/* Social Links */}
          {socials.length > 0 && !editing && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.startsWith('http') ? s : `https://${s}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                >
                  <Globe size={13} />
                  {s.length > 30 ? s.slice(0, 30) + '...' : s}
                </a>
              ))}
            </div>
          )}

          {/* Tombol Edit (admin) */}
          {isAdmin && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn"
              style={{ fontSize: '0.85rem', padding: '6px 14px' }}
            >
              <Pencil size={14} />
              Edit Translator
            </button>
          )}
        </div>
      </div>

      {/* FORM EDIT (admin) */}
      {editing && (
        <div
          className="card"
          style={{
            padding: 20,
            marginBottom: 32,
            border: '1px solid var(--gold)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1rem', margin: 0 }}>Edit Translator</h2>
            <button
              onClick={() => {
                setEditing(false)
                setMessage(null)
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Avatar upload */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Foto Translator (maks 3MB)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: editAvatarFile
                    ? `url(${URL.createObjectURL(editAvatarFile)}) center/cover`
                    : translator.avatar_url
                    ? `url(${translator.avatar_url}) center/cover`
                    : 'var(--border)',
                  border: '2px solid var(--border)',
                  flexShrink: 0,
                }}
              />
              <label className="btn" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                <Camera size={14} />
                Pilih Foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Nama */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Nama Penerjemah
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{
                width: '100%',
                padding: 10,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontFamily: 'inherit',
              }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              ⚠️ Kalau nama diubah, semua novel yang pakai nama lama bakal otomatis diupdate.
            </p>
          </div>

          {/* Bio */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Deskripsi / Bio
            </label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={5}
              placeholder="Tulis deskripsi penerjemah di sini..."
              style={{
                width: '100%',
                padding: 10,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Social Links */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Link Sosial (1 per baris)
            </label>
            <textarea
              value={editSocial}
              onChange={(e) => setEditSocial(e.target.value)}
              rows={3}
              placeholder={"Contoh:\nhttps://instagram.com/zrukk\nhttps://discord.gg/xxx"}
              style={{
                width: '100%',
                padding: 10,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          {message && (
            <p style={{ color: message.includes('Gagal') ? '#D46B5B' : '#5BBF8A', fontSize: '0.85rem', margin: 0 }}>
              {message}
            </p>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} className="btn btn--gold" disabled={saving}>
              {saving ? <Loader size={16} className="spin" /> : <Save size={16} />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setMessage(null)
                setEditAvatarFile(null)
              }}
              className="btn"
            >
              Batal
            </button>
          </div>
        </div>
      )}

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
          Novel yang Diterjemahkan ({novels.length})
        </h2>

        {novels.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Belum ada novel yang diterjemahkan.
          </p>
        )}

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
