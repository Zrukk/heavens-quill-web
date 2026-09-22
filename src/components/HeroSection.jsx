import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, Library, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function HeroSection() {
  const [stats, setStats] = useState({ novels: 0, chapters: 0, readers: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [novelsRes, chaptersRes, readersRes] = await Promise.all([
        supabase.from('novels').select('*', { count: 'exact', head: true }),
        supabase.from('chapters').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        novels: novelsRes.count ?? 0,
        chapters: chaptersRes.count ?? 0,
        readers: readersRes.count ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const formatNumber = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`
    return `${n}+`
  }

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius)',
        padding: '48px 24px',
        marginBottom: 32,
        background: 'linear-gradient(135deg, rgba(212, 175, 91, 0.12) 0%, rgba(91, 168, 212, 0.08) 50%, transparent 100%)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      {/* Dekorasi background */}
      <div
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 91, 0.2), transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -80,
          left: -80,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91, 168, 212, 0.15), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <img
            src="/heavens_quill_icon_dark.png"
            alt="Heaven's Quill"
            style={{
              width: 72,
              height: 72,
              objectFit: 'contain',
              borderRadius: 12,
            }}
          />
        </div>

        {/* Tagline */}
        <h1
          className="gradient-text"
          style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: 12,
          }}
        >
          Baca Novel Terjemahan Berkualitas
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)',
            marginBottom: 28,
            lineHeight: 1.6,
          }}
        >
          Gratis, tanpa ribet. Tionghoa, Jepang, dan Korea — semua dalam Bahasa Indonesia.
        </p>

        {/* Tombol CTA */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 32,
          }}
        >
          <a
            href="#daftar-novel"
            className="btn btn--gold"
            style={{
              padding: '12px 24px',
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            <BookOpen size={18} />
            Mulai Baca
          </a>
          <Link
            to="/leaderboard"
            className="btn"
            style={{
              padding: '12px 24px',
              fontSize: '0.95rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Wall of Fame
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Statistik */}
        {!loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            <StatItem icon={<Library size={18} />} value={formatNumber(stats.novels)} label="Novel" />
            <StatItem icon={<BookOpen size={18} />} value={formatNumber(stats.chapters)} label="Chapter" />
            <StatItem icon={<Users size={18} />} value={formatNumber(stats.readers)} label="Pembaca" />
          </div>
        )}
      </div>
    </div>
  )
}

function StatItem({ icon, value, label }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ color: 'var(--gold)' }}>{icon}</span>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{value}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  )
                                               }
