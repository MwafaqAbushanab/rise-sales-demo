import { BarChart3, RefreshCw, Sparkles } from 'lucide-react';

export default function AppHeader({ loading, onRefresh }: {
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Rise Sales Agent</h1>
              <p className="text-xs text-gray-500">Real CU/Bank Data from NCUA & FDIC</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> AI Active
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
