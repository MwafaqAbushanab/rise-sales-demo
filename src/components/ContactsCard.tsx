import { useState } from 'react';
import { Users, Mail, Phone, ExternalLink, Loader2, UserX, Search, Check } from 'lucide-react';
import { useContacts } from '../hooks/useContacts';
import { triggerContactSearch, triggerEnrichment } from '../api/contactsApi';
import type { DecisionMaker } from '../types/contacts';

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
  c_suite: 'bg-purple-100 text-purple-700',
  vp: 'bg-blue-100 text-blue-700',
  director: 'bg-teal-100 text-teal-700',
  manager: 'bg-gray-100 text-gray-600',
  senior: 'bg-gray-100 text-gray-600',
  entry: 'bg-gray-100 text-gray-500',
};

function ContactAvatar({ dm }: { dm: DecisionMaker }) {
  const initials = `${dm.firstName?.[0] || ''}${dm.lastName?.[0] || ''}`.toUpperCase();
  if (dm.photoUrl) {
    return (
      <img src={dm.photoUrl} alt={dm.fullName} className="w-9 h-9 rounded-full object-cover" />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
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
    <div className="flex items-center gap-1.5">
      {dm.email && (
        <button
          onClick={copyEmail}
          className="p-1 rounded hover:bg-blue-50 text-blue-600 transition-colors"
          title={`Copy email: ${dm.email}`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Mail className="w-3.5 h-3.5" />}
        </button>
      )}
      {dm.phone && (
        <a
          href={`tel:${dm.phone}`}
          className="p-1 rounded hover:bg-green-50 text-green-600 transition-colors"
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
          className="p-1 rounded hover:bg-blue-50 text-blue-500 transition-colors"
          title="View LinkedIn"
        >
          <ExternalLink className="w-3.5 h-3.5" />
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
    // The hook will re-fetch on next render cycle
    window.location.reload(); // Simple refresh to pick up new data
  };

  const handleEnrich = async () => {
    if (!institutionId) return;
    setEnriching(true);
    await triggerEnrichment(institutionId);
    setEnriching(false);
  };

  // Not configured state
  if (!configured && !loading) {
    return (
      <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4 text-center">
        <UserX className="w-6 h-6 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Contact enrichment not configured</p>
        <p className="text-xs text-gray-400 mt-1">Add APOLLO_API_KEY to server/.env to enable</p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm">Loading contacts...</span>
      </div>
    );
  }

  // No contacts found — offer to search
  if (!contacts || contacts.decisionMakers.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4 text-center">
        <Users className="w-6 h-6 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          {status === 'not_found' ? 'No decision makers found' : 'Contacts not yet searched'}
        </p>
        {configured && (
          <button
            onClick={handleSearch}
            disabled={searching}
            className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1"
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

  // Display contacts
  const dms = compact ? contacts.decisionMakers.slice(0, 3) : contacts.decisionMakers;
  const hasUnenriched = contacts.decisionMakers.some(dm => !dm.enrichedAt);

  return (
    <div className="space-y-2">
      {dms.map((dm) => (
        <div key={dm.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border hover:border-blue-200 transition-colors">
          <ContactAvatar dm={dm} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 truncate">{dm.fullName}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${seniorityColors[dm.seniority] || 'bg-gray-100 text-gray-600'}`}>
                {seniorityLabels[dm.seniority] || dm.seniority}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">{dm.title}</p>
            {dm.email && (
              <p className="text-xs text-blue-600 truncate">{dm.email}</p>
            )}
          </div>
          <ContactActions dm={dm} />
        </div>
      ))}

      {/* Show count if compact and more exist */}
      {compact && contacts.decisionMakers.length > 3 && (
        <p className="text-xs text-gray-400 text-center">
          +{contacts.decisionMakers.length - 3} more contacts
        </p>
      )}

      {/* Enrich button if there are unenriched contacts */}
      {hasUnenriched && configured && !compact && (
        <button
          onClick={handleEnrich}
          disabled={enriching}
          className="w-full py-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
        >
          {enriching ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Enriching emails...</>
          ) : (
            <><Mail className="w-3 h-3" /> Enrich Email Addresses (uses Apollo credits)</>
          )}
        </button>
      )}

      {/* Source attribution */}
      <p className="text-[10px] text-gray-400 text-center">
        Data from Apollo.io {contacts.searchedAt && `| Searched ${new Date(contacts.searchedAt).toLocaleDateString()}`}
      </p>
    </div>
  );
}
