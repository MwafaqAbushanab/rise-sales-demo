import { Search, FileText, Bell, Rocket, Globe, GraduationCap, Megaphone } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

export type TabId = 'prospect-finder' | 'precall' | 'alerts' | 'acceleration' | 'territory' | 'coaching' | 'marketing';

export const TAB_PATHS: Record<TabId, string> = {
  'prospect-finder': '/',
  precall: '/precall',
  alerts: '/alerts',
  acceleration: '/acceleration',
  territory: '/territory',
  coaching: '/coaching',
  marketing: '/marketing',
};

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; path: string }[] = [
  { id: 'prospect-finder', label: 'Prospect Finder', icon: Search, path: TAB_PATHS['prospect-finder'] },
  { id: 'precall', label: 'Pre-Call Prep', icon: FileText, path: TAB_PATHS.precall },
  { id: 'alerts', label: 'Alerts', icon: Bell, path: TAB_PATHS.alerts },
  { id: 'acceleration', label: 'Sales Acceleration', icon: Rocket, path: TAB_PATHS.acceleration },
  { id: 'territory', label: 'Territory', icon: Globe, path: TAB_PATHS.territory },
  { id: 'coaching', label: 'Deal Coach', icon: GraduationCap, path: TAB_PATHS.coaching },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, path: TAB_PATHS.marketing },
];

export default function TabNavigation() {
  return (
    <div className="bg-white border-b mb-6 -mx-4 px-4 overflow-x-auto">
      <nav className="flex gap-0.5" role="tablist">
        {TABS.map(tab => (
          <NavLink
            key={tab.id}
            to={tab.path}
            end={tab.id === 'prospect-finder'}
            role="tab"
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap rounded-t-lg',
                isActive
                  ? 'text-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon className={cn('w-4 h-4', isActive && 'text-blue-600')} />
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
