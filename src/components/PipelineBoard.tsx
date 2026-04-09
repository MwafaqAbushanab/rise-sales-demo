import { useState } from 'react';
import { Users, Landmark, Zap, Mail, GripVertical } from 'lucide-react';
import type { Lead } from '../types';
import { formatCurrency, statusColors, formatStatus, PIPELINE_STAGES } from '../types';
import { cn } from '../lib/utils';

const COLUMN_ACCENTS: Record<string, { bar: string; dropBg: string; badge: string }> = {
  new: { bar: 'bg-slate-400', dropBg: 'bg-slate-50', badge: 'text-slate-600' },
  contacted: { bar: 'bg-sky-500', dropBg: 'bg-sky-50', badge: 'text-sky-600' },
  qualified: { bar: 'bg-amber-500', dropBg: 'bg-amber-50', badge: 'text-amber-600' },
  demo_scheduled: { bar: 'bg-violet-500', dropBg: 'bg-violet-50', badge: 'text-violet-600' },
  proposal_sent: { bar: 'bg-indigo-500', dropBg: 'bg-indigo-50', badge: 'text-indigo-600' },
  won: { bar: 'bg-emerald-500', dropBg: 'bg-emerald-50', badge: 'text-emerald-600' },
  lost: { bar: 'bg-rose-400', dropBg: 'bg-rose-50', badge: 'text-rose-500' },
};

interface PipelineBoardProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onComposeEmail: (lead: Lead) => void;
}

export default function PipelineBoard({ leads, selectedLead, onSelectLead, onUpdateLead, onComposeEmail }: PipelineBoardProps) {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const columns = PIPELINE_STAGES.map(status => ({
    status,
    leads: leads.filter(l => l.status === status),
    totalAssets: leads.filter(l => l.status === status).reduce((sum, l) => sum + l.assets, 0),
  }));

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData('leadId', lead.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(lead.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDraggingId(null);
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      const lead = leads.find(l => l.id === leadId);
      if (lead && lead.status !== newStatus) {
        onUpdateLead(leadId, { status: newStatus });
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pipeline Board</h2>
          <p className="text-xs text-gray-400 mt-0.5">Drag cards between stages to update status</p>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg font-medium">{leads.length} leads</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2" style={{ minHeight: '500px' }}>
        {columns.map(col => {
          const accent = COLUMN_ACCENTS[col.status] || COLUMN_ACCENTS.new;
          const isDropTarget = dragOverColumn === col.status;

          return (
            <div
              key={col.status}
              className={cn(
                'flex-shrink-0 w-[210px] rounded-xl border-2 transition-all duration-200',
                isDropTarget
                  ? `${accent.dropBg} border-dashed border-current ${accent.badge} ring-1 ring-current/20`
                  : 'bg-gray-50/80 border-gray-100'
              )}
              onDragOver={e => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, col.status)}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-gray-100">
                <div className={cn('h-1 w-full rounded-full mb-2.5', accent.bar)} />
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('text-xs font-semibold', accent.badge)}>
                    {formatStatus(col.status)}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center">
                    {col.leads.length}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">{formatCurrency(col.totalAssets)} total</p>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 max-h-[430px] overflow-y-auto">
                {col.leads.slice(0, 30).map(lead => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={e => handleDragStart(e, lead)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onSelectLead(lead)}
                    className={cn(
                      'group p-2.5 bg-white rounded-lg border cursor-grab active:cursor-grabbing transition-all duration-150',
                      draggingId === lead.id && 'opacity-40 scale-95 rotate-1',
                      selectedLead?.id === lead.id
                        ? 'ring-2 ring-blue-400 border-blue-300 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-3 h-3 text-gray-300 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      <div className={cn('w-6 h-6 rounded flex items-center justify-center flex-shrink-0',
                        lead.type === 'Credit Union' ? 'bg-blue-100' : 'bg-green-100'
                      )}>
                        {lead.type === 'Credit Union'
                          ? <Users className="w-3 h-3 text-blue-600" />
                          : <Landmark className="w-3 h-3 text-green-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{lead.name}</p>
                        <p className="text-[10px] text-gray-400">{lead.city}, {lead.state}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 ml-5">
                      <span className="text-[10px] font-medium text-gray-500">{formatCurrency(lead.assets)}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          'text-xs font-bold px-1.5 py-0.5 rounded',
                          lead.score >= 85 ? 'text-green-700 bg-green-50' :
                          lead.score >= 70 ? 'text-amber-700 bg-amber-50' : 'text-gray-500'
                        )}>
                          {lead.score}
                        </span>
                        {lead.score >= 85 && <Zap className="w-3 h-3 text-amber-500" />}
                        <button
                          onClick={e => { e.stopPropagation(); onComposeEmail(lead); }}
                          className="p-0.5 text-gray-300 hover:text-blue-500 transition-colors"
                          title="Compose email"
                        >
                          <Mail className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {lead.contact && (
                      <p className="text-[10px] text-gray-400 mt-1 ml-5 truncate">{lead.contact}{lead.title ? ` - ${lead.title}` : ''}</p>
                    )}
                  </div>
                ))}
                {col.leads.length === 0 && (
                  <div className={cn(
                    'text-center py-8 rounded-lg border-2 border-dashed transition-colors',
                    isDropTarget ? 'border-current/30' : 'border-gray-200'
                  )}>
                    <p className="text-[10px] text-gray-400">Drop leads here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
