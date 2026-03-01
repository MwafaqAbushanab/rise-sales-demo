import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Camera, Shuffle, TrendingUp, TrendingDown, ArrowUpCircle, Sparkles,
  ChevronUp, ChevronDown, Eye, CheckCircle, X, Clock, AlertTriangle,
} from 'lucide-react';
import { type Lead, formatCurrency } from '../../types';
import {
  generateTriggerAlerts, createSnapshot, computeAlertSummary,
  simulateFinancialChanges, generateSampleAlerts,
  type FinancialSnapshot, type AlertState, type AlertType, type PriorityTier,
} from '../../utils/triggerAlerts';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3002';

interface TriggerAlertsProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

const PRIORITY_COLORS: Record<PriorityTier, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Low: 'bg-gray-100 text-gray-600 border-gray-200',
};

const TYPE_ICONS: Record<AlertType, typeof TrendingUp> = {
  growth: TrendingUp,
  distress: TrendingDown,
  scale: ArrowUpCircle,
  opportunity: Sparkles,
};

const TYPE_STYLES: Record<AlertType, { bg: string; text: string; label: string }> = {
  growth: { bg: 'bg-green-50', text: 'text-green-600', label: 'Growth' },
  distress: { bg: 'bg-red-50', text: 'text-red-600', label: 'Distress' },
  scale: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Scale' },
  opportunity: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'Opportunity' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function TriggerAlertsDashboard({ leads, onSelectLead }: TriggerAlertsProps) {
  const navigate = useNavigate();

  const [snapshot, setSnapshot] = useState<FinancialSnapshot | null>(null);
  const [alertState, setAlertState] = useState<AlertState>({ dismissed: [], reviewed: [] });
  const [activeFilter, setActiveFilter] = useState<'all' | AlertType>('all');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [simulatedLeads, setSimulatedLeads] = useState<Lead[] | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [isSample, setIsSample] = useState(false);

  // Fetch existing snapshot and state on mount
  useEffect(() => {
    fetch(`${API}/api/alerts/snapshot`).then(r => {
      if (r.ok) return r.json();
      return null;
    }).then(data => {
      if (data) setSnapshot(data);
    }).catch(() => {});

    fetch(`${API}/api/alerts/state`).then(r => r.json()).then(setAlertState).catch(() => {});
  }, []);

  // Compute alerts
  const alerts = useMemo(() => {
    const source = simulatedLeads || leads;
    if (!snapshot || source.length === 0) {
      const samples = generateSampleAlerts(leads);
      if (samples.length > 0) setIsSample(true);
      return samples;
    }
    setIsSample(false);
    return generateTriggerAlerts(source, snapshot, alertState);
  }, [leads, simulatedLeads, snapshot, alertState]);

  const summary = useMemo(() => computeAlertSummary(alerts), [alerts]);

  const filteredAlerts = useMemo(() => {
    if (activeFilter === 'all') return alerts;
    return alerts.filter(a => a.type === activeFilter);
  }, [alerts, activeFilter]);

  const handleTakeSnapshot = useCallback(async () => {
    setSnapshotLoading(true);
    const snap = createSnapshot(leads);
    try {
      await fetch(`${API}/api/alerts/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snap),
      });
    } catch { /* saved locally */ }
    setSnapshot(snap);
    setSimulatedLeads(null);
    setSnapshotLoading(false);
  }, [leads]);

  const handleSimulate = useCallback(() => {
    if (!snapshot) {
      // Auto-take snapshot first, then simulate
      const snap = createSnapshot(leads);
      setSnapshot(snap);
      fetch(`${API}/api/alerts/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snap),
      }).catch(() => {});
    }
    setSimulatedLeads(simulateFinancialChanges(leads));
  }, [leads, snapshot]);

  const handleDismiss = useCallback(async (alertId: string) => {
    const newState = { ...alertState, dismissed: [...alertState.dismissed, alertId] };
    setAlertState(newState);
    try {
      await fetch(`${API}/api/alerts/${alertId}/dismiss`, { method: 'POST' });
    } catch {}
  }, [alertState]);

  const handleReview = useCallback(async (alertId: string) => {
    const newState = { ...alertState, reviewed: [...alertState.reviewed, alertId] };
    setAlertState(newState);
    try {
      await fetch(`${API}/api/alerts/${alertId}/review`, { method: 'POST' });
    } catch {}
  }, [alertState]);

  const handleViewBrief = useCallback((lead: Lead) => {
    onSelectLead(lead);
    navigate('/precall');
  }, [onSelectLead, navigate]);

  const isReviewed = useCallback((id: string) => alertState.reviewed.includes(id), [alertState]);

  return (
    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Financial Trigger Alerts</h2>
              <p className="text-amber-100 text-xs">Monitoring FDIC/NCUA data for buying signals</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulate}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Simulate Changes
            </button>
            <button
              onClick={handleTakeSnapshot}
              disabled={snapshotLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-50 transition-colors disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              {snapshotLoading ? 'Saving...' : 'Take Snapshot'}
            </button>
          </div>
        </div>
      </div>

      {/* Sample data banner */}
      {isSample && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-amber-700">
            Showing sample alerts for demo. Click <strong>Take Snapshot</strong> then <strong>Simulate Changes</strong> to see real diff-based alerts.
          </span>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50 border-b">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{summary.critical}</div>
          <div className="text-[11px] text-gray-500 font-medium uppercase">Critical</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{summary.high}</div>
          <div className="text-[11px] text-gray-500 font-medium uppercase">High</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{summary.total}</div>
          <div className="text-[11px] text-gray-500 font-medium uppercase">Total Alerts</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600 flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {snapshot ? timeAgo(snapshot.timestamp) : 'No snapshot'}
          </div>
          <div className="text-[11px] text-gray-500 font-medium uppercase">Last Scan</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b overflow-x-auto">
        {([
          { key: 'all' as const, label: 'All', count: summary.total },
          { key: 'growth' as const, label: 'Growth', count: summary.byType.growth },
          { key: 'distress' as const, label: 'Distress', count: summary.byType.distress },
          { key: 'scale' as const, label: 'Scale', count: summary.byType.scale },
          { key: 'opportunity' as const, label: 'Opportunity', count: summary.byType.opportunity },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeFilter === tab.key
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.key !== 'all' && (() => {
              const Icon = TYPE_ICONS[tab.key];
              const style = TYPE_STYLES[tab.key];
              return <Icon className={`w-3.5 h-3.5 ${style.text}`} />;
            })()}
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeFilter === tab.key ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {filteredAlerts.length === 0 ? (
        <div className="p-12 text-center">
          <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No alerts detected</p>
          <p className="text-gray-400 text-sm mb-4">Take a snapshot to start monitoring financial changes</p>
          <button
            onClick={handleTakeSnapshot}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            Take Snapshot
          </button>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto divide-y">
          {filteredAlerts.map(alert => {
            const expanded = expandedAlert === alert.id;
            const reviewed = isReviewed(alert.id);
            const Icon = TYPE_ICONS[alert.type];
            const typeStyle = TYPE_STYLES[alert.type];

            return (
              <div key={alert.id} className={`${reviewed ? 'opacity-60' : ''}`}>
                {/* Collapsed row */}
                <button
                  onClick={() => setExpandedAlert(expanded ? null : alert.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  {/* Priority badge */}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${PRIORITY_COLORS[alert.priorityTier]}`}>
                    {alert.priority}
                  </span>

                  {/* Type icon */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${typeStyle.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${typeStyle.text}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                        {alert.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        {alert.lead.type === 'Credit Union' ? 'Credit Union' : 'Bank'} · {alert.lead.city}, {alert.lead.state}
                      </span>
                      {reviewed && <CheckCircle className="w-3 h-3 text-green-500" />}
                    </div>
                    <p className="text-sm font-medium text-gray-800 truncate mt-0.5">{alert.title}</p>
                  </div>

                  {/* Chevron */}
                  {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div className="px-4 pb-4 bg-gray-50 border-t">
                    <div className="pt-3 space-y-3">
                      {/* Description */}
                      <p className="text-sm text-gray-600">{alert.description}</p>

                      {/* Metrics comparison */}
                      <div className="space-y-1.5">
                        {alert.metrics.map((metric, i) => (
                          <div key={i} className="flex items-center justify-between bg-white p-2.5 rounded-lg border text-sm">
                            <span className="text-gray-500 font-medium">{metric.label}</span>
                            <div className="flex items-center gap-2">
                              {metric.previous > 0 && (
                                <>
                                  <span className="text-gray-400">
                                    {metric.label === 'ROA' ? `${metric.previous.toFixed(2)}%` :
                                     metric.label === 'Members' || metric.label === 'Branches'
                                      ? metric.previous.toLocaleString()
                                      : formatCurrency(metric.previous)}
                                  </span>
                                  <span className="text-gray-300">&rarr;</span>
                                </>
                              )}
                              <span className="font-semibold text-gray-900">
                                {metric.label === 'ROA' ? `${metric.current.toFixed(2)}%` :
                                 metric.label === 'Members' || metric.label === 'Branches'
                                  ? metric.current.toLocaleString()
                                  : formatCurrency(metric.current)}
                              </span>
                              <span className={`text-xs font-bold ${
                                alert.type === 'growth' || alert.type === 'scale' || alert.type === 'opportunity'
                                  ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {metric.change}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Suggested action & product */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-lg border">
                          <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Suggested Action</div>
                          <p className="text-xs text-gray-700">{alert.suggestedAction}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border">
                          <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Best Product</div>
                          <p className="text-xs text-gray-700 font-medium">{alert.suggestedProduct}</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleViewBrief(alert.lead)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Brief
                        </button>
                        <button
                          onClick={() => handleReview(alert.id)}
                          disabled={reviewed}
                          className="flex items-center gap-1.5 py-2 px-3 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {reviewed ? 'Reviewed' : 'Mark Reviewed'}
                        </button>
                        <button
                          onClick={() => handleDismiss(alert.id)}
                          className="flex items-center gap-1.5 py-2 px-3 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
