import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Crown,
  Check,
  X,
  Sparkles,
  Upload,
  Loader,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  Coffee,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useMembership } from '../lib/MembershipContext'
import { useDocumentMeta } from '../lib/useDocumentMeta'

const PLANS = [
  {
    id: 'monthly',
    name: 'Bulanan',
    duration: '1 Bulan',
    price: 30000,
    normalPrice: 30000,
    discount: 0,
    popular: false,
  },
  {
    id: 'quarterly',
    name: 'Triwulan',
    duration: '3 Bulan',
    price: 76500,
    normalPrice: 90000,
    discount: 15,
    popular: true,
  },
  {
    id: 'semester',
    name: 'Semester',
    duration: '6 Bulan',
    price: 144000,
    normalPrice: 180000,
    discount: 20,
    popular: false,
  },
  {
    id: 'yearly',
    name: 'Tahunan',
    duration: '12 Bulan',
    price: 270000,
    normalPrice: 360000,
    discount: 25,
    popular: false,
  },
]

const BENEFITS = [
  '🚫 Tanpa iklan — baca dengan tenang',
  '👑 Badge "Member" di profil & komentar',
  '✨ Nama berwarna emas di komentar',
  '💬 Akses channel Discord privat',
  '❤️ Dukungan langsung ke penerjemah',
]

function formatRupiah(num) {
  return 'Rp' + num.toLocaleString('id-ID')
}

export default function Membership() {
  const { user } = useAuth()
  const { membership, isMember, refreshMembership } = useMembership()
  const navigate = useNavigate()

  const [selectedPlan, setSelectedPlan] = useState('quarterly')
  const [proofFile, setProofFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  useDocumentMeta(
    "Membership — Heaven's Quill",
    "Dukung Heaven's Quill dan nikmati pengalaman baca tanpa iklan.",
  )

  useEffect(() => {
    if (membership?.plan) {
      setSelectedPlan(membership.plan)
    }
  }, [membership])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    if (!proofFile) {
      setMessage('Upload bukti transfer dulu ya.')
      return
    }

    setSubmitting(true)
    setMessage(null)

    const fileExt = proofFile.name.split('.').pop()
    const fileName = `${user.id}/proof-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, proofFile)

    if (uploadError) {
      setSubmitting(false)
      setMessage('Gagal upload bukti: ' + uploadError.message)
      return
    }

    const { data: urlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(fileName)

    const plan = PLANS.find((p) => p.id === selectedPlan)

    const { error } = await supabase
      .from('memberships')
      .upsert(
        {
          user_id: user.id,
          plan: selectedPlan,
          status: 'pending',
          amount: plan.price,
          payment_proof_url: urlData.publicUrl,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    setSubmitting(false)

    if (error) {
      setMessage('Gagal kirim: ' + error.message)
    } else {
      setMessage('Berhasil! Tunggu konfirmasi dari admin (1-3 hari kerja).')
      setProofFile(null)
      setNotes('')
      refreshMembership()
    }
  }

  if (!user) {
    return (
      <div className="container" style={{ paddingTop: 60, paddingBottom: 60, maxWidth: 500, textAlign: 'center' }}>
        <Crown size={48} color="var(--gold)" style={{ marginBottom: 16 }} />
        <h1 className="gradient-text" style={{ fontSize: '1.8rem', marginBottom: 12 }}>
          Membership
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          Login dulu buat jadi member dan nikmati pengalaman baca tanpa iklan.
        </p>
        <Link to="/login" className="btn btn--gold">
          Login Sekarang
        </Link>
      </div>
    )
  }

  // === KALAU UDAH MEMBER AKTIF ===
  if (isMember && membership) {
    const expiresDate = new Date(membership.expires_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    return (
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Crown size={28} color="var(--gold)" />
          <h1 className="gradient-text" style={{ fontSize: '1.8rem' }}>Membership Aktif</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
          Terima kasih udah mendukung Heaven's Quill! 💖
        </p>

        <div
          className="card"
          style={{
            padding: 24,
            background: 'linear-gradient(135deg, rgba(212, 175, 91, 0.15), rgba(212, 175, 91, 0.03))',
            border: '2px solid var(--gold)',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Crown size={28} color="#1a1a1a" />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold)' }}>
                Member Aktif
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Paket {PLANS.find((p) => p.id === membership.plan)?.name || membership.plan}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 12,
              background: 'var(--bg)',
              borderRadius: 'var(--radius)',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Berlaku sampai</span>
              <strong style={{ color: 'var(--text)' }}>{expiresDate}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status</span>
              <strong style={{ color: '#5BBF8A' }}>✓ Aktif</strong>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Benefit Kamu</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {BENEFITS.map((b, i) => (
              <div key={i} style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // === KALAU ADA PENDING ===
  const isPending = membership?.status === 'pending'
  const currentPlan = PLANS.find((p) => p.id === selectedPlan)

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 900 }}>
      {/* HERO */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Crown size={48} color="var(--gold)" style={{ marginBottom: 12 }} />
        <h1 className="gradient-text" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', marginBottom: 12 }}>
          Jadi Member, Baca Tanpa Iklan
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>
          Dukung Heaven's Quill dan nikmati pengalaman baca yang lebih nyaman.
        </p>
      </div>

      {/* PENDING NOTICE */}
      {isPending && (
        <div
          className="card"
          style={{
            padding: 16,
            marginBottom: 24,
            border: '1px solid #D4AF5B',
            background: 'rgba(212, 175, 91, 0.08)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <Clock size={20} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--gold)', marginBottom: 4 }}>
              Menunggu Konfirmasi Admin
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Bukti transfer kamu udah diterima. Tunggu admin konfirmasi dalam 1-3 hari kerja ya.
            </div>
          </div>
        </div>
      )}

      {/* BENEFIT LIST */}
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 32,
          background: 'linear-gradient(135deg, rgba(212, 175, 91, 0.08), transparent)',
          border: '1px solid var(--gold)',
        }}
      >
        <h3 style={{ fontSize: '1rem', marginBottom: 16, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} />
          Benefit Member
        </h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {BENEFITS.map((b, i) => (
            <div key={i} style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
              {b}
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <h2 style={{ fontSize: '1.3rem', marginBottom: 16, textAlign: 'center' }}>
        Pilih Paket Kamu
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 32,
        }}
      >
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className="card"
              style={{
                padding: 20,
                textAlign: 'left',
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--gold)' : '1px solid var(--border)',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(212, 175, 91, 0.1), rgba(212, 175, 91, 0.02))'
                  : 'var(--surface)',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: 'inherit',
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'var(--gold)',
                    color: '#1a1a1a',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 10,
                  }}
                >
                  ⭐ POPULER
                </div>
              )}

              {plan.discount > 0 && (
                <div
                  style={{
                    display: 'inline-block',
                    background: 'rgba(212, 107, 91, 0.15)',
                    color: '#D46B5B',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    marginBottom: 10,
                  }}
                >
                  🔥 Diskon {plan.discount}% hanya untuk kamu!
                </div>
              )}

              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 2 }}>{plan.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                {plan.duration}
              </div>

              {plan.discount > 0 && (
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    textDecoration: 'line-through',
                    marginBottom: 2,
                  }}
                >
                  {formatRupiah(plan.normalPrice)}
                </div>
              )}

              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  marginBottom: 4,
                }}
              >
                {formatRupiah(plan.price)}
              </div>

              {plan.discount > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#5BBF8A', fontWeight: 600 }}>
                  Hemat {formatRupiah(plan.normalPrice - plan.price)}
                </div>
              )}

              {isSelected && (
                <div
                  style={{
                    marginTop: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.8rem',
                    color: 'var(--gold)',
                    fontWeight: 600,
                  }}
                >
                  <Check size={14} />
                  Dipilih
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* CARA BAYAR */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          💳 Cara Bayar
        </h3>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <p style={{ marginTop: 0 }}>
            Bayar langsung lewat <strong style={{ color: 'var(--text)' }}>Sociabuzz</strong>. Klik tombol di bawah,
            pilih nominal sesuai paket yang kamu pilih, lalu selesaikan pembayaran.
          </p>

          <div
            style={{
              padding: 16,
              background: 'linear-gradient(135deg, rgba(212, 175, 91, 0.1), rgba(212, 175, 91, 0.02))',
              border: '1px solid var(--gold)',
              borderRadius: 'var(--radius)',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Nominal yang perlu dibayar:
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)', marginBottom: 16 }}>
              {formatRupiah(currentPlan?.price || 0)}
            </div>
            <a
              href="https://sociabuzz.com/heavensquill/tribe"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--gold"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              <Coffee size={18} />
              Bayar via Sociabuzz
            </a>
          </div>

          <div
            style={{
              padding: 12,
              background: 'var(--bg)',
              borderRadius: 'var(--radius)',
              fontSize: '0.85rem',
              lineHeight: 1.7,
            }}
          >
            <strong style={{ color: 'var(--text)' }}>📌 Langkah-langkah:</strong>
            <ol style={{ paddingLeft: 20, margin: '8px 0 0' }}>
              <li>Klik tombol <strong style={{ color: 'var(--gold)' }}>Bayar via Sociabuzz</strong> di atas.</li>
              <li>Pilih nominal sesuai paket (<strong style={{ color: 'var(--text)' }}>{formatRupiah(currentPlan?.price || 0)}</strong>).</li>
              <li>Selesaikan pembayaran (bisa via QRIS, e-wallet, atau kartu).</li>
              <li><strong style={{ color: 'var(--text)' }}>Screenshot bukti pembayaran</strong>.</li>
              <li>Upload screenshot-nya di form di bawah.</li>
            </ol>
          </div>

          <p style={{ marginBottom: 0, marginTop: 12, fontSize: '0.8rem', fontStyle: 'italic' }}>
            ⚠️ Pastikan nominal transfer <strong>sesuai</strong> dengan harga paket yang kamu pilih.
          </p>
        </div>
      </div>

      {/* FORM UPLOAD BUKTI */}
      <form onSubmit={handleSubmit} className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Upload size={18} color="var(--gold)" />
          Upload Bukti Transfer
        </h3>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
            Bukti Transfer *
          </label>
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

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
            Catatan (opsional)
          </label>
          <textarea
            placeholder="Contoh: Transfer via Sociabuzz tanggal 26 Sep, a/n Budi"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: 10,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        {message && (
          <div
            style={{
              padding: 12,
              marginBottom: 12,
              borderRadius: 'var(--radius)',
              fontSize: '0.85rem',
              background: message.includes('Berhasil') ? 'rgba(91, 191, 138, 0.1)' : 'rgba(212, 107, 91, 0.1)',
              border: message.includes('Berhasil') ? '1px solid #5BBF8A' : '1px solid #D46B5B',
              color: message.includes('Berhasil') ? '#5BBF8A' : '#D46B5B',
            }}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          className="btn btn--gold"
          disabled={submitting || isPending}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {submitting ? <Loader size={16} className="spin" /> : <Upload size={16} />}
          {submitting ? 'Mengirim...' : isPending ? 'Menunggu Konfirmasi' : 'Kirim Konfirmasi'}
        </button>
      </form>
    </div>
  )
                     }
