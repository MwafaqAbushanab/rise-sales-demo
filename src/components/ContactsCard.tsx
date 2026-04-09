import { useState } from 'react';
import { Users, Mail, Phone, Loader2, UserX, Search, Check } from 'lucide-react';
import { useContacts } from '../hooks/useContacts';
import { triggerContactSearch, triggerEnrichment } from '../api/contactsApi';
import type { DecisionMaker } from '../types/contacts';
import { cn } from '../lib/utils';
import { LinkedInIcon } from './icons';

interface ContactsCardProps {
  institutionId: string | undefined;
  companyName: string;
  compact?: boolean;
}

const seniorityLabels: Record<string, string> = {
  c_suite: 'C-Suite',
  vp: 'VP',
  director: 'Director',
  manager: 'Manager',
  senior: 'Senior',
  entry: 'Entry',
};

const seniorityColors: Record<string, string> = {
  c_suite: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200',
  vp: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  director: 'bg-teal-100 text-teal-700 ring-1 ring-teal-200',
  manager: 'bg-gray-100 text-gray-600',
  senior: 'bg-gray-100 text-gray-600',
  entry: 'bg-gray-100 text-gray-500',
};

function ContactAvatar({ dm }: { dm: DecisionMaker }) {
  const initials = `${dm.firstName?.[0] || ''}${dm.lastName?.[0] || ''}`.toUpperCase();
  if (dm.photoUrl) {
    return (
      <img src={dm.photoUrl} alt={dm.fullName} className="w-10 h-10 rounded-xl object-cover ring-1 ring-gray-200" />
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
      {initials || '?'}
    </div>
  );
}

function ContactActions({ dm }: { dm: DecisionMaker }) {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    if (dm.email) {
      navigator.clipboard.writeText(dm.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {dm.email && (
        <button
          onClick={copyEmail}
          className={cn(
            'p-1.5 rounded-lg transition-all',
            copied ? 'bg-green-50 text-green-600' : 'hover:bg-blue-50 text-blue-500'
          )}
          title={`Copy email: ${dm.email}`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
        </button>
      )}
      {dm.phone && (
        <a
          href={`tel:${dm.phone}`}
          className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-all"
          title={`Call: ${dm.phone}`}
        >
          <Phone className="w-3.5 h-3.5" />
        </a>
      )}
      {dm.linkedinUrl && (
        <a
          href={dm.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-all"
          title="View LinkedIn"
        >
          <LinkedInIcon className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

export default function ContactsCard({ institutionId, companyName, compact = false }: ContactsCardProps) {
  const { contacts, configured, loading, status } = useContacts(institutionId);
  const [searching, setSearching] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const handleSearch = async () => {
    if (!institutionId || !companyName) return;
    setSearching(true);
    await triggerContactSearch(institutionId, companyName);
    setSearching(false);
    window.location.reload();
  };

  const handleEnrich = async () => {
    if (!institutionId) return;
    setEnriching(true);
    await triggerEnrichment(institutionId);
    setEnriching(false);
  };

  if (!configured && !loading) {
    return (
      <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-5 text-center">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
          <UserX className="w-5 h-5 text-gray-300" />
        </div>
        <p className="text-sm text-gray-500">Contact enrichment not configured</p>
        <p className="text-xs text-gray-400 mt-1">Add APOLLO_API_KEY to server/.env to enable</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm">Loading contacts...</span>
      </div>
    );
  }

  if (!contacts || contacts.decisionMakers.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-5 text-center">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-2">
          <Users className="w-5 h-5 text-gray-300" />
        </div>
        <p className="text-sm text-gray-500">
          {status === 'not_found' ? 'No decision makers found' : 'Contacts not yet searched'}
        </p>
        {configured && (
          <button
            onClick={handleSearch}
            disabled={searching}
            className="mt-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium rounded-lg hover:shadow-md shadow-sm disabled:opacity-50 transition-all inline-flex items-center gap-1.5"
          >
            {searching ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Searching...</>
            ) : (
              <><Search className="w-3 h-3" /> Find Decision Makers</>
            )}
          </button>
        )}
      </div>
    );
  }

  const dms = compact ? contacts.decisionMakers.slice(0, 3) : contacts.decisionMakers;
  const hasUnenriched = contacts.decisionMakers.some(dm => !dm.enrichedAt);

  return (
    <div className="space-y-2">
      {dms.map((dm) => (
        <div key={dm.id} className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group">
          <ContactAvatar dm={dm} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 truncate">{dm.fullName}</span>
              <span className={cn(
                'px-1.5 py-0.5 rounded-md text-[10px] font-semibold',
                seniorityColors[dm.seniority] || 'bg-gray-100 text-gray-600'
              )}>
                {seniorityLabels[dm.seniority] || dm.seniority}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">{dm.title}</p>
            {dm.email && (
              <p className="text-xs text-blue-600 truncate">{dm.email}</p>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ContactActions dm={dm} />
          </div>
        </div>
      ))}

      {compact && contacts.decisionMakers.length > 3 && (
        <p className="text-xs text-gray-400 text-center py-1">
          +{contacts.decisionMakers.length - 3} more contacts
        </p>
      )}

      {hasUnenriched && configured && !compact && (
        <button
          onClick={handleEnrich}
          disabled={enriching}
          className="w-full py-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 font-medium"
        >
          {enriching ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Enriching emails...</>
          ) : (
            <><Mail className="w-3 h-3" /> Enrich Email Addresses (uses Apollo credits)</>
          )}
        </button>
      )}

      <p className="text-[10px] text-gray-400 text-center">
        Data from Apollo.io {contacts.searchedAt && `| Searched ${new Date(contacts.searchedAt).toLocaleDateString()}`}
      </p>
    </div>
  );
}
