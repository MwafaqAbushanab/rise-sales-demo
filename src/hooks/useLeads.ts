import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchBanks, ASSET_SIZE_FILTERS } from '../api/fdicApi';
import { fetchCreditUnions } from '../api/ncuaApi';
import { bankToLead, creditUnionToLead, type Lead } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

async function fetchSavedSalesData(): Promise<Record<string, Partial<Lead>>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/leads`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Server not available — fall through to localStorage
  }
  // Fallback: read from localStorage
  const saved = localStorage.getItem('riseSalesData');
  if (saved) {
    try { return JSON.parse(saved); } catch { /* ignore */ }
  }
  return {};
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [assetFilter, setAssetFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [banksData, creditUnionsData, salesDataMap] = await Promise.all([
        fetchBanks({ activeOnly: true }),
        fetchCreditUnions({}),
        fetchSavedSalesData(),
      ]);
      const bankLeads = banksData.map(bankToLead);
      const cuLeads = creditUnionsData.map(creditUnionToLead);
      const allLeads = [...bankLeads, ...cuLeads].sort((a, b) => b.assets - a.assets);

      // Apply saved pipeline overrides
      allLeads.forEach(lead => {
        if (salesDataMap[lead.id]) {
          Object.assign(lead, salesDataMap[lead.id]);
        }
      });

      setLeads(allLeads);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lead.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lead.state.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesType = typeFilter === 'all' || lead.type === typeFilter;
      const matchesState = stateFilter === 'all' || lead.state === stateFilter;

      let matchesAsset = true;
      if (assetFilter !== 'all') {
        const filter = ASSET_SIZE_FILTERS.find(f => f.value === assetFilter);
        if (filter) {
          matchesAsset = lead.assets >= filter.min && lead.assets < filter.max;
        }
      }
      return matchesSearch && matchesStatus && matchesType && matchesState && matchesAsset;
    });
  }, [leads, searchTerm, statusFilter, typeFilter, stateFilter, assetFilter]);

  const availableStates = useMemo(() =>
    [...new Set(leads.map(l => l.state))].sort(),
    [leads]
  );

  // Save a lead update to server (with localStorage fallback)
  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    // Optimistic UI update
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));

    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) return;
    } catch {
      // Server unreachable — save to localStorage as fallback
    }
    const saved = localStorage.getItem('riseSalesData');
    const data = saved ? JSON.parse(saved) : {};
    data[id] = { ...data[id], ...updates };
    localStorage.setItem('riseSalesData', JSON.stringify(data));
  }, []);

  return {
    leads, filteredLeads, loading, error, fetchData, availableStates, updateLead,
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    stateFilter, setStateFilter,
    assetFilter, setAssetFilter,
  };
}
