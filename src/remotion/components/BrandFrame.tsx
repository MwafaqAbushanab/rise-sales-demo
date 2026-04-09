import { useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import type { ReactNode } from 'react';
import { BRAND } from '../constants';
import { RiseLogo } from './RiseLogo';

interface BrandFrameProps {
  children: ReactNode;
  showLogo?: boolean;
  showFooter?: boolean;
}

export function BrandFrame({
  children,
  showLogo = true,
  showFooter = true,
}: BrandFrameProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const bgOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: BRAND.colors.dark,
        fontFamily: BRAND.fonts.primary,
        overflow: 'hidden',
        opacity: bgOpacity,
      }}
    >
      {/* Header gradient bar */}
      <div
        style={{
          height: 6,
          width: '100%',
          background: `linear-gradient(90deg, ${BRAND.gradients.primary[0]}, ${BRAND.gradients.primary[1]})`,
          flexShrink: 0,
        }}
      />

      {/* Logo area */}
      {showLogo && (
        <div style={{ padding: '28px 48px 0', flexShrink: 0 }}>
          <RiseLogo size={36} showTagline />
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          flex: 1,
          padding: '32px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>

      {/* Footer bar */}
      {showFooter && (
        <div
          style={{
            padding: '16px 48px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: `1px solid ${BRAND.colors.darkAlt}`,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: BRAND.colors.textMuted,
              fontFamily: BRAND.fonts.primary,
            }}
          >
            Powered by Rise Analytics
          </span>
          <span
            style={{
              fontSize: 13,
              color: BRAND.colors.textMuted,
              fontFamily: BRAND.fonts.primary,
            }}
          >
            riseanalytics.com
          </span>
        </div>
      )}

      {/* Bottom gradient bar */}
      <div
        style={{
          height: 4,
          width: '100%',
          background: `linear-gradient(90deg, ${BRAND.gradients.primary[0]}, ${BRAND.gradients.primary[1]})`,
          flexShrink: 0,
        }}
      />
    </div>
  );
}
