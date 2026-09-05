import { useEffect, useState } from 'react'
import JSZip from 'jszip'
import { BookPlus, FilePlus2, UploadCloud, ListChecks, Trash2, Save } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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

    const paragraphs = Array.from(htmlDoc.querySelectorAll('p'))
      .map((p) => p.textContent.trim())
      .filter(Boolean)
    const content = paragraphs.length > 0
      ? paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n')
      : (htmlDoc.body?.textContent.trim() ? `<p>${escapeHtml(htmlDoc.body.textContent.trim())}</p>` : '')

    if (content) chapters.push({ title, content })
  }

  return { chapters, totalInEpub: spineIds.length }
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

  async function loadManageChapters(novelId) {
    const { data } = await supabase
      .from('chapters')
      .select('id, chapter_number, title')
      .eq('novel_id', novelId)
      .order('chapter_number', { ascending: true })
    setManageChapters(data ?? [])
    setSelectedIds([])
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.length === manageChapters.length ? [] : manageChapters.map((c) => c.id)))
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
      const { chapters, totalInEpub } = await parseEpub(epubFile, range)
      setEpubTotal(totalInEpub)
      applyParsed(chapters)
      setMessage(`${chapters.length} chapter diproses (total item di epub ini: ${totalInEpub}). Cek & sesuaikan nomor di bawah sebelum import.`)
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
