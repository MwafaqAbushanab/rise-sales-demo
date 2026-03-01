// Hook for lazy-loading Apollo contact data for an institution

import { useState, useEffect } from 'react';
import { fetchContactsForLead } from '../api/contactsApi';
import type { InstitutionContacts } from '../types/contacts';

export function useContacts(institutionId: string | undefined) {
  const [contacts, setContacts] = useState<InstitutionContacts | null>(null);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'not_found'>('idle');

  useEffect(() => {
    if (!institutionId) {
      setContacts(null);
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchContactsForLead(institutionId).then(response => {
      if (cancelled) return;
      setConfigured(response.configured);
      setContacts(response.data);
      setStatus(
        !response.configured ? 'idle' :
        response.data ? 'found' :
        response.status === 'searching' ? 'searching' : 'not_found'
      );
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [institutionId]);

  return { contacts, configured, loading, status };
}
