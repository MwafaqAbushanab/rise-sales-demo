import { useState, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Building2, DollarSign, Filter, Target } from 'lucide-react';
import { analyzeProspect, type ProspectIntelligence } from './utils/prospectingIntelligence';
import { analyzeCompetitiveLandscape, type CompetitiveIntel } from './utils/competitiveIntelligence';
import { identifyHotLeads } from './utils/salesAcceleration';
import { useLeads } from './hooks/useLeads';
import { useAIHealth } from './hooks/useAIHealth';
import { formatCurrency, type Lead } from './types';

import AppHeader from './components/layout/AppHeader';
import TabNavigation from './components/layout/TabNavigation';
import ErrorBoundary from './components/ErrorBoundary';
import GettingStarted from './components/GettingStarted';
import ExecutiveSummary from './components/ExecutiveSummary';
import InstitutionsTable from './components/InstitutionsTable';
import IntelligencePanel from './components/IntelligencePanel';
import AIChat from './components/AIChat';
import ROICalculatorModal from './components/ROICalculatorModal';
import SalesAccelerationDashboard from './components/dashboards/SalesAcceleration';
import TerritoryIntelligenceDashboard from './components/dashboards/TerritoryIntelligence';
import DealCoachingDashboard from './components/dashboards/DealCoaching';
import MarketingAgentDashboard from './components/dashboards/MarketingAgent';

export default function App() {
  const {
    leads, filteredLeads, loading, error, fetchData, availableStates,
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    stateFilter, setStateFilter,
    assetFilter, setAssetFilter,
  } = useLeads();

  const { aiConnected } = useAIHealth();
  const navigate = useNavigate();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showROICalculator, setShowROICalculator] = useState(false);
  const [showGettingStarted, setShowGettingStarted] = useState(() => {
    return localStorage.getItem('hideGettingStarted') !== 'true';
  });

  const handleDismissGettingStarted = useCallback(() => {
    localStorage.setItem('hideGettingStarted', 'true');
    setShowGettingStarted(false);
  }, []);

  const handleSelectDemo = useCallback((scenario: string) => {
    setShowGettingStarted(false);
    localStorage.setItem('hideGettingStarted', 'true');
    if (leads.length > 0) {
      let targetLead: Lead | undefined;
      switch (scenario) {
        case 'enterprise':
          targetLead = [...leads]
            .filter(l => l.type === 'Credit Union')
            .sort((a, b) => b.assets - a.assets)[0];
          break;
        case 'competitive':
          targetLead = leads.find(l => l.state === 'TX' && l.assets >= 500000000 && l.assets <= 5000000000);
          break;
        case 'expansion':
          targetLead = leads.find(l => l.type === 'Community Bank' && l.assets >= 100000000);
          break;
      }
      if (targetLead) {
        setSelectedLead(targetLead);
        navigate('/');
      }
    }
  }, [leads, navigate]);

  const selectedLeadIntelligence = useMemo((): ProspectIntelligence | null => {
    if (!selectedLead || leads.length === 0) return null;
    const leadForAnalysis = {
      id: selectedLead.id, name: selectedLead.name, type: selectedLead.type,
      city: selectedLead.city, state: selectedLead.state, assets: selectedLead.assets,
      members: selectedLead.members, deposits: selectedLead.deposits,
      roa: selectedLead.roa, branches: selectedLead.branches,
    };
    const allLeadsForAnalysis = leads.map(l => ({
      id: l.id, name: l.name, type: l.type, city: l.city, state: l.state,
      assets: l.assets, members: l.members, deposits: l.deposits,
      roa: l.roa, branches: l.branches,
    }));
    return analyzeProspect(leadForAnalysis, allLeadsForAnalysis);
  }, [selectedLead, leads]);

  const selectedLeadCompetitiveIntel = useMemo((): CompetitiveIntel | null => {
    if (!selectedLead) return null;
    return analyzeCompetitiveLandscape({
      type: selectedLead.type, assets: selectedLead.assets,
      state: selectedLead.state, name: selectedLead.name,
    });
  }, [selectedLead]);

  const hotLeads = useMemo(() => {
    if (leads.length === 0) return [];
    return identifyHotLeads(leads);
  }, [leads]);

  const stats = useMemo(() => [
    {
      label: 'Total Institutions',
      value: leads.length.toLocaleString(),
      icon: Building2,
      change: `${leads.filter(l => l.type === 'Credit Union').length} CUs / ${leads.filter(l => l.type === 'Community Bank').length} Banks`,
      color: 'text-blue-600'
    },
    {
      label: 'Total Assets',
      value: formatCurrency(leads.reduce((sum, l) => sum + l.assets, 0)),
      icon: DollarSign,
      change: 'Combined',
      color: 'text-green-600'
    },
    {
      label: 'Filtered Results',
      value: filteredLeads.length.toLocaleString(),
      icon: Filter,
      change: `of ${leads.length}`,
      color: 'text-purple-600'
    },
    {
      label: 'Avg Lead Score',
      value: leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length).toString() : '0',
      icon: Target,
      change: '/100',
      color: 'text-amber-600'
    },
  ], [leads, filteredLeads]);

  return (
    <div className="min-h-screen bg-gray-100">
      <AppHeader loading={loading} onRefresh={fetchData} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {showGettingStarted && (
          <GettingStarted
            aiConnected={aiConnected}
            leadsLoaded={!loading && leads.length > 0}
            onDismiss={handleDismissGettingStarted}
            onSelectDemo={handleSelectDemo}
          />
        )}

        <TabNavigation />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchData} className="text-sm underline">Try Again</button>
          </div>
        )}

        <Routes>
          <Route path="/" element={
            <>
              <ErrorBoundary fallbackTitle="Executive Summary failed to load">
                {!loading && leads.length > 0 && (
                  <ExecutiveSummary leads={leads} hotLeads={hotLeads} />
                )}

                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm border">
                      <div className="flex items-center justify-between">
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                        <span className="text-xs text-gray-500 font-medium">{stat.change}</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-sm text-gray-500">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ErrorBoundary>

              {/* Full-width institutions table */}
              <ErrorBoundary fallbackTitle="Institutions table failed to load">
                <InstitutionsTable
                  leads={filteredLeads}
                  selectedLead={selectedLead}
                  onSelectLead={setSelectedLead}
                  loading={loading}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  typeFilter={typeFilter}
                  onTypeFilterChange={setTypeFilter}
                  stateFilter={stateFilter}
                  onStateFilterChange={setStateFilter}
                  assetFilter={assetFilter}
                  onAssetFilterChange={setAssetFilter}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  availableStates={availableStates}
                />
              </ErrorBoundary>

              {/* Intelligence + AI Chat side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="min-h-[400px] max-h-[700px] overflow-y-auto">
                  <ErrorBoundary fallbackTitle="Intelligence panel failed to load">
                    <IntelligencePanel
                      intelligence={selectedLeadIntelligence}
                      lead={selectedLead}
                      competitiveIntel={selectedLeadCompetitiveIntel}
                      onOpenROICalculator={() => setShowROICalculator(true)}
                    />
                  </ErrorBoundary>
                </div>
                <div className="min-h-[400px] max-h-[700px]">
                  <ErrorBoundary fallbackTitle="AI Chat failed to load">
                    <AIChat
                      selectedLead={selectedLead}
                      intelligence={selectedLeadIntelligence}
                      competitiveIntel={selectedLeadCompetitiveIntel}
                    />
                  </ErrorBoundary>
                </div>
              </div>
            </>
          } />

          <Route path="/acceleration" element={
            <ErrorBoundary fallbackTitle="Sales Acceleration failed to load">
              {!loading && leads.length > 0 ? (
                <SalesAccelerationDashboard leads={leads} onSelectLead={(lead) => {
                  setSelectedLead(lead);
                  navigate('/');
                }} />
              ) : null}
            </ErrorBoundary>
          } />

          <Route path="/territory" element={
            <ErrorBoundary fallbackTitle="Territory Intelligence failed to load">
              {!loading && leads.length > 0 ? (
                <TerritoryIntelligenceDashboard leads={leads} />
              ) : null}
            </ErrorBoundary>
          } />

          <Route path="/coaching" element={
            <ErrorBoundary fallbackTitle="Deal Coach failed to load">
              <DealCoachingDashboard
                selectedLead={selectedLead}
                intelligence={selectedLeadIntelligence}
              />
            </ErrorBoundary>
          } />

          <Route path="/marketing" element={
            <ErrorBoundary fallbackTitle="Marketing Agent failed to load">
              <MarketingAgentDashboard />
            </ErrorBoundary>
          } />
        </Routes>
      </main>

      <ROICalculatorModal
        lead={selectedLead}
        isOpen={showROICalculator}
        onClose={() => setShowROICalculator(false)}
      />
    </div>
  );
}
