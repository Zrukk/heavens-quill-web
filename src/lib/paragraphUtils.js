
/**
 * Tambahkan ID unik pada setiap paragraf chapter
 * agar posisi membaca bisa disimpan dan dipulihkan.
 *
 * Gambar yang berdiri sendiri akan dibungkus dalam <p>.
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

  // Beri setiap paragraf ID yang konsisten dalam chapter.
  const paragraphs = doc.querySelectorAll('p')

  paragraphs.forEach((paragraph, index) => {
    const paragraphId = `chapter-paragraph-${index}`

    paragraph.setAttribute('id', paragraphId)
    paragraph.setAttribute(
      'data-paragraph',
      String(index)
    )
    paragraph.setAttribute(
      'data-paragraph-id',
      paragraphId
    )
  })

  return {
    htmlWithIds: doc.body.innerHTML,
    totalParagraphs: paragraphs.length,
  }
}

/**
 * Ambil cuplikan teks paragraf.
 * Jika paragraf hanya berisi gambar, tampilkan "[Gambar]".
 */
export function getParagraphPreview(
  html,
  index,
  maxLength = 80
) {
  if (!html) return ''

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const paragraphs = doc.querySelectorAll('p')
  const paragraph = paragraphs[index]

  if (!paragraph) return ''

  const image = paragraph.querySelector('img')
  const text = paragraph.textContent.trim()

  if (!text && image) return '[Gambar]'

  return text.length > maxLength
    ? `${text.slice(0, maxLength)}...`
    : text
      }
  
