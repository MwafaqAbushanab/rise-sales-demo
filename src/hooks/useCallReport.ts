// React hook for lazy-loading NCUA 5300 Call Report data per credit union

import { useState, useEffect } from 'react';
import { fetchCallReport } from '../api/callReportApi';
import { computeFinancialHealth } from '../utils/financialHealth';
import type { CallReportData, FinancialHealthScore } from '../types/callReport';

export function useCallReport(charterNumber: string | number | undefined) {
  const [callReport, setCallReport] = useState<CallReportData | null>(null);
  const [financialHealth, setFinancialHealth] = useState<FinancialHealthScore | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!charterNumber) {
      setCallReport(null);
      setFinancialHealth(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchCallReport(charterNumber).then(data => {
      if (cancelled) return;
      setCallReport(data);
      if (data) {
        setFinancialHealth(computeFinancialHealth(data));
      } else {
        setFinancialHealth(null);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [charterNumber]);

  return { callReport, financialHealth, loading };
}
