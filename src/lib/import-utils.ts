// Auto-mapping from Wild Apricot CSV column names to our fields
const COLUMN_AUTO_MAP: Record<string, { target: string; entity: string }> = {
  "first name": { target: "firstName", entity: "contact" },
  "last name": { target: "lastName", entity: "contact" },
  "email": { target: "email", entity: "contact" },
  "phone": { target: "phone", entity: "contact" },
  "mobile phone": { target: "mobile", entity: "contact" },
  "organization": { target: "organizationName", entity: "member" },
  "membership status": { target: "status", entity: "member" },
  "member since": { target: "memberSince", entity: "member" },
  "renewal due": { target: "renewalDate", entity: "member" },
  "membership level": { target: "tierName", entity: "member" },
  "member #": { target: "memberNumber", entity: "member" },
  "member id": { target: "legacyId", entity: "member" },
  "organization id": { target: "legacyOrganizationId", entity: "member" },
  "link to organization id": { target: "linkToOrganizationId", entity: "contact" },
  "street address (address)": { target: "address1", entity: "member" },
  "city (address)": { target: "city", entity: "member" },
  "state/province (address)": { target: "state", entity: "member" },
  "zip/postal code (address)": { target: "zip", entity: "member" },
  "country (address)": { target: "country", entity: "member" },
};

export function autoMapColumns(csvHeaders: string[]): Record<string, { target: string; entity: string }> {
  const mapping: Record<string, { target: string; entity: string }> = {};
  for (const header of csvHeaders) {
    const normalized = header.toLowerCase().trim();
    if (COLUMN_AUTO_MAP[normalized]) {
      mapping[header] = COLUMN_AUTO_MAP[normalized];
    }
  }
  return mapping;
}
