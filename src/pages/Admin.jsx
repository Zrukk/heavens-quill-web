import { useEffect, useState } from 'react'
import JSZip from 'jszip'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

async function parseEpub(file) {
  const zip = await JSZip.loadAsync(file)
  const parser = new DOMParser()

  const containerXml = await zip.file('META-INF/container.xml').async('text')
  const containerDoc = parser.parseFromString(containerXml, 'application/xml')
  const opfPath = decodeURIComponent(containerDoc.querySelector('rootfile').getAttribute('full-path'))
  const opfDir = opfPath.includes('/') ? opfPath.split('/').slice(0, -1).join('/') : ''

  const opfXml = await zip.file(opfPath).async('text')
  const opfDoc = parser.parseFromString(opfXml, 'application/xml')

  const manifest = {}
  opfDoc.querySelectorAll('manifest item').forEach((item) => {
    manifest[item.getAttribute('id')] = item.getAttribute('href')
  })

  const spineIds = Array.from(opfDoc.querySelectorAll('spine itemref')).map((el) => el.getAttribute('idref'))

  const chapters = []
  for (const id of spineIds) {
    const href = manifest[id]
    if (!href) continue
    const decodedHref = decodeURIComponent(href)
    const fullPath = opfDir ? `${opfDir}/${decodedHref}` : decodedHref
    const fileEntry = zip.file(fullPath)
    if (!fileEntry) continue

    const html = await fileEntry.async('text')
    const htmlDoc = parser.parseFromString(html, 'text/html')

    const titleEl = htmlDoc.querySelector('h1, h2, title')
    const title = titleEl ? titleEl.textContent.trim() : ''

    const paragraphs = Array.from(htmlDoc.querySelectorAll('p'))
      .map((p) => p.textContent.trim())
      .filter(Boolean)
    const content = paragraphs.length > 0 ? paragraphs.join('\n\n') : (htmlDoc.body?.textContent.trim() ?? '')

    if (content) chapters.push({ title, content })
  }

  return chapters
}

function parseBulkText(text) {
  const lines = text.split('\n')
  const pattern = /^(chapter|bab)\s*\d+/i
  const result = []
  let current = null

  for (const line of lines) {
    if (pattern.test(line.trim())) {
      if (current) result.push(current)
      current = { title: line.trim(), content: '' }
    } else if (current) {
      current.content += line + '\n'
    }
  }
  if (current) result.push(current)

  return result.map((c) => ({ ...c, content: c.content.trim() })).filter((c) => c.content)
}

export default function Admin() {
  const { user, isAdmin, loading } = useAuth()
  const [novels, setNovels] = useState([])
  const [tab, setTab] = useState('novel')
  const [message, setMessage] = useState(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [coverFile, setCoverFile] = useState(null)
  const [language, setLanguage] = useState('')
  const [status, setStatus] = useState('ongoing')

  const [selectedNovel, setSelectedNovel] = useState('')
  const [chapterNumber, setChapterNumber] = useState('')
  const [chapterTitle, setChapterTitle] = useState('')
  const [content, setContent] = useState('')

  const [importNovel, setImportNovel] = useState('')
  const [importSource, setImportSource] = useState('epub')
  const [bulkText, setBulkText] = useState('')
  const [parsedChapters, setParsedChapters] = useState([])
  const [importing, setImporting] = useState(false)

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

    if (coverFile && coverFile.size > 5 * 1024 * 1024) {
      setMessage('Ukuran gambar maksimal 5MB.')
      return
    }

    let coverUrl = null
    if (coverFile) {
      const fileExt = coverFile.name.split('.').pop()
      const fileName = `${slug || 'cover'}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('covers').upload(fileName, coverFile)
      if (uploadError) {
        setMessage('Gagal upload gambar: ' + uploadError.message)
        return
      }
      const { data: urlData } = supabase.storage.from('covers').getPublicUrl(fileName)
      coverUrl = urlData.publicUrl
    }

    const { error } = await supabase.from('novels').insert({
      title, slug, synopsis, cover_url: coverUrl, original_language: language, status,
    })
    if (error) setMessage(error.message)
    else {
      setMessage('Novel ditambahkan.')
      setTitle(''); setSlug(''); setSynopsis(''); setCoverFile(null); setLanguage('')
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

  async function handleEpubFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setMessage('Membaca epub...')
    try {
      const chapters = await parseEpub(file)
      applyParsed(chapters)
      setMessage(`${chapters.length} chapter terdeteksi. Cek & sesuaikan nomor di bawah sebelum import.`)
    } catch (err) {
      setMessage('Gagal baca epub: ' + err.message)
    }
  }

  function handleParseBulk() {
    const chapters = parseBulkText(bulkText)
    applyParsed(chapters)
    setMessage(`${chapters.length} chapter terdeteksi. Cek & sesuaikan nomor di bawah sebelum import.`)
  }

  function extractChapterInfo(rawTitle, fallbackNumber) {
    const match = (rawTitle || '').match(/^(chapter|bab)\s*(\d+)\s*[:\-–—.]?\s*(.*)$/i)
    if (match) {
      return { number: Number(match[2]), title: match[3].trim() }
    }
    return { number: fallbackNumber, title: (rawTitle || '').trim() }
  }

  function applyParsed(chapters) {
    setParsedChapters(
      chapters.map((c, i) => {
        const { number, title } = extractChapterInfo(c.title, i + 1)
        return {
          checked: true,
          number,
          title,
          content: c.content,
        }
      }),
    )
  }
  function updateParsed(index, field, value) {
    setParsedChapters((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
  }

  async function handleImport() {
    if (!importNovel) {
      setMessage('Pilih novel tujuan dulu.')
      return
    }
    const toImport = parsedChapters.filter((c) => c.checked)
    if (toImport.length === 0) return

    setImporting(true)

    const rows = toImport.map((c) => ({
      novel_id: importNovel,
      chapter_number: Number(c.number),
      title: c.title || null,
      content: c.content,
    }))

    const { data, error } = await supabase.from('chapters').insert(rows).select()

    setImporting(false)

    if (error) {
      setMessage(`Import gagal: ${error.message}`)
    } else {
      setMessage(`${data.length} chapter berhasil diimport.`)
      setParsedChapters([])
    }
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
    width: '100%',
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 600 }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: 24 }}>Admin</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button className={tab === 'novel' ? 'btn btn--filled' : 'btn'} onClick={() => setTab('novel')}>Tambah Novel</button>
        <button className={tab === 'chapter' ? 'btn btn--filled' : 'btn'} onClick={() => setTab('chapter')}>Tambah Chapter</button>
        <button className={tab === 'import' ? 'btn btn--filled' : 'btn'} onClick={() => setTab('import')}>Import Massal</button>
      </div>

      {message && <p style={{ color: 'var(--accent)', marginBottom: 16, fontSize: '0.9rem' }}>{message}</p>}

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

      {tab === 'import' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <select value={importNovel} onChange={(e) => setImportNovel(e.target.value)} style={inputStyle}>
            <option value="">Pilih novel tujuan</option>
            {novels.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
          </select>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className={importSource === 'epub' ? 'btn btn--filled' : 'btn'} onClick={() => setImportSource('epub')}>Upload EPUB</button>
            <button className={importSource === 'bulk' ? 'btn btn--filled' : 'btn'} onClick={() => setImportSource('bulk')}>Tempel Teks</button>
          </div>

          {importSource === 'epub' && (
            <input type="file" accept=".epub" onChange={handleEpubFile} />
          )}

          {importSource === 'bulk' && (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Tempel beberapa chapter sekaligus. Tiap baris judul chapter harus diawali "Chapter" atau "Bab" diikuti angka, contoh: "Chapter 12" atau "Bab 12 - Pertarungan".
              </p>
              <textarea
                placeholder="Tempel teks di sini..."
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={10}
                style={inputStyle}
              />
              <button className="btn" onClick={handleParseBulk}>Pisahkan Otomatis</button>
            </>
          )}

          {parsedChapters.length > 0 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                {parsedChapters.map((c, i) => (
                  <div key={i} style={{ padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <input type="checkbox" checked={c.checked} onChange={(e) => updateParsed(i, 'checked', e.target.checked)} />
                      <input
                        type="number"
                        value={c.number}
                        onChange={(e) => updateParsed(i, 'number', e.target.value)}
                        style={{ width: 60, padding: 6, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 2 }}
                      />
                      <input
                        type="text"
                        value={c.title}
                        onChange={(e) => updateParsed(i, 'title', e.target.value)}
                        placeholder="Judul"
                        style={{ flex: 1, padding: 6, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 2 }}
                      />
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                      {c.content.slice(0, 120)}{c.content.length > 120 ? '...' : ''}
                    </p>
                  </div>
                ))}
              </div>
              <button className="btn btn--filled" onClick={handleImport} disabled={importing}>
                {importing ? 'Mengimport...' : `Import ${parsedChapters.filter((c) => c.checked).length} Chapter`}
              </button>
            </>
          )}
        </div>
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
