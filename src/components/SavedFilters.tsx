import { useState, useEffect } from 'react';
import { Bookmark, Plus, X, RotateCcw } from 'lucide-react';

interface FilterState {
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
  stateFilter: string;
  assetFilter: string;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
}

interface SavedFiltersProps {
  currentFilters: FilterState;
  onApplyFilter: (filters: FilterState) => void;
}

const STORAGE_KEY = 'riseSavedFilters';
const MAX_FILTERS = 10;

const DEFAULT_FILTERS: FilterState = {
  searchTerm: '',
  statusFilter: 'all',
  typeFilter: 'all',
  stateFilter: 'all',
  assetFilter: 'all',
};

function hasActiveFilters(filters: FilterState): boolean {
  return filters.searchTerm !== '' ||
    filters.statusFilter !== 'all' ||
    filters.typeFilter !== 'all' ||
    filters.stateFilter !== 'all' ||
    filters.assetFilter !== 'all';
}

function describeFilter(filters: FilterState): string {
  const parts: string[] = [];
  if (filters.searchTerm) parts.push(`"${filters.searchTerm}"`);
  if (filters.typeFilter !== 'all') parts.push(filters.typeFilter);
  if (filters.stateFilter !== 'all') parts.push(filters.stateFilter);
  if (filters.statusFilter !== 'all') parts.push(filters.statusFilter.replace(/_/g, ' '));
  if (filters.assetFilter !== 'all') parts.push(filters.assetFilter);
  return parts.join(' + ') || 'No filters';
}

export default function SavedFilters({ currentFilters, onApplyFilter }: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [filterName, setFilterName] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setSavedFilters(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const persist = (filters: SavedFilter[]) => {
    setSavedFilters(filters);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  };

  const handleSave = () => {
    if (!filterName.trim()) return;
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName.trim(),
      filters: { ...currentFilters },
    };
    const updated = [newFilter, ...savedFilters].slice(0, MAX_FILTERS);
    persist(updated);
    setFilterName('');
    setShowSaveInput(false);
  };

  const handleDelete = (id: string) => {
    persist(savedFilters.filter(f => f.id !== id));
  };

  const handleClearFilters = () => {
    onApplyFilter(DEFAULT_FILTERS);
  };

  const active = hasActiveFilters(currentFilters);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Bookmark className="w-4 h-4 text-gray-400 flex-shrink-0" />

      {/* Saved filter chips */}
      {savedFilters.map((sf) => (
        <div
          key={sf.id}
          className="group flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer shadow-sm"
          onClick={() => onApplyFilter(sf.filters)}
          title={describeFilter(sf.filters)}
        >
          {sf.name}
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(sf.id); }}
            className="ml-0.5 text-blue-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Save current button */}
      {showSaveInput ? (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSaveInput(false); }}
            placeholder="Filter name..."
            autoFocus
            className="px-2.5 py-1.5 border border-blue-300 rounded-lg text-xs w-32 focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-white"
          />
          <button
            onClick={handleSave}
            disabled={!filterName.trim()}
            className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            Save
          </button>
          <button
            onClick={() => setShowSaveInput(false)}
            className="px-1.5 py-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        active && (
          <button
            onClick={() => setShowSaveInput(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
          >
            <Plus className="w-3 h-3" />
            Save Filter
          </button>
        )
      )}

      {/* Clear all filters */}
      {active && (
        <button
          onClick={handleClearFilters}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}
