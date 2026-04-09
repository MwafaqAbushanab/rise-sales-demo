import { Composition, registerRoot } from 'remotion';
import { ProspectHighlight } from './ProspectHighlight';
import type { ProspectHighlightProps } from './ProspectHighlight';
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
    </>
  );
}

registerRoot(RemotionRoot);
