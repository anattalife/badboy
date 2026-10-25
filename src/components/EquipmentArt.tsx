import type { EquipmentKind } from '@/lib/format'

/**
 * Placeholder line illustrations used until real photos are uploaded.
 * Generic machine silhouettes, drawn for this site.
 */
const Wheel = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="currentColor" />
    <circle cx={cx} cy={cy} r={r * 0.42} fill="var(--art-bg)" />
  </g>
)

const shapes: Record<EquipmentKind, React.ReactNode> = {
  'zero-turn': (
    <g>
      <rect x="44" y="96" width="132" height="12" rx="3" fill="currentColor" />
      <path d="M86 96 L96 62 H150 L162 96 Z" fill="currentColor" opacity="0.85" />
      <path d="M112 62 L118 34 H140 L144 62 Z" fill="currentColor" />
      <path d="M126 34 V22 M150 34 V26 M150 26 H118" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Wheel cx={162} cy={98} r={20} />
      <Wheel cx={64} cy={110} r={9} />
    </g>
  ),
  'stand-on': (
    <g>
      <rect x="40" y="98" width="120" height="11" rx="3" fill="currentColor" />
      <path d="M120 98 V54 H160 L172 98 Z" fill="currentColor" opacity="0.85" />
      <path d="M172 98 H196 V104 H172" fill="currentColor" />
      <path d="M150 54 V30 H172" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
      <Wheel cx={158} cy={100} r={18} />
      <Wheel cx={58} cy={111} r={8} />
    </g>
  ),
  'walk-behind': (
    <g>
      <rect x="40" y="98" width="110" height="11" rx="3" fill="currentColor" />
      <path d="M110 98 V62 H156 L162 98 Z" fill="currentColor" opacity="0.85" />
      <path d="M156 64 L194 30" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M186 26 L202 36" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <Wheel cx={146} cy={100} r={17} />
      <Wheel cx={56} cy={111} r={8} />
    </g>
  ),
  push: (
    <g>
      <path d="M70 108 L80 76 H140 L148 108 Z" fill="currentColor" opacity="0.85" />
      <rect x="92" y="62" width="34" height="16" rx="4" fill="currentColor" />
      <path d="M144 80 L184 30 M176 26 L192 36" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <Wheel cx={82} cy={110} r={12} />
      <Wheel cx={140} cy={110} r={12} />
    </g>
  ),
  tractor: (
    <g>
      <path d="M58 98 V72 H118 V98 Z" fill="currentColor" opacity="0.85" />
      <path d="M118 98 V40 H164 L170 98 Z" fill="currentColor" />
      <path d="M126 48 H156 V70 H126 Z" fill="var(--art-bg)" opacity="0.7" />
      <path d="M78 72 V56" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <Wheel cx={158} cy={96} r={26} />
      <Wheel cx={74} cy={106} r={14} />
    </g>
  ),
  implement: (
    <g>
      <path d="M48 90 H184 L176 108 H56 Z" fill="currentColor" opacity="0.85" />
      <path d="M100 90 L116 56 H140 L132 90" fill="currentColor" />
      <path d="M116 56 L106 44 M140 56 L150 44" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <Wheel cx={166} cy={110} r={8} />
    </g>
  ),
  utv: (
    <g>
      <path d="M40 92 H198 L190 74 H150 L134 46 H88 L72 74 H48 Z" fill="currentColor" opacity="0.85" />
      <path d="M92 52 H130 L142 74 H82 Z" fill="var(--art-bg)" opacity="0.7" />
      <path d="M88 46 V40 H134 V46" stroke="currentColor" strokeWidth="4" fill="none" />
      <Wheel cx={70} cy={98} r={18} />
      <Wheel cx={170} cy={98} r={18} />
    </g>
  ),
  loader: (
    <g>
      <path d="M80 100 V58 H130 V100 Z" fill="currentColor" opacity="0.85" />
      <path d="M96 58 V36 H124 V58" stroke="currentColor" strokeWidth="5" fill="none" />
      <path d="M130 66 L176 82 L176 104 H200 L194 84" stroke="currentColor" strokeWidth="6" fill="none" strokeLinejoin="round" />
      <rect x="62" y="98" width="88" height="14" rx="7" fill="currentColor" />
      <Wheel cx={76} cy={105} r={8} />
      <Wheel cx={136} cy={105} r={8} />
    </g>
  ),
  tool: (
    <g>
      <path d="M50 104 L168 46" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <rect x="150" y="30" width="44" height="30" rx="6" fill="currentColor" />
      <path d="M40 98 L64 110 L58 118 L34 106 Z" fill="currentColor" opacity="0.85" />
      <path d="M118 62 L128 80" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
}

export function EquipmentArt({
  kind,
  className = '',
  label,
  notice = true,
}: {
  kind: EquipmentKind
  className?: string
  label?: string
  /** Show the “Photo coming soon” tag (off for category icons). */
  notice?: boolean
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-haze/55 text-ridge [--art-bg:var(--color-fescue)] ${className}`}
    >
      <svg
        viewBox="0 0 240 140"
        className="h-full w-full"
        role="img"
        aria-hidden={notice ? undefined : true}
        aria-label={notice ? (label ? `${label} (photo coming soon)` : 'Photo coming soon') : undefined}
      >
        <line x1="20" y1="122" x2="220" y2="122" stroke="currentColor" strokeWidth="2" opacity="0.35" />
        {shapes[kind]}
      </svg>
      {notice ? <span className="absolute right-2.5 top-2 rounded bg-paper/80 px-1.5 py-0.5 text-[0.7rem] text-steel">Photo coming soon</span> : null}
    </div>
  )
}
