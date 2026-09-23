import { useEffect, useState } from 'react'
import JSZip from 'jszip'
import { BookPlus, FilePlus2, UploadCloud, ListChecks, Trash2, Save, Pencil, Info, CheckCircle2, AlertCircle, X } from 'lucide-react'
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

    const h1El = htmlDoc.querySelector('h1')
    const h2El = htmlDoc.querySelector('h2')
    const titleTagEl = htmlDoc.querySelector('title')
    let title = (h1El?.textContent || h2El?.textContent || titleTagEl?.textContent || '').trim()
    if (/^(unknown|untitled|no title)$/i.test(title)) title = ''
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
  const [messageType, setMessageType] = useState('info')

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [author, setAuthor] = useState('')
  const [genre, setGenre] = useState('')
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

  const [editingNovelId, setEditingNovelId] = useState(null)
  const [editNovelTitle, setEditNovelTitle] = useState('')
  const [editNovelSlug, setEditNovelSlug] = useState('')
  const [editNovelAuthor, setEditNovelAuthor] = useState('')
  const [editNovelGenre, setEditNovelGenre] = useState('')
  const [editNovelSynopsis, setEditNovelSynopsis] = useState('')
  const [editNovelLanguage, setEditNovelLanguage] = useState('')
  const [editNovelStatus, setEditNovelStatus] = useState('ongoing')
  const [editNovelCoverFile, setEditNovelCoverFile] = useState(null)
  const [savingNovelEdit, setSavingNovelEdit] = useState(false)

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
      showMessage('Gagal simpan perubahan: ' + error.message, 'error')
    } else {
      showMessage('Chapter berhasil diupdate.', 'success')
      setEditingChapterId(null)
      loadManageChapters(manageNovel)
    }
  }

  function showMessage(text, type = 'info') {
    setMessage(text)
    setMessageType(type)
  }

  async function handleDeleteChapters() {
    if (selectedIds.length === 0) return
    if (!confirm(`Hapus ${selectedIds.length} chapter terpilih? Ini gak bisa dibatalin.`)) return

    setDeletingChapters(true)
    const { error } = await supabase.from('chapters').delete().in('id', selectedIds)
    setDeletingChapters(false)

    if (error) {
      showMessage('Gagal hapus: ' + error.message, 'error')
    } else {
      showMessage(`${selectedIds.length} chapter berhasil dihapus.`, 'success')
      loadManageChapters(manageNovel)
    }
  }

  async function handleAddNovel(e) {
    e.preventDefault()
    setMessage(null)

    if (coverFile && coverFile.size > 5 * 1024 * 1024) {
      showMessage('Ukuran gambar maksimal 5MB.', 'error')
      return
    }

    let coverUrl = null
    if (coverFile) {
      const fileExt = coverFile.name.split('.').pop()
      const fileName = `${slug || 'cover'}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('covers').upload(fileName, coverFile)
      if (uploadError) {
        showMessage('Gagal upload gambar: ' + uploadError.message, 'error')
        return
      }
      const { data: urlData } = supabase.storage.from('covers').getPublicUrl(fileName)
      coverUrl = urlData.publicUrl
    }

    const { error } = await supabase.from('novels').insert({
      title, slug, author: author || null, genre: genre || null, synopsis, cover_url: coverUrl, original_language: language, status,
    })
    if (error) {
      showMessage(error.message, 'error')
    } else {
      showMessage('Novel berhasil ditambahkan.', 'success')
      setTitle(''); setSlug(''); setAuthor(''); setGenre(''); setSynopsis(''); setCoverFile(null); setLanguage('')
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
    if (error) {
      showMessage(error.message, 'error')
    } else {
      showMessage('Chapter berhasil ditambahkan.', 'success')
      setChapterNumber(''); setChapterTitle(''); setContent('')
    }
  }

  async function handleDeleteNovel(id) {
    if (!confirm('Hapus novel ini beserta semua chapternya?')) return
    await supabase.from('novels').delete().eq('id', id)
    loadNovels()
  }

  function startEditNovel(novel) {
    setEditingNovelId(novel.id)
    setEditNovelTitle(novel.title)
    setEditNovelSlug(novel.slug)
    setEditNovelAuthor(novel.author || '')
    setEditNovelGenre(novel.genre || '')
    setEditNovelSynopsis(novel.synopsis || '')
    setEditNovelLanguage(novel.original_language || '')
    setEditNovelStatus(novel.status || 'ongoing')
    setEditNovelCoverFile(null)
  }

  function cancelEditNovel() {
    setEditingNovelId(null)
  }

  async function handleSaveNovelEdit(novelId) {
    setSavingNovelEdit(true)

    let coverUrl
    if (editNovelCoverFile) {
      if (editNovelCoverFile.size > 5 * 1024 * 1024) {
        showMessage('Ukuran gambar maksimal 5MB.', 'error')
        setSavingNovelEdit(false)
        return
      }
      const fileExt = editNovelCoverFile.name.split('.').pop()
      const fileName = `${editNovelSlug || 'cover'}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('covers').upload(fileName, editNovelCoverFile)
      if (uploadError) {
        showMessage('Gagal upload gambar: ' + uploadError.message, 'error')
        setSavingNovelEdit(false)
        return
      }
      const { data: urlData } = supabase.storage.from('covers').getPublicUrl(fileName)
      coverUrl = urlData.publicUrl
    }

    const updates = {
      title: editNovelTitle,
      slug: editNovelSlug,
      author: editNovelAuthor || null,
      genre: editNovelGenre || null,
      synopsis: editNovelSynopsis,
      original_language: editNovelLanguage,
      status: editNovelStatus,
    }
    if (coverUrl) updates.cover_url = coverUrl

    const { error } = await supabase.from('novels').update(updates).eq('id', novelId)
    setSavingNovelEdit(false)

    if (error) {
      showMessage('Gagal simpan perubahan novel: ' + error.message, 'error')
    } else {
      showMessage('Novel berhasil diupdate.', 'success')
      setEditingNovelId(null)
      loadNovels()
    }
  }

  function handleEpubFileSelect(e) {
    const file = e.target.files[0]
    setEpubFile(file)
    setEpubTotal(null)
    setMessage(file ? `File dipilih: ${file.name}. Atur range chapter di bawah, lalu klik "Proses Range Ini".` : null)
  }

  async function handleProcessEpubRange() {
    if (!epubFile) {
      showMessage('Pilih file epub dulu.', 'error')
      return
    }
    showMessage('Membaca epub...', 'info')
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
      showMessage(msg, imageErrors.length > 0 ? 'error' : 'success')
    } catch (err) {
      showMessage('Gagal baca epub: ' + err.message, 'error')
    }
  }

  function handleParseBulk() {
    const chapters = parseBulkText(bulkText)
    applyParsed(chapters)
    showMessage(`${chapters.length} chapter terdeteksi. Cek & sesuaikan nomor di bawah sebelum import.`, 'success')
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
      showMessage('Pilih novel tujuan dulu.', 'error')
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
      showMessage(`Import gagal: ${error.message}`, 'error')
    } else {
      showMessage(`${data.length} chapter berhasil diimport.`, 'success')
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
    borderRadius: 'var(--radius)',
    fontFamily: 'inherit',
    width: '100%',
    fontSize: '0.9rem',
  }

  const labelStyle = {
    display: 'block',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    marginBottom: 6,
    fontWeight: 600,
  }

  const TabButton = ({ id, icon, label }) => (
    <button
      onClick={() => { setTab(id); setMessage(null) }}
      className={tab === id ? 'btn btn--gold' : 'btn'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: '0.85rem',
        padding: '10px 16px',
      }}
    >
      {icon}
      {label}
    </button>
  )

  const MessageBanner = () => {
    if (!message) return null
    const colors = {
      info: { bg: 'rgba(91, 168, 212, 0.1)', border: '#5BA8D4', color: '#5BA8D4', icon: <Info size={16} /> },
      success: { bg: 'rgba(91, 191, 138, 0.1)', border: '#5BBF8A', color: '#5BBF8A', icon: <CheckCircle2 size={16} /> },
      error: { bg: 'rgba(212, 107, 91, 0.1)', border: '#D46B5B', color: '#D46B5B', icon: <AlertCircle size={16} /> },
    }
    const c = colors[messageType] || colors.info

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: 12,
          marginBottom: 20,
          background: c.bg,
          border: `1px solid ${c.border}`,
          borderRadius: 'var(--radius)',
          color: c.color,
          fontSize: '0.85rem',
        }}
      >
        <span style={{ flexShrink: 0, marginTop: 2 }}>{c.icon}</span>
        <span style={{ flex: 1 }}>{message}</span>
        <button
          onClick={() => setMessage(null)}
          style={{
            background: 'none',
            border: 'none',
            color: c.color,
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
          }}
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <h1 className="gradient-text" style={{ fontSize: '1.8rem' }}>Admin Dashboard</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
        Kelola novel, chapter, dan import massal.
      </p>

      {/* TAB NAVIGATION */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          flexWrap: 'wrap',
          paddingBottom: 16,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <TabButton id="novel" icon={<BookPlus size={16} />} label="Tambah Novel" />
        <TabButton id="chapter" icon={<FilePlus2 size={16} />} label="Tambah Chapter" />
        <TabButton id="import" icon={<UploadCloud size={16} />} label="Import Massal" />
        <TabButton id="manage" icon={<ListChecks size={16} />} label="Kelola Chapter" />
      </div>

      {/* MESSAGE */}
      <MessageBanner />

      {/* TAB: NOVEL */}
      {tab === 'novel' && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(212, 175, 91, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookPlus size={18} color="var(--gold)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 2 }}>Tambah Novel Baru</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Isi data novel yang mau ditambahkan
              </p>
            </div>
          </div>

          <form onSubmit={handleAddNovel} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Judul Novel *</label>
              <input type="text" placeholder="Contoh: Lord of the Mysteries" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Slug (URL) *</label>
              <input type="text" placeholder="Contoh: lord-of-the-mysteries" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Nama Author</label>
              <input type="text" placeholder="Penulis asli (opsional)" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Genre</label>
              <input type="text" placeholder="Pisah pakai koma (Action, Fantasy, Romance)" value={genre} onChange={(e) => setGenre(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Sinopsis</label>
              <textarea placeholder="Ringkasan cerita..." value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={5} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Cover (opsional, maks 5MB)</label>
              <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} />
            </div>
            <div>
              <label style={labelStyle}>Bahasa Asli</label>
              <input type="text" placeholder="Contoh: Chinese, Japanese, Korean" value={language} onChange={(e) => setLanguage(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
                <option value="ongoing">Berjalan</option>
                <option value="completed">Tamat</option>
              </select>
            </div>
            <button type="submit" className="btn btn--gold" style={{ justifyContent: 'center' }}>
              <Save size={16} />
              Simpan Novel
            </button>
          </form>
        </div>
      )}

      {/* TAB: CHAPTER */}
      {tab === 'chapter' && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(212, 175, 91, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FilePlus2 size={18} color="var(--gold)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 2 }}>Tambah Chapter</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Tambah 1 chapter manual ke novel
              </p>
            </div>
          </div>

          <form onSubmit={handleAddChapter} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Pilih Novel *</label>
              <select value={selectedNovel} onChange={(e) => setSelectedNovel(e.target.value)} required style={inputStyle}>
                <option value="">-- Pilih novel --</option>
                {novels.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Nomor Chapter *</label>
              <input type="number" step="any" placeholder="Contoh: 1" value={chapterNumber} onChange={(e) => setChapterNumber(e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Judul Chapter</label>
              <input type="text" placeholder="Opsional" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Isi Chapter *</label>
              <textarea placeholder="Tulis isi chapter di sini. Tiap paragraf pisah dengan enter." value={content} onChange={(e) => setContent(e.target.value)} rows={15} required style={inputStyle} />
            </div>
            <button type="submit" className="btn btn--gold" style={{ justifyContent: 'center' }}>
              <Save size={16} />
              Simpan Chapter
            </button>
          </form>
        </div>
      )}

      {/* TAB: IMPORT */}
      {tab === 'import' && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(212, 175, 91, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UploadCloud size={18} color="var(--gold)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 2 }}>Import Massal</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Upload EPUB atau tempel teks banyak chapter sekaligus
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Novel Tujuan *</label>
              <select value={importNovel} onChange={(e) => setImportNovel(e.target.value)} style={inputStyle}>
                <option value="">-- Pilih novel --</option>
                {novels.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Sumber Chapter</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className={importSource === 'epub' ? 'btn btn--gold' : 'btn'} onClick={() => setImportSource('epub')} style={{ flex: 1, justifyContent: 'center' }}>Upload EPUB</button>
                <button type="button" className={importSource === 'bulk' ? 'btn btn--gold' : 'btn'} onClick={() => setImportSource('bulk')} style={{ flex: 1, justifyContent: 'center' }}>Tempel Teks</button>
              </div>
            </div>

            {importSource === 'epub' && (
              <>
                <div>
                  <label style={labelStyle}>File EPUB</label>
                  <input type="file" accept=".epub" onChange={handleEpubFileSelect} />
                </div>
                {epubFile && (
                  <>
                    <div
                      style={{
                        padding: 12,
                        background: 'rgba(91, 168, 212, 0.08)',
                        border: '1px solid #5BA8D4',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      💡 Epub dengan ratusan chapter bisa berat diproses sekaligus di HP. Proses per beberapa chapter aja (misal 1–30, lalu 31–60, dst) kalau kerasa lag.
                      {epubTotal ? ` Total item di epub ini: ${epubTotal}.` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="number"
                        placeholder="Dari #"
                        value={epubRangeStart}
                        onChange={(e) => setEpubRangeStart(e.target.value)}
                        style={{ width: 100, padding: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>sampai</span>
                      <input
                        type="number"
                        placeholder="ke #"
                        value={epubRangeEnd}
                        onChange={(e) => setEpubRangeEnd(e.target.value)}
                        style={{ width: 100, padding: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                      />
                    </div>
                    <button type="button" className="btn btn--gold" onClick={handleProcessEpubRange} style={{ justifyContent: 'center' }}>
                      <UploadCloud size={16} />
                      Proses Range Ini
                    </button>
                  </>
                )}
              </>
            )}

            {importSource === 'bulk' && (
              <>
                <div
                  style={{
                    padding: 12,
                    background: 'rgba(91, 168, 212, 0.08)',
                    border: '1px solid #5BA8D4',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  💡 Tempel beberapa chapter sekaligus. Tiap baris judul chapter harus diawali "Chapter" atau "Bab" diikuti angka. Contoh: "Chapter 12" atau "Bab 12 - Pertarungan".
                </div>
                <textarea
                  placeholder="Tempel teks di sini..."
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={12}
                  style={inputStyle}
                />
                <button type="button" className="btn" onClick={handleParseBulk} style={{ justifyContent: 'center' }}>
                  <FilePlus2 size={16} />
                  Pisahkan Otomatis
                </button>
              </>
            )}

            {parsedChapters.length > 0 && (
              <>
                {(() => {
                  const numberCounts = parsedChapters.reduce((acc, c) => {
                    acc[c.number] = (acc[c.number] || 0) + 1
                    return acc
                  }, {})
                  const conflictCount = parsedChapters.filter(
                    (c) => existingNumbers.has(Number(c.number)) || numberCounts[c.number] > 1,
                  ).length
                  return conflictCount > 0 ? (
                    <div
                      style={{
                        padding: 10,
                        background: 'rgba(212, 107, 91, 0.1)',
                        border: '1px solid #D46B5B',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.85rem',
                        color: '#D46B5B',
                      }}
                    >
                      ⚠ {conflictCount} chapter nomornya bentrok (udah ada di database atau dobel di batch ini) — cek yang bergaris merah di bawah, betulin atau uncheck sebelum import.
                    </div>
                  ) : null
                })()}

                <div>
                  <label style={labelStyle}>Preview ({parsedChapters.length} chapter)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                    {parsedChapters.map((c, i) => {
                      const numberCounts = parsedChapters.reduce((acc, x) => {
                        acc[x.number] = (acc[x.number] || 0) + 1
                        return acc
                      }, {})
                      const conflict = existingNumbers.has(Number(c.number)) || numberCounts[c.number] > 1
                      return (
                        <div
                          key={i}
                          style={{
                            padding: 12,
                            background: 'var(--bg)',
                            border: conflict ? '1px solid #D46B5B' : '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                          }}
                        >
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                            <input type="checkbox" checked={c.checked} onChange={(e) => updateParsed(i, 'checked', e.target.checked)} />
                            <input
                              type="number"
                              value={c.number}
                              onChange={(e) => updateParsed(i, 'number', e.target.value)}
                              style={{
                                width: 70,
                                padding: 6,
                                background: 'var(--surface)',
                                border: conflict ? '1px solid #D46B5B' : '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                              }}
                            />
                            <input
                              type="text"
                              value={c.title}
                              onChange={(e) => updateParsed(i, 'title', e.target.value)}
                              placeholder="Judul"
                              style={{ flex: 1, padding: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                            />
                          </div>
                          {conflict && (
                            <p style={{ color: '#D46B5B', fontSize: '0.75rem', margin: '0 0 6px' }}>
                              ⚠ nomor {c.number} udah ada di database atau dobel di batch ini
                            </p>
                          )}
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                            {c.content.slice(0, 120)}{c.content.length > 120 ? '...' : ''}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <button type="button" className="btn btn--gold" onClick={handleImport} disabled={importing} style={{ justifyContent: 'center' }}>
                  <UploadCloud size={16} />
                  {importing ? 'Mengimport...' : `Import ${parsedChapters.filter((c) => c.checked).length} Chapter`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB: MANAGE */}
      {tab === 'manage' && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(212, 175, 91, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ListChecks size={18} color="var(--gold)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 2 }}>Kelola Chapter</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Edit atau hapus chapter yang udah ada
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Pilih Novel</label>
              <select value={manageNovel} onChange={(e) => setManageNovel(e.target.value)} style={inputStyle}>
                <option value="">-- Pilih novel --</option>
                {novels.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
              </select>
            </div>

            {manageNovel && manageChapters.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: 20 }}>
                Novel ini belum punya chapter.
              </p>
            )}

            {manageChapters.length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className="btn" onClick={toggleSelectAll} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                    <ListChecks size={14} />
                    {selectedIds.length === manageChapters.length ? 'Batal Semua' : 'Pilih Semua'}
                  </button>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedIds.length} dipilih</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 500, overflowY: 'auto' }}>
                  {manageChapters.map((c) => (
                    <div key={c.id}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          fontSize: '0.9rem',
                        }}
                      >
                        <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)} />
                        <span style={{ flex: 1, cursor: 'pointer' }} onClick={() => toggleSelect(c.id)}>
                          Chapter {c.chapter_number}{c.title ? ` — ${c.title}` : ''}
                        </span>
                        <button
                          onClick={() => (editingChapterId === c.id ? cancelEdit() : startEdit(c))}
                          style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', padding: 4, display: 'flex' }}
                        >
                          <Pencil size={14} />
                        </button>
                      </div>

                      {editingChapterId === c.id && (
                        <div
                          style={{
                            padding: 12,
                            background: 'var(--bg)',
                            border: '1px solid var(--gold)',
                            borderRadius: 'var(--radius)',
                            marginTop: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                          }}
                        >
                          <input
                            type="number"
                            step="any"
                            value={editNumber}
                            onChange={(e) => setEditNumber(e.target.value)}
                            placeholder="Nomor chapter"
                            style={inputStyle}
                          />
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Judul (opsional)"
                            style={inputStyle}
                          />
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={10}
                            style={inputStyle}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn--gold" onClick={() => handleSaveEdit(c.id)} disabled={savingEdit}>
                              <Save size={14} />
                              {savingEdit ? 'Menyimpan...' : 'Simpan'}
                            </button>
                            <button className="btn" onClick={cancelEdit}>Batal</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  className="btn"
                  onClick={handleDeleteChapters}
                  disabled={selectedIds.length === 0 || deletingChapters}
                  style={{ borderColor: '#D46B5B', color: '#D46B5B', justifyContent: 'center' }}
                >
                  <Trash2 size={16} />
                  {deletingChapters ? 'Menghapus...' : `Hapus ${selectedIds.length} Chapter`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* NOVEL TERDAFTAR */}
      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.2rem' }}>Novel Terdaftar ({novels.length})</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {novels.map((n) => (
            <div key={n.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{n.title}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => (editingNovelId === n.id ? cancelEditNovel() : startEditNovel(n))}
                    style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', padding: 4, display: 'flex' }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button className="btn" onClick={() => handleDeleteNovel(n.id)} style={{ borderColor: '#D46B5B', color: '#D46B5B', padding: '4px 10px', fontSize: '0.8rem' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {editingNovelId === n.id && (
                <div
                  style={{
                    padding: 12,
                    background: 'var(--bg)',
                    border: '1px solid var(--gold)',
                    borderRadius: 'var(--radius)',
                    marginTop: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <input type="text" placeholder="Judul novel" value={editNovelTitle} onChange={(e) => setEditNovelTitle(e.target.value)} style={inputStyle} />
                  <input type="text" placeholder="Slug" value={editNovelSlug} onChange={(e) => setEditNovelSlug(e.target.value)} style={inputStyle} />
                  <input type="text" placeholder="Nama author" value={editNovelAuthor} onChange={(e) => setEditNovelAuthor(e.target.value)} style={inputStyle} />
                  <input type="text" placeholder="Genre (pisah pakai koma)" value={editNovelGenre} onChange={(e) => setEditNovelGenre(e.target.value)} style={inputStyle} />
                  <textarea placeholder="Sinopsis" value={editNovelSynopsis} onChange={(e) => setEditNovelSynopsis(e.target.value)} rows={4} style={inputStyle} />
                  <div>
                    <label style={labelStyle}>Ganti cover (opsional, maks 5MB)</label>
                    <input type="file" accept="image/*" onChange={(e) => setEditNovelCoverFile(e.target.files[0])} />
                  </div>
                  <input type="text" placeholder="Bahasa asli" value={editNovelLanguage} onChange={(e) => setEditNovelLanguage(e.target.value)} style={inputStyle} />
                  <select value={editNovelStatus} onChange={(e) => setEditNovelStatus(e.target.value)} style={inputStyle}>
                    <option value="ongoing">Berjalan</option>
                    <option value="completed">Tamat</option>
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn--gold" onClick={() => handleSaveNovelEdit(n.id)} disabled={savingNovelEdit}>
                      <Save size={14} />
                      {savingNovelEdit ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button className="btn" onClick={cancelEditNovel}>Batal</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
                  } 
