import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import type { ReactNode } from 'react';

type Direction = 'left' | 'right' | 'up' | 'down';

interface SlideTransitionProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  distance?: number;
}

const AXIS: Record<Direction, { prop: 'translateX' | 'translateY'; sign: number }> = {
  left: { prop: 'translateX', sign: -1 },
  right: { prop: 'translateX', sign: 1 },
  up: { prop: 'translateY', sign: -1 },
  down: { prop: 'translateY', sign: 1 },
};

export function SlideTransition({
  children,
  direction = 'up',
  delay = 0,
  distance = 60,
}: SlideTransitionProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delayedFrame = Math.max(0, frame - delay);

  const progress = spring({
    frame: delayedFrame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const opacity = interpolate(delayedFrame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const { prop, sign } = AXIS[direction];
  const offset = (1 - progress) * distance * sign;

  return (
    <div
      style={{
        opacity,
        transform: `${prop}(${offset}px)`,
      }}
    >
      {children}
    </div>
  );
}
