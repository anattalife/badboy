/** Layered ridge silhouette under the home page hero. Tinted to fit any dealer color. */
export function RidgeLine({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 200"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block w-full ${className}`}
    >
      <path
        d="M0 120 C120 88 210 70 320 92 C420 112 470 60 590 58 C710 56 760 100 880 96 C1000 92 1060 44 1180 50 C1290 56 1360 86 1440 80 V200 H0 Z"
        fill="#ffffff"
        opacity="0.06"
      />
      <path
        d="M0 150 C140 128 240 110 360 128 C480 146 560 104 700 108 C840 112 900 146 1040 140 C1180 134 1260 106 1440 118 V200 H0 Z"
        fill="#ffffff"
        opacity="0.1"
      />
      <path
        d="M0 182 C180 170 300 160 460 170 C620 180 760 158 920 164 C1080 170 1240 186 1440 172 V200 H0 Z"
        fill="var(--color-paper)"
      />
    </svg>
  )
}
