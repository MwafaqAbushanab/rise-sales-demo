import { useState, useEffect, useCallback } from 'react';
import { Phone, Mail, Calendar, FileText, ArrowRight, Plus, Send, Loader2 } from 'lucide-react';
import type { Activity } from '../types';
import { timeAgo } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const ACTIVITY_TYPES = [
  { value: 'call' as const, label: 'Call', icon: Phone, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'email' as const, label: 'Email', icon: Mail, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'meeting' as const, label: 'Meeting', icon: Calendar, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'note' as const, label: 'Note', icon: FileText, color: 'text-gray-600 bg-gray-50 border-gray-200' },
];

function getActivityStyle(type: Activity['type']) {
  const found = ACTIVITY_TYPES.find(t => t.value === type);
  if (found) return found;
  return { value: type, label: 'Update', icon: ArrowRight, color: 'text-amber-600 bg-amber-50 border-amber-200' };
}

interface ActivityTimelineProps {
  leadId: string;
  onActivityLogged?: () => void;
}

export default function ActivityTimeline({ leadId, onActivityLogged }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<Activity['type']>('call');
  const [formDescription, setFormDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/${encodeURIComponent(leadId)}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch { /* server offline */ }
    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    setLoading(true);
    fetchActivities();
  }, [fetchActivities]);

  const handleSubmit = async () => {
    if (!formDescription.trim()) return;
    setSubmitting(true);

    const optimisticActivity: Activity = {
      id: Date.now().toString(),
      leadId,
      type: formType,
      description: formDescription.trim(),
      timestamp: new Date().toISOString(),
    };

    // Optimistic update
    setActivities(prev => [optimisticActivity, ...prev]);
    setFormDescription('');
    setShowForm(false);

    try {
      await fetch(`${API_BASE_URL}/api/leads/${encodeURIComponent(leadId)}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: formType, description: formDescription.trim() }),
      });
      onActivityLogged?.();
    } catch { /* fallback: optimistic update stays */ }

    setSubmitting(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">Activity</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          <Plus className="w-3 h-3" />
          Log Activity
        </button>
      </div>

      {/* Log Activity Form */}
      {showForm && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border space-y-2">
          <div className="flex gap-1.5">
            {ACTIVITY_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setFormType(t.value)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${
                  formType === t.value ? t.color + ' ring-1 ring-current' : 'bg-white border-gray-200 text-gray-500'
                }`}
              >
                <t.icon className="w-3 h-3" />
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={formDescription}
            onChange={e => setFormDescription(e.target.value)}
            placeholder="What happened?"
            rows={2}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={!formDescription.trim() || submitting}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-3 h-3" />
              Save
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3">No activity yet</p>
      ) : (
        <div className="space-y-0 relative">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200" />
          {activities.slice(0, 20).map(activity => {
            const style = getActivityStyle(activity.type);
            const Icon = style.icon;
            return (
              <div key={activity.id} className="flex items-start gap-2.5 py-1.5 relative">
                <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 border z-10 ${style.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-xs text-gray-700 leading-relaxed">{activity.description}</p>
                  <span className="text-[10px] text-gray-400">{timeAgo(activity.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
