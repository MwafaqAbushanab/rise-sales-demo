import { Search, Users, Landmark, Zap, Building2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Lead } from '../types';
import { formatCurrency, statusColors, formatStatus } from '../types';
import { ASSET_SIZE_FILTERS } from '../api/fdicApi';
import { usePagination } from '../hooks/usePagination';

interface InstitutionsTableProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
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
}

export default function InstitutionsTable({
  leads,
  selectedLead,
  onSelectLead,
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

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, leads.length);

  return (
    <div className="col-span-2 bg-white rounded-xl shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Institutions Pipeline</h2>
          <span className="text-sm text-gray-500">{leads.length.toLocaleString()} results</span>
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
            <span className="ml-3 text-gray-600">Loading institutions from NCUA & FDIC...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No institutions match your filters</p>
            <p className="text-sm mt-1">Try adjusting your search criteria</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Institution</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assets</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedItems.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className={`cursor-pointer transition-colors ${
                    selectedLead?.id === lead.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`text-lg font-bold ${
                        lead.score >= 85 ? 'text-green-600' : lead.score >= 70 ? 'text-amber-600' : 'text-gray-600'
                      }`}>
                        {lead.score}
                      </div>
                      {lead.score >= 85 && <Zap className="w-4 h-4 text-amber-500" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                      {formatStatus(lead.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && leads.length > 0 && (
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex}-{endIndex} of {leads.length.toLocaleString()} institutions
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
