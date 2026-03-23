import type { Platform } from "./import-utils";

export interface PlatformGuide {
  name: string;
  tagline: string;
  exportSteps: string[];
  exportUrl?: string;
  tips: string[];
  dataAvailable: string[];
  dataNotAvailable: string[];
}

export const PLATFORM_GUIDES: Partial<Record<Platform, PlatformGuide>> = {
  memberclicks: {
    name: "MemberClicks",
    tagline: "We've helped hundreds of organizations switch from MemberClicks.",
    exportSteps: [
      "Log in to MemberClicks as an administrator",
      "Go to Profiles → All Profiles",
      "Click \"Export\" in the top-right toolbar",
      "Select \"All Fields\" to include all data columns",
      "Choose CSV or Excel format and download",
      "Upload the exported file here",
    ],
    exportUrl: "https://help.memberclicks.com",
    tips: [
      "MemberClicks uses bracket notation like [Name | First] — we auto-detect this format",
      "Export both Organization and Contact profiles for a complete migration",
      "Include custom fields — we'll map them automatically or let you assign them manually",
    ],
    dataAvailable: [
      "Members & contacts with full details",
      "Organization/household relationships",
      "Membership types and tiers",
      "Join dates, renewal dates, expiration dates",
      "Dues and payment history",
      "Custom fields",
      "Address and phone data",
      "Communication preferences",
    ],
    dataNotAvailable: [
      "Event registrations (coming soon)",
      "Email campaign history",
      "File attachments / documents",
    ],
  },
  wildapricot: {
    name: "Wild Apricot",
    tagline: "Moving to a modern platform? Great choice. We make it painless.",
    exportSteps: [
      "Log in to Wild Apricot as an administrator",
      "Go to Contacts → Contact list",
      "Click the \"Export\" button above the contact list",
      "Select \"Export all contacts\" and \"All fields\"",
      "Choose CSV format and download",
      "Upload the exported file here",
    ],
    exportUrl: "https://gethelp.wildapricot.com",
    tips: [
      "Export your full contact list, not a filtered view, to capture everyone",
      "Wild Apricot's membership levels map directly to Memberwise tiers",
      "If you have archived members, include them — we'll import them with the correct status",
    ],
    dataAvailable: [
      "All contacts with membership status",
      "Membership levels with pricing",
      "Join dates and renewal dates",
      "Full address data",
      "Phone and email",
      "Organization links",
    ],
    dataNotAvailable: [
      "Event registrations (coming soon)",
      "Online store orders",
      "Website pages (use our site builder instead)",
    ],
  },
  growthzone: {
    name: "GrowthZone / ChamberMaster",
    tagline: "Upgrading from GrowthZone? We speak ChamberMaster fluently.",
    exportSteps: [
      "Log in to GrowthZone as an administrator",
      "Go to Membership → Members",
      "Click \"Actions\" → \"Export to Excel\"",
      "Select all fields and include contact details",
      "Download the export file",
      "Upload the exported file here",
    ],
    tips: [
      "GrowthZone exports often include billing address fields — we map those automatically",
      "If your export has multiple sheets, we'll let you pick which one to import",
      "Include dues amount fields to bring over payment history",
    ],
    dataAvailable: [
      "Company and contact records",
      "Membership types and statuses",
      "Start/end/renewal dates",
      "Billing addresses",
      "Dues amounts",
      "Member numbers",
    ],
    dataNotAvailable: [
      "Event data",
      "Invoice history (individual payments are imported)",
      "Committee structures (names are imported as notes)",
    ],
  },
  yourmembership: {
    name: "YourMembership",
    tagline: "YourMembership → Memberwise in minutes, not months.",
    exportSteps: [
      "Log in to YourMembership as an administrator",
      "Navigate to Members → Member List",
      "Click \"Export\" and select \"All Members\"",
      "Include all available fields in the export",
      "Download as CSV or Excel",
      "Upload the exported file here",
    ],
    tips: [
      "Include both active and expired members to get your full history",
      "YourMembership's \"Member Type\" field becomes your Memberwise tiers",
      "Dues amounts are auto-detected and converted to payment records",
    ],
    dataAvailable: [
      "Member profiles with status",
      "Membership types",
      "Join, expiry, and renewal dates",
      "Addresses and phone numbers",
      "Dues amounts",
    ],
    dataNotAvailable: [
      "Discussion forum posts",
      "Event registrations",
      "Email communications",
    ],
  },
  hivebrite: {
    name: "Hivebrite",
    tagline: "Bringing your alumni community to Memberwise? Let's go.",
    exportSteps: [
      "Log in to Hivebrite as an administrator",
      "Go to Admin → Members → Member directory",
      "Click \"Export\" and select all fields",
      "Choose CSV format",
      "Download and upload here",
    ],
    tips: [
      "Hivebrite uses 'firstname' and 'lastname' (no space) — we handle this",
      "Graduation year is imported into the committees/notes field",
      "External IDs are preserved for reference",
    ],
    dataAvailable: [
      "Member profiles with job titles",
      "Membership plans and statuses",
      "Join and expiration dates",
      "Company information",
      "Bio and website",
      "Addresses",
    ],
    dataNotAvailable: [
      "Groups and sub-communities",
      "Mentorship connections",
      "Job board listings",
    ],
  },
  clubexpress: {
    name: "ClubExpress",
    tagline: "Club management doesn't have to be complicated. Welcome aboard.",
    exportSteps: [
      "Log in to ClubExpress as a club administrator",
      "Go to Members → Member List",
      "Click \"Export\" or \"Download\" from the toolbar",
      "Select all fields including custom data",
      "Export as CSV or Excel",
      "Upload the file here",
    ],
    tips: [
      "ClubExpress uses 'Club ID' and 'Member #' — both are preserved as identifiers",
      "Spouse names are captured in notes for reference",
      "Dues paid amounts are imported as payment records",
    ],
    dataAvailable: [
      "Member profiles with status",
      "Membership types",
      "Join, expiration, and renewal dates",
      "Multiple phone numbers (home, work, cell)",
      "Dues paid amounts",
      "Do not email/mail preferences",
    ],
    dataNotAvailable: [
      "Event signups",
      "Forum posts",
      "Photo galleries",
    ],
  },
  neoncrm: {
    name: "Neon CRM",
    tagline: "Neon CRM data? We'll have you up and running in no time.",
    exportSteps: [
      "Log in to Neon CRM as an administrator",
      "Go to Contacts → Contact Search",
      "Run a search with your desired filters (or all contacts)",
      "Click \"Export\" and select \"All Fields\"",
      "Download as CSV",
      "Upload the exported file here",
    ],
    tips: [
      "Neon CRM exports include 'Account ID' or 'Neon ID' — we preserve both",
      "Multiple email and phone fields are supported (Email 1, Email 2, etc.)",
      "Membership cost is imported as dues/payment data",
      "'Do not contact' and 'Opt-in for email' preferences are both recognized",
    ],
    dataAvailable: [
      "Contact profiles with multiple emails/phones",
      "Membership levels and costs",
      "Join and expiration dates",
      "Company associations",
      "Addresses",
      "Communication preferences",
      "Deceased flags",
    ],
    dataNotAvailable: [
      "Donation history (contact support for help)",
      "Campaign/appeal data",
      "Volunteer hours",
    ],
  },
  glueup: {
    name: "Glue Up",
    tagline: "Switching from Glue Up? Your data is in good hands.",
    exportSteps: [
      "Log in to Glue Up as an administrator",
      "Go to Contacts or Memberships section",
      "Click \"Export\" from the action menu",
      "Select all fields and choose CSV format",
      "Download and upload here",
    ],
    tips: [
      "Glue Up exports may include 'Membership Plan Name' — we map this to tiers",
      "Payment amounts and dates are imported as payment records",
      "Contact IDs are preserved for reference",
    ],
    dataAvailable: [
      "Contact and organization records",
      "Membership plans and statuses",
      "Start/end/renewal dates",
      "Payment amounts and dates",
      "Addresses and websites",
      "Member numbers",
    ],
    dataNotAvailable: [
      "Event registrations",
      "Email campaign stats",
      "Invoice PDFs",
    ],
  },
  memberplanet: {
    name: "MemberPlanet",
    tagline: "Growing beyond MemberPlanet? We'll bring everything with you.",
    exportSteps: [
      "Log in to MemberPlanet as an administrator",
      "Go to Members → Member List",
      "Click \"Export\" or \"Download Members\"",
      "Include all available fields",
      "Export as CSV or Excel",
      "Upload the file here",
    ],
    tips: [
      "MemberPlanet uses both 'Membership Type' and 'Membership Level' — we handle both",
      "Amount paid and dues amount are both recognized",
      "Communication preferences carry over automatically",
    ],
    dataAvailable: [
      "Member profiles with statuses",
      "Membership types and levels",
      "Join, expiration, and renewal dates",
      "Multiple phone numbers",
      "Dues and payment data",
      "Addresses",
      "Communication preferences",
    ],
    dataNotAvailable: [
      "Form submissions",
      "Event registrations",
      "Payment processor connections",
    ],
  },
};

// ─── Migration completeness scoring ─────────────────────

export interface MigrationScore {
  overall: number; // 0-100
  categories: {
    name: string;
    score: number; // 0-100
    description: string;
    icon: "users" | "credit-card" | "calendar" | "map-pin" | "mail" | "tag";
  }[];
}

/**
 * Calculate a migration completeness score based on what data is mapped.
 */
export function calculateMigrationScore(
  mappedTargets: Set<string>,
  totalRows: number,
  rowsWithEmail: number,
  validation: { totalIssues: number; invalidEmails: number; invalidDates: number }
): MigrationScore {
  const categories: MigrationScore["categories"] = [];

  // 1. Identity (name, email, phone) — most important
  const identityFields = ["firstName", "lastName", "displayName", "fullName", "email", "phone", "mobile"];
  const identityMapped = identityFields.filter((f) => mappedTargets.has(f)).length;
  const identityScore = Math.min(100, Math.round((identityMapped / 3) * 100)); // need at least 3
  categories.push({ name: "Identity", score: identityScore, description: `${identityMapped} of ${identityFields.length} fields`, icon: "users" });

  // 2. Membership (type, status, number)
  const membershipFields = ["memberType", "status", "memberNumber"];
  const membershipMapped = membershipFields.filter((f) => mappedTargets.has(f)).length;
  const membershipScore = Math.round((membershipMapped / membershipFields.length) * 100);
  categories.push({ name: "Membership", score: membershipScore, description: `${membershipMapped} of ${membershipFields.length} fields`, icon: "tag" });

  // 3. Dates (join, expiration, renewal)
  const dateFields = ["joinDate", "expirationDate", "renewalDate"];
  const dateMapped = dateFields.filter((f) => mappedTargets.has(f)).length;
  const dateScore = Math.round((dateMapped / dateFields.length) * 100);
  categories.push({ name: "Dates", score: dateScore, description: `${dateMapped} of ${dateFields.length} fields`, icon: "calendar" });

  // 4. Address
  const addressFields = ["address1", "city", "state", "zip", "country"];
  const addressMapped = addressFields.filter((f) => mappedTargets.has(f)).length;
  const addressScore = Math.round((addressMapped / addressFields.length) * 100);
  categories.push({ name: "Address", score: addressScore, description: `${addressMapped} of ${addressFields.length} fields`, icon: "map-pin" });

  // 5. Financial (dues, payment)
  const financialFields = ["dues", "paymentDate"];
  const financialMapped = financialFields.filter((f) => mappedTargets.has(f)).length;
  const financialScore = Math.round((financialMapped / Math.max(1, financialFields.length)) * 100);
  categories.push({ name: "Financial", score: financialScore, description: financialMapped > 0 ? `${financialMapped} payment fields` : "No payment data", icon: "credit-card" });

  // 6. Data quality (based on validation issues)
  const emailCoverage = totalRows > 0 ? rowsWithEmail / totalRows : 0;
  const issueRate = totalRows > 0 ? validation.totalIssues / totalRows : 0;
  const qualityScore = Math.max(0, Math.round((1 - issueRate) * emailCoverage * 100));
  categories.push({ name: "Data Quality", score: qualityScore, description: `${Math.round(emailCoverage * 100)}% have email`, icon: "mail" });

  // Overall: weighted average
  const weights = [30, 20, 15, 10, 10, 15]; // identity heaviest
  const overall = Math.round(
    categories.reduce((sum, cat, i) => sum + cat.score * weights[i], 0) /
    weights.reduce((a, b) => a + b, 0)
  );

  return { overall, categories };
}
