import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Upload,
  Loader,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Coffee,
  Sparkles,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import { uploadToBlob } from '../lib/upload'

const MIN_BUDGET = 50000

const STATUS_CONFIG = {
  pending: { label: 'Menunggu Review', color: '#D4AF5B', icon: <Clock size={12} /> },
  approved: { label: 'Disetujui', color: '#5BBF8A', icon: <CheckCircle2 size={12} /> },
  in_progress: { label: 'Sedang Dikerjakan', color: '#5BA8D4', icon: <Loader size={12} /> },
  completed: { label: 'Selesai', color: '#5BBF8A', icon: <CheckCircle2 size={12} /> },
  rejected: { label: 'Ditolak', color: '#D46B5B', icon: <XCircle size={12} /> },
  cancelled: { label: 'Dibatalkan', color: 'var(--text-muted)', icon: <XCircle size={12} /> },
}

function formatRupiah(num) {
  return 'Rp' + (num || 0).toLocaleString('id-ID')
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function RequestTranslation() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form states
  const [novelTitle, setNovelTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [originalLanguage, setOriginalLanguage] = useState('')
  const [genre, setGenre] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [rawLink, setRawLink] = useState('')
  const [budget, setBudget] = useState('')
  const [contact, setContact] = useState('')
  const [notes, setNotes] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  useDocumentMeta(
    "Request Translate — Heaven's Quill",
    "Request novel favorit kamu buat diterjemahin ke Bahasa Indonesia.",
  )

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    loadRequests()
  }, [user])

  async function loadRequests() {
    setLoading(true)
    const { data } = await supabase
      .from('translation_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setRequests(data ?? [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }

    setMessage(null)

    const budgetNum = Number(budget)
    if (!budgetNum || budgetNum < MIN_BUDGET) {
      setMessage(`Budget minimal ${formatRupiah(MIN_BUDGET)}.`)
      return
    }
    if (!proofFile) {
      setMessage('Upload bukti transfer dulu ya.')
      return
    }
    if (!contact.trim()) {
      setMessage('Isi kontak kamu (WA/Email/Discord) biar admin bisa hubungi.')
      return
    }

    setSubmitting(true)

    // Upload bukti transfer
    let proofUrl
    try {
      proofUrl = await uploadToBlob(proofFile)
    } catch (err) {
      setSubmitting(false)
      setMessage('Gagal upload bukti: ' + err.message)
      return
    }

    const { error } = await supabase.from('translation_requests').insert({
      user_id: user.id,
      novel_title: novelTitle.trim(),
      author: author.trim() || null,
      original_language: originalLanguage.trim() || null,
      genre: genre.trim() || null,
      synopsis: synopsis.trim() || null,
      raw_link: rawLink.trim() || null,
      budget: budgetNum,
      contact: contact.trim(),
      notes: notes.trim() || null,
      payment_proof_url: proofUrl,
      status: 'pending',
    })

    setSubmitting(false)

    if (error) {
      setMessage('Gagal kirim: ' + error.message)
    } else {
      setMessage('✅ Request berhasil dikirim! Admin akan review dalam 1-3 hari kerja.')

      // Reset form
      setNovelTitle('')
      setAuthor('')
      setOriginalLanguage('')
      setGenre('')
      setSynopsis('')
      setRawLink('')
      setBudget('')
      setContact('')
      setNotes('')
      setProofFile(null)
      setShowForm(false)
      loadRequests()
    }
  }

  // === BELUM LOGIN ===
  if (!user) {
    return (
      <div className="container" style={{ paddingTop: 60, paddingBottom: 60, maxWidth: 500, textAlign: 'center' }}>
        <FileText size={48} color="var(--gold)" style={{ marginBottom: 16 }} />
        <h1 className="gradient-text" style={{ fontSize: '1.8rem', marginBottom: 12 }}>
          Request Translate
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          Login dulu buat kirim request novel yang mau diterjemahin.
        </p>
        <Link to="/login" className="btn btn--gold">
          Login Sekarang
        </Link>
      </div>
    )
  }

  const inputStyle = {
    width: '100%',
    padding: 12,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginBottom: 6,
    fontWeight: 600,
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 900 }}>
      {/* HERO */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <FileText size={48} color="var(--gold)" style={{ marginBottom: 12 }} />
        <h1 className="gradient-text" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', marginBottom: 12 }}>
          Request Translate Berbayar
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: 600, margin: '0 auto 24px' }}>
          Punya novel favorit yang belum ada terjemahan Indonesianya? Request di sini, admin bakal
          coba carikan penerjemah sesuai budget kamu.
        </p>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn--gold"
            style={{ padding: '14px 28px', fontSize: '1rem', fontWeight: 600 }}
          >
            <Send size={18} />
            Buat Request Baru
          </button>
        )}
      </div>

      {/* INFO BOX */}
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 32,
          background: 'linear-gradient(135deg, rgba(91, 168, 212, 0.08), transparent)',
          border: '1px solid var(--accent)',
        }}
      >
        <h3 style={{ fontSize: '1rem', marginBottom: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} />
          Cara Kerja
        </h3>
        <ol style={{ paddingLeft: 20, margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <li>Isi form request dengan data novel + budget yang kamu tawarkan.</li>
          <li>Bayar biaya request via Sociabuzz, upload bukti transfer.</li>
          <li>Admin review & hubungi kamu via kontak yang kamu kasih.</li>
          <li>Kalau setuju, admin carikan penerjemah & kerjakan.</li>
          <li>Kalau gak ketemu penerjemah / request ditolak, dana dikembalikan 100%.</li>
        </ol>
      </div>

      {/* FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={20} color="var(--gold)" />
            Form Request
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Judul Novel *</label>
              <input
                type="text"
                placeholder="Contoh: Lord of the Mysteries"
                value={novelTitle}
                onChange={(e) => setNovelTitle(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div>
                <label style={labelStyle}>Author</label>
                <input
                  type="text"
                  placeholder="Nama penulis asli"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Bahasa Asli</label>
                <input
                  type="text"
                  placeholder="Chinese / Japanese / Korean"
                  value={originalLanguage}
                  onChange={(e) => setOriginalLanguage(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Genre</label>
                <input
                  type="text"
                  placeholder="Fantasy, Action, dll"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Sinopsis</label>
              <textarea
                placeholder="Ringkasan cerita novel..."
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Link Raw / Sumber Novel</label>
              <input
                type="url"
                placeholder="https://..."
                value={rawLink}
                onChange={(e) => setRawLink(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div>
                <label style={labelStyle}>Budget * (min {formatRupiah(MIN_BUDGET)})</label>
                <input
                  type="number"
                  placeholder="50000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min={MIN_BUDGET}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Kontak * (WA/Email/Discord)</label>
                <input
                  type="text"
                  placeholder="08123456789 / @username"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Catatan Tambahan</label>
              <textarea
                placeholder="Misal: butuh selesai dalam 2 minggu, atau preferensi penerjemah..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* CARA BAYAR */}
            <div
              style={{
                padding: 16,
                background: 'linear-gradient(135deg, rgba(212, 175, 91, 0.1), rgba(212, 175, 91, 0.02))',
                border: '1px solid var(--gold)',
                borderRadius: 'var(--radius)',
                marginTop: 8,
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                Nominal yang perlu dibayar:
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold)', marginBottom: 12 }}>
                {formatRupiah(Number(budget) || 0)}
              </div>
              <a
                href="https://sociabuzz.com/heavensquill/tribe"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--gold"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Coffee size={16} />
                Bayar via Sociabuzz
              </a>
            </div>

            <div>
              <label style={labelStyle}>Bukti Transfer *</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files[0])}
                required
              />
              {proofFile && (
                <div style={{ fontSize: '0.8rem', color: '#5BBF8A', marginTop: 6 }}>
                  ✓ File dipilih: {proofFile.name}
                </div>
              )}
            </div>

            {message && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 'var(--radius)',
                  fontSize: '0.85rem',
                  background: message.includes('✅') ? 'rgba(91, 191, 138, 0.1)' : 'rgba(212, 107, 91, 0.1)',
                  border: message.includes('✅') ? '1px solid #5BBF8A' : '1px solid #D46B5B',
                  color: message.includes('✅') ? '#5BBF8A' : '#D46B5B',
                }}
              >
                {message}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="submit"
                className="btn btn--gold"
                disabled={submitting}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {submitting ? <Loader size={16} className="spin" /> : <Send size={16} />}
                {submitting ? 'Mengirim...' : 'Kirim Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn"
              >
                Batal
              </button>
            </div>
          </div>
        </form>
      )}

      {/* RIWAYAT REQUEST */}
      <div>
        <h2 style={{ fontSize: '1.3rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={20} color="var(--gold)" />
          Riwayat Request Kamu ({requests.length})
        </h2>

        {loading && <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>}

        {!loading && requests.length === 0 && (
          <div
            className="card"
            style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}
          >
            <AlertCircle size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Belum ada request. Klik "Buat Request Baru" di atas buat mulai.
            </p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requests.map((r) => {
              const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
              return (
                <div key={r.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>
                        {r.novel_title}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {r.author && `${r.author} · `}
                        {r.original_language || '-'} · Budget {formatRupiah(r.budget)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Dikirim: {formatDate(r.created_at)}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: 12,
                        background: `${st.color}22`,
                        color: st.color,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {st.icon}
                      {st.label}
                    </div>
                  </div>

                  {r.admin_notes && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 10,
                        background: 'var(--bg)',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.8rem',
                        borderLeft: '3px solid var(--gold)',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600, marginBottom: 4 }}>
                        📢 Catatan Admin
                      </div>
                      {r.admin_notes}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
             }
