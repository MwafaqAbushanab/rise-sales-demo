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
import { CountUp } from './components/CountUp';

export interface FinancialSnapshotProps {
  institutionName: string;
  // Health score
  overallScore: number;
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  capitalAdequacy: number;
  assetQuality: number;
  earnings: number;
  liquidity: number;
  growth: number;
  // Key ratios
  netWorthRatio: number;
  delinquencyRatio: number;
  efficiencyRatio: number;
  coverageRatio: number;
  // Loan composition percentages
  loanComposition: {
    realEstate: number;
    auto: number;
    creditCard: number;
    otherConsumer: number;
    commercial: number;
  };
}

const RISK_COLORS: Record<string, string> = {
  low: '#10b981',
  moderate: '#f59e0b',
  elevated: '#f97316',
  high: '#ef4444',
};

const SUB_SCORE_COLORS = [
  BRAND.colors.emerald,
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
];

// Scene 1: Title (frames 0–90)
function TitleScene({ institutionName }: { institutionName: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const lineWidth = interpolate(frame, [30, 70], [0, 100], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        height: '100%',
      }}
    >
      <SlideTransition direction="up" delay={0}>
        <span
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: BRAND.colors.emerald,
            fontFamily: BRAND.fonts.primary,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Quarterly Financial Snapshot
        </span>
      </SlideTransition>
      <h1
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: BRAND.colors.white,
          fontFamily: BRAND.fonts.primary,
          textAlign: 'center',
          transform: `scale(${scale})`,
          lineHeight: 1.1,
        }}
      >
        {institutionName}
      </h1>
      <div
        style={{
          width: `${lineWidth}%`,
          maxWidth: 180,
          height: 3,
          background: `linear-gradient(90deg, ${BRAND.gradients.primary[0]}, ${BRAND.gradients.primary[1]})`,
          borderRadius: 2,
        }}
      />
    </div>
  );
}

// Scene 2: Health score ring (frames 70–220)
function HealthRingScene({ overallScore, riskLevel }: FinancialSnapshotProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ringProgress = spring({ frame, fps, config: { damping: 20, stiffness: 60 } });
  const scoreValue = Math.round(overallScore * ringProgress);
  const circumference = 2 * Math.PI * 100;
  const strokeDash = circumference * (overallScore / 100) * ringProgress;
  const ringColor = RISK_COLORS[riskLevel] ?? BRAND.colors.emerald;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 60,
        height: '100%',
      }}
    >
      <div style={{ position: 'relative', width: 260, height: 260 }}>
        <svg width={260} height={260} viewBox="0 0 260 260">
          <circle cx={130} cy={130} r={100} fill="none" stroke={BRAND.colors.darkAlt} strokeWidth={16} />
          <circle
            cx={130}
            cy={130}
            r={100}
            fill="none"
            stroke={ringColor}
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            transform="rotate(-90 130 130)"
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
              fontSize: 64,
              fontWeight: 800,
              color: BRAND.colors.white,
              fontFamily: BRAND.fonts.primary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {scoreValue}
          </span>
          <span
            style={{ fontSize: 14, color: BRAND.colors.textMuted, fontFamily: BRAND.fonts.primary, textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            Overall Health
          </span>
        </div>
      </div>

      <SlideTransition direction="right" delay={15}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: BRAND.colors.white, fontFamily: BRAND.fonts.primary }}>
            Financial Health
          </h2>
          <div
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              backgroundColor: `${ringColor}22`,
              border: `1px solid ${ringColor}`,
              alignSelf: 'flex-start',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: ringColor, fontFamily: BRAND.fonts.primary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {riskLevel} risk
            </span>
          </div>
          <p style={{ fontSize: 16, color: BRAND.colors.textMuted, fontFamily: BRAND.fonts.primary, maxWidth: 360, lineHeight: 1.5 }}>
            Composite score based on capital adequacy, asset quality, earnings, liquidity, and growth.
          </p>
        </div>
      </SlideTransition>
    </div>
  );
}

// Scene 3: Sub-score bars (frames 190–370)
function SubScoresScene(props: FinancialSnapshotProps) {
  const scores = [
    { label: 'Capital Adequacy', value: props.capitalAdequacy },
    { label: 'Asset Quality', value: props.assetQuality },
    { label: 'Earnings', value: props.earnings },
    { label: 'Liquidity', value: props.liquidity },
    { label: 'Growth', value: props.growth },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', justifyContent: 'center' }}>
      <SlideTransition direction="up" delay={0}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: BRAND.colors.white, fontFamily: BRAND.fonts.primary, marginBottom: 8 }}>
          Score Breakdown
        </h2>
      </SlideTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {scores.map((s, i) => (
          <SlideTransition key={s.label} direction="right" delay={i * 10}>
            <AnimatedBar
              label={s.label}
              value={s.value}
              maxValue={100}
              delay={i * 10}
              color={SUB_SCORE_COLORS[i]}
              formatValue={(v) => `${Math.round(v)}/100`}
            />
          </SlideTransition>
        ))}
      </div>
    </div>
  );
}

// Scene 4: Key ratios (frames 340–480)
function RatiosScene(props: FinancialSnapshotProps) {
  const ratios = [
    { label: 'Net Worth Ratio', value: props.netWorthRatio, suffix: '%', decimals: 1 },
    { label: 'Delinquency', value: props.delinquencyRatio * 100, suffix: '%', decimals: 2 },
    { label: 'Efficiency Ratio', value: props.efficiencyRatio, suffix: '%', decimals: 1 },
    { label: 'Coverage Ratio', value: props.coverageRatio, suffix: 'x', decimals: 1 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', justifyContent: 'center' }}>
      <SlideTransition direction="up" delay={0}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: BRAND.colors.white, fontFamily: BRAND.fonts.primary, marginBottom: 8 }}>
          Key Ratios
        </h2>
      </SlideTransition>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {ratios.map((r, i) => (
          <SlideTransition key={r.label} direction="up" delay={i * 12}>
            <div
              style={{
                padding: '20px 28px',
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: `1px solid ${BRAND.colors.darkAlt}`,
                minWidth: 200,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 13, color: BRAND.colors.textMuted, fontFamily: BRAND.fonts.primary, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {r.label}
              </span>
              <CountUp
                target={r.value}
                delay={i * 12}
                duration={40}
                suffix={r.suffix}
                decimals={r.decimals}
                fontSize={36}
                color={BRAND.colors.white}
              />
            </div>
          </SlideTransition>
        ))}
      </div>
    </div>
  );
}

// Scene 5: Loan composition bar (frames 450–550)
function LoanCompositionScene({ loanComposition }: FinancialSnapshotProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const barProgress = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });

  const segments = [
    { label: 'Real Estate', value: loanComposition.realEstate, color: '#059669' },
    { label: 'Auto', value: loanComposition.auto, color: '#10b981' },
    { label: 'Credit Card', value: loanComposition.creditCard, color: '#14b8a6' },
    { label: 'Other Consumer', value: loanComposition.otherConsumer, color: '#06b6d4' },
    { label: 'Commercial', value: loanComposition.commercial, color: '#0ea5e9' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, height: '100%', justifyContent: 'center' }}>
      <SlideTransition direction="up" delay={0}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: BRAND.colors.white, fontFamily: BRAND.fonts.primary }}>
          Loan Composition
        </h2>
      </SlideTransition>

      {/* Stacked bar */}
      <div style={{ width: '100%', height: 48, borderRadius: 12, overflow: 'hidden', display: 'flex' }}>
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{
              width: `${seg.value * barProgress}%`,
              height: '100%',
              backgroundColor: seg.color,
              transition: 'width 0.3s',
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {segments.map((seg, i) => (
          <SlideTransition key={seg.label} direction="up" delay={10 + i * 6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: seg.color }} />
              <span style={{ fontSize: 14, color: BRAND.colors.textMuted, fontFamily: BRAND.fonts.primary }}>
                {seg.label} {seg.value.toFixed(0)}%
              </span>
            </div>
          </SlideTransition>
        ))}
      </div>
    </div>
  );
}

// Scene 6: CTA closing (frames 520–600)
function ClosingScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 12 } });
  const buttonOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, height: '100%' }}>
      <SlideTransition direction="up" delay={0}>
        <h2
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: BRAND.colors.white,
            fontFamily: BRAND.fonts.primary,
            textAlign: 'center',
            transform: `scale(${scale})`,
          }}
        >
          Deep insights, delivered quarterly
        </h2>
      </SlideTransition>
      <SlideTransition direction="up" delay={10}>
        <p style={{ fontSize: 20, color: BRAND.colors.textMuted, fontFamily: BRAND.fonts.primary, textAlign: 'center' }}>
          Powered by NCUA 5300 Call Report data
        </p>
      </SlideTransition>
      <div
        style={{
          opacity: buttonOpacity,
          marginTop: 12,
          padding: '14px 44px',
          borderRadius: 12,
          background: `linear-gradient(135deg, ${BRAND.gradients.primary[0]}, ${BRAND.gradients.primary[1]})`,
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700, color: BRAND.colors.white, fontFamily: BRAND.fonts.primary }}>
          Schedule a Demo
        </span>
      </div>
    </div>
  );
}

export function FinancialSnapshot(props: FinancialSnapshotProps) {
  return (
    <AbsoluteFill>
      <BrandFrame>
        <Sequence from={0} durationInFrames={90}>
          <AbsoluteFill style={{ padding: '80px 48px 48px' }}>
            <TitleScene institutionName={props.institutionName} />
          </AbsoluteFill>
        </Sequence>

        <Sequence from={70} durationInFrames={150}>
          <AbsoluteFill style={{ padding: '80px 48px 48px' }}>
            <HealthRingScene {...props} />
          </AbsoluteFill>
        </Sequence>

        <Sequence from={190} durationInFrames={180}>
          <AbsoluteFill style={{ padding: '80px 48px 48px' }}>
            <SubScoresScene {...props} />
          </AbsoluteFill>
        </Sequence>

        <Sequence from={340} durationInFrames={140}>
          <AbsoluteFill style={{ padding: '80px 48px 48px' }}>
            <RatiosScene {...props} />
          </AbsoluteFill>
        </Sequence>

        <Sequence from={450} durationInFrames={100}>
          <AbsoluteFill style={{ padding: '80px 48px 48px' }}>
            <LoanCompositionScene {...props} />
          </AbsoluteFill>
        </Sequence>

        <Sequence from={520} durationInFrames={80}>
          <AbsoluteFill style={{ padding: '80px 48px 48px' }}>
            <ClosingScene />
          </AbsoluteFill>
        </Sequence>
      </BrandFrame>
    </AbsoluteFill>
  );
}
