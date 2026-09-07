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
