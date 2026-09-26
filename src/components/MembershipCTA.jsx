import { Link } from 'react-router-dom'
import { Crown, Sparkles, ArrowRight } from 'lucide-react'
import { useMembership } from '../lib/MembershipContext'
import { useAuth } from '../lib/AuthContext'

export default function MembershipCTA() {
  const { user } = useAuth()
  const { isMember, loading } = useMembership()

  // Gak muncul kalau loading / user udah member
  if (loading || isMember) return null

  return (
    <div
      className="card membership-cta"
      style={{
        padding: '24px',
        marginBottom: 32,
        background: 'linear-gradient(135deg, rgba(212, 175, 91, 0.15), rgba(91, 168, 212, 0.08), transparent)',
        border: '1px solid var(--gold)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow decoration */}
      <div
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 91, 0.25), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="membership-cta-content"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--gold), var(--gold-hover))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 24px rgba(212, 175, 91, 0.4)',
          }}
        >
          <Crown size={28} color="#1a1a1a" strokeWidth={2.5} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(212, 107, 91, 0.15)',
              color: '#D46B5B',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 10,
              marginBottom: 8,
            }}
          >
            <Sparkles size={11} />
            DISKON HINGGA 25%
          </div>

          <h2
            className="gradient-text"
            style={{
              fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
              marginBottom: 6,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Jadi Member, Baca Tanpa Iklan 👑
          </h2>

          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Dukung Heaven's Quill mulai <strong style={{ color: 'var(--gold)' }}>Rp30.000/bulan</strong>.
            Nikmati pengalaman baca yang lebih nyaman + badge eksklusif.
          </p>
        </div>

        {/* Button */}
        <Link
          to={user ? '/membership' : '/login'}
          className="btn btn--gold"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            fontSize: '0.9rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 20px rgba(212, 175, 91, 0.4)',
          }}
        >
          {user ? 'Jadi Member' : 'Login & Jadi Member'}
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* CSS responsive */}
      <style>{`
        @media (max-width: 600px) {
          .membership-cta-content {
            flex-direction: column;
            text-align: center;
          }
          .membership-cta-content > a {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
              }
