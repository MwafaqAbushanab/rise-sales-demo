import { useState, useEffect } from 'react';
import { Search, X, Save, Trash2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { type ICPCriteria, DEFAULT_ICP_TEMPLATES } from '../utils/prospectFinder';

const STORAGE_KEY = 'riseICPTemplates';

interface ICPBuilderProps {
  onApplyCriteria: (criteria: ICPCriteria | null) => void;
  availableStates: string[];
  isActive: boolean;
  activeCriteria: ICPCriteria | null;
}

function loadSavedTemplates(): ICPCriteria[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveTemplates(templates: ICPCriteria[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export default function ICPBuilder({ onApplyCriteria, availableStates, isActive, activeCriteria }: ICPBuilderProps) {
  const [expanded, setExpanded] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<ICPCriteria[]>(loadSavedTemplates);
  const [templateName, setTemplateName] = useState('');

  // Form state
  const [types, setTypes] = useState<('Credit Union' | 'Community Bank')[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [minAssets, setMinAssets] = useState('');
  const [maxAssets, setMaxAssets] = useState('');
  const [minROA, setMinROA] = useState('');
  const [minMembers, setMinMembers] = useState('');
  const [minScore, setMinScore] = useState('');

  useEffect(() => {
    setSavedTemplates(loadSavedTemplates());
  }, []);

  const toggleType = (t: 'Credit Union' | 'Community Bank') => {
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const toggleState = (s: string) => {
    setStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const buildCriteria = (): ICPCriteria => ({
    id: Date.now().toString(),
    name: templateName || 'Custom Search',
    types,
    states,
    minAssets: minAssets ? parseFloat(minAssets) * 1e6 : 0,
    maxAssets: maxAssets ? parseFloat(maxAssets) * 1e6 : Infinity,
    minMembers: minMembers ? parseInt(minMembers) : 0,
    maxMembers: Infinity,
    minROA: minROA ? parseFloat(minROA) : 0,
    maxROA: Infinity,
    minScore: minScore ? parseInt(minScore) : 0,
  });

  const loadTemplate = (criteria: ICPCriteria) => {
    setTypes(criteria.types);
    setStates(criteria.states);
    setMinAssets(criteria.minAssets > 0 ? (criteria.minAssets / 1e6).toString() : '');
    setMaxAssets(criteria.maxAssets < Infinity ? (criteria.maxAssets / 1e6).toString() : '');
    setMinROA(criteria.minROA > 0 ? criteria.minROA.toString() : '');
    setMinMembers(criteria.minMembers > 0 ? criteria.minMembers.toString() : '');
    setMinScore(criteria.minScore > 0 ? criteria.minScore.toString() : '');
    setTemplateName(criteria.name);
    setExpanded(true);
  };

  const handleApply = () => {
    onApplyCriteria(buildCriteria());
  };

  const handleClear = () => {
    setTypes([]);
    setStates([]);
    setMinAssets('');
    setMaxAssets('');
    setMinROA('');
    setMinMembers('');
    setMinScore('');
    setTemplateName('');
    onApplyCriteria(null);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    const criteria = buildCriteria();
    criteria.name = templateName.trim();
    const updated = [...savedTemplates, criteria].slice(-10);
    setSavedTemplates(updated);
    saveTemplates(updated);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    saveTemplates(updated);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border mb-4">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors">
          <Sparkles className="w-4 h-4 text-blue-500" />
          ICP Prospect Finder
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <div className="flex items-center gap-2">
          {/* Template chips */}
          {!expanded && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {DEFAULT_ICP_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { loadTemplate(t); onApplyCriteria(t); }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap transition-colors ${
                    activeCriteria?.name === t.name ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-200'
                  }`}
                >
                  {t.name}
                </button>
              ))}
              {savedTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => { loadTemplate(t); onApplyCriteria(t); }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap transition-colors ${
                    activeCriteria?.name === t.name ? 'bg-blue-600 text-white border-blue-600' : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
          {isActive && (
            <button onClick={handleClear} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors">
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div className="px-4 pb-4 border-t pt-3 space-y-3">
          {/* Type selector */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase">Institution Type</label>
            <div className="flex gap-2 mt-1">
              {(['Credit Union', 'Community Bank'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    types.includes(t) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Asset range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase">Min Assets ($M)</label>
              <input type="number" value={minAssets} onChange={e => setMinAssets(e.target.value)} placeholder="e.g. 100" className="w-full mt-1 px-2.5 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase">Max Assets ($M)</label>
              <input type="number" value={maxAssets} onChange={e => setMaxAssets(e.target.value)} placeholder="No limit" className="w-full mt-1 px-2.5 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          {/* ROA, Members, Score */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase">Min ROA (%)</label>
              <input type="number" step="0.1" value={minROA} onChange={e => setMinROA(e.target.value)} placeholder="e.g. 0.8" className="w-full mt-1 px-2.5 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase">Min Members</label>
              <input type="number" value={minMembers} onChange={e => setMinMembers(e.target.value)} placeholder="e.g. 50000" className="w-full mt-1 px-2.5 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase">Min Lead Score</label>
              <input type="number" value={minScore} onChange={e => setMinScore(e.target.value)} placeholder="e.g. 70" className="w-full mt-1 px-2.5 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>

          {/* States */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase">Target States {states.length > 0 && `(${states.length} selected)`}</label>
            <div className="flex flex-wrap gap-1 mt-1 max-h-20 overflow-y-auto">
              {availableStates.map(s => (
                <button
                  key={s}
                  onClick={() => toggleState(s)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                    states.includes(s) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="Template name..."
                className="px-2.5 py-1.5 border rounded-lg text-xs w-40 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button onClick={handleSaveTemplate} disabled={!templateName.trim()} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 disabled:opacity-40 transition-colors">
                <Save className="w-3 h-3" />
                Save Template
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleClear} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">
                Clear
              </button>
              <button onClick={handleApply} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                <Search className="w-3.5 h-3.5" />
                Find Matches
              </button>
            </div>
          </div>

          {/* Saved templates */}
          {savedTemplates.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1">Saved Templates</p>
              <div className="flex flex-wrap gap-1.5">
                {savedTemplates.map(t => (
                  <div key={t.id} className="flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-200 rounded-full">
                    <button onClick={() => { loadTemplate(t); onApplyCriteria(t); }} className="text-[11px] font-medium text-purple-700 hover:text-purple-900">{t.name}</button>
                    <button onClick={() => handleDeleteTemplate(t.id)} className="text-purple-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
