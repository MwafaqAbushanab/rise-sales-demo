// Apollo.io contact enrichment types

export interface DecisionMaker {
  id: string;                    // Apollo person ID
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;                 // "CEO", "CFO", etc.
  seniority: string;             // "c_suite", "vp", "director"
  departments: string[];         // ["executive", "finance", "technology"]
  email?: string;                // from enrichment (costs 1 credit)
  emailStatus?: string;          // "verified" | "likely" | "unverified"
  phone?: string;                // from enrichment (costs 5 credits)
  phoneType?: string;            // "direct" | "mobile" | "hq"
  linkedinUrl?: string;
  photoUrl?: string;
  source: 'apollo';
  enrichedAt?: string;           // ISO date when email/phone fetched
  creditCost: number;            // 0=search only, 1=email, 6=email+phone
}

export interface InstitutionContacts {
  institutionId: string;         // lead.id ("cu_68413")
  institutionName: string;
  decisionMakers: DecisionMaker[];
  searchedAt: string;            // ISO date of last Apollo search
  enrichedAt?: string;           // ISO date of last enrichment pass
  searchStatus: 'pending' | 'found' | 'not_found' | 'error';
  totalCreditsCost: number;
}

export interface ContactsCache {
  [institutionId: string]: InstitutionContacts;
}
