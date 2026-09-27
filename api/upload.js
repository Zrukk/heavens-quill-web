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

    // Bikin nama unik
    const ext = fileName.split('.').pop() || 'jpg'
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    // Upload ke Upstash Blob via REST API
    const uploadRes = await fetch(`https://blob.upstash.io/${key}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_BLOB_TOKEN}`,
        'Content-Type': contentType || 'application/octet-stream',
      },
      body: buffer,
    })

    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      console.error('Upstash upload error:', errText)
      return res.status(uploadRes.status).json({ error: errText || 'Upload gagal' })
    }

    const data = await uploadRes.json()

    return res.status(200).json({ url: data.url || data.downloadUrl || '' })
  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).json({ error: err.message || 'Upload gagal' })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
                   }
