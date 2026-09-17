/**
 * Ambil HTML chapter, kasih data-paragraph ke setiap <p>, dan return:
 * - htmlWithIds: HTML yang sudah ditambahi data-paragraph
 * - totalParagraphs: jumlah paragraf
 */
export function tagParagraphs(html) {
  if (!html) return { htmlWithIds: '', totalParagraphs: 0 }

  // Pakai DOMParser untuk parsing HTML dengan aman
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Ambil semua <p> di body
  const paragraphs = doc.querySelectorAll('p')

  paragraphs.forEach((p, index) => {
    p.setAttribute('data-paragraph', String(index))
  })

  return {
    htmlWithIds: doc.body.innerHTML,
    totalParagraphs: paragraphs.length,
  }
}

/**
 * Ambil cuplikan teks paragraf tertentu dari HTML chapter (buat preview di komentar)
 */
export function getParagraphPreview(html, index, maxLength = 80) {
  if (!html) return ''
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const paragraphs = doc.querySelectorAll('p')
  const p = paragraphs[index]
  if (!p) return ''
  const text = p.textContent.trim()
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
    }
