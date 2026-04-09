import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { BRAND } from '../constants';

interface AnimatedBarProps {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
  delay?: number;
  height?: number;
  showValue?: boolean;
  formatValue?: (v: number) => string;
}

export function AnimatedBar({
  label,
  value,
  maxValue,
  color = BRAND.colors.emerald,
  delay = 0,
  height = 32,
  showValue = true,
  formatValue = (v) => String(v),
}: AnimatedBarProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delayedFrame = Math.max(0, frame - delay);
  const widthProgress = spring({
    frame: delayedFrame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const opacity = interpolate(delayedFrame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div style={{ opacity, width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 6,
          fontFamily: BRAND.fonts.primary,
        }}
      >
        <span style={{ fontSize: 16, color: BRAND.colors.text, fontWeight: 500 }}>
          {label}
        </span>
        {showValue && (
          <span style={{ fontSize: 16, color: BRAND.colors.textMuted, fontWeight: 600 }}>
            {formatValue(value)}
          </span>
        )}
      </div>
      <div
        style={{
          width: '100%',
          height,
          backgroundColor: BRAND.colors.border,
          borderRadius: height / 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage * widthProgress}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: height / 2,
          }}
        />
      </div>
    </div>
  );
}
