const SITE = 'https://heavens-quill.com' // ganti kalau domain beda
const SITE_NAME = "Heaven's Quill"

export function buildBookSchema(novel) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: novel.title,
    alternateName: novel.originalTitle,
    author: { '@type': 'Person', name: novel.author },
    image: novel.coverUrl,
    description: novel.synopsis,
    genre: novel.genres,
    inLanguage: 'id',
    numberOfPages: novel.totalChapters,
    bookFormat: 'https://schema.org/EBook',
    url: `${SITE}/novel/${novel.slug}`,
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE },
    aggregateRating: novel.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: novel.rating,
          ratingCount: novel.ratingCount || 1,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
  }
}

export function buildChapterSchema({ chapter, novel, prevUrl, nextUrl }) {
  const chapterUrl = `${SITE}/novel/${novel.slug}/chapter/${chapter.number}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Chapter',
    name: chapter.title || `Bab ${chapter.number}`,
    position: chapter.number,
    inLanguage: 'id',
    url: chapterUrl,
    datePublished: chapter.publishedAt,
    dateModified: chapter.updatedAt || chapter.publishedAt,
    wordCount: chapter.wordCount,
    isPartOf: {
      '@type': 'Book',
      name: novel.title,
      url: `${SITE}/novel/${novel.slug}`,
    },
    author: { '@type': 'Person', name: novel.author },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    ...(prevUrl && { previousItem: { '@type': 'Chapter', url: prevUrl } }),
    ...(nextUrl && { nextItem: { '@type': 'Chapter', url: nextUrl } }),
  }
}

export function buildBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${SITE}${it.url}`,
    })),
  }
}

export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE}/catalog?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}
