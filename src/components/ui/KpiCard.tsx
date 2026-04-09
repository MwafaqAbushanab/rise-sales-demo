import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger';
type Size = 'sm' | 'md' | 'lg';
type Trend = 'up' | 'down' | 'flat';

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number | string;
  trend?: Trend;
  caption?: string;
  icon?: ReactNode;
  tone?: Tone;
  size?: Size;
  className?: string;
}

const toneMap: Record<
  Tone,
  { card: string; value: string; deltaUp: string; deltaDown: string }
> = {
  default: {
    card: 'bg-zinc-100/70 ring-1 ring-zinc-200',
    value: 'text-zinc-950',
    deltaUp: 'text-emerald-600',
    deltaDown: 'text-rose-600',
  },
  primary: {
    card: 'bg-blue-100/70 ring-1 ring-blue-200/60',
    value: 'text-blue-700',
    deltaUp: 'text-emerald-600',
    deltaDown: 'text-rose-600',
  },
  success: {
    card: 'bg-emerald-100/70 ring-1 ring-emerald-200/60',
    value: 'text-emerald-700',
    deltaUp: 'text-emerald-700',
    deltaDown: 'text-rose-600',
  },
  warning: {
    card: 'bg-amber-100/70 ring-1 ring-amber-200/60',
    value: 'text-amber-700',
    deltaUp: 'text-emerald-600',
    deltaDown: 'text-rose-600',
  },
  danger: {
    card: 'bg-rose-100/70 ring-1 ring-rose-200/60',
    value: 'text-rose-700',
    deltaUp: 'text-emerald-600',
    deltaDown: 'text-rose-700',
  },
};

const sizeMap: Record<
  Size,
  { pad: string; label: string; value: string; caption: string }
> = {
  sm: { pad: 'p-3', label: 'text-xs', value: 'text-xl', caption: 'text-[11px]' },
  md: { pad: 'p-4', label: 'text-sm', value: 'text-2xl', caption: 'text-xs' },
  lg: { pad: 'p-6', label: 'text-sm', value: 'text-3xl', caption: 'text-sm' },
};

export function KpiCard({
  label,
  value,
  delta,
  trend = 'flat',
  caption,
  icon,
  tone = 'primary',
  size = 'md',
  className,
}: KpiCardProps) {
  const t = toneMap[tone];
  const s = sizeMap[size];

  const deltaValue =
    typeof delta === 'number' ? `${delta > 0 ? '+' : ''}${delta}%` : delta;

  const isUp = trend === 'up';
  const isDown = trend === 'down';
  const DeltaIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl shadow-sm transition-transform hover:scale-[1.02]',
        t.card,
        s.pad,
        'min-h-[92px]',
        className
      )}
    >
      <span className="pointer-events-none absolute -right-6 -top-6 inline-flex h-16 w-16 rounded-full bg-black/5" />
      <span className="pointer-events-none absolute -right-2 -top-2 inline-flex h-8 w-8 rounded-full bg-black/5" />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className={cn('font-medium text-zinc-700', s.label)}>
            {label}
          </div>
          <div className={cn('font-semibold tracking-tight', t.value, s.value)}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {caption ? (
            <div className={cn('text-zinc-500', s.caption)}>
              {caption}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {typeof deltaValue !== 'undefined' && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-medium',
                isUp ? t.deltaUp : isDown ? t.deltaDown : 'text-zinc-500'
              )}
            >
              <DeltaIcon className="h-4 w-4" aria-hidden />
              {deltaValue}
            </div>
          )}
          {icon ? (
            <div className="rounded-full bg-white/40 p-1.5">
              {icon}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 h-0.5 w-16 rounded bg-current opacity-20" />
    </div>
  );
}
