import { BarChart3, RefreshCw, Sparkles } from 'lucide-react';
import { SalesforceIcon } from '../icons';

export default function AppHeader({ loading, onRefresh }: {
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-600/20">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Rise Sales Agent</h1>
              <p className="text-xs text-gray-500">Credit Union Intelligence — Powered by NCUA & FDIC Data</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 border border-gray-100 rounded-lg px-2.5 py-1.5">
              <SalesforceIcon className="h-4 w-auto" />
              <span>Synced</span>
            </div>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            <span className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-4 h-4" /> AI Active
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
