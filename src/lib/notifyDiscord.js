/**
 * Kirim notifikasi ke Discord via webhook.
 *
 * @param {Object} options
 * @param {string} options.type - 'new_novel' | 'new_chapter' | 'bulk_import' | 'comment' | 'comment_reply'
 * @param {Object} options.data - data novel/chapter/komentar
 */
export async function notifyDiscord({ type, data }) {
  // Pilih webhook berdasarkan tipe
  let webhookUrl

  if (type === 'new_novel' || type === 'new_chapter' || type === 'bulk_import') {
    // Channel konten (novel & chapter)
    webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_CONTENT_URL
  } else if (type === 'comment' || type === 'comment_reply') {
    // Channel komentar
    webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL
  } else {
    console.warn('Tipe notifikasi gak dikenal:', type)
    return
  }

  if (!webhookUrl) {
    console.warn('Webhook URL belum di-set untuk tipe:', type)
    return
  }

  try {
    let embed = null

    // ==== KONTEN: Novel Baru ====
    if (type === 'new_novel') {
      embed = {
        title: '📚 Novel Baru Ditambahkan!',
        description: data.synopsis
          ? (data.synopsis.length > 300 ? data.synopsis.slice(0, 300) + '...' : data.synopsis)
          : 'Tanpa sinopsis.',
        url: `${window.location.origin}/novel/${data.slug}`,
        color: 0xd4af5b,
        thumbnail: data.cover_url ? { url: data.cover_url } : undefined,
        fields: [
          { name: 'Judul', value: data.title || '-', inline: true },
          { name: 'Author', value: data.author || '-', inline: true },
          { name: 'Bahasa', value: data.original_language || '-', inline: true },
          { name: 'Genre', value: data.genre || '-', inline: false },
        ],
        footer: { text: "Heaven's Quill" },
        timestamp: new Date().toISOString(),
      }
    }

    // ==== KONTEN: Chapter Baru ====
    if (type === 'new_chapter') {
      embed = {
        title: '📖 Chapter Baru Rilis!',
        description: data.chapter_title
          ? `**Chapter ${data.chapter_number} — ${data.chapter_title}**`
          : `**Chapter ${data.chapter_number}**`,
        url: `${window.location.origin}/novel/${data.novel_slug}/chapter/${data.chapter_number}`,
        color: 0x5ba8d4,
        thumbnail: data.cover_url ? { url: data.cover_url } : undefined,
        fields: [
          { name: 'Novel', value: data.novel_title || '-', inline: true },
          { name: 'Chapter', value: `${data.chapter_number}`, inline: true },
        ],
        footer: { text: "Heaven's Quill" },
        timestamp: new Date().toISOString(),
      }
    }

    // ==== KONTEN: Bulk Import ====
    if (type === 'bulk_import') {
      embed = {
        title: '⚡ Import Massal Chapter',
        description: `${data.count} chapter baru ditambahkan ke **${data.novel_title}**.`,
        url: `${window.location.origin}/novel/${data.novel_slug}`,
        color: 0x5bbf8a,
        fields: [
          { name: 'Novel', value: data.novel_title || '-', inline: true },
          { name: 'Jumlah', value: `${data.count} chapter`, inline: true },
        ],
        footer: { text: "Heaven's Quill" },
        timestamp: new Date().toISOString(),
      }
    }

    // ==== KOMENTAR: Komentar Baru ====
    if (type === 'comment') {
      embed = {
        title: '💬 Komentar Baru',
        description: data.content.length > 300 ? data.content.slice(0, 300) + '...' : data.content,
        url: data.url,
        color: 0xd4af5b,
        author: { name: data.author_name || 'Pembaca' },
        fields: [
          { name: 'Novel', value: data.novel_title || '-', inline: true },
          { name: 'Chapter', value: `${data.chapter_number}${data.chapter_title ? ` — ${data.chapter_title}` : ''}`, inline: true },
        ],
        footer: { text: "Heaven's Quill" },
        timestamp: new Date().toISOString(),
      }
    }

    // ==== KOMENTAR: Balasan ====
    if (type === 'comment_reply') {
      embed = {
        title: '↩️ Balasan Baru',
        description: data.content.length > 300 ? data.content.slice(0, 300) + '...' : data.content,
        url: data.url,
        color: 0x5ba8d4,
        author: { name: data.author_name || 'Pembaca' },
        fields: [
          { name: 'Novel', value: data.novel_title || '-', inline: true },
          { name: 'Chapter', value: `${data.chapter_number}${data.chapter_title ? ` — ${data.chapter_title}` : ''}`, inline: true },
        ],
        footer: { text: "Heaven's Quill" },
        timestamp: new Date().toISOString(),
      }
    }

    if (!embed) return

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
  } catch (err) {
    console.error('Gagal kirim notif Discord:', err)
  }
}
