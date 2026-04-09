import { useCurrentFrame, interpolate } from 'remotion';
import { BRAND } from '../constants';

interface CountUpProps {
  target: number;
  delay?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
}

export function CountUp({
  target,
  delay = 0,
  duration = 30,
  prefix = '',
  suffix = '',
  decimals = 0,
  fontSize = 48,
  color = BRAND.colors.text,
  fontWeight = 700,
}: CountUpProps) {
  const frame = useCurrentFrame();

  const delayedFrame = Math.max(0, frame - delay);
  const progress = interpolate(delayedFrame, [0, duration], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const eased = 1 - Math.pow(1 - progress, 3);
  const current = target * eased;

  return (
    <span
      style={{
        fontSize,
        fontWeight,
        fontFamily: BRAND.fonts.primary,
        color,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {prefix}
      {current.toFixed(decimals)}
      {suffix}
    </span>
  );
}
