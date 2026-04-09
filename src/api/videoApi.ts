import type { VideoTemplate, VideoRenderRequest, VideoRenderResult } from '../types/video';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export async function fetchCompositions(): Promise<VideoTemplate[]> {
  const res = await fetch(`${API_BASE}/api/video/compositions`);
  if (!res.ok) throw new Error('Failed to fetch video compositions');
  return res.json();
}

export async function renderVideo(
  request: VideoRenderRequest,
  onProgress: (progress: number) => void,
): Promise<VideoRenderResult> {
  const res = await fetch(`${API_BASE}/api/video/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) throw new Error('Failed to start video render');

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response stream');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = JSON.parse(line.slice(6));

      if (data.progress != null) {
        onProgress(data.progress);
      }

      if (data.done) {
        return { done: true, url: data.url, filename: data.filename };
      }

      if (data.error) {
        return { done: false, error: data.error, status: data.status };
      }
    }
  }

  return { done: false, error: 'Stream ended unexpectedly' };
}

export function getVideoDownloadUrl(filename: string): string {
  return `${API_BASE}/api/video/download/${filename}`;
}

export async function deleteVideo(filename: string): Promise<void> {
  await fetch(`${API_BASE}/api/video/download/${filename}`, { method: 'DELETE' });
}
