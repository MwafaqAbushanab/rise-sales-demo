import { Composition, registerRoot } from 'remotion';
import { ProspectHighlight } from './ProspectHighlight';
import type { ProspectHighlightProps } from './ProspectHighlight';
import { FinancialSnapshot } from './FinancialSnapshot';
import type { FinancialSnapshotProps } from './FinancialSnapshot';
import { CompetitivePitch } from './CompetitivePitch';
import type { CompetitivePitchProps } from './CompetitivePitch';
import { VIDEO } from './constants';

const defaultProspectProps: ProspectHighlightProps = {
  institutionName: 'Sample Credit Union',
  type: 'Credit Union',
  city: 'Orlando',
  state: 'FL',
  assets: 2_500_000_000,
  members: 185_000,
  deposits: 2_100_000_000,
  roa: 0.95,
  score: 82,
  healthScore: 74,
  riskLevel: 'moderate',
};

const defaultSnapshotProps: FinancialSnapshotProps = {
  institutionName: 'Sample Credit Union',
  overallScore: 74,
  riskLevel: 'moderate',
  capitalAdequacy: 82,
  assetQuality: 71,
  earnings: 68,
  liquidity: 75,
  growth: 65,
  netWorthRatio: 10.5,
  delinquencyRatio: 0.012,
  efficiencyRatio: 72.5,
  coverageRatio: 1.8,
  loanComposition: {
    realEstate: 42,
    auto: 22,
    creditCard: 8,
    otherConsumer: 15,
    commercial: 13,
  },
};

const defaultPitchProps: CompetitivePitchProps = {
  competitorName: 'Jack Henry',
  institutionType: 'Credit Union',
  estimatedROI: 175,
  features: [
    { name: 'NCUA 5300 Call Report Analytics', rise: true, competitor: false },
    { name: 'AI-Powered Prospect Intelligence', rise: true, competitor: false },
    { name: 'Real-Time FDIC/NCUA Data', rise: true, competitor: false },
    { name: 'Competitive Battlecards', rise: true, competitor: false },
    { name: 'Financial Health Scoring', rise: true, competitor: false },
    { name: 'Pipeline Management', rise: true, competitor: true },
    { name: 'Basic Reporting', rise: true, competitor: true },
  ],
  differentiators: [
    'Real-time NCUA & FDIC government data integration',
    'AI-driven prospect analysis & lead scoring',
    'Automated financial health assessments',
    'Credit union-specific intelligence layer',
    'Fraction of the cost of enterprise alternatives',
  ],
  clientCount: '150+',
  retentionRate: '96%',
  nps: '72',
};

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="ProspectHighlight"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={ProspectHighlight as any}
        durationInFrames={VIDEO.fps * VIDEO.durations.prospectHighlight}
        fps={VIDEO.fps}
        width={VIDEO.resolutions['1080p'].width}
        height={VIDEO.resolutions['1080p'].height}
        defaultProps={defaultProspectProps}
      />
      <Composition
        id="FinancialSnapshot"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={FinancialSnapshot as any}
        durationInFrames={VIDEO.fps * VIDEO.durations.financialSnapshot}
        fps={VIDEO.fps}
        width={VIDEO.resolutions['1080p'].width}
        height={VIDEO.resolutions['1080p'].height}
        defaultProps={defaultSnapshotProps}
      />
      <Composition
        id="CompetitivePitch"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={CompetitivePitch as any}
        durationInFrames={VIDEO.fps * VIDEO.durations.competitivePitch}
        fps={VIDEO.fps}
        width={VIDEO.resolutions['1080p'].width}
        height={VIDEO.resolutions['1080p'].height}
        defaultProps={defaultPitchProps}
      />
    </>
  );
}

registerRoot(RemotionRoot);
