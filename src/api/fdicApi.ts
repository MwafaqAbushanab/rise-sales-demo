// FDIC API Service - Fetches real Community Bank data
// API Documentation: https://banks.data.fdic.gov/docs/

const FDIC_API_BASE = 'https://banks.data.fdic.gov/api';

export interface Bank {
  id: string;
  name: string;
  certNumber: string;
  city: string;
  state: string;
  assets: number;
  deposits: number;
  equity: number;
  netIncome: number;
  roa: number;
  roe: number;
  branches: number;
  established: string;
  charterClass: string;
  activeFlag: boolean;
  bankClass: string;
  address: string;
  zip: string;
  county: string;
  website: string;
}

export interface FDICSearchParams {
  state?: string;
  minAssets?: number;
  maxAssets?: number;
  name?: string;
  limit?: number;
  offset?: number;
  activeOnly?: boolean;
}

// Fetch banks from FDIC API
export async function fetchBanks(params: FDICSearchParams = {}): Promise<Bank[]> {
  try {
    const filters: string[] = [];

    // Only get active banks by default
    if (params.activeOnly !== false) {
      filters.push('ACTIVE:1');
    }

    // State filter
    if (params.state) {
      filters.push(`STALP:${params.state}`);
    }

    // Asset filters (FDIC stores assets in thousands)
    if (params.minAssets) {
      filters.push(`ASSET:[${params.minAssets / 1000} TO *]`);
    }
    if (params.maxAssets) {
      filters.push(`ASSET:[* TO ${params.maxAssets / 1000}]`);
    }

    // Name search
    if (params.name) {
      filters.push(`NAME:*${params.name}*`);
    }

    const queryParams = new URLSearchParams({
      filters: filters.join(','),
      fields: 'CERT,NAME,CITY,STALP,ASSET,DEP,EQ,NETINC,ROA,ROE,OFFNUM,ESTYMD,CHARTER,ACTIVE,BKCLASS,ADDRESS,ZIP,COUNTY,WEBADDR',
      sort_by: 'ASSET',
      sort_order: 'DESC',
      limit: (params.limit || 10000).toString(),
      offset: (params.offset || 0).toString(),
      format: 'json',
    });

    const response = await fetch(`${FDIC_API_BASE}/institutions?${queryParams.toString()}`);

    if (!response.ok) {
      throw new Error(`FDIC API error: ${response.status}`);
    }

    const data = await response.json();
    return transformFDICData(data.data || []);
  } catch (error) {
    console.error('Error fetching from FDIC API:', error);
    return [];
  }
}

// Fetch bank financials for more detailed data
export async function fetchBankFinancials(certNumber: string): Promise<any> {
  try {
    const response = await fetch(
      `${FDIC_API_BASE}/financials?filters=CERT:${certNumber}&limit=1&format=json`
    );

    if (!response.ok) {
      throw new Error(`FDIC Financials API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error('Error fetching bank financials:', error);
    return null;
  }
}

// Get summary statistics for banks
export async function fetchBankSummary(): Promise<any> {
  try {
    const response = await fetch(`${FDIC_API_BASE}/summary?format=json`);

    if (!response.ok) {
      throw new Error(`FDIC Summary API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching bank summary:', error);
    return null;
  }
}

function transformFDICData(data: any[]): Bank[] {
  return data.map((item) => {
    const bankData = item.data || item;
    return {
      id: `bank_${bankData.CERT || bankData.cert}`,
      name: bankData.NAME || bankData.name || 'Unknown Bank',
      certNumber: (bankData.CERT || bankData.cert || '').toString(),
      city: bankData.CITY || bankData.city || '',
      state: bankData.STALP || bankData.stalp || bankData.state || '',
      assets: (parseFloat(bankData.ASSET || bankData.asset || 0)) * 1000, // Convert from thousands
      deposits: (parseFloat(bankData.DEP || bankData.dep || 0)) * 1000,
      equity: (parseFloat(bankData.EQ || bankData.eq || 0)) * 1000,
      netIncome: (parseFloat(bankData.NETINC || bankData.netinc || 0)) * 1000,
      roa: parseFloat(bankData.ROA || bankData.roa || 0),
      roe: parseFloat(bankData.ROE || bankData.roe || 0),
      branches: parseInt(bankData.OFFNUM || bankData.offnum || 1),
      established: bankData.ESTYMD || bankData.estymd || '',
      charterClass: bankData.CHARTER || bankData.charter || '',
      activeFlag: bankData.ACTIVE === 1 || bankData.active === 1,
      bankClass: bankData.BKCLASS || bankData.bkclass || '',
      address: bankData.ADDRESS || bankData.address || '',
      zip: bankData.ZIP || bankData.zip || '',
      county: bankData.COUNTY || bankData.county || '',
      website: bankData.WEBADDR || bankData.webaddr || '',
    };
  });
}

// Get count of banks matching criteria
export async function getBankCount(params: FDICSearchParams = {}): Promise<number> {
  try {
    const filters: string[] = ['ACTIVE:1'];

    if (params.state) {
      filters.push(`STALP:${params.state}`);
    }
    if (params.minAssets) {
      filters.push(`ASSET:[${params.minAssets / 1000} TO *]`);
    }

    const queryParams = new URLSearchParams({
      filters: filters.join(','),
      limit: '1',
      format: 'json',
    });

    const response = await fetch(`${FDIC_API_BASE}/institutions?${queryParams.toString()}`);
    const data = await response.json();
    return data.totals?.count || 0;
  } catch (error) {
    console.error('Error getting bank count:', error);
    return 0;
  }
}

// Bank class descriptions
export const BANK_CLASSES: Record<string, string> = {
  'N': 'National Bank',
  'NM': 'State Nonmember Bank',
  'SM': 'State Member Bank',
  'SB': 'Savings Bank',
  'SA': 'Savings Association',
  'OI': 'Insured Branch of Foreign Bank',
};

// Asset size categories for filtering
export const ASSET_SIZE_FILTERS = [
  { label: 'All Sizes', value: 'all', min: 0, max: Infinity },
  { label: 'Under $100M', value: 'under100m', min: 0, max: 100000000 },
  { label: '$100M - $500M', value: '100m-500m', min: 100000000, max: 500000000 },
  { label: '$500M - $1B', value: '500m-1b', min: 500000000, max: 1000000000 },
  { label: '$1B - $5B', value: '1b-5b', min: 1000000000, max: 5000000000 },
  { label: '$5B - $10B', value: '5b-10b', min: 5000000000, max: 10000000000 },
  { label: 'Over $10B', value: 'over10b', min: 10000000000, max: Infinity },
];
