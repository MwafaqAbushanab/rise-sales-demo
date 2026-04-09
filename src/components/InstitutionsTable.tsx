import { useState, useRef, useEffect } from 'react';
import { Search, Users, Landmark, Zap, Building2, Loader2, ChevronLeft, ChevronRight, Download, Mail } from 'lucide-react';
import type { Lead } from '../types';
import { formatCurrency, statusColors, formatStatus } from '../types';
import { ASSET_SIZE_FILTERS } from '../api/fdicApi';
import { usePagination } from '../hooks/usePagination';
import { exportICPMatchesToCSV, type ICPMatch } from '../utils/prospectFinder';
import SavedFilters from './SavedFilters';
import { cn } from '../lib/utils';

const ALL_STATUSES = ['new', 'contacted', 'qualified', 'demo_scheduled', 'proposal_sent', 'won', 'lost'];

interface InstitutionsTableProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onComposeEmail: (lead: Lead) => void;
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  typeFilter: string;
  onTypeFilterChange: (filter: string) => void;
  stateFilter: string;
  onStateFilterChange: (filter: string) => void;
  assetFilter: string;
  onAssetFilterChange: (filter: string) => void;
  statusFilter: string;
  onStatusFilterChange: (filter: string) => void;
  availableStates: string[];
  icpMatches?: ICPMatch[] | null;
}

function escapeCsvValue(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function exportLeadsToCsv(leads: Lead[]) {
  const headers = ['Name', 'Type', 'City', 'State', 'Assets', 'Members', 'Deposits', 'ROA', 'Score', 'Status', 'Recommended Products', 'Contact', 'Email', 'Phone', 'Notes', 'Website'];
  const rows = leads.map(l => [
    l.name, l.type, l.city, l.state,
    l.assets.toString(), l.members.toString(), l.deposits.toString(),
    l.roa.toFixed(2), l.score.toString(), formatStatus(l.status),
    l.recommendedProducts.join('; '),
    l.contact, l.email, l.phone, l.notes, l.website,
  ].map(escapeCsvValue));

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rise-leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function InstitutionsTable({
  leads,
  selectedLead,
  onSelectLead,
  onUpdateLead,
  onComposeEmail,
  loading,
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  stateFilter,
  onStateFilterChange,
  assetFilter,
  onAssetFilterChange,
  statusFilter,
  onStatusFilterChange,
  availableStates,
  icpMatches,
}: InstitutionsTableProps) {
  const {
    page,
    totalPages,
    paginatedItems,
    pageSize,
    setPageSize,
    nextPage,
    prevPage,
  } = usePagination(leads, 25);

  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEditingStatusId(null);
      }
    }
    if (editingStatusId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [editingStatusId]);

  const handleStatusChange = (leadId: string, newStatus: string) => {
    onUpdateLead(leadId, { status: newStatus });
    setEditingStatusId(null);
  };

  const handleApplyFilter = (filters: { searchTerm: string; statusFilter: string; typeFilter: string; stateFilter: string; assetFilter: string }) => {
    onSearchChange(filters.searchTerm);
    onTypeFilterChange(filters.typeFilter);
    onStateFilterChange(filters.stateFilter);
    onAssetFilterChange(filters.assetFilter);
    onStatusFilterChange(filters.statusFilter);
  };

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, leads.length);

  return (
    <div className="col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-4 border-b bg-gradient-to-r from-white to-gray-50/50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {icpMatches ? `Prospect Finder Results — ${icpMatches.length} matches` : 'Institutions Pipeline'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Search, filter, and manage your prospect pipeline</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => icpMatches ? exportICPMatchesToCSV(icpMatches) : exportLeadsToCsv(leads)}
              disabled={leads.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              title="Export filtered leads to CSV"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg font-medium">{leads.length.toLocaleString()} results</span>
          </div>
        </div>

        {/* Saved Filters */}
        <div className="mb-3">
          <SavedFilters
            currentFilters={{ searchTerm, statusFilter, typeFilter, stateFilter, assetFilter }}
            onApplyFilter={handleApplyFilter}
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, city, or state..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Types</option>
            <option value="Credit Union">Credit Unions</option>
            <option value="Community Bank">Community Banks</option>
          </select>
          <select
            value={stateFilter}
            onChange={(e) => onStateFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All States</option>
            {availableStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          <select
            value={assetFilter}
            onChange={(e) => onAssetFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {ASSET_SIZE_FILTERS.map(filter => (
              <option key={filter.value} value={filter.value}>{filter.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="demo_scheduled">Demo Scheduled</option>
            <option value="proposal_sent">Proposal Sent</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading credit unions & banks from NCUA & FDIC...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No institutions match your filters</p>
            <p className="text-sm mt-1">Try adjusting your search criteria</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50/80 border-b sticky top-0 backdrop-blur-sm z-10">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Institution</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Assets</th>
                {icpMatches && <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Match</th>}
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedItems.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className={cn(
                    'cursor-pointer transition-all duration-150',
                    selectedLead?.id === lead.id
                      ? 'bg-blue-50/80 border-l-2 border-l-blue-500'
                      : 'hover:bg-gray-50/80 border-l-2 border-l-transparent'
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        lead.type === 'Credit Union'
                          ? 'bg-gradient-to-br from-blue-100 to-blue-200'
                          : 'bg-gradient-to-br from-green-100 to-green-200'
                      }`}>
                        {lead.type === 'Credit Union'
                          ? <Users className="w-5 h-5 text-blue-600" />
                          : <Landmark className="w-5 h-5 text-green-600" />
                        }
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{lead.name}</div>
                        <div className="text-xs text-gray-500">{lead.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{lead.city}</div>
                    <div className="text-xs text-gray-500">{lead.state}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(lead.assets)}</div>
                    {lead.members > 0 && (
                      <div className="text-xs text-gray-500">{lead.members.toLocaleString()} members</div>
                    )}
                  </td>
                  {icpMatches && (() => {
                    const match = icpMatches.find(m => m.lead.id === lead.id);
                    return (
                      <td className="px-4 py-3">
                        {match ? (
                          <div>
                            <span className={`text-sm font-bold ${match.matchScore >= 90 ? 'text-green-600' : match.matchScore >= 80 ? 'text-blue-600' : match.matchScore >= 70 ? 'text-amber-600' : 'text-gray-500'}`}>
                              {match.matchScore}%
                            </span>
                            {match.matchReasons.length > 0 && (
                              <p className="text-[10px] text-gray-400 truncate max-w-[120px]" title={match.matchReasons.join(', ')}>{match.matchReasons[0]}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    );
                  })()}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-lg font-bold px-2 py-0.5 rounded-lg',
                        lead.score >= 85 ? 'text-green-700 bg-green-50' :
                        lead.score >= 70 ? 'text-amber-700 bg-amber-50' : 'text-gray-600'
                      )}>
                        {lead.score}
                      </span>
                      {lead.score >= 85 && <Zap className="w-4 h-4 text-amber-500" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 relative">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingStatusId(editingStatusId === lead.id ? null : lead.id);
                      }}
                    >
                      <span className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all ${statusColors[lead.status]}`}>
                        {formatStatus(lead.status)}
                      </span>
                    </div>

                    {/* Status Dropdown */}
                    {editingStatusId === lead.id && (
                      <div
                        ref={dropdownRef}
                        className="absolute z-20 top-full left-0 mt-1 bg-white rounded-lg shadow-lg border py-1 min-w-[160px]"
                      >
                        {ALL_STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(lead.id, s);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors ${
                              lead.status === s ? 'bg-blue-50 font-semibold' : ''
                            }`}
                          >
                            <span className={`inline-block w-2 h-2 rounded-full ${
                              statusColors[s]?.replace(/text-\S+/, '').replace('bg-', 'bg-').trim() || 'bg-gray-300'
                            }`} />
                            <span className={`px-1.5 py-0.5 rounded text-xs ${statusColors[s]}`}>
                              {formatStatus(s)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onComposeEmail(lead);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Compose email"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && leads.length > 0 && (
        <div className="p-4 border-t bg-gray-50/50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-700">{startIndex}-{endIndex}</span> of <span className="font-medium text-gray-700">{leads.length.toLocaleString()}</span> institutions
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Per page:</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={prevPage}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={nextPage}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
