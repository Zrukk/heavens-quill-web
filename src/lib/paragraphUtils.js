/**
 * Ambil HTML chapter, kasih data-paragraph ke setiap <p>,
 * dan bungkus <img> yang belum ada di dalam <p> jadi <p><img /></p>.
 */
export function tagParagraphs(html) {
  if (!html) return { htmlWithIds: '', totalParagraphs: 0 }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Bungkus <img> yang berdiri sendiri jadi <p><img /></p>
  const images = doc.querySelectorAll('img')
  images.forEach((img) => {
    const parent = img.parentElement
    // Kalau parent-nya bukan <p>, bungkus img jadi <p>
    if (parent && parent.tagName !== 'P') {
      const wrapper = doc.createElement('p')
      img.parentNode.insertBefore(wrapper, img)
      wrapper.appendChild(img)
    }
  })

  // Kasih data-paragraph ke semua <p>
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
 * Ambil cuplikan teks paragraf tertentu (kalau paragraf-nya gambar, kasih label "[Gambar]")
 */
export function getParagraphPreview(html, index, maxLength = 80) {
  if (!html) return ''
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const paragraphs = doc.querySelectorAll('p')
  const p = paragraphs[index]
  if (!p) return ''

  // Kalau paragraf isinya cuma gambar
  const img = p.querySelector('img')
  const text = p.textContent.trim()
  if (!text && img) return '[Gambar]'

  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}
