import { useEffect, useState } from 'react'
import JSZip from 'jszip'
import { BookPlus, FilePlus2, UploadCloud, ListChecks, Trash2, Save, Pencil } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchAllChapterRows } from '../lib/fetchAllChapterRows'

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function compressImage(blob) {
  try {
    const bitmap = await createImageBitmap(blob)
    const maxWidth = 1400
    if (bitmap.width <= maxWidth) {
      bitmap.close?.()
      return null
    }
    const scale = maxWidth / bitmap.width
    const canvas = document.createElement('canvas')
    canvas.width = maxWidth
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
  } catch {
    return null
  }
}

async function uploadEpubImage(zip, chapterPath, src) {
  const dir = chapterPath.includes('/') ? chapterPath.split('/').slice(0, -1).join('/') : ''
  const decodedSrc = decodeURIComponent(src)
  const rawPath = dir ? `${dir}/${decodedSrc}` : decodedSrc

  const normalizedPath = rawPath.split('/').reduce((acc, part) => {
    if (part === '..') acc.pop()
    else if (part !== '.') acc.push(part)
    return acc
  }, []).join('/')

  const fileEntry = zip.file(normalizedPath)
  if (!fileEntry) return { url: null, error: `file gak ketemu di epub: ${normalizedPath}` }

  const rawBlob = await fileEntry.async('blob')
  const compressedBlob = await compressImage(rawBlob)
  const blob = compressedBlob || rawBlob
  const ext = compressedBlob ? 'jpg' : normalizedPath.split('.').pop()
  const fileName = `epub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage.from('chapter-images').upload(fileName, blob)
  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from('chapter-images').getPublicUrl(fileName)
  return { url: data.publicUrl, error: null }
}

async function parseEpub(file, range) {
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

  const startIdx = range?.start ? Math.max(1, range.start) - 1 : 0
  const endIdx = range?.end ? Math.min(spineIds.length, range.end) : spineIds.length
  const targetIds = spineIds.slice(startIdx, endIdx)

  const chapters = []
  const imageErrors = []
  for (const id of targetIds) {
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

    const elements = Array.from(htmlDoc.body ? htmlDoc.body.querySelectorAll('p, img') : [])
    const htmlParts = []

    for (const el of elements) {
      if (el.tagName.toLowerCase() === 'img') {
        const src = el.getAttribute('src')
        if (!src) continue
        const result = await uploadEpubImage(zip, fullPath, src)
        if (result.url) {
          const alt = escapeHtml(el.getAttribute('alt') || '')
          htmlParts.push(`<img src="${result.url}" alt="${alt}" />`)
        } else {
          imageErrors.push(result.error)
        }
      } else {
        const text = el.textContent.trim()
        if (text) htmlParts.push(`<p>${escapeHtml(text)}</p>`)
      }
    }

    const content = htmlParts.length > 0
      ? htmlParts.join('\n')
      : (htmlDoc.body?.textContent.trim() ? `<p>${escapeHtml(htmlDoc.body.textContent.trim())}</p>` : '')

    if (content) chapters.push({ title, content })
  }

  return { chapters, imageErrors, totalInEpub: spineIds.length }
}

function parseBulkText(text) {
  const lines = text.split('\n')
  const pattern = /^(chapter|bab)\s*\d+/i
  const result = []
  let current = null

  for (const line of lines) {
    if (pattern.test(line.trim())) {
      if (current) result.push(current)
      current = { title: line.trim(), paragraphs: [] }
    } else if (current) {
      const trimmed = line.trim()
      if (trimmed) current.paragraphs.push(trimmed)
    }
  }
  if (current) result.push(current)

  return result
    .filter((c) => c.paragraphs.length > 0)
    .map((c) => ({
      title: c.title,
      content: c.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n'),
    }))
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

  const [epubFile, setEpubFile] = useState(null)
  const [epubRangeStart, setEpubRangeStart] = useState('')
  const [epubRangeEnd, setEpubRangeEnd] = useState('')
  const [epubTotal, setEpubTotal] = useState(null)

  const [manageNovel, setManageNovel] = useState('')
  const [manageChapters, setManageChapters] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [deletingChapters, setDeletingChapters] = useState(false)

  const [existingNumbers, setExistingNumbers] = useState(new Set())

  const [editingChapterId, setEditingChapterId] = useState(null)
  const [editNumber, setEditNumber] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    loadNovels()
  }, [])

  async function loadNovels() {
    const { data } = await supabase.from('novels').select('*').order('title')
    setNovels(data ?? [])
  }

  useEffect(() => {
    if (manageNovel) loadManageChapters(manageNovel)
    else {
      setManageChapters([])
      setSelectedIds([])
    }
  }, [manageNovel])

  useEffect(() => {
    if (importNovel) loadExistingNumbers(importNovel)
    else setExistingNumbers(new Set())
  }, [importNovel])

  async function loadExistingNumbers(novelId) {
    const data = await fetchAllChapterRows(novelId, 'chapter_number')
    setExistingNumbers(new Set((data ?? []).map((c) => c.chapter_number)))
  }

  async function loadManageChapters(novelId) {
    const data = await fetchAllChapterRows(novelId, 'id, chapter_number, title')
    setManageChapters(data ?? [])
    setSelectedIds([])
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.length === manageChapters.length ? [] : manageChapters.map((c) => c.id)))
  }

  async function startEdit(chapter) {
    setEditingChapterId(chapter.id)
    setEditNumber(chapter.chapter_number)
    setEditTitle(chapter.title || '')
    setEditContent('Memuat...')
    const { data } = await supabase.from('chapters').select('content').eq('id', chapter.id).single()
    setEditContent(data?.content || '')
  }

  function cancelEdit() {
    setEditingChapterId(null)
  }

  async function handleSaveEdit(chapterId) {
    setSavingEdit(true)
    const { error } = await supabase
      .from('chapters')
      .update({
        chapter_number: Number(editNumber),
        title: editTitle || null,
        content: editContent,
})
      .eq('id', chapterId)
    setSavingEdit(false)

    if (error) {
      setMessage('Gagal simpan perubahan: ' + error.message)
    } else {
      setMessage('Chapter berhasil diupdate.')
      setEditingChapterId(null)
      loadManageChapters(manageNovel)
    }
  }

  async function handleDeleteChapters() {
    if (selectedIds.length === 0) return
    if (!confirm(`Hapus ${selectedIds.length} chapter terpilih? Ini gak bisa dibatalin.`)) return

    setDeletingChapters(true)
    const { error } = await supabase.from('chapters').delete().in('id', selectedIds)
    setDeletingChapters(false)

    if (error) {
      setMessage('Gagal hapus: ' + error.message)
    } else {
      setMessage(`${selectedIds.length} chapter berhasil dihapus.`)
      loadManageChapters(manageNovel)
    }
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
    const htmlContent = content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join('\n')
    const { error } = await supabase.from('chapters').insert({
      novel_id: selectedNovel,
      chapter_number: Number(chapterNumber),
      title: chapterTitle || null,
      content: htmlContent,
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

  function handleEpubFileSelect(e) {
    const file = e.target.files[0]
    setEpubFile(file)
    setEpubTotal(null)
    setMessage(file ? `File dipilih: ${file.name}. Atur range chapter di bawah, lalu klik "Proses Range Ini".` : null)
  }

  async function handleProcessEpubRange() {
    if (!epubFile) {
      setMessage('Pilih file epub dulu.')
      return
    }
    setMessage('Membaca epub...')
    try {
      const range = {}
      if (epubRangeStart) range.start = Number(epubRangeStart)
      if (epubRangeEnd) range.end = Number(epubRangeEnd)
      const { chapters, imageErrors, totalInEpub } = await parseEpub(epubFile, range)
      setEpubTotal(totalInEpub)
      applyParsed(chapters)
      let msg = `${chapters.length} chapter diproses (total item di epub ini: ${totalInEpub}). Cek & sesuaikan nomor di bawah sebelum import.`
      if (imageErrors.length > 0) {
        const uniqueErrors = [...new Set(imageErrors)].slice(0, 3)
        msg += ` ⚠️ ${imageErrors.length} gambar gagal diupload — ${uniqueErrors.join(' | ')}`
      }
      setMessage(msg)
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
    const match = (rawTitle || '').match(/^(chapter|bab)\s*(\d+(?:\.\d+)?)\s*[:\-–—.]?\s*(.*)$/i)
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
        <button className={tab === 'novel' ? 'btn btn--filled' : 'btn'} onClick={() => setTab('novel')}><BookPlus size={16} />Tambah Novel</button>
        <button className={tab === 'chapter' ? 'btn btn--filled' : 'btn'} onClick={() => setTab('chapter')}><FilePlus2 size={16} />Tambah Chapter</button>
        <button className={tab === 'import' ? 'btn btn--filled' : 'btn'} onClick={() => setTab('import')}><UploadCloud size={16} />Import Massal</button>
        <button className={tab === 'manage' ? 'btn btn--filled' : 'btn'} onClick={() => setTab('manage')}><ListChecks size={16} />Kelola Chapter</button>
      </div>

      {message && <p style={{ color: 'var(--accent)', marginBottom: 16, fontSize: '0.9rem' }}>{message}</p>}

      {tab === 'novel' && (
        <form onSubmit={handleAddNovel} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="text" placeholder="Judul novel" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <input type="text" placeholder="Slug (contoh: sword-of-coming)" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          <textarea placeholder="Sinopsis" value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={4} style={inputStyle} />
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>
              Cover (opsional, maks 5MB)
            </label>
            <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} />
          </div>
          <input type="text" placeholder="Bahasa asli (contoh: Chinese)" value={language} onChange={(e) => setLanguage(e.target.value)} />
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>
              Status
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
              <option value="ongoing">Berjalan</option>
              <option value="completed">Tamat</option>
            </select>
          </div>
          <button type="submit" className="btn btn--filled"><Save size={16} />Simpan Novel</button>
        </form>
      )}

      {tab === 'chapter' && (
        <form onSubmit={handleAddChapter} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select value={selectedNovel} onChange={(e) => setSelectedNovel(e.target.value)} required style={inputStyle}>
            <option value="">Pilih novel</option>
            {novels.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
          </select>
          <input type="number" step="any" placeholder="Nomor chapter" value={chapterNumber} onChange={(e) => setChapterNumber(e.target.value)} required />
          <input type="text" placeholder="Judul chapter (opsional)" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} />
          <textarea placeholder="Isi chapter" value={content} onChange={(e) => setContent(e.target.value)} rows={12} required style={inputStyle} />
          <button type="submit" className="btn btn--filled"><Save size={16} />Simpan Chapter</button>
        </form>
      )}

      {tab === 'import' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <select value={importNovel} onChange={(e) => setImportNovel(e.target.value)} style={inputStyle}>
            <option value="">Pilih novel tujuan</option>
            {novels.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
          </select>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>
              Sumber chapter
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={importSource === 'epub' ? 'btn btn--filled' : 'btn'} onClick={() => setImportSource('epub')}>Upload EPUB</button>
              <button className={importSource === 'bulk' ? 'btn btn--filled' : 'btn'} onClick={() => setImportSource('bulk')}>Tempel Teks</button>
