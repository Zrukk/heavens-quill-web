import { Crown } from 'lucide-react'

/**
 * Badge kecil "Member" dengan icon crown.
 * size: 'small' | 'medium'
 */
export default function MemberBadge({ size = 'small' }) {
  const sizes = {
    small: { fontSize: '0.65rem', padding: '1px 6px', iconSize: 10 },
    medium: { fontSize: '0.75rem', padding: '3px 8px', iconSize: 12 },
  }
  const s = sizes[size] || sizes.small

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        fontSize: s.fontSize,
        fontWeight: 700,
        padding: s.padding,
        borderRadius: 10,
        background: 'linear-gradient(135deg, var(--gold), var(--gold-hover))',
        color: '#1a1a1a',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        letterSpacing: 0.3,
        boxShadow: '0 0 8px rgba(212, 175, 91, 0.3)',
      }}
      title="Member Heaven's Quill"
    >
      <Crown size={s.iconSize} strokeWidth={2.5} />
      MEMBER
    </span>
  )
}
