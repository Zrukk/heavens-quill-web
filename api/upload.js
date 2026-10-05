import { Bucket } from '@upstash/blob'

// Bikin koneksi ke Upstash (baca token dari environment variable)
const bucket = Bucket.fromEnv()

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { fileName, base64, contentType } = req.body

    if (!fileName || !base64) {
      return res.status(400).json({ error: 'fileName & base64 wajib diisi' })
    }

    // Convert base64 → Buffer
    const buffer = Buffer.from(base64, 'base64')

    // Bikin nama unik biar gak bentrok
    const ext = fileName.split('.').pop() || 'jpg'
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    // Upload pakai SDK resmi Upstash (cara yang BENAR)
    const blob = await bucket.put(key, buffer, {
      contentType: contentType || 'application/octet-stream',
    })

    // blob.url itu URL publik file-nya
    return res.status(200).json({ url: blob.url })

  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).json({ error: err.message || 'Upload gagal' })
  }
}
