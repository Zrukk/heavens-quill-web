/**
 * Memberikan ID pada setiap paragraf agar posisi bacaan
 * dapat disimpan dan dipulihkan.
 */
export function tagParagraphs(html) {
  if (!html) {
    return {
      htmlWithIds: '',
      totalParagraphs: 0,
    }
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Bungkus gambar yang belum berada di dalam paragraf.
  const images = Array.from(doc.querySelectorAll('img'))

  images.forEach((img) => {
    const parent = img.parentElement

    if (parent && parent.tagName !== 'P') {
      const wrapper = doc.createElement('p')
      img.parentNode.insertBefore(wrapper, img)
      wrapper.appendChild(img)
    }
  })

  const paragraphs = doc.querySelectorAll('p')

  paragraphs.forEach((paragraph, index) => {
    const paragraphId = `chapter-paragraph-${index}`

    paragraph.setAttribute('id', paragraphId)
    paragraph.setAttribute('data-paragraph', String(index))
    paragraph.setAttribute('data-paragraph-id', paragraphId)
  })

  return {
    htmlWithIds: doc.body.innerHTML,
    totalParagraphs: paragraphs.length,
  }
}

/**
 * Mengambil cuplikan teks untuk sebuah paragraf.
 */
export function getParagraphPreview(html, index, maxLength = 80) {
  if (!html) return ''

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const paragraph = doc.querySelectorAll('p')[index]

  if (!paragraph) return ''

  const image = paragraph.querySelector('img')
  const text = paragraph.textContent.trim()

  if (!text && image) return '[Gambar]'

  return text.length > maxLength
    ? `${text.slice(0, maxLength)}...`
    : text
}
  
