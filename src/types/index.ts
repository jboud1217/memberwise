export type UserRole = "OWNER" | "ADMIN" | "STAFF" | "MEMBER";

export type MemberStatus = "ACTIVE" | "LAPSED" | "SUSPENDED" | "PROSPECT" | "ARCHIVED";

export type BillingInterval = "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL" | "TWO_YEAR" | "LIFETIME" | "ONE_TIME";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export type PaymentMethod = "STRIPE" | "CHECK" | "CASH" | "OTHER";

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";

export type CampaignStatus = "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "FAILED";

export type ImportStatus = "PENDING" | "VALIDATING" | "IMPORTING" | "COMPLETED" | "FAILED";
