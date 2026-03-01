import { useState } from 'react';
import { Users, Landmark, Zap, Mail } from 'lucide-react';
import type { Lead } from '../types';
import { formatCurrency, statusColors, formatStatus, PIPELINE_STAGES } from '../types';

interface PipelineBoardProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onComposeEmail: (lead: Lead) => void;
}

export default function PipelineBoard({ leads, selectedLead, onSelectLead, onUpdateLead, onComposeEmail }: PipelineBoardProps) {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const columns = PIPELINE_STAGES.map(status => ({
    status,
    leads: leads.filter(l => l.status === status),
    totalAssets: leads.filter(l => l.status === status).reduce((sum, l) => sum + l.assets, 0),
  }));

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData('leadId', lead.id);
    e.dataTransfer.effectAllowed = 'move';
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
        <h2 className="text-lg font-semibold text-gray-900">Pipeline Board</h2>
        <span className="text-sm text-gray-500">{leads.length} leads</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2" style={{ minHeight: '500px' }}>
        {columns.map(col => (
          <div
            key={col.status}
            className={`flex-shrink-0 w-[200px] rounded-xl border transition-colors ${
              dragOverColumn === col.status
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                : 'bg-gray-50 border-gray-200'
            }`}
            onDragOver={e => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, col.status)}
          >
            {/* Column Header */}
            <div className="p-3 border-b">
              <div className="flex items-center justify-between mb-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[col.status]}`}>
                  {formatStatus(col.status)}
                </span>
                <span className="text-xs font-bold text-gray-500">{col.leads.length}</span>
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
                  onClick={() => onSelectLead(lead)}
                  className={`p-2.5 bg-white rounded-lg border cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                    selectedLead?.id === lead.id ? 'ring-2 ring-blue-400 border-blue-300' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                      lead.type === 'Credit Union' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
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
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-medium text-gray-500">{formatCurrency(lead.assets)}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${
                        lead.score >= 85 ? 'text-green-600' : lead.score >= 70 ? 'text-amber-600' : 'text-gray-500'
                      }`}>
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
                    <p className="text-[10px] text-gray-400 mt-1 truncate">{lead.contact}{lead.title ? ` - ${lead.title}` : ''}</p>
                  )}
                </div>
              ))}
              {col.leads.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-[10px] text-gray-400">Drop leads here</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
