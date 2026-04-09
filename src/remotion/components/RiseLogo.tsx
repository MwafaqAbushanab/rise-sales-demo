import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { BRAND } from '../constants';

interface RiseLogoProps {
  size?: number;
  showTagline?: boolean;
}

export function RiseLogo({ size = 48, showTagline = false }: RiseLogoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: size * 0.3,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
      >
        <rect width="48" height="48" rx="10" fill={BRAND.colors.emerald} />
        <path
          d="M14 34V20l6-6 6 6v14M26 34V24l4-4 4 4v10"
          stroke={BRAND.colors.white}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="36" cy="14" r="3" fill={BRAND.colors.emeraldLight} />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontSize: size * 0.55,
            fontWeight: 700,
            fontFamily: BRAND.fonts.primary,
            color: BRAND.colors.white,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          Rise Analytics
        </span>
        {showTagline && (
          <span
            style={{
              fontSize: size * 0.22,
              fontWeight: 400,
              fontFamily: BRAND.fonts.primary,
              color: 'rgba(255,255,255,0.7)',
              marginTop: size * 0.05,
              lineHeight: 1,
            }}
          >
            Credit Union Intelligence
          </span>
        )}
      </div>
    </div>
  );
}
