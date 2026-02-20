import { Building2, Rocket, Globe, GraduationCap, Megaphone } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export type TabId = 'pipeline' | 'acceleration' | 'territory' | 'coaching' | 'marketing';

export const TAB_PATHS: Record<TabId, string> = {
  pipeline: '/',
  acceleration: '/acceleration',
  territory: '/territory',
  coaching: '/coaching',
  marketing: '/marketing',
};

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; path: string }[] = [
  { id: 'pipeline', label: 'Pipeline', icon: Building2, path: TAB_PATHS.pipeline },
  { id: 'acceleration', label: 'Sales Acceleration', icon: Rocket, path: TAB_PATHS.acceleration },
  { id: 'territory', label: 'Territory', icon: Globe, path: TAB_PATHS.territory },
  { id: 'coaching', label: 'Deal Coach', icon: GraduationCap, path: TAB_PATHS.coaching },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, path: TAB_PATHS.marketing },
];

export default function TabNavigation() {
  return (
    <div className="bg-white border-b mb-6 -mx-4 px-4 overflow-x-auto">
      <nav className="flex gap-1" role="tablist">
        {TABS.map(tab => (
          <NavLink
            key={tab.id}
            to={tab.path}
            end={tab.id === 'pipeline'}
            role="tab"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
