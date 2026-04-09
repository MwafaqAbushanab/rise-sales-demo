import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VIDEOS_DIR = join(__dirname, 'data', 'videos');
const ENTRY_POINT = join(__dirname, '..', 'src', 'remotion', 'index.tsx');
const MAX_CONCURRENT = 1;
const MAX_QUEUED = 3;
const CLEANUP_AGE_MS = 60 * 60 * 1000; // 1 hour

if (!existsSync(VIDEOS_DIR)) {
  mkdirSync(VIDEOS_DIR, { recursive: true });
}

// Cache the bundle URL after first build
let bundleUrl = null;

async function getBundleUrl() {
  if (bundleUrl) return bundleUrl;
  console.log('[video] Bundling Remotion compositions...');
  bundleUrl = await bundle({
    entryPoint: ENTRY_POINT,
    ignoreRegisterRootWarning: false,
  });
  console.log('[video] Bundle ready');
  return bundleUrl;
}

// Simple render queue
let activeRenders = 0;
const queue = [];

function processQueue() {
  while (activeRenders < MAX_CONCURRENT && queue.length > 0) {
    const next = queue.shift();
    activeRenders++;
    next.execute().finally(() => {
      activeRenders--;
      processQueue();
    });
  }
}

// Composition metadata for the UI
const COMPOSITIONS = [
  {
    id: 'ProspectHighlight',
    name: 'Prospect Highlight',
    description: 'Personalized credit union/bank video with key metrics, financial health score, and Rise Analytics branding.',
    requiredProps: ['institutionName', 'type', 'city', 'state', 'assets', 'members', 'deposits', 'roa', 'score'],
    optionalProps: ['healthScore', 'riskLevel'],
    defaultDuration: 15,
    supportedResolutions: ['1080p', 'square', 'story'],
  },
];

const RESOLUTIONS = {
  '1080p': { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
};

export function getCompositions() {
  return COMPOSITIONS;
}

/**
 * Render a video composition.
 * @param {string} compositionId
 * @param {object} inputProps
 * @param {object} options
 * @param {string} [options.resolution='1080p']
 * @param {'mp4'|'gif'} [options.format='mp4']
 * @param {(progress: number) => void} [options.onProgress]
 * @returns {Promise<{ url: string, filename: string }>}
 */
export function renderVideo(compositionId, inputProps, options = {}) {
  const { resolution = '1080p', format = 'mp4', onProgress } = options;

  return new Promise((resolve, reject) => {
    if (activeRenders >= MAX_CONCURRENT && queue.length >= MAX_QUEUED) {
      reject(new Error('Render queue is full. Please try again later.'));
      return;
    }

    const job = {
      execute: async () => {
        try {
          const url = await getBundleUrl();
          const res = RESOLUTIONS[resolution] || RESOLUTIONS['1080p'];

          const composition = await selectComposition({
            serveUrl: url,
            id: compositionId,
            inputProps,
          });

          const filename = `${compositionId}-${Date.now()}.${format === 'gif' ? 'gif' : 'mp4'}`;
          const outputPath = join(VIDEOS_DIR, filename);

          await renderMedia({
            composition: {
              ...composition,
              width: res.width,
              height: res.height,
            },
            serveUrl: url,
            codec: format === 'gif' ? 'gif' : 'h264',
            outputLocation: outputPath,
            inputProps,
            onProgress: ({ progress }) => {
              if (onProgress) onProgress(progress);
            },
          });

          resolve({ url: `/api/video/download/${filename}`, filename });
        } catch (err) {
          reject(err);
        }
      },
    };

    if (activeRenders < MAX_CONCURRENT) {
      activeRenders++;
      job.execute().finally(() => {
        activeRenders--;
        processQueue();
      });
    } else {
      queue.push(job);
    }
  });
}

/**
 * Clean up videos older than CLEANUP_AGE_MS.
 */
export function cleanupOldVideos() {
  if (!existsSync(VIDEOS_DIR)) return;
  const now = Date.now();
  for (const file of readdirSync(VIDEOS_DIR)) {
    const filePath = join(VIDEOS_DIR, file);
    try {
      const stat = statSync(filePath);
      if (now - stat.mtimeMs > CLEANUP_AGE_MS) {
        unlinkSync(filePath);
        console.log(`[video] Cleaned up ${file}`);
      }
    } catch {
      // ignore
    }
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupOldVideos, 30 * 60 * 1000);
