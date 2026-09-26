import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Crown,
  Check,
  X,
  Clock,
  Eye,
  Loader,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useDocumentMeta } from '../lib/useDocumentMeta'

const PLANS = {
  monthly: { name: 'Bulanan', duration: 1, price: 30000 },
  quarterly: { name: 'Triwulan', duration: 3, price: 76500 },
  semester: { name: 'Semester', duration: 6, price: 144000 },
  yearly: { name: 'Tahunan', duration: 12, price: 270000 },
}

const FILTERS = [
  { id: 'pending', label: 'Menunggu', icon: <Clock size={14} /> },
  { id: 'active', label: 'Aktif', icon: <CheckCircle2 size={14} /> },
  { id: 'rejected', label: 'Ditolak', icon: <X size={14} /> },
  { id: 'all', label: 'Semua', icon: <Crown size={14} /> },
]

function formatRupiah(num) {
  return 'Rp' + num.toLocaleString('id-ID')
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminMembership() {
  const { isAdmin, loading: authLoading } = useAuth()
  const [memberships, setMemberships] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [expandedId, setExpandedId] = useState(null)
  const [processing, setProcessing] = useState(null)
  const [message, setMessage] = useState(null)

  useDocumentMeta(
    "Admin Membership — Heaven's Quill",
    "Kelola membership Heaven's Quill.",
  )

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)

    const { data: membershipsData } = await supabase
      .from('memberships')
      .select('*')
      .order('created_at', { ascending: false })

    if (!membershipsData || membershipsData.length === 0) {
      setMemberships([])
      setLoading(false)
      return
    }

    // Fetch profil user
    const userIds = [...new Set(membershipsData.map((m) => m.user_id))]
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    const profilesMap = {}
    ;(profilesData ?? []).forEach((p) => {
      profilesMap[p.id] = p
    })

    const merged = membershipsData.map((m) => ({
      ...m,
      profile: profilesMap[m.user_id] || { display_name: 'Pembaca', avatar_url: null },
    }))

    setMemberships(merged)
    setLoading(false)
  }

  async function handleApprove(membership) {
    if (!confirm(`Aktifkan membership untuk ${membership.profile.display_name}?`)) return

    setProcessing(membership.id)

    const plan = PLANS[membership.plan] || { duration: 1 }
    const startDate = new Date()
    const expiresDate = new Date()
    expiresDate.setMonth(expiresDate.getMonth() + plan.duration)

    const { error } = await supabase
      .from('memberships')
      .update({
        status: 'active',
        started_at: startDate.toISOString(),
        expires_at: expiresDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', membership.id)

    setProcessing(null)

    if (error) {
      setMessage('Gagal approve: ' + error.message)
    } else {
      setMessage(`✅ Membership ${membership.profile.display_name} diaktifkan sampai ${formatDate(expiresDate)}.`)
      load()
      setTimeout(() => setMessage(null), 4000)
    }
  }

  async function handleReject(membership) {
    const reason = prompt('Alasan penolakan (opsional):')
    if (reason === null) return

    setProcessing(membership.id)

    const { error } = await supabase
      .from('memberships')
      .update({
        status: 'rejected',
        admin_notes: reason || 'Ditolak oleh admin',
        updated_at: new Date().toISOString(),
      })
      .eq('id', membership.id)

    setProcessing(null)

    if (error) {
      setMessage('Gagal reject: ' + error.message)
    } else {
      setMessage(`❌ Membership ${membership.profile.display_name} ditolak.`)
      load()
      setTimeout(() => setMessage(null), 4000)
    }
  }

  async function handleDelete(membership) {
    if (!confirm(`Hapus data membership ${membership.profile.display_name}?`)) return

    setProcessing(membership.id)
    await supabase.from('memberships').delete().eq('id', membership.id)
    setProcessing(null)
    setMessage('🗑️ Membership dihapus.')
    load()
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleExtend(membership, months) {
    if (!confirm(`Perpanjang membership ${membership.profile.display_name} selama ${months} bulan?`)) return

    setProcessing(membership.id)

    const currentExpiry = membership.expires_at ? new Date(membership.expires_at) : new Date()
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date()
    const newExpiry = new Date(baseDate)
    newExpiry.setMonth(newExpiry.getMonth() + months)

    const { error } = await supabase
      .from('memberships')
      .update({
        status: 'active',
        expires_at: newExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', membership.id)

    setProcessing(null)

    if (error) {
      setMessage('Gagal perpanjang: ' + error.message)
    } else {
      setMessage(`✅ Diperpanjang sampai ${formatDate(newExpiry)}.`)
      load()
      setTimeout(() => setMessage(null), 4000)
    }
  }

  if (authLoading) return <div className="container" style={{ paddingTop: 40 }}>Memuat...</div>
  if (!isAdmin) {
    return (
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 500 }}>
        <p style={{ color: 'var(--text-muted)' }}>Akun ini bukan admin.</p>
      </div>
    )
  }

  const filtered = memberships.filter((m) => {
    if (filter === 'all') return true
    return m.status === filter
  })

  const stats = {
    pending: memberships.filter((m) => m.status === 'pending').length,
    active: memberships.filter((m) => m.status === 'active').length,
    revenue: memberships
      .filter((m) => m.status === 'active')
      .reduce((sum, m) => sum + (m.amount || 0), 0),
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Crown size={28} color="var(--gold)" />
        <h1 className="gradient-text" style={{ fontSize: '1.8rem' }}>Admin Membership</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
        Kelola konfirmasi & perpanjangan membership user.
      </p>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Menunggu</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#D4AF5B' }}>{stats.pending}</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Member Aktif</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#5BBF8A' }}>{stats.active}</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Total Revenue</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold)' }}>
            {formatRupiah(stats.revenue)}
          </div>
        </div>
      </div>

      {/* FILTER */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={filter === f.id ? 'btn btn--gold' : 'btn'}
            style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      {message && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            borderRadius: 'var(--radius)',
            fontSize: '0.85rem',
            background: message.includes('✅') ? 'rgba(91, 191, 138, 0.1)' : message.includes('❌') ? 'rgba(212, 107, 91, 0.1)' : 'rgba(91, 168, 212, 0.1)',
            border: message.includes('✅') ? '1px solid #5BBF8A' : message.includes('❌') ? '1px solid #D46B5B' : '1px solid #5BA8D4',
            color: message.includes('✅') ? '#5BBF8A' : message.includes('❌') ? '#D46B5B' : '#5BA8D4',
          }}
        >
          {message}
        </div>
      )}

      {/* LIST */}
      {loading && <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>}
      {!loading && filtered.length === 0 && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
          Gak ada membership dengan status "{filter}".
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((m) => {
          const plan = PLANS[m.plan] || { name: m.plan, duration: 0 }
          const isExpanded = expandedId === m.id
          const isProcessing = processing === m.id

          return (
            <div key={m.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: m.profile.avatar_url ? `url(${m.profile.avatar_url}) center/cover` : 'var(--border)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                    {m.profile.display_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Paket {plan.name} · {formatRupiah(m.amount)} · {formatDate(m.created_at)}
                  </div>
                </div>

                <StatusBadge status={m.status} />

                <button
                  onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  className="btn"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  <Eye size={14} />
                  {isExpanded ? 'Tutup' : 'Detail'}
                </button>
              </div>

              {isExpanded && (
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {/* Bukti transfer */}
                  {m.payment_proof_url ? (
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                        Bukti Transfer
                      </div>
                      <a
                        href={m.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-block', position: 'relative' }}
                      >
                        <img
                          src={m.payment_proof_url}
                          alt="Bukti transfer"
                          style={{
                            maxWidth: 200,
                            maxHeight: 260,
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            display: 'block',
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 6,
                            right: 6,
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <ExternalLink size={10} />
                          Buka
                        </span>
                      </a>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      ⚠️ Belum ada bukti transfer.
                    </p>
                  )}

                  {/* Notes */}
                  {m.notes && (
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
                        Catatan User
                      </div>
                      <div style={{ fontSize: '0.85rem', padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius)' }}>
                        {m.notes}
                      </div>
                    </div>
                  )}

                  {m.admin_notes && (
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
                        Catatan Admin
                      </div>
                      <div style={{ fontSize: '0.85rem', padding: 10, background: 'var(--bg)', borderRadius: 'var(--radius)' }}>
                        {m.admin_notes}
                      </div>
                    </div>
                  )}

                  {/* Info tanggal */}
                  {m.started_at && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Mulai: <strong style={{ color: 'var(--text)' }}>{formatDate(m.started_at)}</strong>
                      {' · '}
                      Berakhir: <strong style={{ color: 'var(--text)' }}>{formatDate(m.expires_at)}</strong>
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    {m.status !== 'active' && (
                      <button
                        onClick={() => handleApprove(m)}
                        className="btn btn--gold"
                        disabled={isProcessing}
                        style={{ fontSize: '0.85rem' }}
                      >
                        {isProcessing ? <Loader size={14} className="spin" /> : <Check size={14} />}
                        Aktifkan
                      </button>
                    )}

                    {m.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleExtend(m, 1)}
                          className="btn btn--gold"
                          disabled={isProcessing}
                          style={{ fontSize: '0.85rem' }}
                        >
                          +1 Bulan
                        </button>
                        <button
                          onClick={() => handleExtend(m, 3)}
                          className="btn"
                          disabled={isProcessing}
                          style={{ fontSize: '0.85rem' }}
                        >
                          +3 Bulan
                        </button>
                        <button
                          onClick={() => handleExtend(m, 12)}
                          className="btn"
                          disabled={isProcessing}
                          style={{ fontSize: '0.85rem' }}
                        >
                          +1 Tahun
                        </button>
                      </>
                    )}

                    {m.status === 'pending' && (
                      <button
                        onClick={() => handleReject(m)}
                        className="btn"
                        disabled={isProcessing}
                        style={{ borderColor: '#D46B5B', color: '#D46B5B', fontSize: '0.85rem' }}
                      >
                        <X size={14} />
                        Tolak
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(m)}
                      className="btn"
                      disabled={isProcessing}
                      style={{ borderColor: '#D46B5B', color: '#D46B5B', fontSize: '0.85rem', marginLeft: 'auto' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Link ke Admin biasa */}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Link to="/admin" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          ← Kembali ke Admin Panel
        </Link>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    pending: { bg: 'rgba(212, 175, 91, 0.15)', color: '#D4AF5B', label: '⏳ Menunggu' },
    active: { bg: 'rgba(91, 191, 138, 0.15)', color: '#5BBF8A', label: '✓ Aktif' },
    rejected: { bg: 'rgba(212, 107, 91, 0.15)', color: '#D46B5B', label: '✗ Ditolak' },
    expired: { bg: 'rgba(138, 151, 163, 0.15)', color: 'var(--text-muted)', label: '⏰ Expired' },
  }

  const c = config[status] || config.pending

  return (
    <span
      style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: 12,
        background: c.bg,
        color: c.color,
        whiteSpace: 'nowrap',
      }}
    >
      {c.label}
    </span>
  )
    }
