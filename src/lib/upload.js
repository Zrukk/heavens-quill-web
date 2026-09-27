/**
 * Upload file ke Upstash Blob via serverless function.
 * @param {File} file
 * @returns {Promise<string>} URL publik
 */
export async function uploadToBlob(file) {
  const base64 = await fileToBase64(file)

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      base64,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Upload gagal (${response.status})`)
  }

  const { url } = await response.json()
  return url
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
        }
