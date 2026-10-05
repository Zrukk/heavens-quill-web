import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { uploadToBlob } from '../../lib/upload'

const EMPTY_FORM = {
  name: '',
  slug: '',
  bio: '',
  avatar_url: '',
  social_links: { website: '', discord: '', instagram: '' }
}

export default function TranslatorManager() {
  const [translators, setTranslators] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('translators')
      .select('*')
      .order('name', { ascending: true })
    if (error) alert('Gagal memuat daftar translator: ' + error.message)
    setTranslators(data || [])
    setLoading(false)
  }

  function slugify(text) {
    return String(text).toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setEditing('new')
  }

  function openEdit(t) {
    setForm({
      name: t.name || '',
      slug: t.slug || '',
      bio: t.bio || '',
      avatar_url: t.avatar_url || '',
      social_links: {
        website: '', discord: '', instagram: '',
        ...(t.social_links || {})
      }
    })
    setEditing(t)
  }

  function cancel() {
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  async function onUploadAvatar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToBlob(file)
      setForm(f => ({ ...f, avatar_url: url }))
    } catch (err) {
      alert('Upload gagal: ' + (err.message || err))
    }
    setUploading(false)
  }

  async function save() {
    if (!form.name.trim()) return alert('Nama translator wajib diisi ya!')
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      bio: form.bio.trim() || null,
      avatar_url: form.avatar_url || null,
      social_links: form.social_links || {}
    }
    let err
    if (editing === 'new') {
      const res = await supabase.from('translators').insert(payload)
      err = res.error
    } else {
      const res = await supabase.from('translators').update(payload).eq('id', editing.id)
      err = res.error
    }
    setSaving(false)
    if (err) return alert('Gagal simpan: ' + err.message)
    cancel()
    load()
  }

  async function remove(t) {
    if (!confirm(`Yakin hapus translator "${t.name}"?`)) return
    const { error } = await supabase.from('translators').delete().eq('id', t.id)
    if (error) return alert('Gagal hapus: ' + error.message)
    load()
  }

  const filtered = translators.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return (t.name || '').toLowerCase().includes(q)
      || (t.slug || '').toLowerCase().includes(q)
  })

  if (editing) {
    return (
      <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
          {editing === 'new' ? '➕ Tambah Translator Baru' : `✏️ Edit: ${editing.name}`}
        </h3>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
            Nama Translator *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: Zrukk"
            style={{
              width: '100%', padding: 10, background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              fontFamily: 'inherit', fontSize: '0.9rem',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
            Slug (URL)
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={e => setForm({ ...form, slug: e.target.value })}
            placeholder="otomatis dari nama"
            style={{
              width: '100%', padding: 10, background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              fontFamily: 'inherit', fontSize: '0.9rem',
            }}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Kosongkan kalau mau otomatis. Contoh: <code>zrukk</code>
          </p>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
            Bio
          </label>
          <textarea
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            rows={4}
            placeholder="Ceritakan sedikit tentang translator ini..."
            style={{
              width: '100%', padding: 10, background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              fontFamily: 'inherit', fontSize: '0.9rem', resize: 'vertical',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
            Avatar
          </label>
          {form.avatar_url && (
            <img
              src={form.avatar_url}
              alt="avatar"
              style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 8, border: '1px solid var(--border)' }}
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={onUploadAvatar}
            disabled={uploading}
            style={{ fontSize: '0.85rem' }}
          />
          {uploading && <p style={{ fontSize: '0.85rem', color: '#5BA8D4', marginTop: 4 }}>⏳ Mengunggah...</p>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
            Social Links (opsional)
          </label>
          <input
            type="text" placeholder="Website"
            value={form.social_links.website || ''}
            onChange={e => setForm({ ...form, social_links: { ...form.social_links, website: e.target.value } })}
            style={{
              width: '100%', padding: 10, background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              fontFamily: 'inherit', fontSize: '0.9rem', marginBottom: 8,
            }}
          />
          <input
            type="text" placeholder="Discord"
            value={form.social_links.discord || ''}
            onChange={e => setForm({ ...form, social_links: { ...form.social_links, discord: e.target.value } })}
            style={{
              width: '100%', padding: 10, background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              fontFamily: 'inherit', fontSize: '0.9rem', marginBottom: 8,
            }}
          />
          <input
            type="text" placeholder="Instagram"
            value={form.social_links.instagram || ''}
            onChange={e => setForm({ ...form, social_links: { ...form.social_links, instagram: e.target.value } })}
            style={{
              width: '100%', padding: 10, background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              fontFamily: 'inherit', fontSize: '0.9rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
          <button
            onClick={save}
            disabled={saving}
            className="btn btn--gold"
            style={{ opacity: saving ? 0.5 : 1 }}
          >
            {saving ? 'Menyimpan...' : '💾 Simpan'}
          </button>
          <button onClick={cancel} className="btn">
            Batal
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
          👥 Daftar Translator ({translators.length})
        </h3>
        <button onClick={openNew} className="btn btn--gold">
          ➕ Tambah Translator
        </button>
      </div>

      <input
        type="text"
        placeholder="🔍 Cari translator..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: 10, background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          fontFamily: 'inherit', fontSize: '0.9rem',
        }}
      />

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
          ⏳ Memuat...
        </p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>
          Belum ada translator. Klik tombol "Tambah Translator" di atas.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(t => (
            <div
              key={t.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: 12, background: 'var(--bg)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              }}
            >
              {t.avatar_url ? (
                <img
                  src={t.avatar_url}
                  alt={t.name}
                  style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.2rem' }}>
                  👤
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  /{t.slug}
                </p>
              </div>
              <button
                onClick={() => openEdit(t)}
                className="btn btn--gold"
                style={{ fontSize: '0.8rem', padding: '6px 10px' }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => remove(t)}
                className="btn"
                style={{ fontSize: '0.8rem', padding: '6px 10px', borderColor: '#D46B5B', color: '#D46B5B' }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
                                         }
