import type { ProspectHighlightProps } from '../remotion/ProspectHighlight';

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  requiredProps: string[];
  optionalProps: string[];
  defaultDuration: number;
  supportedResolutions: Resolution[];
}

export type Resolution = '1080p' | 'square' | 'story';
export type VideoFormat = 'mp4' | 'gif';

export interface VideoRenderRequest {
  compositionId: string;
  inputProps: ProspectHighlightProps;
  resolution: Resolution;
  format: VideoFormat;
}

export interface VideoRenderProgress {
  progress: number;
}

export interface VideoRenderResult {
  done: boolean;
  url?: string;
  filename?: string;
  error?: string;
  status?: 'queue_full' | 'error';
}

export interface VideoHistoryItem {
  filename: string;
  url: string;
  compositionId: string;
  resolution: Resolution;
  format: VideoFormat;
  createdAt: string;
  institutionName: string;
}
