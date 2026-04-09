import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  AbsoluteFill,
} from 'remotion';
import { BRAND } from './constants';
import { BrandFrame } from './components/BrandFrame';
import { AnimatedBar } from './components/AnimatedBar';
import { SlideTransition } from './components/SlideTransition';

export interface ProspectHighlightProps {
  institutionName: string;
  type: 'Credit Union' | 'Community Bank';
  city: string;
  state: string;
  assets: number;
  members: number;
  deposits: number;
  roa: number;
  score: number;
  healthScore?: number;
  riskLevel?: string;
}

function formatCurrency(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value}`;
}

function formatNumber(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return String(value);
}

// Scene 1: Institution intro (frames 0–120)
function IntroScene({ institutionName, type, city, state }: ProspectHighlightProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nameScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const badgeOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });
  const locationOpacity = interpolate(frame, [30, 45], [0, 1], { extrapolateRight: 'clamp' });
  const lineWidth = interpolate(frame, [40, 80], [0, 100], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        height: '100%',
      }}
    >
      <div
        style={{
          opacity: badgeOpacity,
          padding: '8px 20px',
          borderRadius: 999,
          backgroundColor: 'rgba(5, 150, 105, 0.15)',
          border: `1px solid ${BRAND.colors.emerald}`,
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: BRAND.colors.emerald,
            fontFamily: BRAND.fonts.primary,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {type}
        </span>
      </div>

      <h1
        style={{
          fontSize: 64,
          fontWeight: 800,
          color: BRAND.colors.white,
          fontFamily: BRAND.fonts.primary,
          textAlign: 'center',
          transform: `scale(${nameScale})`,
          lineHeight: 1.1,
          maxWidth: '80%',
        }}
      >
        {institutionName}
      </h1>

      <div
        style={{
          width: `${lineWidth}%`,
          maxWidth: 200,
          height: 3,
          background: `linear-gradient(90deg, ${BRAND.gradients.primary[0]}, ${BRAND.gradients.primary[1]})`,
          borderRadius: 2,
        }}
      />

      <p
        style={{
          fontSize: 24,
          color: BRAND.colors.textMuted,
          fontFamily: BRAND.fonts.primary,
          opacity: locationOpacity,
          fontWeight: 400,
        }}
      >
        {city}, {state}
      </p>
    </div>
  );
}

// Scene 2: Key metrics (frames 90–270)
function MetricsScene({ assets, members, deposits, roa, score }: ProspectHighlightProps) {
  const metrics = [
    { label: 'Total Assets', value: formatCurrency(assets), raw: assets, max: 10e9 },
    { label: 'Members', value: formatNumber(members), raw: members, max: 500000 },
    { label: 'Total Deposits', value: formatCurrency(deposits), raw: deposits, max: 8e9 },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 36,
        height: '100%',
        justifyContent: 'center',
      }}
    >
      <SlideTransition direction="up" delay={0}>
        <h2
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: BRAND.colors.white,
            fontFamily: BRAND.fonts.primary,
            marginBottom: 8,
          }}
        >
          Key Metrics
        </h2>
      </SlideTransition>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {metrics.map((m, i) => (
          <SlideTransition key={m.label} direction="right" delay={i * 12}>
            <AnimatedBar
              label={m.label}
              value={m.raw}
              maxValue={m.max}
              delay={i * 12}
              formatValue={() => m.value}
              color={BRAND.colors.emerald}
            />
          </SlideTransition>
        ))}
      </div>

      <SlideTransition direction="up" delay={40}>
        <div style={{ display: 'flex', gap: 32, marginTop: 8 }}>
          <MetricBadge label="ROA" value={`${roa.toFixed(2)}%`} />
          <MetricBadge label="Lead Score" value={`${score}/100`} highlight />
        </div>
      </SlideTransition>
    </div>
  );
}

function MetricBadge({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        padding: '14px 28px',
        borderRadius: 12,
        backgroundColor: highlight
          ? 'rgba(5, 150, 105, 0.15)'
          : 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${highlight ? BRAND.colors.emerald : BRAND.colors.darkAlt}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 13,
          color: BRAND.colors.textMuted,
          fontFamily: BRAND.fonts.primary,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: highlight ? BRAND.colors.emerald : BRAND.colors.white,
          fontFamily: BRAND.fonts.primary,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// Scene 3: Health score (frames 240–390)
function HealthScene({
  healthScore = 0,
  riskLevel = 'moderate',
  institutionName,
}: ProspectHighlightProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ringProgress = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 60 },
  });

  const scoreValue = Math.round(healthScore * ringProgress);
  const circumference = 2 * Math.PI * 90;
  const strokeDash = circumference * (healthScore / 100) * ringProgress;

  const riskColors: Record<string, string> = {
    low: '#10b981',
    moderate: '#f59e0b',
    elevated: '#f97316',
    high: '#ef4444',
  };
  const ringColor = riskColors[riskLevel] ?? BRAND.colors.emerald;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 80,
        height: '100%',
      }}
    >
      <SlideTransition direction="left" delay={0}>
        <div style={{ position: 'relative', width: 240, height: 240 }}>
          <svg width={240} height={240} viewBox="0 0 240 240">
            <circle
              cx={120}
              cy={120}
              r={90}
              fill="none"
              stroke={BRAND.colors.darkAlt}
              strokeWidth={14}
            />
            <circle
              cx={120}
              cy={120}
              r={90}
              fill="none"
              stroke={ringColor}
              strokeWidth={14}
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              transform="rotate(-90 120 120)"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: BRAND.colors.white,
                fontFamily: BRAND.fonts.primary,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {scoreValue}
            </span>
            <span
              style={{
                fontSize: 14,
                color: BRAND.colors.textMuted,
                fontFamily: BRAND.fonts.primary,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Health Score
            </span>
          </div>
        </div>
      </SlideTransition>

      <SlideTransition direction="right" delay={15}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: BRAND.colors.white,
              fontFamily: BRAND.fonts.primary,
            }}
          >
            Financial Health
          </h2>
          <p
            style={{
              fontSize: 18,
              color: BRAND.colors.textMuted,
              fontFamily: BRAND.fonts.primary,
              maxWidth: 400,
              lineHeight: 1.5,
            }}
          >
            {institutionName} shows a{' '}
            <span style={{ color: ringColor, fontWeight: 600 }}>{riskLevel}</span> risk
            profile based on capital adequacy, asset quality, earnings, liquidity, and growth
            indicators.
          </p>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              backgroundColor: `${ringColor}22`,
              border: `1px solid ${ringColor}`,
              alignSelf: 'flex-start',
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: ringColor,
                fontFamily: BRAND.fonts.primary,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {riskLevel} risk
            </span>
          </div>
        </div>
      </SlideTransition>
    </div>
  );
}

// Scene 4: CTA closing (frames 360–450)
function ClosingScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 12 } });
  const buttonOpacity = interpolate(frame, [25, 40], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        height: '100%',
      }}
    >
      <SlideTransition direction="up" delay={0}>
        <h2
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: BRAND.colors.white,
            fontFamily: BRAND.fonts.primary,
            textAlign: 'center',
            transform: `scale(${scale})`,
          }}
        >
          Let&apos;s unlock your potential
        </h2>
      </SlideTransition>

      <SlideTransition direction="up" delay={12}>
        <p
          style={{
            fontSize: 22,
            color: BRAND.colors.textMuted,
            fontFamily: BRAND.fonts.primary,
            textAlign: 'center',
          }}
        >
          Data-driven insights tailored for your institution
        </p>
      </SlideTransition>

      <div
        style={{
          opacity: buttonOpacity,
          marginTop: 16,
          padding: '16px 48px',
          borderRadius: 12,
          background: `linear-gradient(135deg, ${BRAND.gradients.primary[0]}, ${BRAND.gradients.primary[1]})`,
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: BRAND.colors.white,
            fontFamily: BRAND.fonts.primary,
          }}
        >
          Schedule a Demo
        </span>
      </div>
    </div>
  );
}

export function ProspectHighlight(props: ProspectHighlightProps) {
  const hasHealthData = props.healthScore != null && props.healthScore > 0;

  return (
    <AbsoluteFill>
      <BrandFrame>
        {/* Scene 1: Institution intro */}
        <Sequence from={0} durationInFrames={120}>
          <AbsoluteFill style={{ padding: '80px 48px 48px' }}>
            <IntroScene {...props} />
          </AbsoluteFill>
        </Sequence>

        {/* Scene 2: Key metrics */}
        <Sequence from={90} durationInFrames={180}>
          <AbsoluteFill style={{ padding: '80px 48px 48px' }}>
            <MetricsScene {...props} />
          </AbsoluteFill>
        </Sequence>

        {/* Scene 3: Health score (if data available) or skip to closing */}
        {hasHealthData && (
          <Sequence from={240} durationInFrames={150}>
            <AbsoluteFill style={{ padding: '80px 48px 48px' }}>
              <HealthScene {...props} />
            </AbsoluteFill>
          </Sequence>
        )}

        {/* Scene 4: CTA closing */}
        <Sequence from={hasHealthData ? 360 : 240} durationInFrames={90}>
          <AbsoluteFill style={{ padding: '80px 48px 48px' }}>
            <ClosingScene />
          </AbsoluteFill>
        </Sequence>
      </BrandFrame>
    </AbsoluteFill>
  );
}
