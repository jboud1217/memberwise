import * as XLSX from "xlsx";

export type Platform = "memberclicks" | "wildapricot" | "growthzone" | "yourmembership" | "hivebrite" | "clubexpress" | "neoncrm" | "glueup" | "memberplanet" | "generic";

export interface ColumnMapping {
  target: string;
  entity: "member" | "contact" | "meta" | "custom";
  customFieldId?: string;
}

export interface ParsedSheet {
  name: string;
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  colCount: number;
}

export interface MappingWithConfidence extends ColumnMapping {
  confidence: "exact" | "high" | "medium" | "low";
}

export interface ValidationIssue {
  row: number;
  column: string;
  field: string;
  value: string;
  issue: "invalid_email" | "invalid_date" | "missing_required" | "invalid_phone" | "duplicate_email_in_file";
  message: string;
}

export interface ValidationReport {
  issues: ValidationIssue[];
  duplicateEmails: { email: string; rows: number[] }[];
  totalIssues: number;
  invalidEmails: number;
  invalidDates: number;
  missingRequired: number;
  duplicateCount: number;
}

export interface ImportPreview {
  platform: Platform;
  totalRows: number;
  orgRecords: number;
  contactRecords: number;
  standaloneRecords: number;
  memberTypes: Record<string, number>;
  memberStatuses: Record<string, number>;
  duesValues: Record<string, number>;
  rowsWithEmail: number;
  rowsWithPayment: number;
  mapping: Record<string, ColumnMapping>;
  mappedCount: number;
  unmappedColumns: string[];
  confidence: Record<string, "exact" | "high" | "medium" | "low">;
  validation: ValidationReport;
}

// ─── MemberClicks column mappings ──────────────────────────

const MEMBERCLICKS_MAP: Record<string, ColumnMapping> = {
  // Contact info
  "[name | first]": { target: "firstName", entity: "contact" },
  "[name | last]": { target: "lastName", entity: "contact" },
  "[email | primary]": { target: "email", entity: "contact" },
  "[email | preferred]": { target: "emailPreferred", entity: "contact" },
  "[phone | primary]": { target: "phone", entity: "contact" },
  "[phone | preferred]": { target: "phonePreferred", entity: "contact" },
  "[phone | mobile]": { target: "mobile", entity: "contact" },
  "[phone | home]": { target: "phoneHome", entity: "contact" },
  "[phone | work]": { target: "phoneWork", entity: "contact" },
  "[contact name]": { target: "contactName", entity: "contact" },
  "[key contact]": { target: "keyContact", entity: "contact" },
  "[username]": { target: "username", entity: "contact" },

  // Organization / Member
  "[organization]": { target: "organizationName", entity: "member" },
  "[organization id]": { target: "legacyOrganizationId", entity: "meta" },
  "[link to organization id]": { target: "linkToOrganizationId", entity: "meta" },
  "[member number]": { target: "memberNumber", entity: "member" },
  "[member status]": { target: "status", entity: "member" },
  "[member type]": { target: "memberType", entity: "member" },
  "[group]": { target: "group", entity: "member" },

  // Dates
  "[join date]": { target: "joinDate", entity: "member" },
  "[created date]": { target: "createdDate", entity: "member" },
  "[expiration date]": { target: "expirationDate", entity: "member" },
  "[last renewal date]": { target: "renewalDate", entity: "member" },
  "[last modified date]": { target: "lastModified", entity: "member" },
  "[last login date]": { target: "lastLogin", entity: "contact" },
  "[auto renew]": { target: "autoRenew", entity: "member" },

  // Primary address
  "[address | primary | line 1]": { target: "address1", entity: "member" },
  "[address | primary | line 2]": { target: "address2", entity: "member" },
  "[address | primary | city]": { target: "city", entity: "member" },
  "[address | primary | state]": { target: "state", entity: "member" },
  "[address | primary | zip]": { target: "zip", entity: "member" },
  "[address | primary | country]": { target: "country", entity: "member" },

  // Preferred address (fallback)
  "[address | preferred | line 1]": { target: "addressPreferred1", entity: "member" },
  "[address | preferred | line 2]": { target: "addressPreferred2", entity: "member" },
  "[address | preferred | city]": { target: "cityPreferred", entity: "member" },
  "[address | preferred | state]": { target: "statePreferred", entity: "member" },
  "[address | preferred | zip]": { target: "zipPreferred", entity: "member" },
  "[address | preferred | country]": { target: "countryPreferred", entity: "member" },

  // Organization address
  "[organization address | line 1]": { target: "orgAddress1", entity: "member" },
  "[organization address | line 2]": { target: "orgAddress2", entity: "member" },
  "[organization address | city]": { target: "orgCity", entity: "member" },
  "[organization address | state]": { target: "orgState", entity: "member" },
  "[organization address | zip]": { target: "orgZip", entity: "member" },
  "[organization address | country]": { target: "orgCountry", entity: "member" },
  "[organization email]": { target: "orgEmail", entity: "member" },
  "[organization phone]": { target: "orgPhone", entity: "member" },

  // Secondary / alternate contact info
  "[email | secondary]": { target: "emailSecondary", entity: "contact" },
  "[email | other]": { target: "emailOther", entity: "contact" },
  "[phone | other]": { target: "phoneOther", entity: "contact" },
  "[phone | fax]": { target: "fax", entity: "contact" },
  "[name | prefix]": { target: "prefix", entity: "contact" },
  "[name | suffix]": { target: "suffix", entity: "contact" },
  "[name | middle]": { target: "middleName", entity: "contact" },
  "[name | nickname]": { target: "nickname", entity: "contact" },
  "[name | title]": { target: "title", entity: "contact" },

  // Home address (alternate)
  "[address | home | line 1]": { target: "addressHome1", entity: "member" },
  "[address | home | line 2]": { target: "addressHome2", entity: "member" },
  "[address | home | city]": { target: "cityHome", entity: "member" },
  "[address | home | state]": { target: "stateHome", entity: "member" },
  "[address | home | zip]": { target: "zipHome", entity: "member" },
  "[address | home | country]": { target: "countryHome", entity: "member" },

  // Work address
  "[address | work | line 1]": { target: "addressWork1", entity: "member" },
  "[address | work | line 2]": { target: "addressWork2", entity: "member" },
  "[address | work | city]": { target: "cityWork", entity: "member" },
  "[address | work | state]": { target: "stateWork", entity: "member" },
  "[address | work | zip]": { target: "zipWork", entity: "member" },
  "[address | work | country]": { target: "countryWork", entity: "member" },

  // Additional MemberClicks fields
  "[profile id]": { target: "legacyId", entity: "member" },
  "[active]": { target: "active", entity: "member" },
  "[deceased]": { target: "deceased", entity: "contact" },
  "[do not mail]": { target: "doNotMail", entity: "contact" },
  "[do not email]": { target: "doNotEmail", entity: "contact" },
  "[do not call]": { target: "doNotCall", entity: "contact" },
  "[directory opt out]": { target: "directoryOptOut", entity: "contact" },
  "[board member]": { target: "boardMember", entity: "member" },
  "[notes]": { target: "notes", entity: "member" },
  "[website]": { target: "website", entity: "member" },

  // Custom fields common in MemberClicks
  "dues": { target: "dues", entity: "member" },
  "duesyearspaid": { target: "duesYearsPaid", entity: "member" },
  "date payment made": { target: "paymentDate", entity: "member" },
  "payment id": { target: "paymentId", entity: "member" },
  "posting date": { target: "postingDate", entity: "member" },
  "id": { target: "legacyId", entity: "member" },
  "fullname": { target: "fullName", entity: "contact" },
  "join year": { target: "joinYear", entity: "member" },
  "committees": { target: "committees", entity: "member" },
};

// ─── Wild Apricot column mappings ──────────────────────────

const WILDAPRICOT_MAP: Record<string, ColumnMapping> = {
  "first name": { target: "firstName", entity: "contact" },
  "last name": { target: "lastName", entity: "contact" },
  "email": { target: "email", entity: "contact" },
  "phone": { target: "phone", entity: "contact" },
  "mobile phone": { target: "mobile", entity: "contact" },
  "organization": { target: "organizationName", entity: "member" },
  "membership status": { target: "status", entity: "member" },
  "member since": { target: "joinDate", entity: "member" },
  "renewal due": { target: "renewalDate", entity: "member" },
  "membership level": { target: "memberType", entity: "member" },
  "member #": { target: "memberNumber", entity: "member" },
  "member id": { target: "legacyId", entity: "member" },
  "organization id": { target: "legacyOrganizationId", entity: "meta" },
  "link to organization id": { target: "linkToOrganizationId", entity: "meta" },
  "street address (address)": { target: "address1", entity: "member" },
  "city (address)": { target: "city", entity: "member" },
  "state/province (address)": { target: "state", entity: "member" },
  "zip/postal code (address)": { target: "zip", entity: "member" },
  "country (address)": { target: "country", entity: "member" },
};

// ─── GrowthZone / ChamberMaster column mappings ────────────

const GROWTHZONE_MAP: Record<string, ColumnMapping> = {
  "contact first name": { target: "firstName", entity: "contact" },
  "contact last name": { target: "lastName", entity: "contact" },
  "contact email": { target: "email", entity: "contact" },
  "contact phone": { target: "phone", entity: "contact" },
  "contact mobile": { target: "mobile", entity: "contact" },
  "company name": { target: "organizationName", entity: "member" },
  "membership type": { target: "memberType", entity: "member" },
  "membership status": { target: "status", entity: "member" },
  "start date": { target: "joinDate", entity: "member" },
  "end date": { target: "expirationDate", entity: "member" },
  "renewal date": { target: "renewalDate", entity: "member" },
  "member number": { target: "memberNumber", entity: "member" },
  "billing address line 1": { target: "address1", entity: "member" },
  "billing address line 2": { target: "address2", entity: "member" },
  "billing city": { target: "city", entity: "member" },
  "billing state": { target: "state", entity: "member" },
  "billing zip": { target: "zip", entity: "member" },
  "billing country": { target: "country", entity: "member" },
  "member id": { target: "legacyId", entity: "member" },
  "dues amount": { target: "dues", entity: "member" },
};

// ─── YourMembership column mappings ────────────────────────

const YOURMEMBERSHIP_MAP: Record<string, ColumnMapping> = {
  "first name": { target: "firstName", entity: "contact" },
  "last name": { target: "lastName", entity: "contact" },
  "email address": { target: "email", entity: "contact" },
  "phone number": { target: "phone", entity: "contact" },
  "mobile phone": { target: "mobile", entity: "contact" },
  "company": { target: "organizationName", entity: "member" },
  "member type": { target: "memberType", entity: "member" },
  "member status": { target: "status", entity: "member" },
  "join date": { target: "joinDate", entity: "member" },
  "expiry date": { target: "expirationDate", entity: "member" },
  "renewal date": { target: "renewalDate", entity: "member" },
  "member id": { target: "legacyId", entity: "member" },
  "member number": { target: "memberNumber", entity: "member" },
  "address line 1": { target: "address1", entity: "member" },
  "address line 2": { target: "address2", entity: "member" },
  "city": { target: "city", entity: "member" },
  "state": { target: "state", entity: "member" },
  "zip code": { target: "zip", entity: "member" },
  "country": { target: "country", entity: "member" },
  "dues": { target: "dues", entity: "member" },
};

// ─── Hivebrite column mappings ───────────────────────────

const HIVEBRITE_MAP: Record<string, ColumnMapping> = {
  "firstname": { target: "firstName", entity: "contact" },
  "lastname": { target: "lastName", entity: "contact" },
  "email": { target: "email", entity: "contact" },
  "phone number": { target: "phone", entity: "contact" },
  "mobile number": { target: "mobile", entity: "contact" },
  "company name": { target: "organizationName", entity: "member" },
  "job title": { target: "title", entity: "contact" },
  "membership plan": { target: "memberType", entity: "member" },
  "membership status": { target: "status", entity: "member" },
  "member since": { target: "joinDate", entity: "member" },
  "membership expiration": { target: "expirationDate", entity: "member" },
  "membership renewal date": { target: "renewalDate", entity: "member" },
  "user id": { target: "legacyId", entity: "member" },
  "external id": { target: "legacyOrganizationId", entity: "meta" },
  "address": { target: "address1", entity: "member" },
  "address complement": { target: "address2", entity: "member" },
  "city": { target: "city", entity: "member" },
  "state": { target: "state", entity: "member" },
  "zip code": { target: "zip", entity: "member" },
  "country": { target: "country", entity: "member" },
  "bio": { target: "notes", entity: "member" },
  "website": { target: "website", entity: "member" },
  "linkedin url": { target: "website", entity: "member" },
  "do not email": { target: "doNotEmail", entity: "contact" },
  "prefix": { target: "prefix", entity: "contact" },
  "graduation year": { target: "committees", entity: "member" },
};

// ─── ClubExpress column mappings ────────────────────────

const CLUBEXPRESS_MAP: Record<string, ColumnMapping> = {
  "first name": { target: "firstName", entity: "contact" },
  "last name": { target: "lastName", entity: "contact" },
  "email address": { target: "email", entity: "contact" },
  "home phone": { target: "phoneHome", entity: "contact" },
  "work phone": { target: "phoneWork", entity: "contact" },
  "cell phone": { target: "mobile", entity: "contact" },
  "club id": { target: "legacyId", entity: "member" },
  "member #": { target: "memberNumber", entity: "member" },
  "member type": { target: "memberType", entity: "member" },
  "member status": { target: "status", entity: "member" },
  "date joined": { target: "joinDate", entity: "member" },
  "expiration date": { target: "expirationDate", entity: "member" },
  "renewal date": { target: "renewalDate", entity: "member" },
  "street address": { target: "address1", entity: "member" },
  "street address 2": { target: "address2", entity: "member" },
  "city": { target: "city", entity: "member" },
  "state/province": { target: "state", entity: "member" },
  "zip/postal code": { target: "zip", entity: "member" },
  "country": { target: "country", entity: "member" },
  "company": { target: "organizationName", entity: "member" },
  "spouse first name": { target: "notes", entity: "member" },
  "dues paid": { target: "dues", entity: "member" },
  "notes": { target: "notes", entity: "member" },
  "do not email": { target: "doNotEmail", entity: "contact" },
  "do not mail": { target: "doNotMail", entity: "contact" },
  "prefix": { target: "prefix", entity: "contact" },
  "suffix": { target: "suffix", entity: "contact" },
};

// ─── Neon CRM column mappings ───────────────────────────

const NEONCRM_MAP: Record<string, ColumnMapping> = {
  "first name": { target: "firstName", entity: "contact" },
  "last name": { target: "lastName", entity: "contact" },
  "email 1": { target: "email", entity: "contact" },
  "email 2": { target: "emailSecondary", entity: "contact" },
  "phone 1 full number (standardized)": { target: "phone", entity: "contact" },
  "phone 2 full number (standardized)": { target: "mobile", entity: "contact" },
  "phone 1 full number": { target: "phone", entity: "contact" },
  "phone 2 full number": { target: "mobile", entity: "contact" },
  "account id": { target: "legacyId", entity: "member" },
  "neon id": { target: "legacyId", entity: "member" },
  "company name": { target: "organizationName", entity: "member" },
  "membership name": { target: "memberType", entity: "member" },
  "membership level": { target: "memberType", entity: "member" },
  "membership status": { target: "status", entity: "member" },
  "membership join date": { target: "joinDate", entity: "member" },
  "membership expiration date": { target: "expirationDate", entity: "member" },
  "membership start date": { target: "joinDate", entity: "member" },
  "membership term end date": { target: "expirationDate", entity: "member" },
  "membership cost": { target: "dues", entity: "member" },
  "address line 1": { target: "address1", entity: "member" },
  "address line 2": { target: "address2", entity: "member" },
  "city": { target: "city", entity: "member" },
  "state/province": { target: "state", entity: "member" },
  "zip/postal code": { target: "zip", entity: "member" },
  "country": { target: "country", entity: "member" },
  "prefix": { target: "prefix", entity: "contact" },
  "suffix": { target: "suffix", entity: "contact" },
  "deceased": { target: "deceased", entity: "contact" },
  "do not contact": { target: "doNotEmail", entity: "contact" },
  "opt-in for email": { target: "doNotEmail", entity: "contact" },
  "note": { target: "notes", entity: "member" },
};

// ─── Glue Up (formerly EventBank) column mappings ───────

const GLUEUP_MAP: Record<string, ColumnMapping> = {
  "first name": { target: "firstName", entity: "contact" },
  "last name": { target: "lastName", entity: "contact" },
  "email": { target: "email", entity: "contact" },
  "phone": { target: "phone", entity: "contact" },
  "mobile": { target: "mobile", entity: "contact" },
  "organization": { target: "organizationName", entity: "member" },
  "title": { target: "title", entity: "contact" },
  "membership plan name": { target: "memberType", entity: "member" },
  "membership plan": { target: "memberType", entity: "member" },
  "membership status": { target: "status", entity: "member" },
  "start date": { target: "joinDate", entity: "member" },
  "end date": { target: "expirationDate", entity: "member" },
  "renewal date": { target: "renewalDate", entity: "member" },
  "contact id": { target: "legacyId", entity: "member" },
  "member number": { target: "memberNumber", entity: "member" },
  "address line 1": { target: "address1", entity: "member" },
  "address line 2": { target: "address2", entity: "member" },
  "city": { target: "city", entity: "member" },
  "state": { target: "state", entity: "member" },
  "zip": { target: "zip", entity: "member" },
  "country": { target: "country", entity: "member" },
  "amount": { target: "dues", entity: "member" },
  "payment date": { target: "paymentDate", entity: "member" },
  "website": { target: "website", entity: "member" },
  "notes": { target: "notes", entity: "member" },
};

// ─── MemberPlanet column mappings ───────────────────────

const MEMBERPLANET_MAP: Record<string, ColumnMapping> = {
  "first name": { target: "firstName", entity: "contact" },
  "last name": { target: "lastName", entity: "contact" },
  "email address": { target: "email", entity: "contact" },
  "primary phone": { target: "phone", entity: "contact" },
  "mobile phone": { target: "mobile", entity: "contact" },
  "home phone": { target: "phoneHome", entity: "contact" },
  "work phone": { target: "phoneWork", entity: "contact" },
  "organization name": { target: "organizationName", entity: "member" },
  "member id": { target: "legacyId", entity: "member" },
  "membership type": { target: "memberType", entity: "member" },
  "membership level": { target: "memberType", entity: "member" },
  "status": { target: "status", entity: "member" },
  "membership status": { target: "status", entity: "member" },
  "date joined": { target: "joinDate", entity: "member" },
  "join date": { target: "joinDate", entity: "member" },
  "expiration date": { target: "expirationDate", entity: "member" },
  "renewal date": { target: "renewalDate", entity: "member" },
  "address 1": { target: "address1", entity: "member" },
  "address 2": { target: "address2", entity: "member" },
  "city": { target: "city", entity: "member" },
  "state": { target: "state", entity: "member" },
  "zip": { target: "zip", entity: "member" },
  "country": { target: "country", entity: "member" },
  "dues amount": { target: "dues", entity: "member" },
  "amount paid": { target: "dues", entity: "member" },
  "payment date": { target: "paymentDate", entity: "member" },
  "notes": { target: "notes", entity: "member" },
  "do not email": { target: "doNotEmail", entity: "contact" },
};

// ─── Generic fuzzy patterns for unknown platforms ──────────

interface GenericPattern {
  target: string;
  entity: "member" | "contact" | "meta";
  patterns: RegExp[];
  priority: number;
}

const GENERIC_PATTERNS: GenericPattern[] = [
  // Contact fields
  { target: "firstName", entity: "contact", priority: 10, patterns: [
    /^first[\s_-]?name$/i, /^fname$/i, /^given[\s_-]?name$/i, /^first$/i,
  ]},
  { target: "lastName", entity: "contact", priority: 10, patterns: [
    /^last[\s_-]?name$/i, /^lname$/i, /^surname$/i, /^family[\s_-]?name$/i, /^last$/i,
  ]},
  { target: "email", entity: "contact", priority: 10, patterns: [
    /^e[\s_-]?mail$/i, /^email[\s_-]?address$/i, /^primary[\s_-]?email$/i, /^contact[\s_-]?email$/i,
  ]},
  { target: "phone", entity: "contact", priority: 8, patterns: [
    /^phone$/i, /^phone[\s_-]?number$/i, /^primary[\s_-]?phone$/i, /^tel(?:ephone)?$/i,
    /^work[\s_-]?phone$/i, /^home[\s_-]?phone$/i, /^contact[\s_-]?phone$/i,
  ]},
  { target: "mobile", entity: "contact", priority: 9, patterns: [
    /^mobile$/i, /^mobile[\s_-]?phone$/i, /^cell$/i, /^cell[\s_-]?phone$/i,
  ]},

  // Member fields
  { target: "displayName", entity: "member", priority: 7, patterns: [
    /^display[\s_-]?name$/i, /^full[\s_-]?name$/i, /^name$/i,
    /^member[\s_-]?name$/i, /^account[\s_-]?name$/i,
  ]},
  { target: "organizationName", entity: "member", priority: 8, patterns: [
    /^organi[sz]ation$/i, /^organi[sz]ation[\s_-]?name$/i,
    /^company$/i, /^company[\s_-]?name$/i, /^business[\s_-]?name$/i, /^employer$/i,
  ]},
  { target: "status", entity: "member", priority: 9, patterns: [
    /^status$/i, /^member[\s_-]?status$/i, /^membership[\s_-]?status$/i, /^account[\s_-]?status$/i,
  ]},
  { target: "memberType", entity: "member", priority: 9, patterns: [
    /^member[\s_-]?type$/i, /^membership[\s_-]?type$/i, /^membership[\s_-]?level$/i,
    /^level$/i, /^tier$/i, /^category$/i, /^member[\s_-]?category$/i,
  ]},
  { target: "memberNumber", entity: "member", priority: 8, patterns: [
    /^member[\s_-]?(?:number|no|#)$/i, /^membership[\s_-]?(?:number|no|#)$/i,
    /^account[\s_-]?(?:number|no|#)$/i,
  ]},
  { target: "address1", entity: "member", priority: 8, patterns: [
    /^address$/i, /^address[\s_-]?1$/i, /^address[\s_-]?line[\s_-]?1$/i,
    /^street$/i, /^street[\s_-]?address$/i, /^mailing[\s_-]?address$/i,
  ]},
  { target: "address2", entity: "member", priority: 8, patterns: [
    /^address[\s_-]?2$/i, /^address[\s_-]?line[\s_-]?2$/i,
    /^apt$/i, /^suite$/i, /^unit$/i,
  ]},
  { target: "city", entity: "member", priority: 9, patterns: [
    /^city$/i, /^town$/i, /^municipality$/i,
  ]},
  { target: "state", entity: "member", priority: 9, patterns: [
    /^state$/i, /^province$/i, /^state[\s_-]?\/?\s*province$/i, /^region$/i,
  ]},
  { target: "zip", entity: "member", priority: 9, patterns: [
    /^zip$/i, /^zip[\s_-]?code$/i, /^postal[\s_-]?code$/i, /^postcode$/i,
  ]},
  { target: "country", entity: "member", priority: 8, patterns: [
    /^country$/i, /^nation$/i,
  ]},
  { target: "joinDate", entity: "member", priority: 9, patterns: [
    /^join[\s_-]?date$/i, /^date[\s_-]?joined$/i, /^member[\s_-]?since$/i,
    /^start[\s_-]?date$/i, /^enrollment[\s_-]?date$/i,
  ]},
  { target: "expirationDate", entity: "member", priority: 9, patterns: [
    /^expir(?:ation|y)[\s_-]?date$/i, /^end[\s_-]?date$/i,
    /^membership[\s_-]?expir(?:ation|y|es)$/i,
  ]},
  { target: "renewalDate", entity: "member", priority: 9, patterns: [
    /^renewal[\s_-]?date$/i, /^renew(?:al)?[\s_-]?due$/i,
    /^next[\s_-]?renewal$/i, /^last[\s_-]?renewal$/i,
  ]},
  { target: "legacyId", entity: "member", priority: 5, patterns: [
    /^id$/i, /^record[\s_-]?id$/i, /^legacy[\s_-]?id$/i,
    /^member[\s_-]?id$/i, /^contact[\s_-]?id$/i,
  ]},
  { target: "dues", entity: "member", priority: 7, patterns: [
    /^dues$/i, /^dues[\s_-]?amount$/i, /^amount$/i,
    /^payment[\s_-]?amount$/i, /^annual[\s_-]?dues$/i, /^fee$/i,
  ]},
  { target: "committees", entity: "member", priority: 5, patterns: [
    /^committee/i, /^groups?$/i, /^tags?$/i, /^interests?$/i,
  ]},
  { target: "notes", entity: "member", priority: 4, patterns: [
    /^notes?$/i, /^comments?$/i, /^remarks?$/i, /^description$/i,
  ]},
  { target: "fullName", entity: "contact", priority: 6, patterns: [
    /^full[\s_-]?name$/i, /^contact[\s_-]?name$/i, /^member[\s_-]?name$/i,
  ]},
  { target: "website", entity: "member", priority: 4, patterns: [
    /^website$/i, /^web[\s_-]?site$/i, /^url$/i, /^web[\s_-]?address$/i, /^homepage$/i,
  ]},
  { target: "prefix", entity: "contact", priority: 3, patterns: [
    /^prefix$/i, /^name[\s_-]?prefix$/i, /^salutation$/i, /^title$/i,
  ]},
  { target: "suffix", entity: "contact", priority: 3, patterns: [
    /^suffix$/i, /^name[\s_-]?suffix$/i,
  ]},
  { target: "middleName", entity: "contact", priority: 3, patterns: [
    /^middle[\s_-]?name$/i, /^middle$/i, /^mi$/i,
  ]},
  { target: "emailSecondary", entity: "contact", priority: 5, patterns: [
    /^secondary[\s_-]?email$/i, /^alternate[\s_-]?email$/i, /^alt[\s_-]?email$/i,
    /^email[\s_-]?2$/i, /^other[\s_-]?email$/i,
  ]},
  { target: "phoneOther", entity: "contact", priority: 4, patterns: [
    /^other[\s_-]?phone$/i, /^phone[\s_-]?2$/i, /^alternate[\s_-]?phone$/i,
    /^alt[\s_-]?phone$/i, /^secondary[\s_-]?phone$/i,
  ]},
  { target: "fax", entity: "contact", priority: 3, patterns: [
    /^fax$/i, /^fax[\s_-]?number$/i,
  ]},
  { target: "doNotEmail", entity: "contact", priority: 3, patterns: [
    /^do[\s_-]?not[\s_-]?email$/i, /^opt[\s_-]?out$/i, /^email[\s_-]?opt[\s_-]?out$/i, /^unsubscribed?$/i,
  ]},
  { target: "doNotMail", entity: "contact", priority: 3, patterns: [
    /^do[\s_-]?not[\s_-]?mail$/i, /^mail[\s_-]?opt[\s_-]?out$/i, /^no[\s_-]?mail$/i,
  ]},
];

// ─── Excel / Workbook parsing ──────────────────────────────

/**
 * Parse an Excel workbook (ArrayBuffer) into sheet objects.
 */
export function parseWorkbook(data: ArrayBuffer): ParsedSheet[] {
  const workbook = XLSX.read(data, { type: "array" });
  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
      defval: "",
      raw: false,
    });
    const headers = json.length > 0 ? Object.keys(json[0]) : [];
    return {
      name,
      headers,
      rows: json,
      rowCount: json.length,
      colCount: headers.length,
    };
  });
}

/**
 * Extract up to 3 unique non-empty sample values per column from the first N rows.
 */
export function getSampleValues(
  headers: string[],
  rows: Record<string, string>[],
  maxRows = 10
): Record<string, string[]> {
  const samples: Record<string, string[]> = {};
  for (const header of headers) {
    const values = new Set<string>();
    for (let i = 0; i < Math.min(rows.length, maxRows); i++) {
      const v = (rows[i][header] || "").trim();
      if (v && values.size < 3) values.add(v);
    }
    samples[header] = Array.from(values);
  }
  return samples;
}

// ─── Platform detection ────────────────────────────────────

/**
 * Detect which platform the data was exported from based on column naming patterns.
 */
export function detectPlatform(headers: string[]): Platform {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  // MemberClicks uses bracket notation: [Name | First], [Email | Primary], etc.
  const bracketCount = lowerHeaders.filter((h) => h.startsWith("[") && h.endsWith("]")).length;
  if (bracketCount >= 5) return "memberclicks";

  // Wild Apricot uses plain names
  const waMatches = lowerHeaders.filter((h) => WILDAPRICOT_MAP[h]).length;
  if (waMatches >= 3) return "wildapricot";

  // GrowthZone / ChamberMaster
  const gzMatches = lowerHeaders.filter((h) => GROWTHZONE_MAP[h]).length;
  if (gzMatches >= 3) return "growthzone";

  // YourMembership
  const ymMatches = lowerHeaders.filter((h) => YOURMEMBERSHIP_MAP[h]).length;
  if (ymMatches >= 3) return "yourmembership";

  // Hivebrite
  const hbMatches = lowerHeaders.filter((h) => HIVEBRITE_MAP[h]).length;
  if (hbMatches >= 3) return "hivebrite";

  // ClubExpress
  const ceMatches = lowerHeaders.filter((h) => CLUBEXPRESS_MAP[h]).length;
  if (ceMatches >= 3) return "clubexpress";

  // Neon CRM
  const ncMatches = lowerHeaders.filter((h) => NEONCRM_MAP[h]).length;
  if (ncMatches >= 3) return "neoncrm";

  // Glue Up
  const guMatches = lowerHeaders.filter((h) => GLUEUP_MAP[h]).length;
  if (guMatches >= 3) return "glueup";

  // MemberPlanet
  const mpMatches = lowerHeaders.filter((h) => MEMBERPLANET_MAP[h]).length;
  if (mpMatches >= 3) return "memberplanet";

  return "generic";
}

// ─── Column auto-mapping ───────────────────────────────────

const PLATFORM_MAPS: Record<string, Record<string, ColumnMapping>> = {
  memberclicks: MEMBERCLICKS_MAP,
  wildapricot: WILDAPRICOT_MAP,
  growthzone: GROWTHZONE_MAP,
  yourmembership: YOURMEMBERSHIP_MAP,
  hivebrite: HIVEBRITE_MAP,
  clubexpress: CLUBEXPRESS_MAP,
  neoncrm: NEONCRM_MAP,
  glueup: GLUEUP_MAP,
  memberplanet: MEMBERPLANET_MAP,
};

/**
 * Auto-map columns based on detected platform or generic fuzzy matching.
 * Returns both the mapping and per-column confidence scores.
 */
export function autoMapColumns(
  headers: string[],
  platform: Platform
): { mapping: Record<string, ColumnMapping>; confidence: Record<string, "exact" | "high" | "medium" | "low"> } {
  const map = PLATFORM_MAPS[platform];
  if (map) {
    const mapping: Record<string, ColumnMapping> = {};
    const confidence: Record<string, "exact" | "high" | "medium" | "low"> = {};
    for (const header of headers) {
      const normalized = header.toLowerCase().trim();
      if (map[normalized]) {
        mapping[header] = map[normalized];
        confidence[header] = "exact"; // Platform-specific maps are exact matches
      }
    }
    return { mapping, confidence };
  }

  // Generic: use fuzzy pattern matching with confidence
  return genericAutoMap(headers);
}

/**
 * Fuzzy auto-map for unknown platforms using regex patterns.
 * Returns confidence based on pattern priority.
 */
function genericAutoMap(headers: string[]): { mapping: Record<string, ColumnMapping>; confidence: Record<string, "exact" | "high" | "medium" | "low"> } {
  const mapping: Record<string, ColumnMapping> = {};
  const confidence: Record<string, "exact" | "high" | "medium" | "low"> = {};
  const usedTargets = new Set<string>();

  // Sort by priority descending so higher-priority patterns win
  const sorted = [...GENERIC_PATTERNS].sort((a, b) => b.priority - a.priority);

  for (const pattern of sorted) {
    if (usedTargets.has(pattern.target)) continue;

    for (const header of headers) {
      if (mapping[header]) continue;
      const normalized = header.trim();
      if (pattern.patterns.some((p) => p.test(normalized))) {
        mapping[header] = { target: pattern.target, entity: pattern.entity };
        // Map priority to confidence level
        confidence[header] = pattern.priority >= 9 ? "high" : pattern.priority >= 6 ? "medium" : "low";
        usedTargets.add(pattern.target);
        break;
      }
    }
  }

  return { mapping, confidence };
}

// ─── Record type detection ─────────────────────────────────

/**
 * Determine record type for a row.
 * - "org": Has Organization ID, no Link To Organization ID → household/membership record
 * - "contact": Has Link To Organization ID → individual linked to a household
 * - "standalone": Neither → prospect or standalone member
 */
export function getRecordType(
  row: Record<string, string>,
  headers: string[]
): "org" | "contact" | "standalone" {
  const orgIdCol = headers.find((h) => h.toLowerCase().trim() === "[organization id]")
    || headers.find((h) => h.toLowerCase().trim() === "organization id");
  const linkCol = headers.find((h) => h.toLowerCase().trim() === "[link to organization id]")
    || headers.find((h) => h.toLowerCase().trim() === "link to organization id");

  const orgId = orgIdCol ? (row[orgIdCol] || "").trim() : "";
  const linkToOrg = linkCol ? (row[linkCol] || "").trim() : "";

  if (orgId && !linkToOrg) return "org";
  if (linkToOrg) return "contact";
  return "standalone";
}

// ─── Data analysis ─────────────────────────────────────────

/**
 * Analyze the data and produce a preview summary.
 */
export function analyzeData(
  headers: string[],
  rows: Record<string, string>[]
): ImportPreview {
  const platform = detectPlatform(headers);
  const { mapping, confidence } = autoMapColumns(headers, platform);
  return analyzeWithMapping(headers, rows, mapping, platform, confidence);
}

/**
 * Analyze data with a specific mapping (used for live preview updates).
 */
export function analyzeWithMapping(
  headers: string[],
  rows: Record<string, string>[],
  mapping: Record<string, ColumnMapping>,
  platform?: Platform,
  existingConfidence?: Record<string, "exact" | "high" | "medium" | "low">
): ImportPreview {
  const detectedPlatform = platform || detectPlatform(headers);

  let orgRecords = 0;
  let contactRecords = 0;
  let standaloneRecords = 0;
  const memberTypes: Record<string, number> = {};
  const memberStatuses: Record<string, number> = {};
  const duesValues: Record<string, number> = {};
  let rowsWithEmail = 0;
  let rowsWithPayment = 0;

  const statusCol = headers.find((h) => mapping[h]?.target === "status");
  const typeCol = headers.find((h) => mapping[h]?.target === "memberType");
  const emailCol = headers.find((h) => mapping[h]?.target === "email");
  const duesCol = headers.find((h) => mapping[h]?.target === "dues");
  const paymentDateCol = headers.find((h) => mapping[h]?.target === "paymentDate");

  for (const row of rows) {
    const recordType = getRecordType(row, headers);
    if (recordType === "org") orgRecords++;
    else if (recordType === "contact") contactRecords++;
    else standaloneRecords++;

    if (statusCol) {
      const status = (row[statusCol] || "").trim();
      if (status) memberStatuses[status] = (memberStatuses[status] || 0) + 1;
    }

    if (typeCol) {
      const type = (row[typeCol] || "").trim();
      if (type) memberTypes[type] = (memberTypes[type] || 0) + 1;
    }

    if (emailCol && (row[emailCol] || "").trim()) rowsWithEmail++;

    const duesVal = duesCol ? (row[duesCol] || "").trim() : "";
    const paymentVal = paymentDateCol ? (row[paymentDateCol] || "").trim() : "";
    if (duesVal) duesValues[duesVal] = (duesValues[duesVal] || 0) + 1;
    if (duesVal || paymentVal) rowsWithPayment++;
  }

  const mappedCount = Object.keys(mapping).length;
  const unmappedColumns = headers.filter((h) => !mapping[h]);

  // Use existing confidence or default to empty
  const confidence = existingConfidence || {};

  // Run validation
  const validation = validateImportData(headers, rows, mapping);

  return {
    platform: detectedPlatform,
    totalRows: rows.length,
    orgRecords,
    contactRecords,
    standaloneRecords,
    memberTypes,
    memberStatuses,
    duesValues,
    rowsWithEmail,
    rowsWithPayment,
    mapping,
    mappedCount,
    unmappedColumns,
    confidence,
    validation,
  };
}

// ─── Value extraction ──────────────────────────────────────

/**
 * Extract a mapped field value from a row.
 */
export function getMappedValue(
  row: Record<string, string>,
  mapping: Record<string, ColumnMapping>,
  targetField: string,
  headers: string[]
): string {
  const col = headers.find((h) => mapping[h]?.target === targetField);
  return col ? (row[col] || "").trim() : "";
}

/**
 * Map status values to our enum. Handles variations from multiple platforms.
 */
export function mapStatus(status: string): "ACTIVE" | "LAPSED" | "SUSPENDED" | "PROSPECT" | "ARCHIVED" {
  const s = status.toLowerCase().trim();
  if (s === "active" || s === "current") return "ACTIVE";
  if (s === "lapsed" || s === "expired" || s === "former" || s === "past due") return "LAPSED";
  if (s === "suspended" || s === "inactive" || s === "on hold") return "SUSPENDED";
  if (s === "archived" || s === "deleted" || s === "cancelled" || s === "canceled") return "ARCHIVED";
  return "PROSPECT";
}

// ─── Member type / tier parsing ────────────────────────────

/**
 * Parse a member type string into tier info.
 * e.g. "Single Family - One Year - $50" → { name: "Single Family", interval: "ANNUAL", price: 5000 }
 */
export function parseMemberType(memberType: string): {
  name: string;
  interval: "ANNUAL" | "TWO_YEAR" | "MONTHLY";
  price: number;
  isContact: boolean;
} | null {
  if (!memberType || memberType.toLowerCase() === "prospect") return null;

  const isContact = /contact/i.test(memberType);

  const priceMatch = memberType.match(/\$([0-9,.]+)/);
  const price = priceMatch ? Math.round(parseFloat(priceMatch[1].replace(",", "")) * 100) : 0;

  let interval: "ANNUAL" | "TWO_YEAR" | "MONTHLY" = "ANNUAL";
  if (/two\s*year/i.test(memberType)) interval = "TWO_YEAR";
  if (/monthly/i.test(memberType)) interval = "MONTHLY";

  let name = memberType
    .replace(/\s*contact\s*/gi, "")
    .replace(/\s*-\s*\$[0-9,.]+/g, "")
    .replace(/\s*-\s*(one|two|three)\s*year\s*/gi, "")
    .replace(/\s*-\s*monthly\s*/gi, "")
    .replace(/\s+-\s*$/, "")
    .replace(/^\s+-\s*/, "")
    .trim();

  if (!name) name = memberType.replace(/\s*contact\s*/gi, "").trim();

  return { name, interval, price, isContact };
}

// ─── Robust date parsing ────────────────────────────────

const DATE_FORMATS: { regex: RegExp; parse: (m: RegExpMatchArray) => Date }[] = [
  // ISO: 2024-01-15, 2024-01-15T00:00:00
  { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})/, parse: (m) => new Date(+m[1], +m[2] - 1, +m[3]) },
  // US: 01/15/2024, 1/15/2024, 01-15-2024
  { regex: /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/, parse: (m) => new Date(+m[3], +m[1] - 1, +m[2]) },
  // US short year: 01/15/24
  { regex: /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2})$/, parse: (m) => {
    const yr = +m[3] + (+m[3] > 50 ? 1900 : 2000);
    return new Date(yr, +m[1] - 1, +m[2]);
  }},
  // Month name: Jan 15, 2024 / January 15 2024 / 15-Jan-2024
  { regex: /^(\d{1,2})[/\-.\s](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[/\-.\s,]*(\d{4})$/i,
    parse: (m) => new Date(`${m[2]} ${m[1]}, ${m[3]}`) },
  { regex: /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s\-.,]+(\d{1,2})[\s\-.,]+(\d{4})$/i,
    parse: (m) => new Date(`${m[1]} ${m[2]}, ${m[3]}`) },
  // Year only: 2024
  { regex: /^(\d{4})$/, parse: (m) => new Date(+m[1], 0, 1) },
];

/**
 * Parse a date string using multiple common formats.
 * Returns null if no format matches or the result is invalid.
 */
export function smartParseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  for (const fmt of DATE_FORMATS) {
    const match = trimmed.match(fmt.regex);
    if (match) {
      const d = fmt.parse(match);
      if (!isNaN(d.getTime()) && d.getFullYear() > 1900 && d.getFullYear() < 2100) {
        return d;
      }
    }
  }

  // Final fallback: native Date constructor
  const fallback = new Date(trimmed);
  if (!isNaN(fallback.getTime()) && fallback.getFullYear() > 1900 && fallback.getFullYear() < 2100) {
    return fallback;
  }

  return null;
}

/**
 * Check if a date string is parseable.
 */
export function isValidDateString(dateStr: string): boolean {
  return smartParseDate(dateStr) !== null;
}

// ─── Email validation ──────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

// ─── Pre-import validation ─────────────────────────────

/**
 * Validate all rows against the current mapping. Returns a report with
 * invalid emails, unparseable dates, missing required fields, and duplicate emails.
 */
export function validateImportData(
  headers: string[],
  rows: Record<string, string>[],
  mapping: Record<string, ColumnMapping>
): ValidationReport {
  const issues: ValidationIssue[] = [];
  const emailIndex = new Map<string, number[]>(); // lowercase email -> row numbers

  const emailCol = headers.find((h) => mapping[h]?.target === "email");
  const dateTargets = ["joinDate", "expirationDate", "renewalDate", "paymentDate"];
  const dateCols = dateTargets
    .map((t) => ({ target: t, header: headers.find((h) => mapping[h]?.target === t) }))
    .filter((d): d is { target: string; header: string } => !!d.header);

  const hasNameMapping = Object.values(mapping).some(
    (m) => m.target === "firstName" || m.target === "lastName" || m.target === "displayName" || m.target === "fullName"
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-based + header row

    // Validate email
    if (emailCol) {
      const email = (row[emailCol] || "").trim();
      if (email && !isValidEmail(email)) {
        issues.push({
          row: rowNum, column: emailCol, field: "email",
          value: email, issue: "invalid_email",
          message: `Invalid email format: "${email}"`,
        });
      }
      if (email) {
        const lower = email.toLowerCase();
        if (!emailIndex.has(lower)) emailIndex.set(lower, []);
        emailIndex.get(lower)!.push(rowNum);
      }
    }

    // Validate dates
    for (const { target, header } of dateCols) {
      const val = (row[header] || "").trim();
      if (val && !isValidDateString(val)) {
        issues.push({
          row: rowNum, column: header, field: target,
          value: val, issue: "invalid_date",
          message: `Unparseable date: "${val}"`,
        });
      }
    }

    // Check required fields (name or email should exist for standalone records)
    if (hasNameMapping || emailCol) {
      const hasName = Object.entries(mapping).some(([h, m]) => {
        if (m.target === "firstName" || m.target === "lastName" || m.target === "displayName" || m.target === "fullName") {
          return (row[h] || "").trim() !== "";
        }
        return false;
      });
      const hasEmail = emailCol ? (row[emailCol] || "").trim() !== "" : false;
      if (!hasName && !hasEmail) {
        issues.push({
          row: rowNum, column: "", field: "name/email",
          value: "", issue: "missing_required",
          message: "Row has no name or email — may import as \"Unknown\"",
        });
      }
    }
  }

  // Duplicate emails within file
  const duplicateEmails: { email: string; rows: number[] }[] = [];
  for (const [email, rowNums] of emailIndex) {
    if (rowNums.length > 1) {
      duplicateEmails.push({ email, rows: rowNums });
      for (const rowNum of rowNums) {
        issues.push({
          row: rowNum, column: emailCol || "", field: "email",
          value: email, issue: "duplicate_email_in_file",
          message: `Duplicate email "${email}" appears in rows ${rowNums.join(", ")}`,
        });
      }
    }
  }

  return {
    issues,
    duplicateEmails,
    totalIssues: issues.length,
    invalidEmails: issues.filter((i) => i.issue === "invalid_email").length,
    invalidDates: issues.filter((i) => i.issue === "invalid_date").length,
    missingRequired: issues.filter((i) => i.issue === "missing_required").length,
    duplicateCount: duplicateEmails.length,
  };
}

// ─── Member type / tier parsing ────────────────────────

/**
 * Deduplicate member types into unique tiers.
 */
export function extractTiers(memberTypes: Record<string, number>): {
  name: string;
  interval: "ANNUAL" | "TWO_YEAR" | "MONTHLY";
  price: number;
  memberCount: number;
  sourceTypes: string[];
}[] {
  const tierMap: Record<string, {
    name: string;
    interval: "ANNUAL" | "TWO_YEAR" | "MONTHLY";
    price: number;
    memberCount: number;
    sourceTypes: string[];
  }> = {};

  for (const [typeStr, count] of Object.entries(memberTypes)) {
    const parsed = parseMemberType(typeStr);
    if (!parsed) continue;

    const key = `${parsed.name}|${parsed.interval}`;
    if (!tierMap[key]) {
      tierMap[key] = {
        name: parsed.name,
        interval: parsed.interval,
        price: parsed.price,
        memberCount: 0,
        sourceTypes: [],
      };
    }
    if (parsed.price > tierMap[key].price) {
      tierMap[key].price = parsed.price;
    }
    tierMap[key].memberCount += count;
    tierMap[key].sourceTypes.push(typeStr);
  }

  return Object.values(tierMap).sort((a, b) => b.memberCount - a.memberCount);
}
