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
import { CountUp } from './components/CountUp';
import { SlideTransition } from './components/SlideTransition';

export interface CompetitivePitchProps {
  competitorName: string;
  institutionType: 'Credit Union' | 'Community Bank';
  estimatedROI: number;
  features: FeatureRow[];
  differentiators: string[];
  clientCount: string;
  retentionRate: string;
  nps: string;
}

export interface FeatureRow {
  name: string;
  rise: boolean;
  competitor: boolean;
}

// Scene 1: Title (frames 0–90)
function TitleScene({ competitorName }: { competitorName: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, height: '100%' }}>
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
          Competitive Analysis
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
          lineHeight: 1.15,
        }}
      >
        Why Rise Analytics?
      </h1>
      <SlideTransition direction="up" delay={15}>
        <p style={{ fontSize: 22, color: BRAND.colors.textMuted, fontFamily: BRAND.fonts.primary }}>
          Rise Analytics vs. {competitorName}
        </p>
      </SlideTransition>
    </div>
  );
}

// Scene 2: Feature comparison table (frames 70–260)
function ComparisonScene({ features, competitorName }: CompetitivePitchProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', justifyContent: 'center' }}>
      <SlideTransition direction="up" delay={0}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: BRAND.colors.white, fontFamily: BRAND.fonts.primary, marginBottom: 8 }}>
          Feature Comparison
        </h2>
      </SlideTransition>

      {/* Table header */}
      <SlideTransition direction="down" delay={5}>
        <div style={{ display: 'flex', padding: '12px 20px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <span style={{ flex: 2, fontSize: 14, fontWeight: 600, color: BRAND.colors.textMuted, fontFamily: BRAND.fonts.primary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Feature
          </span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: BRAND.colors.emerald, fontFamily: BRAND.fonts.primary, textAlign: 'center' }}>
            Rise Analytics
          </span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: BRAND.colors.textMuted, fontFamily: BRAND.fonts.primary, textAlign: 'center' }}>
            {competitorName}
          </span>
        </div>
      </SlideTransition>

      {/* Rows */}
      {features.slice(0, 7).map((row, i) => (
        <SlideTransition key={row.name} direction="right" delay={12 + i * 8}>
          <div
            style={{
              display: 'flex',
              padding: '14px 20px',
              borderRadius: 10,
              backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
            }}
          >
            <span style={{ flex: 2, fontSize: 16, color: BRAND.colors.white, fontFamily: BRAND.fonts.primary, fontWeight: 500 }}>
              {row.name}
            </span>
            <span style={{ flex: 1, textAlign: 'center', fontSize: 20 }}>
              {row.rise ? '✅' : '❌'}
            </span>
            <span style={{ flex: 1, textAlign: 'center', fontSize: 20 }}>
              {row.competitor ? '✅' : '❌'}
            </span>
          </div>
        </SlideTransition>
      ))}
    </div>
  );
}

// Scene 3: ROI projection (frames 230–380)
function ROIScene({ estimatedROI, institutionType }: CompetitivePitchProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, height: '100%' }}>
      <SlideTransition direction="up" delay={0}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: BRAND.colors.white, fontFamily: BRAND.fonts.primary }}>
          Estimated ROI
        </h2>
      </SlideTransition>

      <SlideTransition direction="up" delay={10}>
        <div
          style={{
            padding: '32px 64px',
            borderRadius: 20,
            background: `linear-gradient(135deg, rgba(5,150,105,0.15), rgba(13,148,136,0.15))`,
            border: `2px solid ${BRAND.colors.emerald}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CountUp target={estimatedROI} delay={10} duration={45} suffix="%" fontSize={72} color={BRAND.colors.emerald} />
          <span style={{ fontSize: 16, color: BRAND.colors.textMuted, fontFamily: BRAND.fonts.primary }}>
            Annual Return on Investment
          </span>
        </div>
      </SlideTransition>

      <SlideTransition direction="up" delay={25}>
        <p style={{ fontSize: 18, color: BRAND.colors.textMuted, fontFamily: BRAND.fonts.primary, textAlign: 'center', maxWidth: 500 }}>
          Based on industry benchmarks for {institutionType === 'Credit Union' ? 'credit unions' : 'community banks'} of similar asset size
        </p>
      </SlideTransition>
    </div>
  );
}

// Scene 4: Differentiators (frames 350–480)
function DifferentiatorsScene({ differentiators }: CompetitivePitchProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', justifyContent: 'center' }}>
      <SlideTransition direction="up" delay={0}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: BRAND.colors.white, fontFamily: BRAND.fonts.primary, marginBottom: 8 }}>
          Key Differentiators
        </h2>
      </SlideTransition>
      {differentiators.slice(0, 5).map((d, i) => (
        <SlideTransition key={i} direction="right" delay={8 + i * 10}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(5,150,105,0.15)',
                border: `1px solid ${BRAND.colors.emerald}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                color: BRAND.colors.emerald,
                fontFamily: BRAND.fonts.primary,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <span style={{ fontSize: 20, color: BRAND.colors.white, fontFamily: BRAND.fonts.primary, fontWeight: 500 }}>
              {d}
            </span>
          </div>
        </SlideTransition>
      ))}
    </div>
  );
}

// Scene 5: Stats (frames 450–540)
function StatsScene({ clientCount, retentionRate, nps }: CompetitivePitchProps) {
  const stats = [
    { label: 'Clients', value: clientCount },
    { label: 'Retention', value: retentionRate },
    { label: 'NPS', value: nps },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40, height: '100%' }}>
      <SlideTransition direction="up" delay={0}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: BRAND.colors.white, fontFamily: BRAND.fonts.primary }}>
          Trusted by Industry Leaders
        </h2>
      </SlideTransition>
      <div style={{ display: 'flex', gap: 48 }}>
        {stats.map((s, i) => (
          <SlideTransition key={s.label} direction="up" delay={10 + i * 10}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 48, fontWeight: 800, color: BRAND.colors.emerald, fontFamily: BRAND.fonts.primary }}>
                {s.value}
              </span>
              <span style={{ fontSize: 16, color: BRAND.colors.textMuted, fontFamily: BRAND.fonts.primary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.label}
              </span>
            </div>
          </SlideTransition>
        ))}
      </div>
    </div>
  );
}

// Scene 6: CTA (frames 510–600)
function CTAScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 12 } });
  const buttonOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, height: '100%' }}>
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
        Let&apos;s Talk
      </h2>
      <SlideTransition direction="up" delay={10}>
        <p style={{ fontSize: 20, color: BRAND.colors.textMuted, fontFamily: BRAND.fonts.primary }}>
          See why teams choose Rise Analytics
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

export function CompetitivePitch(props: CompetitivePitchProps) {
  return (
    <AbsoluteFill>
      <BrandFrame>
        <Sequence from={0} durationInFrames={90}>
          <AbsoluteFill style={{ padding: '80px 48px 48px' }}>
            <TitleScene competitorName={props.competitorName} />
          </AbsoluteFill>
        </Sequence>

        <Sequence from={70} durationInFrames={190}>
          <AbsoluteFill style={{ padding: '80px 48px 48px' }}>
            <ComparisonScene {...props} />
          </AbsoluteFill>
        </Sequence>

        <Sequence from={230} durationInFrames={150}>
          <AbsoluteFill style={{ padding: '80px 48px 48px' }}>
            <ROIScene {...props} />
          </AbsoluteFill>
        </Sequence>

        <Sequence from={350} durationInFrames={130}>
          <AbsoluteFill style={{ padding: '80px 48px 48px' }}>
            <DifferentiatorsScene {...props} />
          </AbsoluteFill>
        </Sequence>

        <Sequence from={450} durationInFrames={90}>
          <AbsoluteFill style={{ padding: '80px 48px 48px' }}>
            <StatsScene {...props} />
          </AbsoluteFill>
        </Sequence>

        <Sequence from={510} durationInFrames={90}>
          <AbsoluteFill style={{ padding: '80px 48px 48px' }}>
            <CTAScene />
          </AbsoluteFill>
        </Sequence>
      </BrandFrame>
    </AbsoluteFill>
  );
}
