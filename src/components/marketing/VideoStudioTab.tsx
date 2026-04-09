import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { Video, Play, Download, Loader2, Search, Film, Square, Smartphone, Trash2, Clock } from 'lucide-react';
import { renderVideo, getVideoDownloadUrl, deleteVideo } from '../../api/videoApi';
import type { Lead } from '../../types/index';
import type { Resolution, VideoFormat, VideoHistoryItem } from '../../types/video';
import type { ProspectHighlightProps } from '../../remotion/ProspectHighlight';

const LazyPlayer = lazy(() =>
  import('@remotion/player').then((mod) => ({ default: mod.Player }))
);

const LazyProspectHighlight = lazy(() =>
  import('../../remotion/ProspectHighlight').then((mod) => ({
    default: mod.ProspectHighlight,
  }))
);

interface VideoStudioTabProps {
  leads: Lead[];
}

const RESOLUTION_OPTIONS: { value: Resolution; label: string; icon: typeof Film }[] = [
  { value: '1080p', label: '1080p (16:9)', icon: Film },
  { value: 'square', label: 'Square (1:1)', icon: Square },
  { value: 'story', label: 'Story (9:16)', icon: Smartphone },
];

const RESOLUTION_DIMENSIONS: Record<Resolution, { width: number; height: number }> = {
  '1080p': { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
};

function getStoredHistory(): VideoHistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem('riseVideoHistory') || '[]');
  } catch {
    return [];
  }
}

function saveHistory(items: VideoHistoryItem[]) {
  localStorage.setItem('riseVideoHistory', JSON.stringify(items.slice(0, 20)));
}

export default function VideoStudioTab({ leads }: VideoStudioTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [format, setFormat] = useState<VideoFormat>('mp4');
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [renderResult, setRenderResult] = useState<{ url: string; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<VideoHistoryItem[]>(getStoredHistory);

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return leads
      .filter((l) => l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q) || l.state.toLowerCase().includes(q))
      .slice(0, 8);
  }, [leads, searchQuery]);

  const prospectProps: ProspectHighlightProps | null = selectedLead
    ? {
        institutionName: selectedLead.name,
        type: selectedLead.type,
        city: selectedLead.city,
        state: selectedLead.state,
        assets: selectedLead.assets,
        members: selectedLead.members,
        deposits: selectedLead.deposits,
        roa: selectedLead.roa,
        score: selectedLead.score,
        healthScore: (selectedLead.financialHealth as any)?.overallScore ?? (selectedLead.financialHealth as any)?.overall,
        riskLevel: selectedLead.financialHealth?.riskLevel,
      }
    : null;

  const handleRender = useCallback(async () => {
    if (!prospectProps || !selectedLead) return;

    setIsRendering(true);
    setProgress(0);
    setRenderResult(null);
    setError(null);

    try {
      const result = await renderVideo(
        {
          compositionId: 'ProspectHighlight',
          inputProps: prospectProps,
          resolution,
          format,
        },
        (p) => setProgress(p),
      );

      if (result.done && result.url && result.filename) {
        setRenderResult({ url: result.url, filename: result.filename });
        const item: VideoHistoryItem = {
          filename: result.filename,
          url: result.url,
          compositionId: 'ProspectHighlight',
          resolution,
          format,
          createdAt: new Date().toISOString(),
          institutionName: selectedLead.name,
        };
        const updated = [item, ...history];
        setHistory(updated);
        saveHistory(updated);
      } else {
        setError(result.error || 'Render failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Render failed');
    } finally {
      setIsRendering(false);
    }
  }, [prospectProps, selectedLead, resolution, format, history]);

  const handleDeleteHistory = useCallback(
    async (idx: number) => {
      const item = history[idx];
      try {
        await deleteVideo(item.filename);
      } catch {
        // file may already be cleaned up
      }
      const updated = history.filter((_, i) => i !== idx);
      setHistory(updated);
      saveHistory(updated);
    },
    [history],
  );

  const dims = RESOLUTION_DIMENSIONS[resolution];
  const previewScale = Math.min(720 / dims.width, 405 / dims.height);

  return (
    <div className="p-6 space-y-6">
      {/* Lead Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Institution</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads by name, city, or state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        {(!selectedLead || searchQuery) && (
          <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg divide-y">
            {filteredLeads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => {
                  setSelectedLead(lead);
                  setSearchQuery('');
                  setRenderResult(null);
                  setError(null);
                }}
                className={`w-full text-left px-4 py-2.5 hover:bg-purple-50 transition-colors flex items-center justify-between ${
                  selectedLead?.id === lead.id ? 'bg-purple-50' : ''
                }`}
              >
                <div>
                  <span className="font-medium text-sm text-gray-900">{lead.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {lead.city}, {lead.state}
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {lead.type}
                </span>
              </button>
            ))}
            {filteredLeads.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No leads found</div>
            )}
          </div>
        )}
        {selectedLead && !searchQuery && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
            <Video className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">{selectedLead.name}</span>
            <span className="text-xs text-purple-600">
              {selectedLead.city}, {selectedLead.state}
            </span>
            <button
              onClick={() => {
                setSelectedLead(null);
                setRenderResult(null);
              }}
              className="ml-auto text-xs text-purple-500 hover:text-purple-700"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Options Row */}
      <div className="flex flex-wrap gap-4">
        {/* Resolution */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Resolution</label>
          <div className="flex gap-1.5">
            {RESOLUTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setResolution(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  resolution === opt.value
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <opt.icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Format */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Format</label>
          <div className="flex gap-1.5">
            {(['mp4', 'gif'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors uppercase ${
                  format === f
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview + Render */}
      {selectedLead && prospectProps && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Preview</h4>
          <div
            className="bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ height: Math.round(dims.height * previewScale) + 32 }}
          >
            <Suspense
              fallback={
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading preview...
                </div>
              }
            >
              <LazyPlayer
                component={LazyProspectHighlight as any}
                inputProps={prospectProps}
                durationInFrames={450}
                compositionWidth={dims.width}
                compositionHeight={dims.height}
                fps={30}
                style={{
                  width: Math.round(dims.width * previewScale),
                  height: Math.round(dims.height * previewScale),
                }}
                controls
                loop
                autoPlay={false}
              />
            </Suspense>
          </div>

          {/* Render Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleRender}
              disabled={isRendering}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Rendering... {Math.round(progress * 100)}%
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Render {format.toUpperCase()}
                </>
              )}
            </button>

            {isRendering && (
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {renderResult && (
              <a
                href={getVideoDownloadUrl(renderResult.filename)}
                download
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Render History */}
      {history.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Recent Renders
          </h4>
          <div className="border rounded-lg divide-y">
            {history.map((item, idx) => (
              <div key={item.filename} className="flex items-center gap-3 px-4 py-2.5">
                <Film className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.institutionName}</p>
                  <p className="text-xs text-gray-500">
                    {item.resolution} &middot; {item.format.toUpperCase()} &middot;{' '}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <a
                  href={getVideoDownloadUrl(item.filename)}
                  download
                  className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDeleteHistory(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedLead && (
        <div className="text-center py-12 text-gray-400">
          <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">Select an institution to create a personalized video</p>
          <p className="text-xs mt-1">Videos use Rise Analytics branding with real financial data</p>
        </div>
      )}
    </div>
  );
}
