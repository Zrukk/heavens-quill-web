import { useEffect, useState } from 'react'
import {
  Clock, CheckCircle2, XCircle, Loader as LoaderIcon, Save,
  ExternalLink, ChevronDown, ChevronUp, Search, FileText, X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STATUS_CONFIG = {
  pending:     { label: 'Menunggu',   color: '#D4AF5B' },
  approved:    { label: 'Disetujui',  color: '#5BBF8A' },
  in_progress: { label: 'Dikerjakan', color: '#5BA8D4' },
  completed:   { label: 'Selesai',    color: '#5BBF8A' },
  rejected:    { label: 'Ditolak',    color: '#D46B5B' },
  cancelled:   { label: 'Dibatalkan', color: '#888888' },
}

const STATUS_ORDER = ['pending', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled']

function formatRupiah(num) {
  return 'Rp' + (num || 0).toLocaleString('id-ID')
}

function formatDate(str) {
  if (!str) return '-'
  return new Date(str).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function TranslationRequestsManager() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('pending')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [editingNotes, setEditingNotes] = useState(null)
  const [notesInput, setNotesInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('translation_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) alert('Gagal load request: ' + error.message)
    setRequests(data ?? [])
    setLoading(false)
  }

  async function updateStatus(id, newStatus) {
    setUpdatingId(id)
    const { error } = await supabase
      .from('translation_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
    setUpdatingId(null)
    if (error) return alert('Gagal ubah status: ' + error.message)
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    )
  }

  function startEditNotes(r) {
    setEditingNotes(r.id)
    setNotesInput(r.admin_notes || '')
  }

  async function saveNotes(id) {
    setSaving(true)
    const { error } = await supabase
      .from('translation_requests')
      .update({ admin_notes: notesInput.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', id)
    setSaving(false)
    if (error) return alert('Gagal simpan catatan: ' + error.message)
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, admin_notes: notesInput.trim() || null } : r))
    )
    setEditingNotes(null)
  }

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = requests.filter((r) => r.status === s).length
    return acc
  }, {})

  const filtered = requests.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (r.novel_title || '').toLowerCase().includes(q) ||
        (r.contact || '').toLowerCase().includes(q) ||
        (r.author || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const inputStyle = {
    width: '100%',
    padding: 10,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
  }

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>⏳ Memuat...</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileText size={20} color="var(--gold)" />
        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>
          Request Translate ({requests.length})
        </h2>
      </div>

      {/* FILTER STATUS */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilterStatus('all')}
          className={filterStatus === 'all' ? 'btn btn--gold' : 'btn'}
          style={{ fontSize: '0.75rem', padding: '6px 10px' }}
        >
          Semua ({requests.length})
        </button>
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={filterStatus === s ? 'btn btn--gold' : 'btn'}
            style={{ fontSize: '0.75rem', padding: '6px 10px' }}
          >
            {STATUS_CONFIG[s].label} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div style={{ position: 'relative' }}>
        <Search
          size={14}
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder="Cari judul / kontak / author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 34 }}
        />
      </div>

      {filtered.length === 0 && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24, fontSize: '0.9rem' }}>
          {search ? 'Gak ada request yang cocok.' : 'Belum ada request di status ini.'}
        </p>
      )}

      {/* LIST REQUEST */}
      {filtered.map((r) => {
        const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
        const expanded = expandedId === r.id
        const isEditingNotes = editingNotes === r.id

        return (
          <div
            key={r.id}
            className="card"
            style={{
              padding: 14,
              border: `1px solid ${st.color}33`,
              borderLeft: `3px solid ${st.color}`,
            }}
          >
            {/* HEADER */}
            <div
              onClick={() => setExpandedId(expanded ? null : r.id)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 2 }}>
                  {r.novel_title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formatRupiah(r.budget)} · {r.contact} · {formatDate(r.created_at)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 10,
                    background: `${st.color}22`,
                    color: st.color,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {st.label}
                </span>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {/* DETAIL EXPAND */}
            {expanded && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
                <DetailRow label="Author" value={r.author || '-'} />
                <DetailRow label="Bahasa Asli" value={r.original_language || '-'} />
                <DetailRow label="Genre" value={r.genre || '-'} />
                {r.synopsis && <DetailRow label="Sinopsis" value={r.synopsis} multiline />}
                {r.raw_link && (
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
                      LINK RAW
                    </div>
                    <a
                      href={r.raw_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent)', wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      {r.raw_link}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
                {r.notes && <DetailRow label="Catatan User" value={r.notes} multiline />}

                {r.payment_proof_url && (
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
                      BUKTI TRANSFER
                    </div>
                    <a
                      href={r.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <ExternalLink size={14} />
                      Buka Gambar
                    </a>
                  </div>
                )}

                {/* UBAH STATUS */}
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
                    UBAH STATUS
                  </div>
                  <select
                    value={r.status}
                    onChange={(e) => updateStatus(r.id, e.target.value)}
                    disabled={updatingId === r.id}
                    style={inputStyle}
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                </div>

                {/* CATATAN ADMIN */}
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
                    CATATAN ADMIN (kelihatan oleh user)
                  </div>
                  {isEditingNotes ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <textarea
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                        rows={3}
                        placeholder="Contoh: Request disetujui, penerjemah sudah dicari..."
                        style={{ ...inputStyle, resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => saveNotes(r.id)}
                          disabled={saving}
                          className="btn btn--gold"
                          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        >
                          <Save size={14} />
                          {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                        <button
                          onClick={() => setEditingNotes(null)}
                          className="btn"
                          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        >
                          <X size={14} />
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: 10,
                        background: 'var(--bg)',
                        borderRadius: 'var(--radius)',
                        borderLeft: '3px solid var(--gold)',
                        whiteSpace: 'pre-wrap',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        minHeight: 38,
                      }}
                      onClick={() => startEditNotes(r)}
                    >
                      {r.admin_notes || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Klik buat tulis catatan...</span>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function DetailRow({ label, value, multiline }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>{value}</div>
    </div>
  )
                      }
