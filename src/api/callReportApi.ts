// Frontend API client for NCUA 5300 Call Report data

import type { CallReportData, CallReportCacheMeta } from '../types/callReport';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export async function fetchCallReport(charterNumber: string | number): Promise<CallReportData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/call-report/${charterNumber}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchCallReportBatch(charterNumbers: number[]): Promise<Record<number, CallReportData>> {
  try {
    const res = await fetch(`${API_BASE}/api/call-report/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ charterNumbers }),
    });
    if (!res.ok) return {};
    const { data } = await res.json();
    return data;
  } catch {
    return {};
  }
}

export async function fetchCallReportMeta(): Promise<CallReportCacheMeta | null> {
  try {
    const res = await fetch(`${API_BASE}/api/call-report/summary`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
