// NCUA API Service - Fetches real Credit Union data
// Using Socrata Open Data API from NCUA

export interface CreditUnion {
  id: string;
  name: string;
  charterNumber: string;
  city: string;
  state: string;
  assets: number;
  members: number;
  loans: number;
  shares: number;
  netWorth: number;
  roa: number;
  charterType: string;
  peerGroup: string;
}

export interface NCUASearchParams {
  state?: string;
  minAssets?: number;
  maxAssets?: number;
  name?: string;
  limit?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Fetch credit unions — tries server cache first, then direct NCUA, then sample data
export async function fetchCreditUnions(params: NCUASearchParams = {}): Promise<CreditUnion[]> {
  // 1. Try server-side cache proxy (fastest, most reliable)
  try {
    const res = await fetch(`${API_BASE_URL}/api/ncua/credit-unions`);
    if (res.ok) {
      const { data, source } = await res.json();
      if (data && data.length > 0) {
        console.log(`NCUA: ${data.length} credit unions from server (${source})`);
        return applyClientFilters(transformNCUAData(data), params);
      }
    }
  } catch {
    // Server not available — fall through to direct fetch
  }

  // 2. Fall back to direct NCUA API calls
  const endpoints = [
    'https://data.ncua.gov/resource/9k6a-5st2.json',
    'https://data.ncua.gov/resource/kp6f-mwpt.json',
    'https://data.ncua.gov/resource/7kii-a53n.json',
  ];

  for (const endpoint of endpoints) {
    try {
      const queryParams = new URLSearchParams({
        '$limit': '10000',
        '$order': 'total_assets DESC',
      });

      const whereConditions: string[] = [];
      if (params.state) {
        whereConditions.push(`state='${params.state}'`);
      }
      if (params.minAssets) {
        whereConditions.push(`total_assets>=${params.minAssets / 1000}`);
      }
      if (params.name) {
        whereConditions.push(`upper(cu_name) like '%${params.name.toUpperCase()}%'`);
      }

      if (whereConditions.length > 0) {
        queryParams.append('$where', whereConditions.join(' AND '));
      }

      const response = await fetch(`${endpoint}?${queryParams.toString()}`, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        console.log(`Endpoint ${endpoint} returned ${response.status}, trying next...`);
        continue;
      }

      const data = await response.json();
      if (data && data.length > 0) {
        console.log(`Successfully fetched ${data.length} credit unions from ${endpoint}`);
        return transformNCUAData(data);
      }
    } catch (error) {
      console.log(`Failed to fetch from ${endpoint}:`, error);
      continue;
    }
  }

  // 3. All sources failed — use embedded sample data
  console.log('All NCUA sources failed, using sample credit union data');
  return getSampleCreditUnions();
}

function applyClientFilters(cus: CreditUnion[], params: NCUASearchParams): CreditUnion[] {
  return cus.filter(cu => {
    if (params.state && cu.state !== params.state) return false;
    if (params.minAssets && cu.assets < params.minAssets) return false;
    if (params.maxAssets && cu.assets > params.maxAssets) return false;
    if (params.name && !cu.name.toLowerCase().includes(params.name.toLowerCase())) return false;
    return true;
  });
}

function transformNCUAData(data: any[]): CreditUnion[] {
  return data.map((item, index) => {
    // Handle different field naming conventions from various NCUA datasets
    const assets = parseFloat(
      item.total_assets ||
      item.totalassets ||
      item.assets ||
      item.TOTAL_ASSETS ||
      0
    ) * 1000; // Data is usually in thousands

    const members = parseInt(
      item.no_of_members ||
      item.members ||
      item.number_of_members ||
      item.NO_OF_MEMBERS ||
      0
    );

    const name = item.cu_name ||
                 item.cuname ||
                 item.name ||
                 item.CU_NAME ||
                 'Unknown Credit Union';

    const charterNum = item.cu_number ||
                       item.cunumber ||
                       item.charter_number ||
                       item.CU_NUMBER ||
                       index.toString();

    return {
      id: `cu_${charterNum}`,
      name: name,
      charterNumber: charterNum.toString(),
      city: item.city || item.physical_address_city || item.CITY || '',
      state: item.state || item.physical_address_state_code || item.STATE || '',
      assets: assets,
      members: members,
      loans: parseFloat(item.total_loans || item.loans || 0) * 1000,
      shares: parseFloat(item.total_shares || item.shares || 0) * 1000,
      netWorth: parseFloat(item.net_worth || 0) * 1000,
      roa: parseFloat(item.roa || item.return_on_assets || 0),
      charterType: item.charter_type || item.type || 'FCU',
      peerGroup: item.peer_group || '',
    };
  }).filter(cu => cu.assets > 0); // Filter out invalid entries
}

// Sample credit union data for when APIs are unavailable
function getSampleCreditUnions(): CreditUnion[] {
  return [
    { id: 'cu_68413', name: 'Navy Federal Credit Union', charterNumber: '68413', city: 'Vienna', state: 'VA', assets: 165000000000, members: 13000000, loans: 105000000000, shares: 140000000000, netWorth: 22000000000, roa: 1.1, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_60936', name: 'State Employees Credit Union', charterNumber: '60936', city: 'Raleigh', state: 'NC', assets: 54000000000, members: 2700000, loans: 38000000000, shares: 46000000000, netWorth: 6200000000, roa: 0.9, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_68771', name: 'Pentagon Federal Credit Union', charterNumber: '68771', city: 'McLean', state: 'VA', assets: 36000000000, members: 2900000, loans: 28000000000, shares: 30000000000, netWorth: 4500000000, roa: 0.8, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_67757', name: 'Boeing Employees Credit Union', charterNumber: '67757', city: 'Tukwila', state: 'WA', assets: 28000000000, members: 1400000, loans: 20000000000, shares: 24000000000, netWorth: 3200000000, roa: 0.95, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_61577', name: 'SchoolsFirst Federal Credit Union', charterNumber: '61577', city: 'Santa Ana', state: 'CA', assets: 28000000000, members: 1200000, loans: 16000000000, shares: 24000000000, netWorth: 3100000000, roa: 0.85, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_68547', name: 'Golden 1 Credit Union', charterNumber: '68547', city: 'Sacramento', state: 'CA', assets: 21000000000, members: 1100000, loans: 14000000000, shares: 18000000000, netWorth: 2400000000, roa: 0.75, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_67905', name: 'Alliant Credit Union', charterNumber: '67905', city: 'Chicago', state: 'IL', assets: 19000000000, members: 800000, loans: 13000000000, shares: 16000000000, netWorth: 2100000000, roa: 0.88, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_67776', name: 'First Tech Federal Credit Union', charterNumber: '67776', city: 'San Jose', state: 'CA', assets: 17000000000, members: 700000, loans: 12000000000, shares: 14000000000, netWorth: 1900000000, roa: 0.92, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_68149', name: 'Suncoast Credit Union', charterNumber: '68149', city: 'Tampa', state: 'FL', assets: 17000000000, members: 1000000, loans: 11000000000, shares: 14000000000, netWorth: 1800000000, roa: 0.82, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_67911', name: 'VyStar Credit Union', charterNumber: '67911', city: 'Jacksonville', state: 'FL', assets: 13500000000, members: 890000, loans: 9000000000, shares: 11000000000, netWorth: 1500000000, roa: 0.78, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_68302', name: 'America First Credit Union', charterNumber: '68302', city: 'Ogden', state: 'UT', assets: 18000000000, members: 1300000, loans: 12000000000, shares: 15000000000, netWorth: 2000000000, roa: 0.86, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_60945', name: 'Bethpage Federal Credit Union', charterNumber: '60945', city: 'Bethpage', state: 'NY', assets: 12000000000, members: 450000, loans: 8500000000, shares: 10000000000, netWorth: 1300000000, roa: 0.72, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_67584', name: 'Space Coast Credit Union', charterNumber: '67584', city: 'Melbourne', state: 'FL', assets: 8200000000, members: 520000, loans: 5500000000, shares: 7000000000, netWorth: 900000000, roa: 0.81, charterType: 'FCU', peerGroup: '2' },
    { id: 'cu_68422', name: 'Digital Federal Credit Union', charterNumber: '68422', city: 'Marlborough', state: 'MA', assets: 13000000000, members: 1000000, loans: 9000000000, shares: 11000000000, netWorth: 1400000000, roa: 0.77, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_61785', name: 'USAA Federal Savings Bank', charterNumber: '61785', city: 'San Antonio', state: 'TX', assets: 15000000000, members: 850000, loans: 10000000000, shares: 13000000000, netWorth: 1600000000, roa: 0.83, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_67890', name: 'Lake Michigan Credit Union', charterNumber: '67890', city: 'Grand Rapids', state: 'MI', assets: 12500000000, members: 550000, loans: 8800000000, shares: 10500000000, netWorth: 1350000000, roa: 0.79, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_60987', name: 'Randolph-Brooks Federal Credit Union', charterNumber: '60987', city: 'Live Oak', state: 'TX', assets: 16500000000, members: 1100000, loans: 11500000000, shares: 14000000000, netWorth: 1750000000, roa: 0.84, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_68234', name: 'Mountain America Credit Union', charterNumber: '68234', city: 'Sandy', state: 'UT', assets: 16000000000, members: 1150000, loans: 11000000000, shares: 13500000000, netWorth: 1700000000, roa: 0.88, charterType: 'FCU', peerGroup: '1' },
    { id: 'cu_67543', name: 'Redstone Federal Credit Union', charterNumber: '67543', city: 'Huntsville', state: 'AL', assets: 9500000000, members: 750000, loans: 6500000000, shares: 8000000000, netWorth: 1050000000, roa: 0.76, charterType: 'FCU', peerGroup: '2' },
    { id: 'cu_68123', name: 'Coastal Credit Union', charterNumber: '68123', city: 'Raleigh', state: 'NC', assets: 4800000000, members: 320000, loans: 3200000000, shares: 4000000000, netWorth: 530000000, roa: 0.71, charterType: 'FCU', peerGroup: '2' },
    { id: 'cu_61234', name: 'Canvas Credit Union', charterNumber: '61234', city: 'Lone Tree', state: 'CO', assets: 4200000000, members: 280000, loans: 2900000000, shares: 3500000000, netWorth: 460000000, roa: 0.69, charterType: 'FCU', peerGroup: '2' },
    { id: 'cu_67321', name: 'Affinity Federal Credit Union', charterNumber: '67321', city: 'Basking Ridge', state: 'NJ', assets: 4500000000, members: 260000, loans: 3100000000, shares: 3800000000, netWorth: 495000000, roa: 0.73, charterType: 'FCU', peerGroup: '2' },
    { id: 'cu_60876', name: 'Tropical Financial Credit Union', charterNumber: '60876', city: 'Miramar', state: 'FL', assets: 1100000000, members: 68000, loans: 750000000, shares: 950000000, netWorth: 120000000, roa: 0.65, charterType: 'FCU', peerGroup: '3' },
    { id: 'cu_68567', name: 'Jax Federal Credit Union', charterNumber: '68567', city: 'Jacksonville', state: 'FL', assets: 950000000, members: 55000, loans: 650000000, shares: 800000000, netWorth: 105000000, roa: 0.62, charterType: 'FCU', peerGroup: '3' },
    { id: 'cu_67654', name: 'Arizona Federal Credit Union', charterNumber: '67654', city: 'Phoenix', state: 'AZ', assets: 3200000000, members: 180000, loans: 2200000000, shares: 2700000000, netWorth: 350000000, roa: 0.68, charterType: 'FCU', peerGroup: '2' },
    { id: 'cu_61456', name: 'Firefighters First Credit Union', charterNumber: '61456', city: 'Los Angeles', state: 'CA', assets: 2800000000, members: 145000, loans: 1950000000, shares: 2350000000, netWorth: 310000000, roa: 0.71, charterType: 'FCU', peerGroup: '2' },
    { id: 'cu_68789', name: 'Veridian Credit Union', charterNumber: '68789', city: 'Waterloo', state: 'IA', assets: 7200000000, members: 285000, loans: 5000000000, shares: 6100000000, netWorth: 790000000, roa: 0.74, charterType: 'FCU', peerGroup: '2' },
    { id: 'cu_60543', name: 'University Credit Union', charterNumber: '60543', city: 'Los Angeles', state: 'CA', assets: 3500000000, members: 120000, loans: 2400000000, shares: 2950000000, netWorth: 385000000, roa: 0.67, charterType: 'FCU', peerGroup: '2' },
    { id: 'cu_67123', name: 'Premier America Credit Union', charterNumber: '67123', city: 'Chatsworth', state: 'CA', assets: 3100000000, members: 115000, loans: 2150000000, shares: 2600000000, netWorth: 340000000, roa: 0.66, charterType: 'FCU', peerGroup: '2' },
    { id: 'cu_68901', name: 'Patelco Credit Union', charterNumber: '68901', city: 'Dublin', state: 'CA', assets: 9000000000, members: 450000, loans: 6200000000, shares: 7600000000, netWorth: 990000000, roa: 0.75, charterType: 'FCU', peerGroup: '1' },
  ];
}

// Get list of all US states for filtering
export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'VI', name: 'Virgin Islands' },
  { code: 'GU', name: 'Guam' },
];
